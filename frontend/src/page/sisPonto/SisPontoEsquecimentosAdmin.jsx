import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { Card } from './SisPontoComponents.jsx';

// Esquecimentos de registro, na aba Justificativas junto com as enviadas pelos
// funcionários. O horário previsto já fica registrado pelo servidor; dentro do
// prazo quem age é o funcionário (justifica — a justificativa aparece na lista
// normal). Passado o prazo sem justificativa, vira uma "justificativa
// automática" de esquecimento: a gestão aceita (conta as horas) ou não aceita
// (falta, desconta as horas).
const SITUACAO = {
  PENDENTE: { texto: 'Em análise', cor: '#b9770e', fundo: '#fff8ee', borda: '#ffd8aa' },
  ABONADA: { texto: 'Aceita (conta as horas)', cor: '#1f9d63', fundo: '#effaf6', borda: '#b7f0d6' },
  FALTA: { texto: 'Não aceita — falta', cor: '#c23b34', fundo: '#fff4f3', borda: '#ffc4bd' },
};
// Mesmo filtro de status das justificativas.
const STATUS_DO_FILTRO = { 'Em análise': 'PENDENTE', Aceita: 'ABONADA', Recusada: 'FALTA' };

const mesDe = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
const horaDe = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const botao = (fundo, cor = '#fff') => ({ border: 0, borderRadius: 8, padding: '9px 16px', background: fundo, color: cor, fontWeight: 800, fontSize: 12, cursor: 'pointer' });

// filtros: { funcionario, setor, status, mes } com os valores dos selects da aba
// ('Todos os ...' = sem filtro). Sem mês escolhido, mostra o mês atual e o
// anterior (os mesmos do contador da aba).
// atualizacao: muda quando as justificativas mudam (aceitar uma abona os
// horários previstos que ela cobre).
export default function SisPontoEsquecimentosAdmin({ filtros, atualizacao, onDecidido }) {
  const [previstas, setPrevistas] = useState([]);
  const [erro, setErro] = useState(null);
  const [processando, setProcessando] = useState(null);

  const meses = useMemo(() => {
    if (filtros.mes !== 'Todos os meses') return [filtros.mes];
    const hoje = new Date();
    return [mesDe(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)), mesDe(hoje)];
  }, [filtros.mes]);

  const carregar = useCallback(() => Promise.all(meses.map((mes) => api.getSispontoRevisao(mes)))
    .then((respostas) => { setPrevistas(respostas.flatMap((r) => r?.previstas || [])); setErro(null); })
    .catch((e) => setErro(e.message)), [meses]);

  useEffect(() => { carregar(); }, [carregar, atualizacao]);

  // Só o que é da gestão: prazo vencido sem justificativa, ou já decidido.
  // Um cartão por pessoa e dia, com todos os horários sem registro.
  const grupos = useMemo(() => {
    const mapa = new Map();
    previstas
      .filter((p) => p.etapa === 'PARA_DECIDIR' || p.etapa === 'DECIDIDA')
      .filter((p) => (filtros.funcionario === 'Todos os funcionários' || p.nome === filtros.funcionario)
        && (filtros.setor === 'Todos os setores' || p.setor === filtros.setor)
        && (filtros.status === 'Todos os status' || p.situacao === STATUS_DO_FILTRO[filtros.status]))
      .forEach((p) => {
        const chave = `${p.funcionarioId}|${p.dia}`;
        if (!mapa.has(chave)) mapa.set(chave, { chave, nome: p.nome, setor: p.setor, dia: p.dia, itens: [] });
        mapa.get(chave).itens.push(p);
      });
    const temPendente = (g) => g.itens.some((i) => i.situacao === 'PENDENTE');
    return [...mapa.values()]
      .map((g) => ({ ...g, itens: g.itens.sort((a, b) => new Date(a.batidoEm) - new Date(b.batidoEm)) }))
      .sort((a, b) => Number(temPendente(b)) - Number(temPendente(a)) || b.dia.localeCompare(a.dia) || a.nome.localeCompare(b.nome));
  }, [previstas, filtros]);

  const decidir = async (grupo, situacao) => {
    setProcessando(grupo.chave);
    try {
      await api.decidirSispontoPrevistas(grupo.itens.map((i) => i.id), situacao);
      await carregar();
      onDecidido?.();
    } catch (e) {
      setErro(e.message);
    } finally {
      setProcessando(null);
    }
  };

  if (!grupos.length && !erro) return null;

  return (
    <Card style={{ padding: 22, marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 17 }}>Esquecimentos de registro</h2>
      <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 12.5, fontWeight: 600 }}>
        O funcionário não registrou o ponto e não justificou no prazo: vira uma justificativa automática de esquecimento. Aceite (conta as horas) ou não aceite (falta, desconta as horas).
      </p>
      {erro && <p style={{ color: '#be3747', fontWeight: 700, marginTop: 12 }}>{erro}</p>}
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {grupos.map((grupo) => {
          const situacoes = new Set(grupo.itens.map((i) => i.situacao));
          const unica = situacoes.size === 1 ? [...situacoes][0] : null;
          const visual = SITUACAO[unica || 'PENDENTE'];
          const ocupado = processando === grupo.chave;
          return (
            <div key={grupo.chave} style={{ border: `1px solid ${visual.borda}`, borderRadius: 12, padding: 16, background: '#fff', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ color: '#1d3156', fontSize: 14 }}>{grupo.nome}</strong>
                  <span style={{ color: '#7183a3', fontSize: 11, fontWeight: 800 }}>{grupo.setor}</span>
                  <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 99, background: visual.cor, color: '#fff', fontSize: 10, fontWeight: 900 }}>{unica ? visual.texto : 'Decisões diferentes'}</span>
                </div>
                <div style={{ marginTop: 8, color: '#243755', fontSize: 12, fontWeight: 800 }}>
                  {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' }).format(new Date(`${grupo.dia}T12:00:00`))}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {grupo.itens.map((item) => (
                    <span key={item.id} style={{ padding: '4px 9px', borderRadius: 8, background: SITUACAO[item.situacao]?.fundo, color: SITUACAO[item.situacao]?.cor, fontSize: 11, fontWeight: 800 }}>
                      Sem registro: {item.tipo === 'ENTRADA' ? 'entrada' : 'saída'} das {horaDe(item.batidoEm)}
                    </span>
                  ))}
                </div>
                <p style={{ margin: '8px 0 0', color: '#405371', fontSize: 12, fontWeight: 600 }}>Esquecimento de marcação — justificativa automática (prazo encerrado sem justificativa).</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', opacity: ocupado ? 0.6 : 1 }}>
                {unica !== 'ABONADA' && <button type="button" disabled={ocupado} onClick={() => decidir(grupo, 'ABONADA')} style={botao('#2aba72')}>Aceitar justificativa</button>}
                {unica !== 'FALTA' && <button type="button" disabled={ocupado} onClick={() => decidir(grupo, 'FALTA')} style={botao('#e4544e')}>Não aceitar (falta)</button>}
                {unica !== 'PENDENTE' && <button type="button" disabled={ocupado} onClick={() => decidir(grupo, 'PENDENTE')} style={botao('#f1f4f9', '#405371')}>Desfazer decisão</button>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
