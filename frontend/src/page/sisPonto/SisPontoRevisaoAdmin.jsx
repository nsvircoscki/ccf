import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card } from './SisPontoComponents.jsx';
import { chaveData } from './sisPontoUtils.js';

// Conferência antes de fechar a folha: registros com problema em dias já
// encerrados (entrada sem saída, saída sem entrada, sequência inconsistente).
// Saem sinalizados no CSV da folha; "Corrigir" abre o mesmo modal do
// calendário para incluir ou excluir registros daquele dia.
// Os esquecimentos (horário sem registro) ficam na aba Justificativas.
// Também aqui: a quarentena — batidas que chegaram do aparelho mas não
// puderam entrar no ponto (sessão expirada/revogada, funcionário inativo...).
// Nada é descartado sozinho: a gestão aceita (vira registro) ou descarta.
const ROTULOS = {
  SEM_SAIDA: 'Entrada sem saída',
  SEM_ENTRADA: 'Saída sem entrada',
  'INCONSISTENTE:ENTRADA_SEGUIDA': 'Duas entradas seguidas',
  'INCONSISTENTE:SAIDA_SEM_ENTRADA': 'Saída fora de sequência',
};

const mesAtual = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
};
const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

// onCorrigir(funcionarioId, 'YYYY-MM-DD'): abre a correção do dia.
// atualizacao: muda quando uma correção termina (recarrega a lista).
export default function SisPontoRevisaoAdmin({ onCorrigir, atualizacao, onQuarentenaDecidida }) {
  const [mes, setMes] = useState(mesAtual);
  const [pares, setPares] = useState([]);
  const [estado, setEstado] = useState({ carregando: true, erro: null });
  const [quarentena, setQuarentena] = useState([]);
  const [processando, setProcessando] = useState(null);

  const carregarQuarentena = useCallback(() => api.getSispontoQuarentena()
    .then((lista) => setQuarentena(Array.isArray(lista) ? lista : []))
    .catch(() => {}), []);
  useEffect(() => { carregarQuarentena(); }, [carregarQuarentena, atualizacao]);

  const decidirQuarentena = async (item, acao) => {
    setProcessando(item.id);
    try {
      await api.decidirSispontoQuarentena([item.id], acao);
      await carregarQuarentena();
      if (acao === 'ACEITAR') carregar();
      onQuarentenaDecidida?.();
    } catch (erro) {
      setEstado((atual) => ({ ...atual, erro: erro.message }));
    } finally {
      setProcessando(null);
    }
  };

  const carregar = useCallback(() => api.getSispontoRevisao(mes)
    .then((revisao) => {
      setPares(revisao?.pares || []);
      setEstado({ carregando: false, erro: null });
    })
    .catch((erro) => setEstado({ carregando: false, erro: erro.message })), [mes]);

  useEffect(() => { carregar(); }, [carregar, atualizacao]);

  return (
    <section className="sis-empty-view" style={{ display: 'grid', gap: 16 }}>
      {quarentena.length > 0 && (
        <Card style={{ padding: 26 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Batidas em quarentena</h2>
          <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>
            Registros que chegaram do aparelho mas não puderam entrar no ponto. Se a pessoa entrar de novo no app e a batida subir normalmente, ela sai daqui sozinha.
          </p>
          <div style={{ overflowX: 'auto', marginTop: 18 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#405371' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#7183a3' }}>
                  <th style={{ padding: 8 }}>Funcionário</th><th style={{ padding: 8 }}>Registro</th><th style={{ padding: 8 }}>Horário (aparelho)</th><th style={{ padding: 8 }}>Recebido</th><th style={{ padding: 8 }}>Motivo</th><th style={{ padding: 8 }} />
                </tr>
              </thead>
              <tbody>
                {quarentena.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #eef2f8', opacity: processando === item.id ? 0.6 : 1 }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{item.nome} <span style={{ color: '#7183a3', fontWeight: 600 }}>{item.setor}</span></td>
                    <td style={{ padding: 8 }}>{item.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</td>
                    <td style={{ padding: 8 }}>{dataHora(item.batidoEm)}</td>
                    <td style={{ padding: 8 }}>{dataHora(item.recebidoEm)}</td>
                    <td style={{ padding: 8, color: '#b9770e', fontWeight: 700 }}>{item.motivo}</td>
                    <td style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" disabled={processando === item.id} onClick={() => decidirQuarentena(item, 'ACEITAR')} style={{ padding: '6px 12px', border: 0, borderRadius: 8, background: '#2aba72', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Aceitar</button>{' '}
                      <button type="button" disabled={processando === item.id} onClick={() => decidirQuarentena(item, 'DESCARTAR')} style={{ padding: '6px 12px', border: '1px solid #f0d3d3', borderRadius: 8, background: '#fff', color: '#8a4a4f', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Descartar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Card style={{ padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Registros com problema</h2>
            <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>
              Registros fora de sequência em dias já encerrados (por exemplo, entrada sem saída ou duas entradas seguidas). Use Corrigir para incluir o registro que faltou ou excluir um duplicado. Os esquecimentos de registro ficam na aba Justificativas.
            </p>
          </div>
          <input type="month" value={mes} onChange={(e) => { setEstado({ carregando: true, erro: null }); setMes(e.target.value || mesAtual()); }} style={{ padding: '8px 10px', border: '1px solid #d8e6fc', borderRadius: 8, color: '#405371', fontWeight: 700 }} />
        </div>

        {estado.erro && <p style={{ color: '#be3747', fontWeight: 700, marginTop: 18 }}>{estado.erro}</p>}
        {!estado.carregando && !pares.length && !estado.erro && <p style={{ color: '#2b8761', fontWeight: 700, marginTop: 18 }}>Nenhum registro com problema neste mês.</p>}
        {pares.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 18 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#405371' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#7183a3' }}>
                  <th style={{ padding: 8 }}>Funcionário</th><th style={{ padding: 8 }}>Setor</th><th style={{ padding: 8 }}>Entrada</th><th style={{ padding: 8 }}>Saída</th><th style={{ padding: 8 }}>Problema</th><th style={{ padding: 8 }} />
                </tr>
              </thead>
              <tbody>
                {pares.map((item, i) => (
                  <tr key={`${item.funcionarioId}-${item.entrada || item.saida}-${i}`} style={{ borderTop: '1px solid #eef2f8' }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{item.nome}</td>
                    <td style={{ padding: 8 }}>{item.setor}</td>
                    <td style={{ padding: 8 }}>{dataHora(item.entrada)}</td>
                    <td style={{ padding: 8 }}>{dataHora(item.saida)}</td>
                    <td style={{ padding: 8, color: '#b9770e', fontWeight: 700 }}>{item.observacoes.map((o) => ROTULOS[o] || o).join(' · ')}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>
                      <button type="button" onClick={() => onCorrigir(item.funcionarioId, chaveData(new Date(item.entrada || item.saida)))} style={{ padding: '6px 12px', border: '1px solid #d8e6fc', borderRadius: 8, background: '#fff', color: '#1767e8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Corrigir</button>
                    </td>
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
