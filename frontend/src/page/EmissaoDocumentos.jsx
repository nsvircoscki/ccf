import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileBadge,
  FileText,
  MapPin,
  Plus,
  UserRound,
  X,
} from 'lucide-react';

const fieldBase = {
  width: '100%',
  boxSizing: 'border-box',
  height: '44px',
  borderRadius: '12px',
  border: '1px solid #DDE5F2',
  background: '#FFFFFF',
  padding: '0 13px',
  color: '#061733',
  fontSize: '13px',
  fontWeight: 700,
  outline: 'none',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: '#475569',
  fontSize: '12px',
  fontWeight: 800,
};

const cardStyle = {
  borderRadius: '18px',
  border: '1px solid #DDE5F2',
  background: '#FFFFFF',
  boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)',
};

const clientesDocumentos = [
  {
    id: 1,
    nome: 'Mauro Engler',
    matricula: '44.918',
    area: '67.890,00 m2',
    municipio: 'Sao Bento do Sul - SC',
    servicos: ['Retificacao', 'Desmembramento'],
    valorGlobal: '1.412,00',
  },
  {
    id: 2,
    nome: 'Hermes',
    matricula: 'MT-1001',
    area: '24.200,00 m2',
    municipio: 'Rio Negrinho - SC',
    servicos: ['Levantamento Topografico'],
    valorGlobal: '3.242,00',
  },
  {
    id: 3,
    nome: 'Lucia',
    matricula: 'MT-1002',
    area: '13.450,00 m2',
    municipio: 'Campo Alegre - SC',
    servicos: ['Retificacao'],
    valorGlobal: '2.431,50',
  },
];

const catalogoServicos = [
  { id: 1, nome: 'Levantamento Topografico', detalhe: 'L.Seca + Rio', indice: 4.0, ativo: true },
  { id: 2, nome: 'Retificacao', detalhe: 'x1.5', indice: 1.5, ativo: true },
  { id: 3, nome: 'Desmembramento', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 4, nome: 'Unificacao', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 5, nome: 'Usucapiao', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 6, nome: 'Certificacao', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 7, nome: 'CAR', detalhe: 'x0.5', indice: 0.5, ativo: true },
  { id: 8, nome: 'Escritura', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 9, nome: 'Cadastral', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 10, nome: 'Conferencia', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 11, nome: 'Movimentacao de Terra', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 12, nome: 'Locacao', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 13, nome: 'Atualizacao', detalhe: 'x1.0', indice: 1.0, ativo: true },
];

