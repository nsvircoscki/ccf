import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { Card } from './SisPontoComponents.jsx';
import { JUSTIFICATIVA_CORES, rotuloTipoJustificativa } from './sisPontoData.js';

// Conferência do ENG antes de fechar a folha:
// 1) Esquecimentos: horários da jornada em que a pessoa não bateu. O servidor
//    registra o horário previsto; aqui o ENG decide se abona (conta as horas)
//    ou se foi falta (desconta as horas e sai como falta para a folha).
// 2) Batidas com problema: entrada sem saída, saída sem entrada, sequência
//    inconsistente. Nada disso é descartado; sai sinalizado no CSV da folha.
const ROTULOS = {
  SEM_SAIDA: 'Entrada sem saída',
  SEM_ENTRADA: 'Saída sem entrada',
  'INCONSISTENTE:ENTRADA_SEGUIDA': 'Duas entradas seguidas',
  'INCONSISTENTE:SAIDA_SEM_ENTRADA': 'Saída fora de sequência',
};

const SITUACAO = {
  PENDENTE: { texto: 'Aguardando decisão', cor: '#b9770e', fundo: '#fff8ee' },
  ABONADA: { texto: 'Abonado (conta as horas)', cor: '#2b8761', fundo: '#eefaf6' },
  FALTA: { texto: 'Falta (horas descontadas)', cor: '#be3747', fundo: '#ffecef' },
};

