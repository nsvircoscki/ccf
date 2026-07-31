import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

import { currency, formatIndex, labelTextStyle } from './orcamentoUtils.js';

const serviceCardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.12, ease: 'easeOut' },
  },
};

const dropdownWrapperVariants = {
  open: { opacity: 1, scaleY: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  closed: { opacity: 0, scaleY: 0, transition: { duration: 0.16, ease: 'easeIn' } },
};

const dropdownItemVariants = {
  open: { opacity: 1, y: 0, transition: { duration: 0.14, ease: 'easeOut' } },
  closed: { opacity: 0, y: -6, transition: { duration: 0.12, ease: 'easeIn' } },
};

const dropdownIconVariants = {
  open: { rotate: 180, transition: { duration: 0.18, ease: 'easeOut' } },
  closed: { rotate: 0, transition: { duration: 0.18, ease: 'easeOut' } },
};

export const serviceGridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.01,
    },
  },
};

export function AnimatedDropdown({ value, onChange, options, searchable = false, placeholder = 'Buscar...' }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const selectedLabel = options.find((option) => option.value === value)?.label || 'Selecionar...';

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const filteredOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : options;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          height: '44px',
          borderRadius: '12px',
          border: '1px solid rgba(15, 23, 42, 0.12)',
          background: '#F8FAFD',
          padding: '0 14px',
          cursor: 'pointer',
          color: '#1F2937',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel}
        </span>
        <motion.span animate={open ? 'open' : 'closed'} variants={dropdownIconVariants} style={{ display: 'flex' }}>
          <ChevronDown size={18} color="#64748B" />
        </motion.span>
      </button>

      <motion.div
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={dropdownWrapperVariants}
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: '100%',
          zIndex: 60,
          borderRadius: '14px',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          background: '#FFFFFF',
          boxShadow: '0 16px 42px rgba(15, 23, 42, 0.12)',
          overflow: 'hidden',
          transformOrigin: 'top center',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {searchable ? (
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #EEF2F7' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                height: '38px',
                borderRadius: '10px',
                border: '1px solid rgba(15, 23, 42, 0.12)',
                background: '#F8FAFD',
                padding: '0 12px',
                outline: 'none',
                fontSize: '13px',
                color: '#061733',
              }}
            />
          </div>
        ) : null}

        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                variants={dropdownItemVariants}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '11px 12px',
                  border: 'none',
                  background: '#FFFFFF',
                  color: '#061733',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </motion.button>
            ))
          ) : (
            <div style={{ padding: '12px', color: '#64748B', fontSize: '13px' }}>Nenhum orçamento encontrado</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function FieldLabel({ icon: Icon, children }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', ...labelTextStyle }}>
      {Icon ? <Icon size={14} /> : null}
      {children}
    </span>
  );
}

export function OptionButton({ ativo, onClick, children }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        flex: 1,
        height: '36px',
        borderRadius: '8px',
        border: ativo ? '1px solid #2D7AFD' : '1px solid rgba(15, 23, 42, 0.12)',
        background: ativo ? '#2D7AFD' : '#FFFFFF',
        color: ativo ? '#FFFFFF' : '#5F6B83',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '13px',
        flexShrink: 0,
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </motion.button>
  );
}

export function ServiceCard({ service, selected, salarioMinimo, onToggle, onIndiceChange, onNameChange }) {
  const isTopographic = service.id === 1;

  return (
    <motion.div
      variants={serviceCardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ y: -2, scale: 1.01 }}
      style={{
        position: 'relative',
        borderRadius: '12px',
        border: selected ? '1px solid #AFC3FF' : '1px solid rgba(15, 23, 42, 0.10)',
        background: selected ? '#F7FAFF' : '#FFFFFF',
        boxShadow: selected ? '0 4px 14px rgba(45, 122, 253, 0.08)' : '0 1px 2px rgba(15, 23, 42, 0.03)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(service.id)}
        style={{
          width: '100%',
          minHeight: '92px',
          padding: '13px 12px 12px',
          border: 'none',
          background: selected ? '#2D7AFD' : '#FFFFFF',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingRight: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.25, color: selected ? '#FFFFFF' : '#1F2A44', maxWidth: '120px' }}>
            {service.nome}
          </div>
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              border: selected ? '1px solid #2D7AFD' : '1px solid #CBD5E1',
              background: selected ? '#2D7AFD' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {selected ? (
                <motion.span
                  key="selected-check"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.16 }}
                  style={{ display: 'inline-flex' }}
                >
                  <Check size={12} strokeWidth={3} color="#FFFFFF" />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ marginTop: '18px', fontSize: '12px', color: selected ? '#DCE8FF' : '#7C8AA5', fontWeight: 600 }}>
          Valor {currency(service.indice * salarioMinimo)}
        </div>
      </button>

      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {service.editavel ? (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C8AA5' }}>Nome do serviço</span>
            <input
              value={service.nome}
              onChange={(event) => onNameChange(service.id, event.target.value)}
              style={{
                height: '40px',
                borderRadius: '10px',
                border: '1px solid rgba(15, 23, 42, 0.15)',
                background: '#FFFFFF',
                padding: '0 12px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#1F2937',
                outline: 'none',
              }}
            />
          </label>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: '#7C8AA5', fontSize: '12px', fontWeight: 800 }}>{isTopographic ? 'Índice Topo' : 'Índice'}</span>
          <input
            type="text"
            value={formatIndex(service.indice)}
            readOnly={isTopographic}
            onChange={(event) => onIndiceChange?.(service.id, event.target.value)}
            style={{
              width: '60px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(15, 23, 42, 0.12)',
              background: isTopographic ? '#ECEEF4' : '#FFFFFF',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 800,
              color: '#1F2937',
              outline: 'none',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function NotesModal({ notas, setNotas, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(720px, 100%)',
          background: '#FFFFFF',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.22)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Notas do Servico</h3>
          <button type="button" onClick={onClose}>Fechar</button>
        </div>

        <textarea
          value={notas}
          onChange={(event) => setNotas(event.target.value)}
          placeholder="Digite aqui suas notas..."
          style={{
            width: '100%',
            minHeight: '220px',
            borderRadius: '12px',
            border: '1px solid rgba(15, 23, 42, 0.12)',
            padding: '14px',
            outline: 'none',
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="button" onClick={onClose}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
