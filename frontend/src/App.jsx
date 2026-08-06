import React, { useEffect, useState } from 'react';
import { useKanban } from './hooks/useKanban';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { KanbanView } from './components/KanbanView';
import { LoginView } from './components/LoginView';
import IntroScreen from './components/IntroScreen';
import CadastroServicoView from './components/CadastroServicoView';
import Orcamento from './page/Orcamento';
import CadastroClienteView from './page/CadastroClienteView';
import CadastroImovelView from './page/CadastroImovelView';
import CadastroConfrontanteView from './page/CadastroConfrontanteView';
import VinculacaoView from './page/VinculacaoView';

import { NovoProjetoModal } from './modals/NovoProjetoModal';
import { EditarProjetoModal } from './modals/EditarProjetoModal';
import { TicketDetailModal } from './modals/TicketDetailModal';
import { AuditoriaModal } from './modals/AuditoriaModal';
import { AvisoDependenciaModal } from './modals/AvisoDependenciaModal';
import { ExcluirProjetoModal } from './modals/ExcluirProjetoModal';
import { ExcluirCartaoModal } from './modals/ExcluirCartaoModal';
import { DetalhesProjetoModal } from './modals/DetalhesProjetoModal';

const COLUNAS_VISUAIS = ['Iniciar', 'Em Andamento', 'Concluído'];

