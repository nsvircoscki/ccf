import React from 'react';

export function ExcluirCartaoModal({ ticketId, kanban, onClose }) {
  const confirmarExclusaoCartao = async () => {
    if (!ticketId) return;
    try {
      await kanban.excluirCartaoLocal(ticketId);
      onClose();
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <div style={{ background: '#FFF', padding: '30px', borderRadius: '20px', width: '400px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 10px', color: '#333' }}>Excluir Tarefa</h2>
        <p style={{ color: '#777', fontSize: '14px', marginBottom: '25px', lineHeight: '1.4' }}>
          Tem certeza que deseja excluir esta tarefa definitivamente? Todo o histórico dela será perdido.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
          <button onClick={confirmarExclusaoCartao} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#FF5252', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Sim, Excluir</button>
        </div>
      </div>
    </div>
  );
}