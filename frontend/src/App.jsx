import React, { useEffect, useState } from 'react';
import { useKanban } from './hooks/useKanban';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { KanbanView } from './components/KanbanView';
import { LoginView } from './components/LoginView';
import CadastroServicoView from './components/CadastroServicoView';
import Orcamento from './page/Orcamento';

import { NovoProjetoModal } from './modals/NovoProjetoModal';
import { EditarProjetoModal } from './modals/EditarProjetoModal';
import { TicketDetailModal } from './modals/TicketDetailModal';
import { AuditoriaModal } from './modals/AuditoriaModal';
import { AvisoDependenciaModal } from './modals/AvisoDependenciaModal';
import { ExcluirProjetoModal } from './modals/ExcluirProjetoModal';
import { ExcluirCartaoModal } from './modals/ExcluirCartaoModal';

export default function App() {
  const kanban = useKanban();
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [telaAtiva, setTelaAtiva] = useState('cadastro');
  const [buscaTexto, setBuscaTexto] = useState('');

  const [modais, setModais] = useState({
    novoProjeto: false,
    editarProjeto: false,
    ticketDetalhe: null,
    auditoria: null,
    avisoDependencia: null,
    excluirProjeto: false,
    excluirCartao: null,
  });

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const globalCss = (
    <style>{`
      * { font-family: 'Roboto', sans-serif !important; }
      .scroll::-webkit-scrollbar { width: 6px; height: 6px; }
      .scroll::-webkit-scrollbar-thumb { background: #BDBDBD; border-radius: 10px; }
      .print-only { display: none; }
      @media print {
        @page { margin: 20mm; }
        body { background: white; margin: 0; padding: 0; }
        .no-print { display: none !important; }
        .print-only { display: block !important; width: 100%; color: black; }
        .print-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .print-table th, .print-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .print-table th { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
      }
    `}</style>
  );

  if (!usuarioLogado) {
    return <LoginView onLogin={setUsuarioLogado} globalCss={globalCss} />;
  }

  return (
    <>
      {globalCss}
      <div
        className="no-print"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F5F5' }}
      >
        {telaAtiva !== 'cadastro' ? (
          <>
            <Topbar
              telaAtiva={telaAtiva}
              setTelaAtiva={setTelaAtiva}
              buscaTexto={buscaTexto}
              setBuscaTexto={setBuscaTexto}
              usuarioLogado={usuarioLogado}
              setUsuarioLogado={setUsuarioLogado}
              onAbrirNovoProjeto={() => setModais({ ...modais, novoProjeto: true })}
            />

            <div className="bg-slate-800 text-white px-6 py-2.5 flex items-center justify-between border-b border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Fluxo do Sistema:</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setTelaAtiva('cadastro')}
                  className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    telaAtiva === 'cadastro'
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  1. Cadastro de Servico
                </button>

                <button
                  onClick={() => setTelaAtiva('dashboard')}
                  className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    telaAtiva === 'dashboard'
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  2. Dashboard
                </button>

                <button
                  onClick={() => setTelaAtiva('kanban')}
                  className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    telaAtiva === 'kanban'
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  3. Fabrica (Kanban)
                </button>

                <button
                  onClick={() => setTelaAtiva('orcamento')}
                  className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    telaAtiva === 'orcamento'
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  4. Orcamento
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {telaAtiva === 'dashboard' && (
                <DashboardView
                  kanban={kanban}
                  usuarioLogado={usuarioLogado}
                  buscaTexto={buscaTexto}
                  onAbrirDetalhe={(ticket) => setModais({ ...modais, ticketDetalhe: ticket })}
                  onAbrirAuditoria={(proj) => setModais({ ...modais, auditoria: proj })}
                  setTelaAtiva={setTelaAtiva}
                />
              )}

              {telaAtiva === 'kanban' && (
                <KanbanView
                  kanban={kanban}
                  usuarioLogado={usuarioLogado}
                  buscaTexto={buscaTexto}
                  onAbrirDetalhe={(ticket) => setModais({ ...modais, ticketDetalhe: ticket })}
                  onAbrirAuditoria={(proj) => setModais({ ...modais, auditoria: proj })}
                  onAbrirEdicao={() => setModais({ ...modais, editarProjeto: true })}
                  onAbrirExcluirProjeto={() => setModais({ ...modais, excluirProjeto: true })}
                  onAbrirExcluirCartao={(id) => setModais({ ...modais, excluirCartao: id })}
                  onAvisoDependencia={(aviso) => setModais({ ...modais, avisoDependencia: aviso })}
                />
              )}

              {telaAtiva === 'orcamento' && <Orcamento />}
            </div>
          </>
        ) : (
          <CadastroServicoView onBack={() => setTelaAtiva('dashboard')} />
        )}

        {modais.novoProjeto && (
          <NovoProjetoModal
            kanban={kanban}
            onClose={() => setModais({ ...modais, novoProjeto: false })}
            setTelaAtiva={setTelaAtiva}
          />
        )}
        {modais.editarProjeto && (
          <EditarProjetoModal kanban={kanban} onClose={() => setModais({ ...modais, editarProjeto: false })} />
        )}
        {modais.ticketDetalhe && (
          <TicketDetailModal
            ticket={modais.ticketDetalhe}
            kanban={kanban}
            usuarioLogado={usuarioLogado}
            onClose={() => setModais({ ...modais, ticketDetalhe: null })}
          />
        )}
        {modais.auditoria && (
          <AuditoriaModal
            projeto={modais.auditoria}
            kanban={kanban}
            onClose={() => setModais({ ...modais, auditoria: null })}
          />
        )}
        {modais.avisoDependencia && (
          <AvisoDependenciaModal
            aviso={modais.avisoDependencia}
            kanban={kanban}
            onClose={() => setModais({ ...modais, avisoDependencia: null })}
          />
        )}
        {modais.excluirProjeto && (
          <ExcluirProjetoModal
            kanban={kanban}
            onClose={() => setModais({ ...modais, excluirProjeto: false })}
            setTelaAtiva={setTelaAtiva}
          />
        )}
        {modais.excluirCartao && (
          <ExcluirCartaoModal
            ticketId={modais.excluirCartao}
            kanban={kanban}
            onClose={() => setModais({ ...modais, excluirCartao: null })}
          />
        )}
      </div>
    </>
  );
}
