import React, { useState } from 'react';

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

export function TicketDetailModal({ ticket, kanban, usuarioLogado, onClose }) {
  const [novoComentario, setNovoComentario] = useState("");
  const [editandoDescricao, setEditandoDescricao] = useState(false);
  const [descricaoEditada, setDescricaoEditada] = useState("");

  // Mantém o ticket sempre sincronizado com o estado global do useKanban
  const ticketAtual = kanban.tickets.find(t => t.id === ticket.id) || ticket;

  const hist = ticketAtual.history ? ticketAtual.history.map(h => ({ type: 'move', date: h.action_timestamp, data: h })) : [];
  const com = ticketAtual.comments ? ticketAtual.comments.map(c => ({ type: 'comment', date: c.created_at, data: c })) : [];
  const timelineCartao = [...hist, ...com].sort((a, b) => new Date(b.date) - new Date(a.date));

  const enviarComentario = async () => {
    if (!novoComentario.trim()) return;
    await kanban.adicionarComentarioLocal(ticketAtual.id, usuarioLogado, novoComentario);
    setNovoComentario("");
  };

  const salvarDescricao = async () => {
    await kanban.atualizarDescricaoLocal(ticketAtual.id, descricaoEditada);
    setEditandoDescricao(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: '#FFF', width: '600px', height: '80vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '25px 30px', borderBottom: '1px solid #EEE', background: CORES[ticketAtual.currentStep?.requiredRole?.name || 'Coordenação']?.bg || '#FFF9C4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>{ticketAtual.title}</h2>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
          </div>
          <p style={{ margin: '10px 0 0', color: '#555', fontWeight: 'bold' }}>Projeto: {ticketAtual.workflow?.name}</p>
          {ticketAtual.workflow?.description && (
            <span style={{ display: 'inline-block', marginTop: '8px', background: 'rgba(0,0,0,0.05)', color: '#555', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              {ticketAtual.workflow.description}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: getCorStatus(ticketAtual.currentStep?.step_name || 'Iniciar'), display: 'inline-block' }}></span>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Status: {ticketAtual.currentStep?.step_name || 'Iniciar'}</span>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalhes (Matrícula, Endereço...)</label>
            {editandoDescricao ? (
              <div style={{ marginTop: '6px' }}>
                <textarea
                  autoFocus
                  value={descricaoEditada}
                  onChange={(e) => setDescricaoEditada(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #4A90E2', outline: 'none', resize: 'vertical', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={salvarDescricao} style={{ padding: '6px 12px', background: '#4A90E2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Salvar</button>
                  <button onClick={() => setEditandoDescricao(false)} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.1)', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => { setDescricaoEditada(ticketAtual.description || ''); setEditandoDescricao(true); }}
                style={{ marginTop: '6px', padding: '10px 12px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', border: '1px dashed rgba(0,0,0,0.2)', minHeight: '40px', cursor: 'pointer', fontSize: '13px', color: ticketAtual.description ? '#333' : 'rgba(0,0,0,0.4)', whiteSpace: 'pre-wrap', lineHeight: '1.5', transition: 'all 0.2s ease' }}
              >
                {ticketAtual.description || 'Clique aqui para adicionar a matrícula, endereço...'}
              </div>
            )}
          </div>
        </div>
        <div className="scroll" style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 15px', color: '#333' }}>Comentários e Histórico</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input value={novoComentario} onChange={e => setNovoComentario(e.target.value)} placeholder="Escreva uma observação..." style={{ flex: 1, padding: '12px 15px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }} />
            <button onClick={enviarComentario} style={{ padding: '12px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Enviar</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {timelineCartao.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>Nenhuma atividade registrada.</p>}
            {timelineCartao.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '15px' }}>
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#777' }}>
                  {item.type === 'comment' ? 'C' : 'M'}
                </div>
                <div style={{ flex: 1, background: item.type === 'comment' ? '#F9F9F9' : 'transparent', padding: item.type === 'comment' ? '15px' : '0', borderRadius: '10px', border: item.type === 'comment' ? '1px solid #EEE' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{item.data.user?.name || 'Sistema'}</span>
                    <span style={{ color: '#999', fontSize: '12px' }}>{new Date(item.date).toLocaleString('pt-BR')}</span>
                  </div>
                  {item.type === 'comment' ? <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.5' }}>{item.data.text}</p> : <p style={{ margin: 0, color: '#777', fontSize: '13px' }}>Moveu para <b>{item.data.toStep?.step_name}</b>.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}