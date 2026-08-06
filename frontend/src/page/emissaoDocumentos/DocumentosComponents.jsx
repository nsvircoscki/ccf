import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, UserRound, X } from 'lucide-react';

import { catalogoServicos } from './documentosData.js';
import { currency, fieldBase, labelStyle, parseCurrency } from './documentosUtils.js';

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

export function FieldIcon({ icon: Icon }) {
  return (
    <span style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#EEF5FF', color: '#2D7AFD', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={17} strokeWidth={2.2} />
    </span>
  );
}

export function ReadOnlyField({ label, value, icon: Icon }) {
  return (
    <label style={labelStyle}>
      {label}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '46px', borderRadius: '13px', border: '1px solid #E5EBF5', background: '#F8FAFD', padding: '0 12px' }}>
        <Icon size={17} color="#8AA0BF" strokeWidth={2.1} />
        <input value={value} disabled style={{ ...fieldBase, height: 'auto', border: 'none', background: 'transparent', padding: 0, color: '#061733', WebkitTextFillColor: '#061733' }} />
      </div>
    </label>
  );
}

export function AnimatedDropdown({ value, onChange, options, width = '100%', searchable = false, placeholder = 'Buscar...' }) {
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
    <div ref={dropdownRef} style={{ position: 'relative', width }}>
      <button type="button" onClick={() => setOpen((current) => !current)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', height: '46px', borderRadius: '13px', border: '1px solid #E5EBF5', background: '#FFFFFF', padding: '0 12px', cursor: 'pointer', color: '#061733', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <UserRound size={17} color="#8AA0BF" strokeWidth={2.1} />
          <span style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel}</span>
        </div>
        <motion.span animate={open ? 'open' : 'closed'} variants={dropdownIconVariants} style={{ display: 'flex' }}>
          <ChevronDown size={18} color="#64748B" />
        </motion.span>
      </button>

      <motion.div initial="closed" animate={open ? 'open' : 'closed'} variants={dropdownWrapperVariants} style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', zIndex: 50, borderRadius: '14px', border: '1px solid #E5EBF5', background: '#FFFFFF', boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)', overflow: 'hidden', transformOrigin: 'top center', pointerEvents: open ? 'auto' : 'none' }}>
        {searchable ? (
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #EEF2F7' }}>
            <input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={placeholder} style={{ width: '100%', boxSizing: 'border-box', height: '38px', borderRadius: '10px', border: '1px solid #DDE5F2', background: '#F8FAFD', padding: '0 12px', outline: 'none', fontSize: '13px', color: '#061733' }} />
          </div>
        ) : null}
        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <motion.button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} variants={dropdownItemVariants} style={{ width: '100%', textAlign: 'left', padding: '11px 12px', border: 'none', background: '#FFFFFF', color: '#061733', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {option.label}
              </motion.button>
            ))
          ) : (
            <div style={{ padding: '12px', color: '#64748B', fontSize: '13px' }}>Nenhum cliente encontrado</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function ContractModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(15, 23, 42, 0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: 'min(860px, 100%)', borderRadius: '22px', overflow: 'hidden', background: '#F6F8FC', boxShadow: '0 28px 90px rgba(15, 23, 42, 0.32)' }}>
        <div style={{ padding: '22px 24px', background: '#FFFFFF', borderBottom: '1px solid #E5EBF5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFF7ED', color: '#C2410C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AlertTriangle size={22} /></span>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', lineHeight: 1.35, color: '#061733', fontWeight: 900 }}>Informacoes Juridicas Pendentes</h2>
              <p style={{ margin: '5px 0 0', color: '#64748B', fontSize: '13px', lineHeight: 1.5, fontWeight: 600 }}>Para emitir o contrato formal, preencha os dados complementares abaixo:</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #DDE5F2', background: '#FFFFFF', color: '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={19} /></button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.85fr 1fr', gap: '14px' }}>
            <label style={labelStyle}>Nacionalidade<input placeholder="Brasileiro(a)" style={fieldBase} /></label>
            <label style={labelStyle}>Estado Civil<select defaultValue="" style={fieldBase}><option value="" disabled>Selecione</option><option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>Viuvo(a)</option></select></label>
            <label style={labelStyle}>Profissao<input placeholder="Ex.: Produtor rural" style={fieldBase} /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.55fr', gap: '14px' }}>
            <label style={labelStyle}>CPF/CNPJ<input placeholder="000.000.000-00" style={fieldBase} /></label>
            <label style={labelStyle}>CEP<input placeholder="00000-000" style={fieldBase} /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.45fr 0.9fr', gap: '14px' }}>
            <label style={labelStyle}>Rua/Logradouro<input placeholder="Rua, avenida ou estrada" style={fieldBase} /></label>
            <label style={labelStyle}>Numero<input placeholder="S/N" style={fieldBase} /></label>
            <label style={labelStyle}>Bairro<input placeholder="Bairro" style={fieldBase} /></label>
          </div>
        </div>

        <div style={{ padding: '18px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#F6F8FC' }}>
          <button type="button" onClick={onClose} style={{ height: '44px', padding: '0 18px', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
          <button type="button" style={{ height: '44px', padding: '0 22px', borderRadius: '12px', border: 'none', background: '#0F766E', color: '#FFFFFF', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 22px rgba(15, 118, 110, 0.22)' }}>Confirmar e Emitir Contrato</button>
        </div>
      </div>
    </div>
  );
}

export function OrcamentoDocumentoModal({ cliente, servicosSelecionados, onClose, onConfirm, onClienteChange }) {
  const [servicosModal, setServicosModal] = useState(() =>
    catalogoServicos.map((servico) => ({ ...servico, selecionado: servicosSelecionados.includes(servico.nome) })),
  );
  const [valorReferencia, setValorReferencia] = useState(parseCurrency(cliente.valorGlobal) || 1621);

  const servicosAtivos = useMemo(() => servicosModal.filter((service) => service.selecionado && service.ativo), [servicosModal]);
  const totalValor = useMemo(() => servicosAtivos.reduce((acc, service) => acc + service.indice * valorReferencia, 0), [servicosAtivos, valorReferencia]);
  const totalIndice = useMemo(() => servicosAtivos.reduce((acc, service) => acc + service.indice, 0), [servicosAtivos]);

  const toggleService = (id) => {
    setServicosModal((current) => current.map((service) => (service.id === id && service.ativo ? { ...service, selecionado: !service.selecionado } : service)));
  };

  const updateServiceIndice = (id, value) => {
    const parsed = parseFloat(String(value).replace(',', '.').replace(/[^0-9.]/g, ''));
    setServicosModal((current) => current.map((service) => (service.id === id ? { ...service, indice: Number.isFinite(parsed) ? parsed : 0 } : service)));
  };

  const handleConfirm = () => {
    onConfirm(servicosAtivos.map((service) => service.nome), currency(totalValor));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2800, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: 'min(760px, 100%)', height: 'calc(100vh - 48px)', maxHeight: 'calc(100vh - 48px)', borderRadius: '22px', background: '#FFFFFF', overflow: 'hidden', boxShadow: '0 28px 90px rgba(15, 23, 42, 0.32)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5EBF5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px', flexShrink: 0 }}>
          <div><h2 style={{ margin: 0, color: '#061733', fontSize: '18px', fontWeight: 900 }}>Adicionar Servicos ao Documento</h2><p style={{ margin: '5px 0 0', color: '#64748B', fontSize: '13px', fontWeight: 700 }}>Orcamento rapido sem alterar cliente ou matricula.</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #DDE5F2', background: '#FFFFFF', color: '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={19} /></button>
        </div>

        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#F6F8FC' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
            <ReadOnlyField label="Cliente bloqueado" value={cliente.nome} icon={UserRound} />
            <label style={labelStyle}>Matricula<input value={cliente.matricula} onChange={(event) => onClienteChange('matricula', event.target.value)} style={fieldBase} /></label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr', gap: '14px', padding: '16px', borderRadius: '16px', border: '1px solid #E5EBF5', background: '#FFFFFF' }}>
            <label style={labelStyle}>Valor de Referencia<input value={valorReferencia.toFixed(2).replace('.', ',')} onChange={(event) => setValorReferencia(parseCurrency(event.target.value))} style={fieldBase} /></label>
            <label style={labelStyle}>Area<input value={cliente.area} onChange={(event) => onClienteChange('area', event.target.value)} style={fieldBase} /></label>
          </div>

          <div style={{ borderRadius: '16px', border: '1px solid #E5EBF5', background: '#FFFFFF', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 1fr', gap: '16px', padding: '14px 16px', borderBottom: '2px solid #E8EDF5', color: '#8E8A97', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase' }}>
              <span>Servico</span><span style={{ textAlign: 'center' }}>Indice</span><span style={{ textAlign: 'right' }}>Valor</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100vh - 420px)', overflowY: 'auto', minHeight: 0 }}>
              {servicosModal.map((service) => {
                const isSelected = service.selecionado && service.ativo;
                return (
                  <div key={service.id} onClick={() => toggleService(service.id)} style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 1fr', gap: '16px', alignItems: 'center', padding: '12px 14px', borderRadius: '12px', border: isSelected ? '2px solid #2D7AFD' : '1px solid rgba(45, 42, 53, 0.08)', background: isSelected ? '#E8F0FF' : '#FFFFFF', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}><input type="checkbox" checked={isSelected} readOnly style={{ width: '20px', height: '20px', minWidth: '20px', accentColor: '#2D7AFD', marginTop: '1px' }} /><div><div style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.2, color: isSelected ? '#2D7AFD' : '#2D2A35' }}>{service.nome}</div><div style={{ fontSize: '11px', color: '#8E8A97', marginTop: '4px' }}>{service.detalhe}</div></div></div>
                    <div style={{ textAlign: 'center' }} onClick={(event) => event.stopPropagation()}><input type="text" value={service.indice.toFixed(1).replace('.', ',')} onChange={(event) => updateServiceIndice(service.id, event.target.value)} style={{ width: '64px', height: '34px', borderRadius: '8px', border: '1px solid rgba(45, 42, 53, 0.15)', background: '#FFFFFF', fontSize: '13px', fontWeight: 700, color: '#2D2A35', textAlign: 'center', outline: 'none' }} /></div>
                    <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: 800 }}>{service.indice > 0 ? currency(service.indice * valorReferencia) : '-'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5EBF5', background: '#FFFFFF', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 900, color: '#061733' }}>Total <span style={{ color: '#64748B' }}>{totalIndice.toFixed(1)}</span><span>{currency(totalValor)}</span></div>
          <button type="button" onClick={onClose} style={{ height: '44px', padding: '0 18px', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={handleConfirm} style={{ height: '44px', padding: '0 20px', borderRadius: '12px', border: 'none', background: '#0F766E', color: '#FFFFFF', fontWeight: 900, cursor: 'pointer' }}>Aplicar Servicos</button>
        </div>
      </div>
    </div>
  );
}
