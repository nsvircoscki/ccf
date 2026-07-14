import React from 'react';

export function AvisoDependenciaModal({ aviso, kanban, onClose }) {
  const executingDropFromWarning = () => {
    if (!aviso) return;
    kanban.moverTicketOtimista(aviso.ticketArrastado, aviso.proximaEtapa);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110 }}>
      <div style={{ background: '#FFF', padding: '35px', borderRadius: '20px', width: '500px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 10px', color: '#F57F17' }}>Aviso de Dependência</h2>
        <p style={{ color: '#555', fontSize: '15px', marginBottom: '20px', lineHeight: '1.5' }}>
          A tarefa <b>{aviso.ticketArrastado.title}</b> possui etapas anteriores pendentes que ainda não foram enviadas para Concluído.
        </p>
        <div style={{ background: '#FFF9C4', padding: '15px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #FBC02D' }}>
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#F57F17', display: 'block', marginBottom: '5px' }}>ATIVIDADES EM ATRASO:</span>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', fontSize: '13px' }}>
            {aviso.pendentes.slice(0, 3).map(p => <li key={p.id}>{p.title} ({p.currentStep?.requiredRole?.name || 'Coordenação'})</li>)}
            {aviso.pendentes.length > 3 && <li>... e outras {aviso.pendentes.length - 3} tarefas pendentes.</li>}
          </ul>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button onClick={onClose} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: '#F0F0F0', color: '#333', cursor: 'pointer', fontWeight: 'bold' }}>Mantenha Preso</button>
          <button onClick={executingDropFromWarning} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: '#F57F17', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Forçar Movimento</button>
        </div>
      </div>
    </div>
  );
}