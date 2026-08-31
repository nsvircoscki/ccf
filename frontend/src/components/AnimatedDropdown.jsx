// src/components/AnimatedDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

// Sem "when"/"staggerChildren": o painel e os itens animam juntos, em
// paralelo. Antes o fechar esperava CADA item terminar sua própria saída
// antes do painel começar a encolher (when: 'afterChildren') — com listas
// grandes (muitas opções) isso fazia o tempo de fechar crescer junto com a
// quantidade de itens, chegando a demorar mais de 1s. Agora a duração é
// sempre a mesma, curta, não importa quantos itens a lista tenha.
const wrapperVariants = {
  open: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.12, ease: 'easeOut' },
  },
  closed: {
    opacity: 0,
    scaleY: 0,
    transition: { duration: 0.08, ease: 'easeIn' },
  }
};

const iconVariants = {
  open: { rotate: 180, transition: { duration: 0.12, ease: 'easeOut' } },
  closed: { rotate: 0, transition: { duration: 0.12, ease: 'easeOut' } }
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.1, ease: 'easeOut' }
  },
  closed: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.06, ease: 'easeIn' }
  }
};

// Versão "crua" do mesmo padrão de animação acima, sem rótulo nem chip de
// botão — só o botão + painel animado, pra substituir um <select> nativo
// mantendo o `style` que cada tela já usa pro próprio campo (label continua
// por fora, do jeito que cada formulário já faz). Usa as mesmas
// wrapperVariants/itemVariants/iconVariants acima — é o mesmo "padrão de
// animação" em todos os dropdowns do sistema, não uma cópia à parte.
export function AnimatedSelect({ value, onChange, options, style, placeholder = 'Selecione…', disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const normalizadas = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  const selecionada = normalizadas.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const fechar = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)} style={{
        ...style, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selecionada ? selecionada.label : placeholder}
        </span>
        <motion.span animate={open ? 'open' : 'closed'} variants={iconVariants} style={{ display: 'flex', flexShrink: 0 }}>
          <FiChevronDown size={14} />
        </motion.span>
      </button>

      <motion.div initial="closed" animate={open ? 'open' : 'closed'} variants={wrapperVariants} style={{
        position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', left: 0, right: 0,
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
        boxShadow: '0 12px 34px rgba(14,37,73,0.14)', overflow: 'hidden', transformOrigin: 'top center',
        pointerEvents: open ? 'auto' : 'none',
      }}>
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {normalizadas.map(o => (
            <motion.button key={o.value} type="button" variants={itemVariants}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', cursor: 'pointer',
                background: value === o.value ? '#EEF2FF' : 'transparent', fontFamily: 'inherit', fontSize: 14, color: '#111827',
                fontWeight: value === o.value ? 700 : 400,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = value === o.value ? '#EEF2FF' : 'transparent'; }}>
              {o.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function AnimatedDropdown({ label, value, onChange, options, width, searchable = false, searchPlaceholder = 'Buscar...' }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const selectedOption = options.find(option => option.value === value);
  const selectedLabel = selectedOption?.label || 'Selecionar...';

  // Fecha limpando a busca no próprio handler: limpar dentro do efeito
  // dispara uma renderização em cascata a cada abre/fecha.
  const fechar = () => {
    setOpen(false);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        fechar();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') fechar();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className="animated-dropdown-container" style={{ width }}>
      <button
        type="button"
        onClick={() => (open ? fechar() : setOpen(true))}
        className="animated-dropdown-button"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>{label}</span>
          <span style={{ color: '#777', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedLabel}
            {selectedOption?.sub && (
              <span style={{ opacity: 0.45, marginLeft: '8px' }}>{selectedOption.sub}</span>
            )}
          </span>
        </div>
        <motion.span animate={open ? 'open' : 'closed'} variants={iconVariants} style={{ display: 'flex' }}>
          <FiChevronDown />
        </motion.span>
      </button>

      <motion.div
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={wrapperVariants}
        className="dropdown-list"
        style={{ pointerEvents: open ? 'auto' : 'none', transformOrigin: 'top center' }}
      >
        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {searchable && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #D1D5DB', outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
              />
            </div>
          )}
          {(searchable ? options.filter(option => {
            const termo = searchQuery.trim().toLowerCase();
            if (!termo) return true;
            // keywords: texto extra pesquisável (ex.: nome do cliente, matrícula)
            // que não aparece no label exibido, mas ainda deve ser encontrável.
            return option.label.toLowerCase().includes(termo) || (option.keywords || '').toLowerCase().includes(termo);
          }) : options).map(option => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                fechar();
              }}
              variants={itemVariants}
              className="dropdown-option"
            >
              {option.label}
              {option.sub && (
                <span style={{ opacity: 0.45, marginLeft: '8px' }}>{option.sub}</span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
