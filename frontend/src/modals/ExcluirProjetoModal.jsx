import React, { useState } from 'react';
import { api } from '../services/api';

export function ExcluirProjetoModal({ kanban, onClose, setTelaAtiva }) {
  const [textoConfirmacaoProjeto, setTextoConfirmacaoProjeto] = useState("");
  const { workflowAtivo, setWorkflowAtivo, carregarDados } = kanban;

  const confirmarExclusaoProjeto = async () => {
    if (textoConfirmacaoProjeto !== 'DELETAR' || !workflowAtivo) return;
    try {
      await api.deleteWorkflow(workflowAtivo);
      setWorkflowAtivo(null);
      setTelaAtiva('dashboard');
      await carregarDados();
      onClose();
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <div style={{ background: '#FFF', padding: '40px', borderRadius: '20px', width: '450px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 10px', color: '#D32F2F' }}>Atenção: Exclusão Permanente</h2>
        <p style={{ color: '#555', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
          CUIDADO: Isso apagará o projeto inteiro, incluindo TODOS os cartões, comentários e histórico de movimentações.
        </p>
        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>Digite "DELETAR" para confirmar:</label>
        <input
          autoFocus value={textoConfirmacaoProjeto} onChange={e => setTextoConfirmacaoProjeto(e.target.value)} placeholder="DELETAR"
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #D32F2F', marginTop: '10px', marginBottom: '25px', fontSize: '16px', outline: 'none', textAlign: 'center', fontWeight: 'bold', color: '#D32F2F' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button onClick={onClose} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
          <button onClick={confirmarExclusaoProjeto} disabled={textoConfirmacaoProjeto !== 'DELETAR'} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: textoConfirmacaoProjeto === 'DELETAR' ? '#D32F2F' : '#FFCDD2', color: 'white', cursor: textoConfirmacaoProjeto === 'DELETAR' ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Excluir Projeto</button>
        </div>
      </div>
    </div>
  );
}