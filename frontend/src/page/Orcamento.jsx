import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  CreditCard,
  FileText,
  MapPin,
  MessageSquare,
  Save,
  UserRound,
} from 'lucide-react';

import ModalPagamento from './ModalPagamento.jsx';
import PainelMapa from './PainelMapa.jsx';
import {
  AnimatedDropdown,
  FieldLabel,
  NotesModal,
  OptionButton,
  ServiceCard,
  serviceGridVariants,
} from './orcamento/OrcamentoComponents.jsx';
import { initialServices, municipiosSugeridos, savedOrcamentos } from './orcamento/orcamentoData.js';
import {
  activeFieldStyle,
  baseFieldStyle,
  currency,
  formatIndex,
  labelTextStyle,
  normalizeText,
  optionRowStyle,
  parseNumberInput,
  uniqueValues,
} from './orcamento/orcamentoUtils.js';

function Orcamento({ onBack, buscaTexto = '', setBuscaTexto = () => {} }) {
  const [services, setServices] = useState(initialServices);
  const [viewMode, setViewMode] = useState('Topografico');
  const [numero, setNumero] = useState(savedOrcamentos[0].numero);
  const [cliente, setCliente] = useState(savedOrcamentos[0].cliente);
  const [contato, setContato] = useState(savedOrcamentos[0].contato);
  const [matricula, setMatricula] = useState(savedOrcamentos[0].matricula);
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
  const [certificacaoCodigo, setCertificacaoCodigo] = useState('');
  const [certificacaoNome, setCertificacaoNome] = useState('');
  const [confrontaCertificacoes, setConfrontaCertificacoes] = useState([{ id: 1, codigo: '', nome: '' }]);
  const [municipio, setMunicipio] = useState('Sao Bento do Sul');
  const [perimetroLSeca, setPerimetroLSeca] = useState('');
  const [perimetroRio, setPerimetroRio] = useState('');
  const [imagensJpg, setImagensJpg] = useState([]);
  const [arquivosKml, setArquivosKml] = useState([]);
  const jpgInputRef = useRef(null);
  const kmlInputRef = useRef(null);

  const fieldStyle = (name) => ({
    ...baseFieldStyle,
    ...(campoAtivo === name ? activeFieldStyle : {}),
  });

  const servicesWithCalculatedTopo = useMemo(
    () =>
      services.map((service) => {
        if (service.id !== 1) return service;
        const indiceR = parseNumberInput(service.indice_r);
        const indiceS = parseNumberInput(service.indice_s);
        const rio = parseNumberInput(perimetroRio);
        const seca = parseNumberInput(perimetroLSeca);
        return { ...service, indice: Number((indiceR * rio + indiceS * seca).toFixed(1)) };
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

  const savedOrcamentosFiltrados = useMemo(() => {
    const query = normalizeText(buscaTexto.trim());
    if (!query) return savedOrcamentos;
    return savedOrcamentos.filter((budget) =>
      [budget.numero, budget.cliente, budget.matricula].some((value) => normalizeText(value).includes(query)),
    );
  }, [buscaTexto]);

  const numerosOrcamento = useMemo(() => uniqueValues(savedOrcamentosFiltrados, 'numero'), [savedOrcamentosFiltrados]);
  const clientes = useMemo(() => uniqueValues(savedOrcamentosFiltrados, 'cliente'), [savedOrcamentosFiltrados]);
  const matriculas = useMemo(() => uniqueValues(savedOrcamentosFiltrados, 'matricula'), [savedOrcamentosFiltrados]);

  useEffect(() => {
    if (confrontaCertificacao !== 'Sim') {
      setConfrontaCertificacoes([{ id: 1, codigo: '', nome: '' }]);
    }
  }, [confrontaCertificacao]);

  useEffect(() => {
    if (confrontaCertificacao !== 'Sim') return;
    const last = confrontaCertificacoes[confrontaCertificacoes.length - 1];
    if (!last) return;

    const lastFilled = last.codigo.trim() !== '' || last.nome.trim() !== '';
    const hasEmptyBeforeLast = confrontaCertificacoes.some(
      (item, index) => index !== confrontaCertificacoes.length - 1 && item.codigo.trim() === '' && item.nome.trim() === '',
    );

    if (lastFilled && !hasEmptyBeforeLast) {
      setConfrontaCertificacoes((current) => [
        ...current,
        { id: Math.max(0, ...current.map((item) => item.id)) + 1, codigo: '', nome: '' },
      ]);
    }
  }, [confrontaCertificacoes, confrontaCertificacao]);

  const applyBudget = (budget) => {
    setNumero(budget.numero);
    setCliente(budget.cliente);
    setContato(budget.contato || '');
    setMatricula(budget.matricula);
  };

  const handleBudgetFieldChange = (field, value) => {
    const setters = { numero: setNumero, cliente: setCliente, matricula: setMatricula };
    setters[field](value);
    const budget = savedOrcamentos.find((item) => item[field] === value);
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
    setServices((current) => current.map((service) => (service.id === id ? { ...service, indice: parseNumberInput(value) } : service)));
  };

  const updateServiceName = (id, value) => {
    setServices((current) => current.map((service) => (service.id === id ? { ...service, nome: value } : service)));
  };

  const updateTopographicFields = (field, value) => {
    setServices((current) => current.map((service) => (service.id === 1 ? { ...service, [field]: value } : service)));
  };

  const updateConfrontaCertificacaoField = (id, key, value) => {
    setConfrontaCertificacoes((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
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
      <header style={{ height: '64px', background: '#FFFFFF', borderBottom: '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', flexShrink: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <motion.button type="button" whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }} onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.12)', background: '#FFFFFF', color: '#54607A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </motion.button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', lineHeight: 1.1 }}>Orcamento</div>
            <div style={{ fontSize: '12px', color: '#95A0B5', marginTop: '2px' }}>{numero || 'Orcamento em edicao'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#54607A', fontWeight: 700 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#2D7AFD', boxShadow: '0 0 0 4px rgba(45, 122, 253, 0.16)' }} />
          Proposta & Pagamento
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 470px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <PainelMapa viewMode={viewMode} setViewMode={setViewMode} />
        <aside style={{ background: '#FFFFFF', borderLeft: '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 14px', minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={FileText}>Numero do Orcamento</FieldLabel>
                <AnimatedDropdown value={numero} onChange={(value) => handleBudgetFieldChange('numero', value)} options={numerosOrcamento.map((item) => ({ value: item, label: item }))} searchable placeholder="Buscar orçamento..." />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={Building2}>Cliente</FieldLabel>
                <input value={cliente} list="clientes-salvos" onChange={(event) => handleBudgetFieldChange('cliente', event.target.value)} onFocus={() => setCampoAtivo('cliente')} onBlur={() => setCampoAtivo(null)} placeholder="Nome do Cliente" style={fieldStyle('cliente')} />
                <datalist id="clientes-salvos">{clientes.map((item) => <option key={item} value={item} />)}</datalist>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={MessageSquare}>Contato</FieldLabel>
                <input value={contato} onChange={(event) => setContato(event.target.value)} onFocus={() => setCampoAtivo('contato')} onBlur={() => setCampoAtivo(null)} placeholder="Contato do Cliente" style={fieldStyle('contato')} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={UserRound}>Matricula</FieldLabel>
                <input value={matricula} list="matriculas-salvas" onChange={(event) => handleBudgetFieldChange('matricula', event.target.value)} onFocus={() => setCampoAtivo('matricula')} onBlur={() => setCampoAtivo(null)} placeholder="Matricula do Imovel" style={fieldStyle('matricula')} />
                <datalist id="matriculas-salvas">{matriculas.map((item) => <option key={item} value={item} />)}</datalist>
              </label>

              <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '14px' }}>
                {[
                  ['Terreno', terreno, setTerreno],
                  ['Possui CAR', possuiCar, setPossuiCar],
                  ['Possui Certificacao', possuiCertificacao, setPossuiCertificacao],
                  ['Confronta com Certificacao', confrontaCertificacao, setConfrontaCertificacao],
                ].map(([label, value, setter]) => (
                  <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={labelTextStyle}>{label}</span>
                    <div style={optionRowStyle}>
                      <OptionButton ativo={value === 'Sim' || value === 'Urbano'} onClick={() => setter(label === 'Terreno' ? 'Urbano' : 'Sim')}>{label === 'Terreno' ? 'Urbano' : 'Sim'}</OptionButton>
                      <OptionButton ativo={value === 'Nao' || value === 'Rural'} onClick={() => setter(label === 'Terreno' ? 'Rural' : 'Nao')}>{label === 'Terreno' ? 'Rural' : 'Nao'}</OptionButton>
                    </div>
                  </label>
                ))}

                {possuiCertificacao === 'Sim' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><span style={labelTextStyle}>Cod Certificacao</span><input value={certificacaoCodigo} onChange={(event) => setCertificacaoCodigo(event.target.value)} style={fieldStyle('certificacaoCodigo')} /></label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><span style={labelTextStyle}>Nome Resp Tec</span><input value={certificacaoNome} onChange={(event) => setCertificacaoNome(event.target.value)} style={fieldStyle('certificacaoNome')} /></label>
                  </div>
                ) : null}

                {confrontaCertificacao === 'Sim' ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={labelTextStyle}>Confrontantes com certificacao</div>
                    {confrontaCertificacoes.map((item) => (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <input value={item.codigo} onChange={(event) => updateConfrontaCertificacaoField(item.id, 'codigo', event.target.value)} placeholder="Codigo" style={fieldStyle(`confronta-codigo-${item.id}`)} />
                        <input value={item.nome} onChange={(event) => updateConfrontaCertificacaoField(item.id, 'nome', event.target.value)} placeholder="Resp. tecnico" style={fieldStyle(`confronta-nome-${item.id}`)} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><FieldLabel icon={MapPin}>Area (m2)</FieldLabel><input value={area} onChange={(event) => setArea(event.target.value)} onFocus={() => setCampoAtivo('area')} onBlur={() => setCampoAtivo(null)} style={fieldStyle('area')} /></label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FieldLabel icon={Building2}>Municipio</FieldLabel>
                <input value={municipio} list="municipios-sugeridos" onChange={(event) => setMunicipio(event.target.value)} onFocus={() => setCampoAtivo('municipio')} onBlur={() => setCampoAtivo(null)} placeholder="Municipio" style={fieldStyle('municipio')} />
                <datalist id="municipios-sugeridos">{municipiosSugeridos.map((item) => <option key={item} value={item} />)}</datalist>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}><span style={labelTextStyle}>Valor Referencia</span><input value={salarioMinimo.toFixed(2).replace('.', ',')} onChange={(event) => setSalarioMinimo(parseNumberInput(event.target.value) || 0)} style={fieldStyle('salarioMinimo')} /></label>

              <div style={{ gridColumn: '1 / -1', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '14px', padding: '14px', background: '#FAFBFE' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase', marginBottom: '12px' }}>Arquivos selecionados</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input ref={jpgInputRef} type="file" accept=".jpg,.jpeg,image/jpeg" onChange={handleJpgUpload} style={{ display: 'none' }} />
                  <input ref={kmlInputRef} type="file" accept=".kml,application/vnd.google-earth.kml+xml" multiple onChange={handleKmlUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => jpgInputRef.current?.click()} style={{ ...baseFieldStyle, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>Selecionar imagem JPG</button>
                  <button type="button" onClick={() => kmlInputRef.current?.click()} style={{ ...baseFieldStyle, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>Selecionar arquivos KML</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', fontSize: '12px', color: '#5F6B83' }}>
                  <div>{imagensJpg.length ? `JPG anexado: ${imagensJpg[0].name}` : 'Nenhuma imagem JPG anexada.'}</div>
                  <div>{arquivosKml.length ? `${arquivosKml.length} KML(s) anexado(s)` : 'Nenhum KML anexado.'}</div>
                </div>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><FieldLabel icon={MapPin}>Perimetro L.Seca (km)</FieldLabel><input value={perimetroLSeca} onChange={(event) => setPerimetroLSeca(event.target.value)} placeholder="Ex.: 1,25" style={fieldStyle('perimetro-lseca')} /></label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><FieldLabel icon={MapPin}>Perimetro Rio (km)</FieldLabel><input value={perimetroRio} onChange={(event) => setPerimetroRio(event.target.value)} placeholder="Ex.: 0,80" style={fieldStyle('perimetro-rio')} /></label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><span style={labelTextStyle}>Indice R</span><input value={services.find((service) => service.id === 1)?.indice_r || ''} onChange={(event) => updateTopographicFields('indice_r', event.target.value)} style={fieldStyle('indice_r')} /></label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><span style={labelTextStyle}>Indice S</span><input value={services.find((service) => service.id === 1)?.indice_s || ''} onChange={(event) => updateTopographicFields('indice_s', event.target.value)} style={fieldStyle('indice_s')} /></label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>Servicos</div>
            </div>
            <motion.div variants={serviceGridVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', paddingBottom: '8px' }}>
              {servicesWithCalculatedTopo.map((service) => (
                <ServiceCard key={service.id} service={service} selected={service.selecionado && service.ativo} salarioMinimo={salarioMinimo} onToggle={toggleService} onIndiceChange={updateServiceIndice} onNameChange={updateServiceName} />
              ))}
            </motion.div>
          </div>

          <div style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', background: '#FFFFFF', padding: '14px 20px 18px', flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: '16px', background: '#F5F7FB', borderRadius: '14px', padding: '12px 14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 800, color: '#5A6780' }}>SELECIONADOS <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '28px', height: '28px', borderRadius: '999px', background: '#E8EEFF', color: '#3D63F1', fontSize: '12px', fontWeight: 800 }}>{selectedCount}</span></div>
              <div style={{ fontSize: '13px', color: '#7B879B', fontWeight: 700, textAlign: 'right' }}>Indice total <strong style={{ color: '#1F2937', fontSize: '14px' }}>{formatIndex(totalIndice)}</strong></div>
              <div style={{ fontSize: '14px', color: '#1F2937', fontWeight: 900, textAlign: 'right' }}>{currency(totalValor)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.25fr', gap: '12px' }}>
              <motion.button type="button" onClick={() => setPagamentoAberto(true)} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }} style={{ height: '46px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.10)', background: '#FFFFFF', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#4E5970', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><CreditCard size={16} /> Pagamento</motion.button>
              <motion.button type="button" onClick={() => setNotasAberta(true)} whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }} style={{ height: '46px', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.10)', background: '#FFFFFF', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#4E5970', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><MessageSquare size={16} /> Notas</motion.button>
              <motion.button type="button" whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }} style={{ height: '46px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #14B38B 0%, #0F9E7A 100%)', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(15, 163, 127, 0.22)' }}><Save size={16} /> Confirmar</motion.button>
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>{notasAberta ? <NotesModal notas={notas} setNotas={setNotas} onClose={() => setNotasAberta(false)} /> : null}</AnimatePresence>
      {pagamentoAberto ? <ModalPagamento totalValor={totalValor} onClose={() => setPagamentoAberto(false)} /> : null}
    </div>
  );
}

export default Orcamento;
