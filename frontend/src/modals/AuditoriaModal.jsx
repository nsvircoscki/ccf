import React, { useState } from 'react';

const COLUNAS_VISUAIS = ['Iniciar', 'Em Andamento', 'Concluído'];

const getCorStatus = (status) => {
  if (status === 'Iniciar') return '#FBC02D';
  if (status === 'Em Andamento') return '#1E88E5';
  if (status === 'Concluído') return '#43A047';
  return '#999';
};

export function AuditoriaModal({ projeto, kanban, onClose }) {
  // 'etapas' é a aba inicial, igual ao comportamento original
  const [aba, setAba] = useState('etapas');

  const cartoesDoProjeto = kanban.tickets.filter(t => t.workflowId === projeto.id);

  const timelineProjeto = [];
  cartoesDoProjeto.forEach(cartao => {
    if (cartao.history) {
      cartao.history.forEach(h => timelineProjeto.push({ type: 'move', date: h.action_timestamp, data: h, cartaoNome: cartao.title, dono: cartao.currentStep?.requiredRole?.name || 'Coordenação' }));
    }
    if (cartao.comments) {
      cartao.comments.forEach(c => timelineProjeto.push({ type: 'comment', date: c.created_at, data: c, cartaoNome: cartao.title, dono: cartao.currentStep?.requiredRole?.name || 'Coordenação' }));
    }
  });
  timelineProjeto.sort((a, b) => new Date(b.date) - new Date(a.date));

  const etapasAtuaisDoProjeto = COLUNAS_VISUAIS.map(etapa => ({
    name: etapa,
    tasks: cartoesDoProjeto.filter(t => (t.currentStep?.step_name || 'Iniciar') === etapa)
  }));

  const comentariosDoProjeto = cartoesDoProjeto
    .flatMap(t => (t.comments || []).map(c => ({ ...c, ticketTitle: t.title, ticketWorkflowName: t.workflow?.name || '' })))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const movimentacoes = timelineProjeto.filter(item => item.type === 'move');

  const estiloAba = (ativa, corAtiva) => ({
    padding: '12px 18px',
    borderRadius: '10px',
    border: `1px solid ${corAtiva}`,
    background: ativa ? corAtiva : '#FFF',
    color: ativa ? '#FFF' : '#333',
    fontWeight: 'bold',
    cursor: 'pointer'
  });

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: '#FFF', width: '860px', maxWidth: '95vw', height: '85vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '30px', borderBottom: '1px solid #EEE', background: '#333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ color: '#22C55E', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>RELATÓRIO DE AUDITORIA</span>
              <h2 style={{ margin: '5px 0 0', color: '#FFF', fontSize: '28px' }}>{projeto.name}</h2>
              {projeto.description && (
                <span style={{ display: 'inline-block', marginTop: '8px', background: 'rgba(255,255,255,0.2)', color: '#FFF', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                  {projeto.description}
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', background: '#F9F9F9', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setAba('etapas')} style={estiloAba(aba === 'etapas', '#333')}>Exibir etapas</button>
            <button onClick={() => setAba('movimentacoes')} style={estiloAba(aba === 'movimentacoes', '#777')}>Movimentações</button>
            <button onClick={() => setAba('comentarios')} style={estiloAba(aba === 'comentarios', '#777')}>Comentários</button>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#555' }}>{comentariosDoProjeto.length} comentário(s) no projeto</span>
        </div>

        <div className="scroll" style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#F9F9F9' }}>
          {aba === 'etapas' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px' }}>
              {etapasAtuaisDoProjeto.map(etapa => (
                <div key={etapa.name} style={{ background: '#FFF', borderRadius: '18px', border: '1px solid #E8E8E8', boxShadow: '0px 6px 18px rgba(0,0,0,0.04)', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#333' }}>{etapa.name}</div>
                      <div style={{ fontSize: '12px', color: '#777', marginTop: '6px' }}>{etapa.tasks.length} tarefa(s)</div>
                    </div>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: getCorStatus(etapa.name), display: 'inline-block' }}></span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {etapa.tasks.length === 0 ? (
                      <div style={{ color: '#999', fontSize: '13px' }}>Nenhuma tarefa nesta etapa.</div>
                    ) : etapa.tasks.map(task => (
                      <div key={task.id} style={{ background: '#F7F9FF', borderRadius: '14px', padding: '14px 16px', border: '1px solid #E4E9F5' }}>
                        <div style={{ fontWeight: '800', color: '#222', marginBottom: '6px' }}>{task.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#555', fontSize: '13px' }}>{task.workflow?.name || ''}</span>
                          <span style={{ color: '#555', fontSize: '13px', fontWeight: '700' }}>{task.currentStep?.requiredRole?.name || 'Coordenação'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : aba === 'movimentacoes' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {movimentacoes.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic' }}>Nenhuma movimentação registrada neste projeto.</p>
              ) : movimentacoes.map((item, index) => (
                <div key={`${item.cartaoNome || 'movimento'}-${index}`} style={{ background: '#FFF', borderRadius: '16px', padding: '20px', border: '1px solid #E8E8E8', boxShadow: '0px 6px 18px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '900', color: '#333' }}>{item.data.toStep?.step_name || item.data.fromStep?.step_name || 'Movimentação de etapa'}</div>
                    <span style={{ color: '#999', fontSize: '13px', fontWeight: '700' }}>{new Date(item.data.action_timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                  <div style={{ marginBottom: '10px', color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                    Cartão <strong>{item.cartaoNome}</strong> foi movido de <strong>{item.data.fromStep?.step_name || 'Criação'}</strong> para <strong>{item.data.toStep?.step_name || 'Desconhecido'}</strong>.
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', color: '#777', fontSize: '13px' }}>
                    <span>Responsável: {item.data.user?.name || item.dono || 'Desconhecido'}</span>
                    <span>Projeto: {projeto.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {comentariosDoProjeto.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic' }}>Nenhum comentário encontrado neste projeto.</p>
              ) : comentariosDoProjeto.map(comment => (
                <div key={comment.id} style={{ background: '#FFF', borderRadius: '16px', padding: '20px', border: '1px solid #E8E8E8', boxShadow: '0px 6px 18px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '900', color: '#333' }}>{comment.user?.name || 'Usuário'}</div>
                    <span style={{ color: '#999', fontSize: '13px', fontWeight: '700' }}>{new Date(comment.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div style={{ marginBottom: '10px', color: '#555', fontSize: '14px', lineHeight: '1.6' }}>{comment.text}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', color: '#777', fontSize: '13px' }}>
                    <span>Cartão: {comment.ticketTitle}</span>
                    <span>Projeto: {comment.ticketWorkflowName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
