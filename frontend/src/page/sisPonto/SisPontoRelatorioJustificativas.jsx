import { useMemo, useState } from 'react';
import { Card } from './SisPontoComponents.jsx';
import { JUSTIFICATIVA_CORES, rotuloTipoJustificativa } from './sisPontoData.js';

// Relatório das justificativas marcadas como Inválida ou Recusada. As duas
// contam no banco de horas igual à aceita (o funcionário não perde horas):
// servem só como registro para o ENG. Inclui decisões antigas guardadas no
// histórico da justificativa.
const mesAtual = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
};
const OPCOES = { ambas: 'Inválidas e recusadas', 'Inválida': 'Só inválidas', Recusada: 'Só recusadas' };
const dataCurta = (dia) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${dia}T12:00:00`));
const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

function linhasDoRelatorio(justificativas) {
  return justificativas.flatMap((j) => {
    const base = { id: j.id, nome: j.nome, setor: j.setor };
    const atual = ['Inválida', 'Recusada'].includes(j.status)
      ? [{ ...base, chave: j.id, status: j.status, dia: j.dia, horaInicio: j.horaInicio, horaFim: j.horaFim, tipo: j.tipo, motivo: j.motivo, decididoEm: j.decididoEm || j.atualizadoEm, refeita: false }]
      : [];
    const anteriores = (j.historicoDecisoes || [])
      .filter((h) => ['Inválida', 'Recusada'].includes(h.status))
      .map((h, i) => ({ ...base, chave: `${j.id}-h${i}`, ...h, refeita: true, situacaoAtual: j.status }));
    return [...atual, ...anteriores];
  });
}

export default function SisPontoRelatorioJustificativas({ justificativas }) {
  const [mes, setMes] = useState(mesAtual);
  const [filtro, setFiltro] = useState('ambas');
  const linhas = useMemo(() => linhasDoRelatorio(justificativas)
    .filter((l) => l.dia?.startsWith(mes) && (filtro === 'ambas' || l.status === filtro))
    .sort((a, b) => a.nome.localeCompare(b.nome) || a.dia.localeCompare(b.dia) || a.horaInicio.localeCompare(b.horaInicio)),
  [justificativas, mes, filtro]);

  const baixarCsv = () => {
    const campo = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const cabecalho = ['Funcionário', 'Setor', 'Dia', 'Início', 'Fim', 'Situação', 'Tipo', 'Motivo', 'Decidida em', 'Observação'];
    const corpo = linhas.map((l) => [
      l.nome, l.setor, dataCurta(l.dia), l.horaInicio, l.horaFim, l.status, rotuloTipoJustificativa(l.tipo) || '', l.motivo, dataHora(l.decididoEm),
      l.refeita ? `Refeita pelo funcionário depois (situação atual: ${l.situacaoAtual})` : '',
    ].map(campo).join(';'));
    // BOM: o Excel abre com acentos corretos.
    const blob = new Blob([`${String.fromCharCode(0xfeff)}${[cabecalho.map(campo).join(';'), ...corpo].join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `justificativas-invalidas-recusadas-${mes}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card style={{ padding: 26 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 620 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Justificativas inválidas e recusadas</h2>
          <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
            Inválidas e recusadas contam no banco de horas igual à aceita (o funcionário não perde horas); ficam registradas aqui só para conferência.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #d8e6fc', borderRadius: 8, color: '#405371', fontWeight: 700 }}>
            {Object.entries(OPCOES).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value || mesAtual())} style={{ padding: '8px 10px', border: '1px solid #d8e6fc', borderRadius: 8, color: '#405371', fontWeight: 700 }} />
          <button type="button" className="sis-export-button" onClick={baixarCsv} disabled={!linhas.length}>Baixar CSV</button>
        </div>
      </div>

      {!linhas.length ? (
        <p style={{ color: '#2b8761', fontWeight: 700, marginTop: 18 }}>Nenhuma justificativa inválida ou recusada neste mês.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 18 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#405371' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#7183a3' }}>
                <th style={{ padding: 8 }}>Funcionário</th><th style={{ padding: 8 }}>Dia</th><th style={{ padding: 8 }}>Período</th><th style={{ padding: 8 }}>Situação</th><th style={{ padding: 8 }}>Motivo</th><th style={{ padding: 8 }}>Decidida em</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const cor = JUSTIFICATIVA_CORES[l.status];
                return (
                  <tr key={l.chave} style={{ borderTop: '1px solid #eef2f8' }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{l.nome} <span style={{ color: '#7183a3', fontWeight: 600 }}>{l.setor}</span></td>
                    <td style={{ padding: 8 }}>{dataCurta(l.dia)}</td>
                    <td style={{ padding: 8 }}>{l.horaInicio}–{l.horaFim}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 99, background: cor?.fundo, color: cor?.texto, fontWeight: 800 }}>{l.status}</span>
                      {l.refeita && <div style={{ marginTop: 4, color: '#7183a3', fontSize: 11 }}>Refeita depois ({l.situacaoAtual})</div>}
                    </td>
                    <td style={{ padding: 8 }}>{[rotuloTipoJustificativa(l.tipo), l.motivo].filter(Boolean).join(' — ')}</td>
                    <td style={{ padding: 8 }}>{dataHora(l.decididoEm)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
