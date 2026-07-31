import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  FileText,
  MapPin,
  MessageSquare,
  Save,
  UserRound,
} from 'lucide-react';

import ModalPagamento from './ModalPagamento.jsx';
import PainelMapa from './PainelMapa.jsx';
import { servicoService } from '../services/servicoService.js';

const initialServices = [
  { id: 1, nome: 'Lev Topo', indice_r: '1,0', indice_s: '1,0', indice: 0, ativo: true, selecionado: false },
  { id: 2, nome: 'Ret', indice: 1.5, ativo: true, selecionado: true },
  { id: 3, nome: 'Desm', indice: 1.0, ativo: true, selecionado: false },
  { id: 4, nome: 'Uni', indice: 1.0, ativo: true, selecionado: false },
  { id: 5, nome: 'Usu', indice: 1.0, ativo: true, selecionado: false },
  { id: 6, nome: 'Cert', indice: 1.0, ativo: true, selecionado: false },
  { id: 7, nome: 'CAR', indice: 0.5, ativo: true, selecionado: false },
  { id: 8, nome: 'Escritura', indice: 1.0, ativo: true, selecionado: false },
  { id: 9, nome: 'Cad', indice: 1.0, ativo: true, selecionado: false },
  { id: 10, nome: 'Conf', indice: 1.0, ativo: true, selecionado: false },
  { id: 11, nome: 'Mov de Terra', indice: 1.0, ativo: true, selecionado: false },
  { id: 12, nome: 'Loc', indice: 1.0, ativo: true, selecionado: false },
  { id: 13, nome: 'At', indice: 1.0, ativo: true, selecionado: false },
  { id: 14, nome: 'Ext', indice: 1.0, ativo: true, selecionado: false },
];

const currency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const formatIndex = (value) => value.toFixed(1).replace('.', ',');

const uniqueValues = (items, key) => [...new Set(items.map((item) => item[key]).filter(Boolean))];

const parseNumberInput = (value) => {
  const normalized = String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const baseFieldStyle = {
  height: '44px',
  borderRadius: '12px',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  background: '#F8FAFD',
  padding: '0 14px',
  fontSize: '14px',
  outline: 'none',
  color: '#1F2937',
  width: '100%',
};

const activeFieldStyle = {
  border: '1px solid #2D7AFD',
  boxShadow: '0 0 0 3px rgba(45, 122, 253, 0.12)',
};

const labelTextStyle = {
  fontSize: '12px',
  fontWeight: 800,
  color: '#5F6B83',
  textTransform: 'uppercase',
};

const optionRowStyle = {
  display: 'flex',
  gap: '8px',
};

const serviceGridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.01,
    },
  },
};

const serviceCardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.12, ease: 'easeOut' },
  },
};

function FieldLabel({ icon: Icon, children }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', ...labelTextStyle }}>
      {Icon ? <Icon size={14} /> : null}
      {children}
    </span>
  );
}

