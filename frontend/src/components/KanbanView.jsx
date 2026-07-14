import React, { useState } from 'react';
import { TicketCard } from './TicketCard';

const USUARIOS = ['Desenho', 'Topografia', 'Charles', 'Coordenação'];
const COLUNAS_VISUAIS = ['Iniciar', 'Em Andamento', 'Concluído']; 
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

export function KanbanView({ 
  kanban, 
  usuarioLogado, 
  buscaTexto, 
  onAbrirDetalhe, 
  onAbrirAuditoria, 
  onAbrirEdicao, 
  onAbrirExcluirProjeto, 
  onAbrirExcluirCartao, 
  onAvisoDependencia 
}) {
  const { tickets, workflows, workflowAtivo, setWorkflowAtivo, moverTicketOtimista } = kanban;
  
  const [filtroResponsavel, setFiltroResponsavel] = useState('Todos'); 
  const [buscaProjetoKanban, setBuscaProjetoKanban] = useState('');
  const [ticketArrastado, setTicketArrastado] = useState(null);

  const projeto = workflows.find(w => w.id === workflowAtivo);

  const handleDrop = (e, nomeColunaDestino) => {
    e.preventDefault();
    if (!ticketArrastado || !projeto) {
        setTicketArrastado(null);
        return;
    }
    
    const setorDoCard = ticketArrastado.currentStep?.requiredRole?.name || 'Coordenação';
    const proximaEtapa = projeto.steps?.find(s => s.step_name === nomeColunaDestino && s.requiredRole?.name === setorDoCard);
    
    if (!proximaEtapa || ticketArrastado.currentStepId === proximaEtapa.id) { 
        setTicketArrastado(null); 
        return; 
    }
    
    const pendentesAnteriores = tickets.filter(t => 
        t.workflowId === ticketArrastado.workflowId && 
        t.sequence > 0 && ticketArrastado.sequence > 0 && 
        t.sequence < ticketArrastado.sequence && 
        (t.currentStep?.step_name || 'Iniciar') !== 'Concluído'
    );

    if (pendentesAnteriores.length > 0 && proximaEtapa.step_name !== 'Iniciar') {
        onAvisoDependencia({ ticketArrastado, proximaEtapa, pendentes: pendentesAnteriores });
        setTicketArrastado(null);
        return;
    }

    moverTicketOtimista(ticketArrastado, proximaEtapa, usuarioLogado);
    setTicketArrastado(null);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: '1182px', margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#FFF', borderRadius: '8px', border: '2px solid #EAEAEA', padding: '0 10px', maxWidth: '400px', height: '35px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Pesquisar cliente..." 
                value={buscaProjetoKanban}
                onChange={e => setBuscaProjetoKanban(e.target.value)}
                style={{ border: 'none', outline: 'none', padding: '5px 10px', width: '100%', fontSize: '13px', background: 'transparent', color: '#333' }}
              />
            </div>
            <select value={workflowAtivo || ""} onChange={e => setWorkflowAtivo(e.target.value)} style={{ height: '45px', background: '#FFF', borderRadius: '10px', padding: '0 20px', color: '#333', fontWeight: '900', border: '2px solid #EAEAEA', fontSize: '16px', outline: 'none', cursor: 'pointer', maxWidth: '500px', width: '100%' }}>
              <option value="">Selecione um projeto...</option>
              {workflows
                .filter(w => w.name.toLowerCase().includes(buscaProjetoKanban.toLowerCase()))
                .map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.description ? ` — ${w.description}` : ''}
                  </option>
                ))
              }
            </select>
            {projeto?.description && (
              <span style={{ fontSize: '12px', color: '#777', marginTop: '2px', fontWeight: 'bold' }}>
                Tipos: <span style={{ color: '#555' }}>{projeto.description}</span>
              </span>
            )}
          </div>
          <button onClick={() => onAbrirAuditoria(projeto)} style={{ padding: '12px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Histórico do Projeto</button>
          
          {usuarioLogado === 'Charles' && (
            <>
              <button onClick={onAbrirEdicao} style={{ padding: '12px 20px', background: '#EAEAEA', color: '#333', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Editar Processos</button>
              <button onClick={onAbrirExcluirProjeto} style={{ padding: '12px 20px', background: '#FF5252', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Excluir Projeto</button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EAEAEA', padding: '8px 20px', borderRadius: '20px' }}>
          <span style={{ fontWeight: 'bold', color: '#787373' }}>Filtro de Setor:</span>
          <select value={filtroResponsavel} onChange={e => setFiltroResponsavel(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
            <option value="Todos">TODOS</option>
            {USUARIOS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '1182px', margin: '0 auto', display: 'flex', gap: '30px', flex: 1, minHeight: 0 }}>
        {workflows.length === 0 ? (
          <div style={{ margin: 'auto', color: '#999', fontSize: '18px', fontWeight: 'bold' }}>Nenhum projeto selecionado ou criado.</div>
        ) : (
          COLUNAS_VISUAIS.map((colunaNome) => (
            <div key={colunaNome} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, colunaNome)} style={{ width: '374px', background: '#EAEAEA', borderRadius: '15px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: getCorStatus(colunaNome), display: 'inline-block' }}></span>
                <h2 style={{ color: '#555', fontSize: '20px', margin: 0 }}>{colunaNome}</h2>
              </div>
              
              <div className="scroll" style={{ padding: '15px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tickets
                  .filter(t => t.workflowId === workflowAtivo)
                  .filter(t => {
                    const statusNome = t.currentStep?.step_name || 'Iniciar';
                    return statusNome === colunaNome;
                  })
                  .filter(t => {
                    const dono = t.currentStep?.requiredRole?.name || 'Coordenação';
                    return filtroResponsavel === 'Todos' || dono === filtroResponsavel;
                  })
                  .filter(t => {
                    if (buscaTexto.trim() === '') return true;
                    const termo = buscaTexto.toLowerCase();
                    return t.title.toLowerCase().includes(termo) || t.workflow?.name.toLowerCase().includes(termo);
                  })
                  .map(t => {
                    const dono = t.currentStep?.requiredRole?.name || 'Coordenação';
                    const temPermissao = dono === usuarioLogado || usuarioLogado === 'Charles';
                    const cor = CORES[dono] || CORES['Charles'];

                    const pendentesAnteriores = tickets.filter(prevT => prevT.workflowId === t.workflowId && prevT.sequence > 0 && t.sequence > 0 && prevT.sequence < t.sequence && (prevT.currentStep?.step_name || 'Iniciar') !== 'Concluído').length > 0;
                    const estaBloqueado = pendentesAnteriores && (t.currentStep?.step_name || 'Iniciar') === 'Iniciar';

                    return (
                      <TicketCard 
                        key={t.id}
                        t={t}
                        dono={dono}
                        cor={cor}
                        temPermissao={temPermissao}
                        estaBloqueado={estaBloqueado}
                        onDragStart={() => setTicketArrastado(t)}
                        onDragEnd={() => setTicketArrastado(null)}
                        onClick={() => onAbrirDetalhe(t)}
                        onExcluir={(e) => { e.stopPropagation(); onAbrirExcluirCartao(t.id); }}
                      />
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}