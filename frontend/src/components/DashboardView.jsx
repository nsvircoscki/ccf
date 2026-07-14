import React, { useState } from 'react';

const TIPOS_PROCESSO = ["Retificação", "Desmembramento", "Unificação", "Usucapião", "Alteração de Divisas", "CAR", "Certificação INCRA", "Escritura", "Conferência", "Cadastral", "Locação", "Movimentação de Terra"];
const CORES = {
  'Charles': { bg: '#FFF9C4', borda: '#FBC02D' },      
  'Topografia': { bg: '#BBDEFB', borda: '#1E88E5' },   
  'Desenho': { bg: '#C8E6C9', borda: '#43A047' },      
  'Coordenação': { bg: '#D7CCC8', borda: '#795548' }   
};

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
  onAbrirDetalhe, 
  onAbrirAuditoria, 
  setTelaAtiva 
}) {
  const { tickets, workflows, setWorkflowAtivo } = kanban;

  const [filtroDashboardEtapa, setFiltroDashboardEtapa] = useState('Pendentes'); 
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

  return (
    <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '32px' }}>Dashboard de Ações</h1>
            <p style={{ margin: 0, color: '#777' }}>Acompanhe o fluxo e o histórico global.</p>
          </div>
          <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#4A90E2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Imprimir A4</button>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR PROJETO</label>
            <select value={filtroDashboardProjeto} onChange={e => setFiltroDashboardProjeto(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }}>
              <option value="Todos">Todos os Projetos</option>
              {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR TIPO</label>
            <select value={filtroDashboardTipo} onChange={e => setFiltroDashboardTipo(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }}>
              <option value="Todos">Todos os Tipos</option>
              {TIPOS_PROCESSO.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR STATUS</label>
            <select value={filtroDashboardEtapa} onChange={e => setFiltroDashboardEtapa(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }}>
              <option value="Pendentes">Pendentes (Iniciar / Em Andamento)</option>
              <option value="Todas">Todas (Incluindo Concluído)</option>
              <option value="Iniciar">Apenas Iniciar</option>
              <option value="Em Andamento">Apenas Em Andamento</option>
              <option value="Concluído">Apenas Concluído</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>BUSCAR POR TAREFA</label>
            <select value={filtroDashboardTarefa} onChange={e => setFiltroDashboardTarefa(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }}>
              <option value="Todas">Mostrar todas as tarefas</option>
              {tarefasUnicasCatalogo.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #EEE' }}>
                <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>PROJETO</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#999', fontSize: '12px' }}>HISTÓRICO</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>STATUS</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>TAREFA</th>
                {usuarioLogado === 'Charles' && <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>RESPONSÁVEL</th>}
                <th style={{ padding: '15px', textAlign: 'right', color: '#999', fontSize: '12px' }}>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {tarefasDoDashboard.map(t => {
                const dono = t.currentStep?.requiredRole?.name || 'Coordenação';
                const statusNome = t.currentStep?.step_name || 'Iniciar';
                
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer' }} onClick={() => onAbrirDetalhe(t)}>
                    <td style={{ padding: '15px' }}>
                      <span style={{ fontWeight: '900', color: '#333', display: 'block' }}>{t.workflow?.name}</span>
                      {t.workflow?.description && (
                        <span style={{ display: 'inline-block', marginTop: '6px', background: '#EAEAEA', color: '#555', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                          {t.workflow.description}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); onAbrirAuditoria(t.workflow); }} style={{ background: '#F0F0F0', border: 'none', padding: '6px 12px', borderRadius: '6px', color: '#555', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Ver Detalhes</button>
                    </td>
                    <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: getCorStatus(statusNome), display: 'inline-block' }}></span>
                      <span style={{ color: '#555', fontSize: '13px', fontWeight: 'bold' }}>{statusNome}</span>
                    </td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#555' }}>{t.title}</td>
                    {usuarioLogado === 'Charles' && <td style={{ padding: '15px' }}><span style={{ background: CORES[dono]?.bg, color: CORES[dono]?.borda, padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{dono}</span></td>}
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <button onClick={(e) => { e.stopPropagation(); setWorkflowAtivo(t.workflowId); setTelaAtiva('kanban'); }} style={{ background: 'transparent', border: '1px solid #DDD', padding: '6px 15px', borderRadius: '6px', color: '#777', fontWeight: 'bold', cursor: 'pointer' }}>Quadro</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}