function OptionButton({ ativo, onClick, children }) {
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

function ServiceCard({ service, selected, salarioMinimo, onToggle, onIndiceChange, onTopographicChange }) {
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
        {isTopographic ? (
          <>
            {[
              ['indice_r', 'Indice R'],
              ['indice_s', 'Indice S'],
            ].map(([field, label]) => (
              <label key={field} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: '#7C8AA5', fontSize: '12px', fontWeight: 800 }}>{label}</span>
                <input
                  type="text"
                  value={service[field] || ''}
                  onChange={(event) => onTopographicChange(field, event.target.value)}
                  style={{
                    width: '60px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid rgba(15, 23, 42, 0.12)',
                    background: '#FFFFFF',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#1F2937',
                    outline: 'none',
                  }}
                />
              </label>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#7C8AA5', fontSize: '12px', fontWeight: 800 }}>Indice</span>
              <input
                type="text"
                value={formatIndex(service.indice)}
                readOnly
                style={{
                  width: '60px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid rgba(15, 23, 42, 0.12)',
                  background: '#ECEEF4',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#1F2937',
                  outline: 'none',
                }}
              />
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#7C8AA5', fontSize: '12px', fontWeight: 800 }}>Indice</span>
            <input
              type="text"
              value={formatIndex(service.indice)}
              onChange={(event) => onIndiceChange(service.id, event.target.value)}
              style={{
                width: '60px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid rgba(15, 23, 42, 0.12)',
                background: '#FFFFFF',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: 800,
                color: '#1F2937',
                outline: 'none',
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NotesModal({ notas, setNotas, onClose }) {
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
          <button type="button" onClick={onClose}>
            Fechar
          </button>
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
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" onClick={onClose}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function Orcamento({ onBack }) {
  const [services, setServices] = useState(initialServices);
  const [viewMode, setViewMode] = useState('Topografico');
  const [orcamentos, setOrcamentos] = useState([]);
  const [numero, setNumero] = useState('');
  const [cliente, setCliente] = useState('');
  const [contato, setContato] = useState('');
  const [matricula, setMatricula] = useState('');
  const [area, setArea] = useState('0,00');
  const [salarioMinimo, setSalarioMinimo] = useState(1621.0);
  const [pagamentoAberto, setPagamentoAberto] = useState(false);
  const [notasAberta, setNotasAberta] = useState(false);
  const [notas, setNotas] = useState('');
  const [campoAtivo, setCampoAtivo] = useState(null);
  const [terreno, setTerreno] = useState('');
  const [possuiCar, setPossuiCar] = useState('');
  const [possuiCertificacao, setPossuiCertificacao] = useState('');
  const [confrontaCertificacao, setConfrontaCertificacao] = useState('');
  const [codRespTecn, setCodRespTecn] = useState('');
  const [respTecn, setRespTecn] = useState('');
  const [municipio, setMunicipio] = useState('Sao Bento do Sul');
  const [perimetroLSeca, setPerimetroLSeca] = useState('');
  const [perimetroRio, setPerimetroRio] = useState('');
  const [imagensJpg, setImagensJpg] = useState([]);
  const [arquivosKml, setArquivosKml] = useState([]);
  const jpgInputRef = useRef(null);
  const kmlInputRef = useRef(null);

  const applyBudget = (budget) => {
    setNumero(budget.numero);
    setCliente(budget.cliente);
    setContato(budget.contato || '');
    setMatricula(budget.matricula);
    setTerreno(budget.terreno || '');
  };

  useEffect(() => {
    (async () => {
      try {
        const servicos = await servicoService.listarTodos();
        const lista = Array.isArray(servicos) ? servicos.map((s) => ({
          id: s.id,
          numero: s.numeroServico,
          cliente: s.nomeCliente,
          contato: s.contato || '',
          matricula: s.matricula || '',
          terreno: s.terreno || ''
        })) : [];

        setOrcamentos(lista);
        if (lista.length > 0) applyBudget(lista[0]);
      } catch (erro) {
        console.error('Erro ao carregar orçamentos:', erro);
      }
    })();
  }, []);

  const servicesWithCalculatedTopo = useMemo(
    () =>
      services.map((service) => {
        if (service.id !== 1) return service;

        const indiceR = parseNumberInput(service.indice_r);
        const indiceS = parseNumberInput(service.indice_s);
        const rio = parseNumberInput(perimetroRio);
        const seca = parseNumberInput(perimetroLSeca);
        const indice = Number((indiceR * rio + indiceS * seca).toFixed(1));

        return { ...service, indice };
      }),
    [perimetroLSeca, perimetroRio, services],
  );

  const selectedServices = useMemo(
    () => servicesWithCalculatedTopo.filter((service) => service.selecionado && service.ativo),
    [servicesWithCalculatedTopo],
  );
  const selectedCount = selectedServices.length;
  const totalValor = useMemo(
    () => selectedServices.reduce((acc, service) => acc + service.indice * salarioMinimo, 0),
    [selectedServices, salarioMinimo],
  );
  const totalIndice = useMemo(() => selectedServices.reduce((acc, service) => acc + service.indice, 0), [selectedServices]);

  const numerosOrcamento = useMemo(() => uniqueValues(orcamentos, 'numero'), [orcamentos]);
  const clientes = useMemo(() => uniqueValues(orcamentos, 'cliente'), [orcamentos]);
  const matriculas = useMemo(() => uniqueValues(orcamentos, 'matricula'), [orcamentos]);
  const mostrarRespTecnico = possuiCertificacao === 'Sim' || confrontaCertificacao === 'Sim';

  const fieldStyle = (name) => ({
    ...baseFieldStyle,
    ...(campoAtivo === name ? activeFieldStyle : {}),
  });

  const handleOrcamentoChange = (value) => {
    setNumero(value);
    const budget = orcamentos.find((item) => item.numero === value);
    if (budget) applyBudget(budget);
  };

  const handleClienteChange = (value) => {
    setCliente(value);
    const budget = orcamentos.find((item) => item.cliente === value);
    if (budget) applyBudget(budget);
  };

  const handleMatriculaChange = (value) => {
    setMatricula(value);
    const budget = orcamentos.find((item) => item.matricula === value);
    if (budget) applyBudget(budget);
  };

  const toggleService = (id) => {
    setServices((current) =>
      current.map((service) =>
        service.id === id && service.ativo ? { ...service, selecionado: !service.selecionado } : service,
      ),
    );
  };

  const updateServiceIndice = (id, value) => {
    const newIndice = parseNumberInput(value);
    setServices((current) => current.map((service) => (service.id === id ? { ...service, indice: newIndice } : service)));
  };

  const updateTopographicFields = (field, value) => {
    setServices((current) =>
      current.map((service) => (service.id === 1 ? { ...service, [field]: value } : service)),
    );
  };

  const handleJpgUpload = (event) => {
    const files = Array.from(event.target.files || []);
    setImagensJpg(files.filter((file) => /\.(jpe?g)$/i.test(file.name)));
    event.target.value = '';
  };

  const handleKmlUpload = (event) => {
    const files = Array.from(event.target.files || []);
    setArquivosKml((current) => [...current, ...files.filter((file) => /\.kml$/i.test(file.name))]);
    event.target.value = '';
  };

  return (
    <div style={{ height: '100%', minHeight: 0, background: '#F4F6FA', color: '#2D2A35', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header
        style={{
          height: '64px',
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: '1px solid rgba(15, 23, 42, 0.12)',
              background: '#FFFFFF',
              color: '#54607A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </motion.button>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', lineHeight: 1.1 }}>Orcamento</div>
            <div style={{ fontSize: '12px', color: '#95A0B5', marginTop: '2px' }}>{numero || 'Orcamento em edicao'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#54607A', fontWeight: 700 }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '999px',
              background: '#2D7AFD',
              boxShadow: '0 0 0 4px rgba(45, 122, 253, 0.16)',
            }}
          />
          Proposta & Pagamento
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 470px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <PainelMapa viewMode={viewMode} setViewMode={setViewMode} />

        <aside
          style={{
            background: '#FFFFFF',
            borderLeft: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 14px', minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={FileText}>Numero do Orcamento</FieldLabel>
                <input
                  value={numero}
                  list="orcamentos-salvos"
                  onChange={(event) => handleOrcamentoChange(event.target.value)}
                  onFocus={() => setCampoAtivo('numero')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Digite ou selecione"
                  style={fieldStyle('numero')}
                />
                <datalist id="orcamentos-salvos">
                  {numerosOrcamento.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={Building2}>Cliente</FieldLabel>
                <input
                  value={cliente}
                  list="clientes-salvos"
                  onChange={(event) => handleClienteChange(event.target.value)}
                  onFocus={() => setCampoAtivo('cliente')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Nome do Cliente"
                  style={fieldStyle('cliente')}
                />
                <datalist id="clientes-salvos">
                  {clientes.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={MessageSquare}>Contato</FieldLabel>
                <input
                  value={contato}
                  onChange={(event) => setContato(event.target.value)}
                  onFocus={() => setCampoAtivo('contato')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Contato do Cliente"
                  style={fieldStyle('contato')}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={UserRound}>Matricula</FieldLabel>
                <input
                  value={matricula}
                  list="matriculas-salvas"
                  onChange={(event) => handleMatriculaChange(event.target.value)}
                  onFocus={() => setCampoAtivo('matricula')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Matricula do Imovel"
                  style={fieldStyle('matricula')}
                />
                <datalist id="matriculas-salvas">
                  {matriculas.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>

              <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '14px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelTextStyle}>Terreno</span>
                  <div style={optionRowStyle}>
                    <OptionButton ativo={terreno === 'Urbano'} onClick={() => setTerreno('Urbano')}>Urbano</OptionButton>
                    <OptionButton ativo={terreno === 'Rural'} onClick={() => setTerreno('Rural')}>Rural</OptionButton>
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelTextStyle}>Possui CAR</span>
                  <div style={optionRowStyle}>
                    <OptionButton ativo={possuiCar === 'Sim'} onClick={() => setPossuiCar('Sim')}>Sim</OptionButton>
                    <OptionButton ativo={possuiCar === 'Nao'} onClick={() => setPossuiCar('Nao')}>Nao</OptionButton>
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelTextStyle}>Possui Certificacao</span>
                  <div style={optionRowStyle}>
                    <OptionButton ativo={possuiCertificacao === 'Sim'} onClick={() => setPossuiCertificacao('Sim')}>Sim</OptionButton>
                    <OptionButton ativo={possuiCertificacao === 'Nao'} onClick={() => setPossuiCertificacao('Nao')}>Nao</OptionButton>
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelTextStyle}>Confronta com Certificacao</span>
                  <div style={optionRowStyle}>
                    <OptionButton ativo={confrontaCertificacao === 'Sim'} onClick={() => setConfrontaCertificacao('Sim')}>Sim</OptionButton>
                    <OptionButton ativo={confrontaCertificacao === 'Nao'} onClick={() => setConfrontaCertificacao('Nao')}>Nao</OptionButton>
                  </div>
                </label>

                {mostrarRespTecnico ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={labelTextStyle}>Cod do Res Tecn</span>
                      <input
                        value={codRespTecn}
                        onChange={(event) => setCodRespTecn(event.target.value)}
                        onFocus={() => setCampoAtivo('codRespTecn')}
                        onBlur={() => setCampoAtivo(null)}
                        placeholder="Codigo"
                        style={fieldStyle('codRespTecn')}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={labelTextStyle}>Resp Tecn</span>
                      <input
                        value={respTecn}
                        onChange={(event) => setRespTecn(event.target.value)}
                        onFocus={() => setCampoAtivo('respTecn')}
                        onBlur={() => setCampoAtivo(null)}
                        placeholder="Nome do tecnico"
                        style={fieldStyle('respTecn')}
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FieldLabel icon={MapPin}>Area (m2)</FieldLabel>
                <input value={area} onChange={(event) => setArea(event.target.value)} onFocus={() => setCampoAtivo('area')} onBlur={() => setCampoAtivo(null)} style={fieldStyle('area')} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FieldLabel icon={Building2}>Municipio</FieldLabel>
                <select value={municipio} onChange={(event) => setMunicipio(event.target.value)} onFocus={() => setCampoAtivo('municipio')} onBlur={() => setCampoAtivo(null)} style={{ ...fieldStyle('municipio'), cursor: 'pointer' }}>
                  <option value="Sao Bento do Sul">Sao Bento do Sul</option>
                  <option value="Campo Alegre">Campo Alegre</option>
                  <option value="Rio Negrinho">Rio Negrinho</option>
                  <option value="Corupa">Corupa</option>
                  <option value="Outro">Outro</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FieldLabel icon={MapPin}>Perimetro L.Seca (km)</FieldLabel>
                <input value={perimetroLSeca} onChange={(event) => setPerimetroLSeca(event.target.value)} onFocus={() => setCampoAtivo('perimetro-lseca')} onBlur={() => setCampoAtivo(null)} placeholder="Ex.: 1,25" style={fieldStyle('perimetro-lseca')} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FieldLabel icon={MapPin}>Perimetro Rio (km)</FieldLabel>
                <input value={perimetroRio} onChange={(event) => setPerimetroRio(event.target.value)} onFocus={() => setCampoAtivo('perimetro-rio')} onBlur={() => setCampoAtivo(null)} placeholder="Ex.: 0,80" style={fieldStyle('perimetro-rio')} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <span style={labelTextStyle}>Valor Referencia</span>
                <input
                  value={salarioMinimo.toFixed(2).replace('.', ',')}
                  onChange={(event) => setSalarioMinimo(parseNumberInput(event.target.value) || 0)}
                  onFocus={() => setCampoAtivo('salarioMinimo')}
                  onBlur={() => setCampoAtivo(null)}
                  style={fieldStyle('salarioMinimo')}
                />
              </label>

              <div style={{ gridColumn: '1 / -1', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '14px', padding: '14px', background: '#FAFBFE' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Arquivos selecionados
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#5F6B83' }}>Imagem JPG</span>
                    <input ref={jpgInputRef} type="file" accept=".jpg,.jpeg,image/jpeg" onChange={handleJpgUpload} style={{ display: 'none' }} />
                    <button type="button" onClick={() => jpgInputRef.current?.click()} style={{ ...baseFieldStyle, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                      Selecionar imagem JPG
                    </button>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#5F6B83' }}>Arquivos KML</span>
                    <input ref={kmlInputRef} type="file" accept=".kml,application/vnd.google-earth.kml+xml" multiple onChange={handleKmlUpload} style={{ display: 'none' }} />
                    <button type="button" onClick={() => kmlInputRef.current?.click()} style={{ ...baseFieldStyle, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                      Selecionar arquivos KML
                    </button>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#5F6B83' }}>
                    {imagensJpg.length ? `JPG anexado: ${imagensJpg[0].name}` : 'Nenhuma imagem JPG anexada.'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#5F6B83' }}>
                    {arquivosKml.length ? `${arquivosKml.length} KML(s) anexado(s)` : 'Nenhum KML anexado.'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>Servicos</div>
              <div style={{ fontSize: '12px', color: '#8A94A6', fontWeight: 700 }}>Indice editavel</div>
            </div>

            <motion.div
              variants={serviceGridVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', paddingBottom: '8px' }}
            >
              {servicesWithCalculatedTopo.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={service.selecionado && service.ativo}
                  salarioMinimo={salarioMinimo}
                  onToggle={toggleService}
                  onIndiceChange={updateServiceIndice}
                  onTopographicChange={updateTopographicFields}
                />
              ))}
            </motion.div>
          </div>

          <div style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', background: '#FFFFFF', padding: '14px 20px 18px', flexShrink: 0 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'center',
                gap: '16px',
                background: '#F5F7FB',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 800, color: '#5A6780' }}>
                SELECIONADOS
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '28px', height: '28px', borderRadius: '999px', background: '#E8EEFF', color: '#3D63F1', fontSize: '12px', fontWeight: 800 }}>
                  {selectedCount}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#7B879B', fontWeight: 700, textAlign: 'right' }}>
                Indice total <strong style={{ color: '#1F2937', fontSize: '14px' }}>{formatIndex(totalIndice)}</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#1F2937', fontWeight: 900, textAlign: 'right' }}>{currency(totalValor)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.25fr', gap: '12px' }}>
              <motion.button
                type="button"
                onClick={() => setPagamentoAberto(true)}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15, 23, 42, 0.10)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#4E5970',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <CreditCard size={16} /> Pagamento
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setNotasAberta(true)}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15, 23, 42, 0.10)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#4E5970',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <MessageSquare size={16} /> Notas
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #14B38B 0%, #0F9E7A 100%)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 10px 20px rgba(15, 163, 127, 0.22)',
                }}
              >
                <Save size={16} /> Confirmar
              </motion.button>
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {notasAberta ? <NotesModal notas={notas} setNotas={setNotas} onClose={() => setNotasAberta(false)} /> : null}
      </AnimatePresence>

      {pagamentoAberto ? <ModalPagamento totalValor={totalValor} onClose={() => setPagamentoAberto(false)} /> : null}
    </div>
  );
}

export default Orcamento;
