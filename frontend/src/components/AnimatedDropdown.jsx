// src/components/AnimatedDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

const wrapperVariants = {
  open: {
    opacity: 1,
    scaleY: 1,
    transition: {
      duration: 0.18,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.03,
    },
    transitionEnd: {
      display: 'block'
    }
  },
  closed: {
    opacity: 0,
    scaleY: 0,
    transition: {
      duration: 0.16,
      ease: 'easeIn',
      when: 'afterChildren',
      staggerChildren: 0.02,
    },
    transitionEnd: {
      display: 'none'
    }
  }
};

const iconVariants = {
  open: { rotate: 180, transition: { duration: 0.18, ease: 'easeOut' } },
  closed: { rotate: 0, transition: { duration: 0.18, ease: 'easeOut' } }
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.16, ease: 'easeOut' }
  },
  closed: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.14, ease: 'easeIn' }
  }
};

export function AnimatedDropdown({ label, value, onChange, options, width, searchable = false, searchPlaceholder = 'Buscar...' }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const selectedLabel = options.find(option => option.value === value)?.label || 'Selecionar...';

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
          <span style={{ color: '#777', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel}</span>
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
          {(searchable ? options.filter(option => option.label.toLowerCase().includes(searchQuery.trim().toLowerCase())) : options).map(option => (
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
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