const currency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const parseCurrency = (value) => {
  const normalized = String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function FieldIcon({ icon: Icon }) {
  return (
    <span style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#EEF5FF', color: '#2D7AFD', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={17} strokeWidth={2.2} />
    </span>
  );
}

function ReadOnlyField({ label, value, icon: Icon }) {
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

function AnimatedDropdown({ value, onChange, options, width = '100%', searchable = false, placeholder = 'Buscar...' }) {
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
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
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          height: '46px',
          borderRadius: '13px',
          border: '1px solid #E5EBF5',
          background: '#FFFFFF',
          padding: '0 12px',
          cursor: 'pointer',
          color: '#061733',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <UserRound size={17} color="#8AA0BF" strokeWidth={2.1} />
          <span style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedLabel}
          </span>
        </div>
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
          zIndex: 50,
          borderRadius: '14px',
          border: '1px solid #E5EBF5',
          background: '#FFFFFF',
          boxShadow: '0 18px 42px rgba(15, 23, 42, 0.12)',
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
                border: '1px solid #DDE5F2',
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
            <div style={{ padding: '12px', color: '#64748B', fontSize: '13px' }}>Nenhum cliente encontrado</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ContractModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(15, 23, 42, 0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: 'min(860px, 100%)', borderRadius: '22px', overflow: 'hidden', background: '#F6F8FC', boxShadow: '0 28px 90px rgba(15, 23, 42, 0.32)' }}>
        <div style={{ padding: '22px 24px', background: '#FFFFFF', borderBottom: '1px solid #E5EBF5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFF7ED', color: '#C2410C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={22} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', lineHeight: 1.35, color: '#061733', fontWeight: 900 }}>
                Informacoes Juridicas Pendentes
              </h2>
              <p style={{ margin: '5px 0 0', color: '#64748B', fontSize: '13px', lineHeight: 1.5, fontWeight: 600 }}>
                Para emitir o contrato formal, preencha os dados complementares abaixo:
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #DDE5F2', background: '#FFFFFF', color: '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={19} />
          </button>
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
          <button type="button" onClick={onClose} style={{ height: '44px', padding: '0 18px', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 800, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="button" style={{ height: '44px', padding: '0 22px', borderRadius: '12px', border: 'none', background: '#0F766E', color: '#FFFFFF', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 22px rgba(15, 118, 110, 0.22)' }}>
            Confirmar e Emitir Contrato
          </button>
        </div>
      </div>
    </div>
  );
}

function OrcamentoDocumentoModal({ cliente, servicosSelecionados, onClose, onConfirm, onClienteChange }) {
  const [servicosModal, setServicosModal] = useState(() =>
    catalogoServicos.map((servico) => ({
      ...servico,
      selecionado: servicosSelecionados.includes(servico.nome),
    }))
  );
  const [valorReferencia, setValorReferencia] = useState(parseCurrency(cliente.valorGlobal) || 1621);

  const totalValor = useMemo(
    () => servicosModal.filter((s) => s.selecionado && s.ativo).reduce((acc, s) => acc + s.indice * valorReferencia, 0),
    [servicosModal, valorReferencia]
  );

  const totalIndice = useMemo(
    () => servicosModal.filter((s) => s.selecionado && s.ativo).reduce((acc, s) => acc + s.indice, 0),
    [servicosModal]
  );

  const toggleService = (id) => {
    setServicosModal((curr) => curr.map((s) => s.id === id && s.ativo ? { ...s, selecionado: !s.selecionado } : s));
  };

  const updateServiceIndice = (id, value) => {
    const normalized = String(value).replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(normalized);
    setServicosModal((curr) => curr.map((s) => s.id === id ? { ...s, indice: Number.isFinite(parsed) ? parsed : 0 } : s));
  };

  const handleConfirm = () => {
    const selecionados = servicosModal.filter((s) => s.selecionado && s.ativo).map((s) => s.nome);
    onConfirm(selecionados, currency(totalValor));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2800, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: 'min(760px, 100%)', height: 'calc(100vh - 48px)', maxHeight: 'calc(100vh - 48px)', borderRadius: '22px', background: '#FFFFFF', overflow: 'hidden', boxShadow: '0 28px 90px rgba(15, 23, 42, 0.32)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5EBF5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, color: '#061733', fontSize: '18px', fontWeight: 900 }}>Adicionar Servicos ao Documento</h2>
            <p style={{ margin: '5px 0 0', color: '#64748B', fontSize: '13px', fontWeight: 700 }}>Orcamento rapido sem alterar cliente ou matricula.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #DDE5F2', background: '#FFFFFF', color: '#64748B', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={19} />
          </button>
        </div>

        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', maxHeight: 'calc(100vh - 160px)', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#F6F8FC' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
            <ReadOnlyField label="Cliente bloqueado" value={cliente.nome} icon={UserRound} />
            <label style={labelStyle}>
              Matricula
              <input
                value={cliente.matricula}
                onChange={(event) => onClienteChange('matricula', event.target.value)}
                style={fieldBase}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr', gap: '14px', padding: '16px', borderRadius: '16px', border: '1px solid #E5EBF5', background: '#FFFFFF' }}>
            <label style={labelStyle}>
              Valor de Referencia
              <input
                value={valorReferencia.toFixed(2).replace('.', ',')}
                onChange={(event) => setValorReferencia(parseCurrency(event.target.value))}
                style={fieldBase}
              />
            </label>
            <label style={labelStyle}>
              Area
              <input
                value={cliente.area}
                onChange={(event) => onClienteChange('area', event.target.value)}
                style={fieldBase}
              />
            </label>
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
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
                      <input type="checkbox" checked={isSelected} readOnly style={{ width: '20px', height: '20px', minWidth: '20px', accentColor: '#2D7AFD', marginTop: '1px' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.2, color: isSelected ? '#2D7AFD' : '#2D2A35' }}>{service.nome}</div>
                        <div style={{ fontSize: '11px', color: '#8E8A97', marginTop: '4px' }}>{service.detalhe}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }} onClick={(event) => event.stopPropagation()}>
                      <input type="text" value={service.indice.toFixed(1).replace('.', ',')} onChange={(event) => updateServiceIndice(service.id, event.target.value)} style={{ width: '64px', height: '34px', borderRadius: '8px', border: '1px solid rgba(45, 42, 53, 0.15)', background: '#FFFFFF', fontSize: '13px', fontWeight: 700, color: '#2D2A35', textAlign: 'center', outline: 'none' }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: 800 }}>{service.indice > 0 ? currency(service.indice * valorReferencia) : '-'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5EBF5', background: '#FFFFFF', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 900, color: '#061733' }}>
            Total
            <span style={{ color: '#64748B' }}>{totalIndice.toFixed(1)}</span>
            <span>{currency(totalValor)}</span>
          </div>
          <button type="button" onClick={onClose} style={{ height: '44px', padding: '0 18px', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 800, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} style={{ height: '44px', padding: '0 20px', borderRadius: '12px', border: 'none', background: '#0F766E', color: '#FFFFFF', fontWeight: 900, cursor: 'pointer' }}>
            Aplicar Servicos
          </button>
        </div>
      </div>
    </div>
  );
}

function EmissaoDocumentos() {
  const [modalContratoAberto, setModalContratoAberto] = useState(false);
  const [modalOrcamentoAberto, setModalOrcamentoAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(clientesDocumentos[0]);
  const [servicosSelecionados, setServicosSelecionados] = useState(clientesDocumentos[0].servicos);
  const [valorGlobal, setValorGlobal] = useState(clientesDocumentos[0].valorGlobal);
  const [responsavel, setResponsavel] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const clientes = useMemo(() => clientesDocumentos.map((cliente) => cliente.nome), []);

  const handleClienteChange = (value) => {
    const clienteEncontrado = clientesDocumentos.find((cliente) => cliente.nome === value);
    if (!clienteEncontrado) return;

    setClienteSelecionado(clienteEncontrado);
    setServicosSelecionados(clienteEncontrado.servicos);
    setValorGlobal(clienteEncontrado.valorGlobal);
  };

  const handleMatriculaChange = (value) => {
    setClienteSelecionado((current) => ({ ...current, matricula: value }));
  };

  const handleAreaChange = (value) => {
    setClienteSelecionado((current) => ({ ...current, area: value }));
  };

  const handleClienteFieldChange = (field, value) => {
    setClienteSelecionado((current) => ({ ...current, [field]: value }));
  };

  const handleAplicarServicos = (servicos, totalFormatado) => {
    setServicosSelecionados(servicos);
    setValorGlobal(totalFormatado.replace('R$', '').trim());
    setModalOrcamentoAberto(false);
  };

  const gerarPdf = () => {
    const linhasServicos = servicosSelecionados.map((servico) => `<li>${escapeHtml(servico)}</li>`).join('');
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      alert('Permita pop-ups no navegador para gerar o PDF.');
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Ordem de Servico - ${escapeHtml(clienteSelecionado.nome)}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
            header { border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            h2 { margin: 24px 0 10px; font-size: 14px; text-transform: uppercase; }
            p { margin: 5px 0; font-size: 13px; line-height: 1.5; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }
            .label { color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            .value { margin-top: 4px; font-size: 14px; font-weight: 700; }
            ul { margin: 8px 0 0 18px; padding: 0; }
            li { margin-bottom: 5px; font-size: 13px; }
            footer { margin-top: 42px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .assinatura { border-top: 1px solid #0f172a; text-align: center; padding-top: 8px; font-size: 12px; }
          </style>
        </head>
        <body>
          <header>
            <h1>Ordem de Servico Tecnica</h1>
            <p>Documento gerado pela tela de Emissao de Documentos.</p>
          </header>

          <section class="grid">
            <div class="box"><div class="label">Cliente</div><div class="value">${escapeHtml(clienteSelecionado.nome)}</div></div>
            <div class="box"><div class="label">Matricula</div><div class="value">${escapeHtml(clienteSelecionado.matricula)}</div></div>
            <div class="box"><div class="label">Area Informada</div><div class="value">${escapeHtml(clienteSelecionado.area)}</div></div>
            <div class="box"><div class="label">Municipio/UF</div><div class="value">${escapeHtml(clienteSelecionado.municipio)}</div></div>
            <div class="box"><div class="label">Responsavel Tecnico</div><div class="value">${escapeHtml(responsavel || 'Nao informado')}</div></div>
            <div class="box"><div class="label">Valor Global</div><div class="value">R$ ${escapeHtml(valorGlobal)}</div></div>
          </section>

          <h2>Servicos Selecionados</h2>
          <div class="box"><ul>${linhasServicos}</ul></div>

          <h2>Observacoes</h2>
          <div class="box"><p>${escapeHtml(observacoes || 'Sem observacoes adicionais.')}</p></div>

          <footer>
            <div class="assinatura">Responsavel Tecnico</div>
            <div class="assinatura">Cliente</div>
          </footer>

          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ height: '100%', minHeight: 0, background: '#F4F6FA', padding: '28px', color: '#061733', overflowY: 'auto' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', paddingBottom: '12px', borderBottom: '1px solid #DDE5F2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#061733', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileBadge size={21} />
            </span>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>Emissao de Documentos</h1>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Geracao visual de OS tecnica e contrato formal</p>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '10px 16px', fontSize: '12px', fontWeight: 900 }}>
            <CheckCircle2 size={16} fill="#10B981" color="#10B981" />
            PRONTO PARA EMISSAO DE OS
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.95fr', gap: '18px', alignItems: 'stretch' }}>
          <section style={{ ...cardStyle, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <span style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#061733', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>1</span>
                <h2 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: 0, fontWeight: 900 }}>Conferencia de Dados Minimos</h2>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 800 }}>Cliente selecionavel</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '14px' }}>
              <label style={labelStyle}>
                Nome do Cliente
                <AnimatedDropdown
                  value={clienteSelecionado.nome}
                  onChange={handleClienteChange}
                  options={clientes.map((cliente) => ({ value: cliente, label: cliente }))}
                  searchable
                />
              </label>
              <label style={labelStyle}>
                Matricula
                <input
                  value={clienteSelecionado.matricula}
                  onChange={(event) => handleMatriculaChange(event.target.value)}
                  style={fieldBase}
                />
              </label>
              <label style={labelStyle}>
                Area Informada
                <input
                  value={clienteSelecionado.area}
                  onChange={(event) => handleAreaChange(event.target.value)}
                  style={fieldBase}
                />
              </label>
              <ReadOnlyField label="Municipio/UF" value={clienteSelecionado.municipio} icon={MapPin} />
            </div>

            <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #E5EBF5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                <BriefcaseBusiness size={16} color="#475569" />
                Servicos Selecionados
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {servicosSelecionados.map((servico) => (
                  <span key={servico} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '12px', background: '#061733', color: '#FFFFFF', padding: '10px 13px', fontSize: '13px', fontWeight: 900 }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E' }} />
                    {servico}
                  </span>
                ))}
                <button type="button" onClick={() => setModalOrcamentoAberto(true)} aria-label="Adicionar servico" style={{ minWidth: '46px', height: '42px', borderRadius: '12px', border: '1px dashed #94A3B8', background: '#E2E8F0', color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={21} strokeWidth={2.6} />
                </button>
              </div>
            </div>
          </section>

          <section style={{ ...cardStyle, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '20px' }}>
              <span style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#061733', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>2</span>
              <h2 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: 0, fontWeight: 900 }}>Configuracoes Tecnicas da OS</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={labelStyle}>
                Colaborador Tecnico Responsavel
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FieldIcon icon={UserRound} />
                  <select value={responsavel} onChange={(event) => setResponsavel(event.target.value)} style={fieldBase}>
                    <option value="" disabled>Selecione o colaborador...</option>
                    <option>Eng. Carlos Henrique</option>
                    <option>Tec. Mariana Souza</option>
                    <option>Topografo Rafael Lima</option>
                  </select>
                </div>
              </label>

              <label style={labelStyle}>
                Valor Global da Obra (R$)
                <input value={valorGlobal} onChange={(event) => setValorGlobal(event.target.value)} inputMode="decimal" style={fieldBase} />
              </label>

              <label style={labelStyle}>
                Observacoes Adicionais do Rodape
                <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder="Digite observacoes internas ou restricoes de campo..." style={{ ...fieldBase, minHeight: '104px', resize: 'vertical', padding: '13px', lineHeight: 1.45, fontWeight: 600 }} />
              </label>
            </div>
          </section>
        </div>

        <section style={{ ...cardStyle, padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '18px' }}>
            <span style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#061733', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>3</span>
            <h2 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: 0, fontWeight: 900 }}>Acoes de Documentos</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <button type="button" onClick={gerarPdf} style={{ minHeight: '88px', borderRadius: '16px', border: 'none', background: '#0F172A', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '18px 20px', boxShadow: '0 14px 28px rgba(15, 23, 42, 0.18)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '13px', textAlign: 'left' }}>
                <span style={{ width: '42px', height: '42px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Download size={21} /></span>
                <span>
                  <strong style={{ display: 'block', fontSize: '15px' }}>Gerar Ordem de Servico (PDF)</strong>
                  <small style={{ display: 'block', marginTop: '4px', color: '#CBD5E1', fontWeight: 700 }}>Abre a impressao para salvar em PDF</small>
                </span>
              </span>
              <BadgeCheck size={24} color="#34D399" />
            </button>

            <button type="button" onClick={() => setModalContratoAberto(true)} style={{ minHeight: '88px', borderRadius: '16px', border: '1px solid #FDBA74', background: '#FFF7ED', color: '#9A3412', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '18px 20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '13px', textAlign: 'left' }}>
                <span style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#FFEDD5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={21} /></span>
                <span>
                  <strong style={{ display: 'block', fontSize: '15px' }}>Gerar Contrato Padrao (DOCX)</strong>
                  <small style={{ display: 'block', marginTop: '4px', color: '#C2410C', fontWeight: 800 }}>Requer validacao juridica complementar</small>
                </span>
              </span>
              <AlertTriangle size={23} />
            </button>
          </div>
        </section>
      </div>

      {modalContratoAberto ? <ContractModal onClose={() => setModalContratoAberto(false)} /> : null}
      {modalOrcamentoAberto ? (
        <OrcamentoDocumentoModal
          cliente={clienteSelecionado}
          servicosSelecionados={servicosSelecionados}
          onClose={() => setModalOrcamentoAberto(false)}
          onConfirm={handleAplicarServicos}
          onClienteChange={handleClienteFieldChange}
        />
      ) : null}
    </div>
  );
}

export default EmissaoDocumentos;