const mesAtual = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
};
const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const horaDe = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const diaLongo = (dia) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${dia}T12:00:00`));

const botao = (cor, fundo) => ({ border: 0, borderRadius: 8, padding: '7px 11px', background: fundo, color: cor, fontSize: 11, fontWeight: 800, cursor: 'pointer' });

export default function SisPontoRevisaoAdmin() {
  const [mes, setMes] = useState(mesAtual);
  const [dados, setDados] = useState({ pares: [], previstas: [] });
  const [justificativas, setJustificativas] = useState([]);
  const [estado, setEstado] = useState({ carregando: true, erro: null });
  const [processando, setProcessando] = useState(null);

  const carregar = useCallback(() => Promise.all([api.getSispontoRevisao(mes), api.getSispontoJustificativas()])
    .then(([revisao, lista]) => {
      setDados({ pares: revisao?.pares || [], previstas: revisao?.previstas || [] });
      setJustificativas(Array.isArray(lista) ? lista : []);
      setEstado({ carregando: false, erro: null });
    })
    .catch((erro) => setEstado({ carregando: false, erro: erro.message })), [mes]);

  useEffect(() => { carregar(); }, [carregar]);

  // Um cartão por pessoa e dia, com todos os horários que faltaram bater.
  const grupos = useMemo(() => {
    const mapa = new Map();
    dados.previstas.forEach((p) => {
      const chave = `${p.funcionarioId}|${p.dia}`;
      if (!mapa.has(chave)) mapa.set(chave, { chave, funcionarioId: p.funcionarioId, nome: p.nome, setor: p.setor, dia: p.dia, itens: [] });
      mapa.get(chave).itens.push(p);
    });
    return [...mapa.values()]
      .map((g) => ({ ...g, itens: g.itens.sort((a, b) => new Date(a.batidoEm) - new Date(b.batidoEm)) }))
      .sort((a, b) => {
        const pa = a.itens.some((i) => i.situacao === 'PENDENTE') ? 0 : 1;
        const pb = b.itens.some((i) => i.situacao === 'PENDENTE') ? 0 : 1;
        return pa - pb || a.dia.localeCompare(b.dia) || a.nome.localeCompare(b.nome);
      });
  }, [dados.previstas]);

  const decidir = async (grupo, situacao, ids = grupo.itens.map((i) => i.id)) => {
    setProcessando(grupo.chave);
    try {
      await api.decidirSispontoPrevistas(ids, situacao);
      await carregar();
    } catch (erro) {
      setEstado((atual) => ({ ...atual, erro: erro.message }));
    } finally {
      setProcessando(null);
    }
  };

  const pendentes = grupos.filter((g) => g.itens.some((i) => i.situacao === 'PENDENTE')).length;

  return (
    <section className="sis-empty-view" style={{ display: 'grid', gap: 16 }}>
      <Card style={{ padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Esquecimentos de ponto</h2>
            <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>
              Horários da jornada em que a pessoa não bateu. Abone se ela trabalhou (conta as horas) ou marque falta (desconta as horas).
            </p>
          </div>
          <input type="month" value={mes} onChange={(e) => { setEstado({ carregando: true, erro: null }); setMes(e.target.value || mesAtual()); }} style={{ padding: '8px 10px', border: '1px solid #d8e6fc', borderRadius: 8, color: '#405371', fontWeight: 700 }} />
        </div>

        {estado.erro && <p style={{ color: '#be3747', fontWeight: 700, marginTop: 18 }}>{estado.erro}</p>}
        {!estado.carregando && !grupos.length && !estado.erro && <p style={{ color: '#2b8761', fontWeight: 700, marginTop: 18 }}>Nenhum esquecimento neste mês.</p>}
        {pendentes > 0 && <p style={{ color: '#b9770e', fontWeight: 800, marginTop: 14 }}>{pendentes} dia(s) aguardando decisão.</p>}

        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          {grupos.map((grupo) => {
            const situacoes = new Set(grupo.itens.map((i) => i.situacao));
            const unica = situacoes.size === 1 ? [...situacoes][0] : null;
            const visual = SITUACAO[unica || 'PENDENTE'];
            const justificativasDoDia = justificativas.filter((j) => j.funcionarioId === grupo.funcionarioId && j.dia === grupo.dia);
            const ocupado = processando === grupo.chave;
            return (
              <div key={grupo.chave} style={{ border: '1px solid #e5edf8', borderLeft: `4px solid ${visual.cor}`, borderRadius: 10, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <strong style={{ color: '#1d3156', fontSize: 14 }}>{grupo.nome}</strong>
                  <span style={{ color: '#7183a3', fontSize: 11, fontWeight: 800 }}>{grupo.setor}</span>
                  <span style={{ color: '#243755', fontSize: 12, fontWeight: 800, textTransform: 'capitalize' }}>{diaLongo(grupo.dia)}</span>
                  <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 99, background: visual.fundo, color: visual.cor, fontSize: 10, fontWeight: 900 }}>{unica ? visual.texto : 'Decisões diferentes'}</span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {grupo.itens.map((item) => (
                    <span key={item.id} title={SITUACAO[item.situacao]?.texto} style={{ padding: '5px 9px', borderRadius: 8, background: SITUACAO[item.situacao]?.fundo, color: SITUACAO[item.situacao]?.cor, fontSize: 11, fontWeight: 800 }}>
                      {item.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} prevista {horaDe(item.batidoEm)}
                    </span>
                  ))}
                </div>

                {justificativasDoDia.length > 0 ? (
                  <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                    {justificativasDoDia.map((j) => {
                      const cor = JUSTIFICATIVA_CORES[j.status] || JUSTIFICATIVA_CORES['Em análise'];
                      return (
                        <div key={j.id} style={{ padding: '7px 10px', borderRadius: 8, background: cor.fundo, border: `1px solid ${cor.borda}`, fontSize: 11.5, color: '#405371', fontWeight: 600 }}>
                          <b>Justificativa ({j.status})</b> {j.horaInicio}–{j.horaFim}: {[rotuloTipoJustificativa(j.tipo), j.motivo].filter(Boolean).join(' — ')}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ margin: '10px 0 0', color: '#8a99b1', fontSize: 11.5, fontWeight: 700 }}>Sem justificativa enviada para este dia.</p>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {unica !== 'ABONADA' && <button type="button" disabled={ocupado} onClick={() => decidir(grupo, 'ABONADA')} style={botao('#fff', '#2b8761')}>Abonar (conta as horas)</button>}
                  {unica !== 'FALTA' && <button type="button" disabled={ocupado} onClick={() => decidir(grupo, 'FALTA')} style={botao('#fff', '#be3747')}>Falta (descontar horas)</button>}
                  {unica !== 'PENDENTE' && <button type="button" disabled={ocupado} onClick={() => decidir(grupo, 'PENDENTE')} style={botao('#405371', '#f1f4f9')}>Desfazer decisão</button>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card style={{ padding: 26 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Registros com problema</h2>
        <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Para corrigir, exclua o registro errado no calendário do funcionário.</p>
        {!estado.carregando && !dados.pares.length && !estado.erro && <p style={{ color: '#2b8761', fontWeight: 700, marginTop: 18 }}>Nenhum registro com problema neste mês.</p>}
        {dados.pares.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 18 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#405371' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#7183a3' }}>
                  <th style={{ padding: 8 }}>Funcionário</th><th style={{ padding: 8 }}>Setor</th><th style={{ padding: 8 }}>Entrada</th><th style={{ padding: 8 }}>Saída</th><th style={{ padding: 8 }}>Problema</th>
                </tr>
              </thead>
              <tbody>
                {dados.pares.map((item, i) => (
                  <tr key={`${item.funcionarioId}-${item.entrada || item.saida}-${i}`} style={{ borderTop: '1px solid #eef2f8' }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{item.nome}</td>
                    <td style={{ padding: 8 }}>{item.setor}</td>
                    <td style={{ padding: 8 }}>{dataHora(item.entrada)}</td>
                    <td style={{ padding: 8 }}>{dataHora(item.saida)}</td>
                    <td style={{ padding: 8, color: '#b9770e', fontWeight: 700 }}>{item.observacoes.map((o) => ROTULOS[o] || o).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
