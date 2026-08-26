import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, Printer, Search } from 'lucide-react';
import { C, MONT, SANS } from '../components/cadastros/CadastroKit.jsx';

const normalize = (texto) => String(texto || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Mesmas cores por setor usadas no Kanban — os "chips" de etapa pendente
// ficam coloridos pelo setor responsável, então dá pra escanear rapidinho
// quem precisa fazer o quê sem ler nome por nome.
const CORES_SETOR = {
  ENG: '#FBC02D', TOPO: '#1E88E5', DES: '#43A047', CRD: '#795548',
};

// Status do projeto como um todo — mesma regra usada na Pesquisa: só
// "Concluído" se todas as etapas terminaram.
const statusDoProjeto = (tarefas) => {
  const etapas = tarefas.map((t) => t.currentStep?.step_name || 'Iniciar');
  if (etapas.length === 0) return 'Concluído';
  if (etapas.every((e) => e === 'Concluído')) return 'Concluído';
  if (etapas.every((e) => e === 'Iniciar')) return 'Iniciar';
  return 'Em Andamento';
};

export default function TabelaServicosView({ onBack, kanban }) {
  const { tickets, workflows } = kanban;
  const [busca, setBusca] = useState('');
  const accent = C.accent;

  const linhas = useMemo(() => {
    return workflows.map((workflow) => {
      const tarefas = tickets
        .filter((t) => t.workflowId === workflow.id)
        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

      const pendentes = tarefas.filter((t) => (t.currentStep?.step_name || 'Iniciar') !== 'Concluído');

      return {
        id: workflow.id,
        cliente: workflow.servico?.nomeCliente || '-',
        matricula: workflow.matricula || '-',
        projeto: workflow.name,
        status: statusDoProjeto(tarefas),
        etapaAtual: pendentes[0]?.title || 'Concluído',
        etapasFaltando: pendentes.slice(1).map((t) => ({
          titulo: t.title,
          setor: t.currentStep?.requiredRole?.name || 'CRD',
        })),
      };
    });
  }, [workflows, tickets]);

  const linhasFiltradas = useMemo(() => {
    const termo = normalize(busca.trim());
    if (!termo) return linhas;
    return linhas.filter((l) =>
      normalize(l.cliente).includes(termo) ||
      normalize(l.projeto).includes(termo) ||
      normalize(l.matricula).includes(termo));
  }, [linhas, busca]);

  const baixarExcel = () => {
    const aoa = [
      ['Cliente', 'Matrícula', 'Projeto', 'Status', 'Etapa atual', 'Etapas faltando'],
      ...linhasFiltradas.map((l) => [l.cliente, l.matricula, l.projeto, l.status, l.etapaAtual, l.etapasFaltando.map((e) => e.titulo).join(', ')]),
    ];
    const planilha = XLSX.utils.aoa_to_sheet(aoa);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, 'Serviços');
    XLSX.writeFile(livro, 'servicos.xlsx');
  };

  const corStatus = (status) => {
    if (status === 'Concluído') return '#2e8b2e';
    if (status === 'Em Andamento') return '#1E88E5';
    return '#B45309';
  };

  const imprimir = () => window.print();

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{
        background: '#fff', borderBottom: `1px solid ${C.border}`, height: 64, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px',
      }}>
        <button onClick={onBack} aria-label="Voltar" style={{
          width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff',
          cursor: 'pointer', color: C.label, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: MONT, fontWeight: 700, fontSize: 17, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>Tabela de Serviços</h1>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: accent, margin: 0, fontWeight: 600 }}>
            Etapa atual de cada projeto e o que ainda falta
          </p>
        </div>
      </header>

      <main className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '26px 28px 60px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente, matrícula ou projeto…"
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: `1px solid ${C.border}`,
                outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: SANS, fontSize: 13,
              }}
            />
          </div>
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.muted }}>{linhasFiltradas.length} projeto(s)</span>
          <div style={{ flex: 1 }} />
          <button
            type="button" onClick={baixarExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10,
              border: `1.5px solid ${accent}`, background: '#fff', color: accent,
              fontFamily: MONT, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Download size={15} />
            Baixar como Excel
          </button>
          <button
            type="button" onClick={imprimir}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10,
              border: `1.5px solid ${C.border}`, background: '#fff', color: C.label,
              fontFamily: MONT, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Printer size={15} />
            Imprimir
          </button>
        </div>

        <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 12, background: C.card }}>
          <table style={{ borderCollapse: 'collapse', fontFamily: SANS, fontSize: 12.5, width: '100%' }}>
            <thead>
              <tr>
                {['Cliente', 'Matrícula', 'Projeto', 'Status', 'Etapa atual', 'Etapas faltando'].map((coluna) => (
                  <th key={coluna} style={{
                    position: 'sticky', top: 0, background: '#F4F6FA', textAlign: 'left',
                    padding: '8px 12px', borderBottom: `1.5px solid ${C.border}`,
                    fontFamily: MONT, fontWeight: 700, fontSize: 10.5, color: C.label,
                    letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhasFiltradas.map((linha, indice) => (
                <tr key={linha.id} style={{ background: indice % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                  <td style={{ padding: '5px 12px', borderBottom: `1px solid ${C.borderSoft}`, color: C.text, whiteSpace: 'nowrap' }}>{linha.cliente}</td>
                  <td style={{ padding: '5px 12px', borderBottom: `1px solid ${C.borderSoft}`, color: C.text, whiteSpace: 'nowrap' }}>{linha.matricula}</td>
                  <td style={{ padding: '5px 12px', borderBottom: `1px solid ${C.borderSoft}`, color: C.text, whiteSpace: 'nowrap' }}>{linha.projeto}</td>
                  <td style={{ padding: '5px 12px', borderBottom: `1px solid ${C.borderSoft}`, whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontWeight: 700, fontSize: 10.5,
                      color: '#fff', background: corStatus(linha.status),
                    }}>
                      {linha.status}
                    </span>
                  </td>
                  <td style={{ padding: '5px 12px', borderBottom: `1px solid ${C.borderSoft}`, color: C.text, whiteSpace: 'nowrap', fontWeight: 600 }}>{linha.etapaAtual}</td>
                  <td style={{ padding: '6px 12px', borderBottom: `1px solid ${C.borderSoft}`, minWidth: 280 }}>
                    {linha.etapasFaltando.length === 0 ? (
                      <span style={{ color: C.muted }}>—</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {linha.etapasFaltando.map((etapa, i) => {
                          const cor = CORES_SETOR[etapa.setor] || CORES_SETOR.CRD;
                          return (
                            <span key={i} title={etapa.setor} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '2px 9px 2px 7px', borderRadius: 999,
                              background: `${cor}1a`, color: cor, fontSize: 11, fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: 999, background: cor, flexShrink: 0 }} />
                              {etapa.titulo}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {linhasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: C.muted }}>Nenhum projeto encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* A tela inteira roda dentro de um contêiner ".no-print" (ver
          App.jsx) que fica display:none na impressão — então isso NÃO
          pode ser um filho normal daqui, senão some junto. O portal
          coloca esse bloco direto no <body>, fora daquele contêiner,
          igual o relatório de impressão do Kanban já faz. Sem largura
          fixa/nowrap: a tabela flui pro tamanho real do papel, não da
          tela, então funciona pra qualquer quantidade de linhas/colunas
          e qualquer tamanho de papel. */}
      {createPortal(
        <div className="print-only" style={{ padding: 20, color: '#000', fontSize: 12 }}>
          <div style={{ marginBottom: 16, borderBottom: '2px solid #000', paddingBottom: 10 }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>Tabela de Serviços</h1>
            <p style={{ margin: '6px 0 0', fontSize: 12 }}>
              {new Date().toLocaleDateString('pt-BR')} — {linhasFiltradas.length} projeto(s)
            </p>
          </div>
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Cliente', 'Matrícula', 'Projeto', 'Status', 'Etapa atual', 'Etapas faltando'].map((coluna) => (
                  <th key={coluna}>{coluna}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhasFiltradas.map((linha) => (
                <tr key={linha.id}>
                  <td>{linha.cliente}</td>
                  <td>{linha.matricula}</td>
                  <td>{linha.projeto}</td>
                  <td>{linha.status}</td>
                  <td>{linha.etapaAtual}</td>
                  <td>{linha.etapasFaltando.map((e) => e.titulo).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
        document.body
      )}
    </div>
  );
}
