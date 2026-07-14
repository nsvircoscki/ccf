// src/components/TicketCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

export const TicketCard = React.memo(({ 
  t, 
  dono, 
  cor, 
  temPermissao, 
  estaBloqueado, 
  onDragStart, 
  onDragEnd, 
  onClick, 
  onExcluir 
}) => {
  return (
    <motion.div layoutId={t.id} layout
      draggable={temPermissao} 
      onDragStart={onDragStart} 
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{ background: cor.bg, borderLeft: `6px solid ${cor.borda}`, padding: '16px', borderRadius: '8px', opacity: temPermissao ? 1 : 0.6, cursor: temPermissao ? 'grab' : 'not-allowed', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#333', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            {estaBloqueado && <span title="Aguardando etapa anterior" style={{ color: '#F57F17', fontWeight: 'bold' }}>[Bloqueado] </span>}
            {t.title}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: cor.borda, background: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>{dono}</span>
        </div>
        {temPermissao && (
          <button onClick={onExcluir} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontWeight: '900', fontSize: '16px', padding: '0 5px' }} title="Excluir Cartão">✕</button>
        )}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.t.id === nextProps.t.id &&
         prevProps.t.currentStepId === nextProps.t.currentStepId &&
         prevProps.temPermissao === nextProps.temPermissao &&
         prevProps.estaBloqueado === nextProps.estaBloqueado;
});