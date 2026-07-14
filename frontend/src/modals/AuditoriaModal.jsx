import React from 'react';

const CORES = {
  'Charles': { bg: '#FFF9C4', borda: '#FBC02D' },      
  'Topografia': { bg: '#BBDEFB', borda: '#1E88E5' },   
  'Desenho': { bg: '#C8E6C9', borda: '#43A047' },      
  'Coordenação': { bg: '#D7CCC8', borda: '#795548' }   
};

export function AuditoriaModal({ projeto, kanban, onClose }) {
  const cartoesDoProjeto = kanban.tickets.filter(t => t.workflowId === projeto.id);
  let timelineProjeto = [];

  cartoesDoProjeto.forEach(cartao => {
    if (cartao.history) {
      cartao.history.forEach(h => timelineProjeto.push({ type: 'move', date: h.action_timestamp, data: h, cartaoNome: cartao.title, dono: cartao.currentStep?.requiredRole?.name || 'Coordenação' }));
    }
    if (cartao.comments) {
      cartao.comments.forEach(c => timelineProjeto.push({ type: 'comment', date: c.created_at, data: c, cartaoNome: cartao.title, dono: cartao.currentStep?.requiredRole?.name || 'Coordenação' }));
    }
  });
  
  timelineProjeto.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: '#FFF', width: '800px', height: '85vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
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
        <div className="scroll" style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#F9F9F9' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {timelineProjeto.length === 0 && <p style={{ color: '#999', textAlign: 'center', marginTop: '50px' }}>Nenhuma atividade foi registrada neste projeto ainda.</p>}
            {timelineProjeto.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px', background: '#FFF', padding: '20px', borderRadius: '15px', boxShadow: '0px 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: CORES[item.dono]?.bg || '#EEE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', color: CORES[item.dono]?.borda || '#333' }}>
                  {item.type === 'comment' ? 'C' : 'M'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '900', color: CORES[item.dono]?.borda || '#333', fontSize: '15px' }}>{item.data.user?.name || item.dono}</span>
                    <span style={{ color: '#999', fontSize: '13px', fontWeight: 'bold' }}>{new Date(item.date).toLocaleString('pt-BR')}</span>
                  </div>
                  <span style={{ display: 'inline-block', background: '#F0F0F0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>
                    Referente a: {item.cartaoNome}
                  </span>
                  {item.type === 'comment' ? (
                    <p style={{ margin: 0, color: '#333', fontSize: '15px', lineHeight: '1.6' }}>"{item.data.text}"</p>
                  ) : (
                    <p style={{ margin: 0, color: '#777', fontSize: '14px' }}>
                      Moveu o cartão de <b>{item.data.fromStep?.step_name || 'Criação'}</b> para <b>{item.data.toStep?.step_name}</b>.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}