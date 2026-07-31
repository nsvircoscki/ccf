import React, { useState } from 'react';
import { FiPrinter, FiList, FiTrello } from 'react-icons/fi';
import { AnimatedDropdown } from './AnimatedDropdown';

const TIPOS_PROCESSO = ["Retificação", "Desmembramento", "Unificação", "Usucapião", "Alteração de Divisas", "CAR", "Certificação INCRA", "Escritura", "Conferência", "Cadastral", "Locação", "Movimentação de Terra"];

const getCorStatus = (status) => {
  if (status === 'Iniciar') return '#FBC02D';
  if (status === 'Em Andamento') return '#1E88E5';
  if (status === 'Concluído') return '#43A047';
  return '#999';
};

export function DashboardView({
  kanban,
  usuarioLogado,
  buscaTexto,
  onAbrirAuditoria,
  setTelaAtiva,
  onImprimirProjeto
}) {
  const { tickets, workflows, setWorkflowAtivo } = kanban;

  const [filtroDashboardEtapa, setFiltroDashboardEtapa] = useState('Todas');
  const [filtroDashboardProjeto, setFiltroDashboardProjeto] = useState('Todos');
  const [filtroDashboardTarefa, setFiltroDashboardTarefa] = useState('Todas');
  const [filtroDashboardTipo, setFiltroDashboardTipo] = useState('Todos');

  const tarefasUnicasCatalogo = [...new Set(tickets.map(t => t.title))].sort();

  // Lógica de filtragem preservada
  let tarefasDoDashboard = tickets;

  if (usuarioLogado !== 'Charles') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => (t.currentStep?.requiredRole?.name || 'Coordenação') === usuarioLogado);
  }
  if (filtroDashboardEtapa === 'Pendentes') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => (t.currentStep?.step_name || 'Iniciar') !== 'Concluído');
  } else if (filtroDashboardEtapa !== 'Todas') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => (t.currentStep?.step_name || 'Iniciar') === filtroDashboardEtapa);
  }
  if (filtroDashboardProjeto !== 'Todos') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => t.workflowId === filtroDashboardProjeto);
  }
  if (filtroDashboardTarefa !== 'Todas') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => t.title === filtroDashboardTarefa);
  }
  if (filtroDashboardTipo !== 'Todos') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => t.workflow?.description?.includes(filtroDashboardTipo));
  }

  if (buscaTexto.trim() !== '') {
    const termo = buscaTexto.toLowerCase();
    tarefasDoDashboard = tarefasDoDashboard.filter(t => {
      const nomeProj = t.workflow?.name || '';
      const titulo = t.title || '';
      return nomeProj.toLowerCase().includes(termo) || titulo.toLowerCase().includes(termo);
    });
  }

  // Agrupamento das tarefas filtradas por projeto
  const projetosDoDashboard = tarefasDoDashboard.reduce((acc, ticket) => {
    if (!ticket.workflow) return acc;
    let projeto = acc.find(p => p.id === ticket.workflowId);
    if (!projeto) {
      projeto = {
        id: ticket.workflowId,
        name: ticket.workflow.name,
        description: ticket.workflow.description,
        tasks: []
      };
      acc.push(projeto);
    }
    projeto.tasks.push(ticket);
    return acc;
  }, []);

  const projetoOptions = [{ value: 'Todos', label: 'Todos os Projetos' }, ...workflows.map(w => ({ value: w.id, label: w.name }))];
  const tipoOptions = [{ value: 'Todos', label: 'Todos os Tipos' }, ...TIPOS_PROCESSO.map(tipo => ({ value: tipo, label: tipo }))];
  const statusOptions = [
    { value: 'Pendentes', label: 'Pendentes (Iniciar / Em Andamento)' },
    { value: 'Todas', label: 'Todas (Incluindo Concluído)' },
    { value: 'Iniciar', label: 'Apenas Iniciar' },
    { value: 'Em Andamento', label: 'Apenas Em Andamento' },
    { value: 'Concluído', label: 'Apenas Concluído' }
  ];
  const tarefaOptions = [{ value: 'Todas', label: 'Mostrar todas as tarefas' }, ...tarefasUnicasCatalogo.map(t => ({ value: t, label: t }))];

  const totalTarefas = tarefasDoDashboard.length;
  const concluidas = tarefasDoDashboard.filter(t => (t.currentStep?.step_name || 'Iniciar') === 'Concluído').length;
  const progressoGlobal = totalTarefas === 0 ? 0 : Math.round((concluidas / totalTarefas) * 100);

  const raio = 36;
  const circunferencia = 2 * Math.PI * raio;
  const offsetProgresso = circunferencia - (progressoGlobal / 100) * circunferencia;

  const imprimir = () => onImprimirProjeto(
    filtroDashboardProjeto !== 'Todos' ? filtroDashboardProjeto : (workflows.length > 0 ? workflows[0].id : null)
  );

  return (
    <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '25px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '32px' }}>Dashboard de Ações</h1>
            <p style={{ margin: 0, color: '#777' }}>Acompanhe o fluxo e o histórico global.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button title="Imprimir Relatório A4" onClick={imprimir} disabled={workflows.length === 0} style={{ padding: '10px 15px', background: workflows.length === 0 ? '#CCC' : '#4A90E2', color: 'white', border: 'none', borderRadius: '8px', cursor: workflows.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <FiPrinter size={22} />
            </button>
            <AnimatedDropdown
              label="Projeto"
              value={filtroDashboardProjeto}
              onChange={setFiltroDashboardProjeto}
              options={projetoOptions}
              width="260px"
              searchable
              searchPlaceholder="Pesquisar projeto"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '20px', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR TIPO</label>
            <AnimatedDropdown
              label="Tipo"
              value={filtroDashboardTipo}
              onChange={setFiltroDashboardTipo}
              options={tipoOptions}
              width="100%"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR STATUS</label>
            <AnimatedDropdown
              label="Status"
              value={filtroDashboardEtapa}
              onChange={setFiltroDashboardEtapa}
              options={statusOptions}
              width="100%"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>BUSCAR POR TAREFA</label>
            <AnimatedDropdown
              label="Tarefa"
              value={filtroDashboardTarefa}
              onChange={setFiltroDashboardTarefa}
              options={tarefaOptions}
              width="100%"
              searchable
              searchPlaceholder="Pesquisar tarefa"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button title="Imprimir tarefas filtradas" onClick={imprimir} disabled={workflows.length === 0} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: workflows.length === 0 ? '#CCC' : '#4A90E2', color: 'white', cursor: workflows.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(74, 144, 226, 0.18)', transition: 'all 0.2s' }}>
              <FiPrinter size={24} />
            </button>
          </div>
        </div>

        {/* GRÁFICO CIRCULAR DE PROGRESSÃO GLOBAL */}
        <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '90px', height: '90px' }}>
            <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r={raio} fill="none" stroke="#F0F0F0" strokeWidth="8" />
              <circle
                cx="50" cy="50" r={raio}
                fill="none"
                stroke={progressoGlobal === 100 ? '#22C55E' : '#4A90E2'}
                strokeWidth="8"
                strokeDasharray={circunferencia}
                strokeDashoffset={offsetProgresso}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: progressoGlobal === 100 ? '#22C55E' : '#4A90E2' }}>
              {progressoGlobal}%
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Progressão Geral</h3>
            <div style={{ fontSize: '14px', color: '#777', fontWeight: 'bold' }}>
              {concluidas} de {totalTarefas} tarefas finalizadas no total
            </div>
          </div>
        </div>

        {/* LISTA DE PROJETOS */}
        <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' }}>
          {projetosDoDashboard.length === 0 ? (
            <p style={{ color: '#999', fontSize: '16px', textAlign: 'center', margin: '40px 0' }}>Nenhuma tarefa encontrada para os filtros aplicados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {projetosDoDashboard.map(projetoDashboard => {
                const etapas = ['Iniciar', 'Em Andamento', 'Concluído'];
                const tarefasPorEtapa = etapas.reduce((acc, etapa) => {
                  acc[etapa] = projetoDashboard.tasks.filter(t => (t.currentStep?.step_name || 'Iniciar') === etapa);
                  return acc;
                }, {});
                return (
                  <div key={projetoDashboard.id} onDoubleClick={() => { setWorkflowAtivo(projetoDashboard.id); setTelaAtiva('kanban'); }} style={{ border: '1px solid #EEE', borderRadius: '15px', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>{projetoDashboard.name}</h3>
                        {projetoDashboard.description && (
                          <p style={{ margin: '8px 0 12px 0', color: '#777', fontSize: '14px' }}>{projetoDashboard.description}</p>
                        )}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {etapas.map(etapa => (
                            <span key={etapa} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F0F0F0', color: '#555', padding: '8px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getCorStatus(etapa), display: 'inline-block' }}></span>
                              {etapa}: {tarefasPorEtapa[etapa].length}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                        <button title="Ver Etapas do Projeto" onClick={() => onAbrirAuditoria(workflows.find(w => w.id === projetoDashboard.id) || projetoDashboard)} style={{ padding: '10px 15px', borderRadius: '10px', border: 'none', background: '#333', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                          <FiList size={20} />
                        </button>
                        <button title="Abrir Quadro Kanban" onClick={() => { setWorkflowAtivo(projetoDashboard.id); setTelaAtiva('kanban'); }} style={{ padding: '10px 15px', borderRadius: '10px', border: 'none', background: '#777', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                          <FiTrello size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
