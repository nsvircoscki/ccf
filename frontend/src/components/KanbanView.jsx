import React, { useState } from 'react';
import { FiClock, FiEdit, FiTrash2, FiPrinter } from 'react-icons/fi';
import { TicketCard } from './TicketCard';
import { AddCard } from './AddCard';
import { AnimatedDropdown } from './AnimatedDropdown';

const USUARIOS = ['Desenho', 'Topografia', 'Charles', 'Coordenação'];
const COLUNAS_VISUAIS = ['Iniciar', 'Em Andamento', 'Concluído']; 
const CORES = {
  'Charles': { bg: '#FFF9C4', borda: '#FBC02D' },      
  'Topografia': { bg: '#BBDEFB', borda: '#1E88E5' },   
  'Desenho': { bg: '#C8E6C9', borda: '#43A047' },      
  'Coordenação': { bg: '#D7CCC8', borda: '#795548' }   
};

const normalize = (text) => String(text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

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
  onAvisoDependencia,
  onAbrirDetalhes,
  onImprimirProjeto
}) {
  const { tickets, workflows, workflowAtivo, setWorkflowAtivo, moverTicketOtimista } = kanban;

  const [filtroResponsavel, setFiltroResponsavel] = useState('Todos');
  const [buscaEtapaKanban, setBuscaEtapaKanban] = useState('');
  const [ticketArrastado, setTicketArrastado] = useState(null);
  const [modalImpressaoAberto, setModalImpressaoAberto] = useState(false);
  const [workflowImpressao, setWorkflowImpressao] = useState(null);

  const etapaTerm = normalize(buscaEtapaKanban.trim());

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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <AnimatedDropdown
              label="Projeto Kanban"
              value={workflowAtivo || ''}
              onChange={setWorkflowAtivo}
              options={[{ value: '', label: 'Nenhum trabalho criado' }, ...workflows.map(w => ({ value: w.id, label: w.name }))]}
              width="400px"
              searchable
              searchPlaceholder="Pesquisar projeto"
            />

            {/* PROCESSO, DADOS VISÍVEIS E BOTÃO DE DETALHES */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {projeto?.description && (
                <span style={{ fontSize: '13px', color: '#555', fontWeight: 'bold' }}>
                  {projeto.description}
                </span>
              )}

              {projeto && (projeto.terreno || projeto.matricula || projeto.endereco) && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {projeto.terreno && (
                    <span style={{ fontSize: '12px', color: '#444', background: projeto.terreno === 'Rural' ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${projeto.terreno === 'Rural' ? '#86EFAC' : '#BFDBFE'}`, padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                      {projeto.terreno}
                    </span>
                  )}
                  {projeto.matricula && (
                    <span style={{ fontSize: '12px', color: '#444', background: '#FFF3E0', border: '1px solid #FFCC80', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                      Mat: {projeto.matricula}
                    </span>
                  )}
                  {projeto.endereco && (
                    <span style={{ fontSize: '12px', color: '#444', background: '#E0F2F1', border: '1px solid #80CBC4', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                      End: {projeto.endereco}
                    </span>
                  )}
                </div>
              )}

              {projeto && (
                <button
                  onClick={onAbrirDetalhes}
                  style={{ padding: '6px 14px', background: projeto.details ? '#333' : '#EAEAEA', color: projeto.details ? '#FFF' : '#333', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {projeto.matricula || projeto.endereco || projeto.details ? 'Editar Informações' : '+ Informações'}
                </button>
              )}
            </div>

            {/* BARRA DE PROGRESSÃO LINEAR DO PROJETO SELECIONADO */}
            {projeto && (() => {
              const totalProj = tickets.filter(t => t.workflowId === workflowAtivo).length;
              const concluidasProj = tickets.filter(t => t.workflowId === workflowAtivo && (t.currentStep?.step_name || 'Iniciar') === 'Concluído').length;
              const progProj = totalProj === 0 ? 0 : Math.round((concluidasProj / totalProj) * 100);
              return (
                <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                    <span>Progresso do Projeto</span>
                    <span style={{ color: progProj === 100 ? '#22C55E' : '#4A90E2' }}>{progProj}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#EAEAEA', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${progProj}%`, height: '100%', background: progProj === 100 ? '#22C55E' : '#4A90E2', transition: 'width 0.5s' }}></div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
              <input
                type="text"
                placeholder="Buscar etapa"
                value={buscaEtapaKanban}
                onChange={e => setBuscaEtapaKanban(e.target.value)}
                style={{ minWidth: '180px', flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1px solid #DDD', outline: 'none', background: '#FFF', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* BOTÕES DE AÇÃO DO PROJETO COM ÍCONES */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button title="Histórico do Projeto" onClick={() => onAbrirAuditoria(projeto)} style={{ padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
              <FiClock size={20} />
            </button>

            <button title="Imprimir Etapas" onClick={() => { setWorkflowImpressao(workflowAtivo || (workflows[0]?.id ?? null)); setModalImpressaoAberto(true); }} style={{ padding: '12px', background: '#4A90E2', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
              <FiPrinter size={20} />
            </button>

            {usuarioLogado === 'Charles' && (
              <>
                <button title="Editar Processos" onClick={onAbrirEdicao} style={{ padding: '12px', background: '#EAEAEA', color: '#333', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                  <FiEdit size={20} />
                </button>
                <button title="Excluir Projeto" onClick={onAbrirExcluirProjeto} style={{ padding: '12px', background: '#FF5252', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                  <FiTrash2 size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EAEAEA', padding: '8px 20px', borderRadius: '20px' }}>
          <span style={{ fontWeight: 'bold', color: '#787373' }}>Filtro de Setor:</span>
          <AnimatedDropdown
            label="Setor"
            value={filtroResponsavel}
            onChange={setFiltroResponsavel}
            options={[{ value: 'Todos', label: 'TODOS' }, ...USUARIOS.map(u => ({ value: u, label: u }))]}
            width="180px"
          />
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
                  .filter(t => {
                    if (etapaTerm === '') return true;
                    const etapaTexto = normalize(t.currentStep?.step_name || 'Iniciar');
                    return etapaTexto.includes(etapaTerm) || normalize(t.title).includes(etapaTerm);
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

                {projeto && (
                  <AddCard
                    column={colunaNome}
                    workflowAtivo={workflowAtivo}
                    projeto={projeto}
                    kanban={kanban}
                    usuarioLogado={usuarioLogado}
                    usuarios={USUARIOS}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {modalImpressaoAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
          <div style={{ background: '#FFF', padding: '35px', borderRadius: '20px', width: '520px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', color: '#333' }}>Imprimir Etapas</h2>
            <p style={{ margin: '0 0 20px', color: '#555', fontSize: '14px' }}>Selecione o processo que deseja imprimir. Todas as etapas serão incluídas.</p>

            <AnimatedDropdown
              label="Processo"
              value={workflowImpressao || ''}
              onChange={setWorkflowImpressao}
              options={[{ value: '', label: 'Selecione o processo' }, ...workflows.map(w => ({ value: w.id, label: w.name }))]}
              width="100%"
              searchable
              searchPlaceholder="Pesquisar processo"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '25px' }}>
              <button onClick={() => setModalImpressaoAberto(false)} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button
                disabled={!workflowImpressao}
                onClick={() => {
                  onImprimirProjeto(workflowImpressao);
                  setModalImpressaoAberto(false);
                }}
                style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: workflowImpressao ? '#4A90E2' : '#CCC', color: 'white', cursor: workflowImpressao ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}