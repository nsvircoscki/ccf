// src/components/AddCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const IconePlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export function AddCard({ column, workflowAtivo, projeto, kanban, usuarioLogado, usuarios }) {
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);
  const [responsavel, setResponsavel] = useState(usuarioLogado || usuarios?.[0] || 'Coordenação');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !workflowAtivo) return;

    const stepMatch = projeto?.steps?.find(step =>
      step.step_name === column &&
      step.requiredRole?.name === responsavel
    );

    if (!stepMatch) {
      alert('Não foi possível encontrar a etapa correspondente para o responsável escolhido.');
      return;
    }

    try {
      await kanban.criarTicketLocal({
        title: trimmed,
        workflowId: workflowAtivo,
        currentStepId: stepMatch.id
      });
      setText('');
      setResponsavel(usuarioLogado || usuarios?.[0] || 'Coordenação');
      setAdding(false);
    } catch (error) {
      console.error('Falha ao criar tarefa:', error);
      alert('Erro ao criar a tarefa. Verifique o servidor e tente novamente.');
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nova tarefa..."
            autoFocus
            rows={3}
            style={{ width: '100%', borderRadius: '14px', border: '1px solid #D1D5DB', padding: '12px', resize: 'vertical', fontSize: '14px', color: '#111827', background: '#F8FAFC', boxSizing: 'border-box' }}
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#4B5563' }}>
            Responsável
            <select
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              style={{ width: '100%', borderRadius: '12px', border: '1px solid #D1D5DB', padding: '10px 12px', background: '#FFF', color: '#111827' }}
            >
              {usuarios.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button type="button" onClick={() => setAdding(false)} style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid #D1D5DB', background: '#FFFFFF', color: '#374151', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', border: 'none', background: '#2563EB', color: '#FFFFFF', cursor: 'pointer' }}>
              <IconePlus />
              Adicionar
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          type="button"
          onClick={() => setAdding(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 14px', borderRadius: '12px', border: '1px dashed #9CA3AF', background: '#F8FAFC', color: '#4B5563', cursor: 'pointer', fontWeight: '700' }}
        >
          <IconePlus />
          Adicionar tarefa
        </motion.button>
      )}
    </div>
  );
}