export default function App() {
  const kanban = useKanban();
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  // A animação só toca uma vez, antes do primeiro login da sessão — depois de
  // "concluída" ela não volta a aparecer mesmo se o usuário sair e entrar de
  // novo (senão o "Sair" no Navbar viraria um replay da splash toda vez).
  const [introConcluida, setIntroConcluida] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState('cadastro');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [workflowParaImpressao, setWorkflowParaImpressao] = useState(null);

  const [modais, setModais] = useState({
    novoProjeto: false,
    editarProjeto: false,
    ticketDetalhe: null,
    auditoria: null,
    avisoDependencia: null,
    excluirProjeto: false,
    excluirCartao: null,
    detalhesProjeto: false,
  });

  const imprimirProjeto = (workflowId) => {
    if (!workflowId) return;
    setWorkflowParaImpressao(workflowId);
    setTimeout(() => window.print(), 100);
  };

  const workflowParaImpressaoData = kanban.workflows.find(w => w.id === workflowParaImpressao);
  const tarefasParaImpressao = workflowParaImpressao
    ? kanban.tickets.filter(t => t.workflowId === workflowParaImpressao)
    : [];
  const etapasParaImpressao = COLUNAS_VISUAIS.map(etapa => ({
    name: etapa,
    tasks: tarefasParaImpressao.filter(t => (t.currentStep?.step_name || 'Iniciar') === etapa)
  }));

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Fontes da intro/login (marca CCF) — carregadas aqui, não dentro de
    // IntroScreen/LoginView, para não sumir quando a intro desmontar.
    const linkMarca = document.createElement('link');
    linkMarca.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;900&family=Open+Sans:wght@400;600&display=swap';
    linkMarca.rel = 'stylesheet';
    document.head.appendChild(linkMarca);
  }, []);

  const globalCss = (
    <style>{`
      * { font-family: 'Roboto', sans-serif !important; }
      body { font-family: 'Roboto', sans-serif; }
      .animated-dropdown-container { position: relative; }
      .animated-dropdown-button { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-radius: 12px; border: 1px solid #D7E1F0; background: #FBFDFF; cursor: pointer; color: #111827; font-weight: 500; transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease; }
      .animated-dropdown-button:hover { background: #EEF4FF; border-color: #A8C4FF; }
      .dropdown-list { position: absolute; top: calc(100% + 8px); left: 0; width: 100%; max-height: 280px; border-radius: 16px; background: #FFFFFF; border: 1px solid rgba(148, 163, 184, 0.24); box-shadow: 0 20px 40px rgba(15,23,42,0.12); overflow: hidden; z-index: 20; transform-origin: top center; }
      .dropdown-list::-webkit-scrollbar { width: 6px; }
      .dropdown-list::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; }
      .dropdown-list::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      .dropdown-option { width: 100%; text-align: left; padding: 13px 16px; background: transparent; border: none; cursor: pointer; color: #111827; font-size: 14px; border-bottom: 1px solid #E2E8F0; transition: background 0.15s ease, color 0.15s ease; }
      .dropdown-option:hover, .dropdown-option:focus { background: #EEF2FF; color: #1D4ED8; outline: none; }
      .dropdown-option:last-child { border-bottom: none; }
      @keyframes girar { to { transform: rotate(360deg); } }
      .girando { animation: girar 0.9s linear infinite; }
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

  if (!introConcluida) {
    return <IntroScreen onDone={() => setIntroConcluida(true)} />;
  }

  if (!usuarioLogado) {
    return <LoginView onLogin={setUsuarioLogado} globalCss={globalCss} />;
  }

  return (
    <>
      {globalCss}
      <div
        className="no-print"
        style={{ height: '100vh', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#F5F5F5' }}
      >
        <Navbar
          telaAtiva={telaAtiva}
          setTelaAtiva={setTelaAtiva}
          buscaTexto={buscaTexto}
          setBuscaTexto={setBuscaTexto}
          usuarioLogado={usuarioLogado}
          setUsuarioLogado={setUsuarioLogado}
          onAbrirNovoProjeto={() => setModais({ ...modais, novoProjeto: true })}
        />

        <div className="flex-1 flex flex-col min-h-0" style={{ minHeight: 0, overflow: 'hidden' }}>
          {telaAtiva === 'cadastro' && (
            <CadastroServicoView
              onBack={() => setTelaAtiva('dashboard')}
              onServicoCriado={kanban.carregarDados}
            />
          )}

          {telaAtiva === 'dashboard' && (
            <DashboardView
              kanban={kanban}
              usuarioLogado={usuarioLogado}
              buscaTexto={buscaTexto}
              onAbrirAuditoria={(proj) => setModais({ ...modais, auditoria: proj })}
              setTelaAtiva={setTelaAtiva}
              onImprimirProjeto={imprimirProjeto}
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
              onAbrirDetalhes={() => setModais({ ...modais, detalhesProjeto: true })}
              onImprimirProjeto={imprimirProjeto}
            />
          )}

          {telaAtiva === 'orcamento' && (
            <Orcamento
              onBack={() => setTelaAtiva('dashboard')}
              onOrcamentoDecidido={kanban.carregarDados}
            />
          )}

          {telaAtiva === 'clientes' && (
            <CadastroClienteView onBack={() => setTelaAtiva('dashboard')} />
          )}

          {telaAtiva === 'imoveis' && (
            <CadastroImovelView onBack={() => setTelaAtiva('dashboard')} />
          )}

          {telaAtiva === 'confrontantes' && (
            <CadastroConfrontanteView onBack={() => setTelaAtiva('dashboard')} />
          )}

          {telaAtiva === 'vinculacao' && (
            <VinculacaoView onBack={() => setTelaAtiva('dashboard')} />
          )}
        </div>

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
            usuarioLogado={usuarioLogado}
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
        {modais.detalhesProjeto && (
          <DetalhesProjetoModal
            kanban={kanban}
            onClose={() => setModais({ ...modais, detalhesProjeto: false })}
          />
        )}
      </div>

      {workflowParaImpressaoData && (
        <div className="print-only" style={{ padding: '20px', color: '#000', fontSize: '14px' }}>
          <div style={{ marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '28px' }}>Relatório de Impressão</h1>
            <p style={{ margin: '8px 0 0', fontSize: '16px' }}><strong>Processo:</strong> {workflowParaImpressaoData.name}</p>
            {workflowParaImpressaoData.description && (
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#333' }}>{workflowParaImpressaoData.description}</p>
            )}
          </div>

          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Atividades</th>
                <th>Responsável</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {etapasParaImpressao.map((etapa) => (
                <tr key={etapa.name}>
                  <td style={{ verticalAlign: 'top', width: '170px', fontWeight: 'bold' }}>{etapa.name}</td>
                  <td style={{ verticalAlign: 'top' }}>
                    {etapa.tasks.length === 0 ? (
                      <span style={{ color: '#777' }}>Sem atividades</span>
                    ) : etapa.tasks.map((t) => (
                      <div key={t.id} style={{ marginBottom: '10px' }}>
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>{t.title}</div>
                        <div style={{ color: '#555', fontSize: '13px', lineHeight: '1.4' }}>{t.description || 'Nenhum detalhe adicional disponível.'}</div>
                      </div>
                    ))}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    {etapa.tasks.length === 0 ? '-' : [...new Set(etapa.tasks.map(t => t.currentStep?.requiredRole?.name || 'Coordenação'))].join(', ')}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>{etapa.tasks.length} tarefa(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
