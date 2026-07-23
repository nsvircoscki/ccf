import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Building2, Check, FolderPlus, MessageSquare, Save, MapPin } from 'lucide-react';
import PainelMapa from '../page/PainelMapa.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const initialServices = [
  { id: 1, nome: 'Lev Topo', indice: 4.0, ativo: true, selecionado: false },
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
  { id: 14, nome: 'Ext', indice: 1.0, ativo: true, selecionado: false}
];
const formatIndex = (value) => value.toFixed(1).replace('.', ',');

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

function ServiceCard({ service, selected, onToggle }) {
  return (
    <motion.button
      type="button"
      onClick={() => onToggle(service.id)}
      variants={serviceCardVariants}
      style={{
        position: 'relative',
        padding: '13px 12px 12px',
        borderRadius: '12px',
        border: selected ? '1px solid #AFC3FF' : '1px solid rgba(15, 23, 42, 0.10)',
        background: selected ? '#2D7AFD' : '#FFFFFF',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: selected ? '0 4px 14px rgba(45, 122, 253, 0.08)' : '0 1px 2px rgba(15, 23, 42, 0.03)',
        minHeight: '92px',
        overflow: 'hidden',
      }}
      initial="hidden"
      animate="show"
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
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
            flexShrink: 0,
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
        Índice {formatIndex(service.indice)}
      </div>
    </motion.button>
  );
}

function OptionButton ({ ativo, onClick, children }) {
  return(
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

export default function CadastroServicoView({ onBack }) {
  const [viewMode, setViewMode] = useState('Topografico');
  const [services, setServices] = useState(initialServices);
  const [contato, setContato] = useState('');
  const [area, setArea] = useState('0,00');
  const [perimetroLSeca, setPerimetroLSeca] = useState('');
  const [perimetroRio, setPerimetroRio] = useState('');
  const [municipio, setMunicipio] = useState('Sao Bento do Sul');
  const [codigoServico] = useState(() => `20260714-${Math.floor(100 + Math.random() * 900)}-TOP`);
  const [mensagem, setMensagem] = useState(null);
  const [cliente, setCliente] = useState('');
  const [notasAberta, setNotasAberta] = useState(false);
  const [notas, setNotas] = useState('');
  const [campoAtivo, setCampoAtivo] = useState(null);
  const [imagensJpg, setImagensJpg] = useState([]);
  const [arquivosKml, setArquivosKml] = useState([]);
  const jpgInputRef = useRef(null);
  const kmlInputRef = useRef(null);
  const [terreno, setTerreno] = useState('');
  const [possuiCar, setPossuiCar] = useState('');
  const [possuiCertificacao, setPossuiCertificacao] = useState('');
  const [confrontaCertificacao, setConfrontaCertificacao] = useState('');
  const [codRespTecn, setCodRespTecn] = useState('');
  const [respTecn, setRespTecn] = useState('');
  const [matricula, setMatricula] = useState('');

  

  const baseFieldStyle = {
    height: '44px',
    borderRadius: '12px',
    border: '1px solid rgba(15, 23, 42, 0.12)',
    background: '#F8FAFD',
    padding: '0 14px',
    fontSize: '14px',
    outline: 'none',
    color: '#1F2937',
  };

  const activeFieldStyle = {
    border: '1px solid #2D7AFD',
    boxShadow: '0 0 0 3px rgba(45, 122, 253, 0.12)',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 800,
    color: '#5F6B83',
    textTransform: 'uppercase',
  };

  const optionRowStyle = {
    display: 'flex',
    gap: '8px'
  };


  const toggleBtnStyle = (ativo) => ({
    flex: 1,
    height: '38px',
    borderRadius: '8px',
    border: ativo ? '1px solid #2D7AFD' : '1px solid rgba(15, 23, 42, 0.12)',
    background: ativo ? '#E8F0FF' : '#FFFFFF',
    color: ativo ? '#2D7AFD' : '#5F6B83',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15 ease',
  });


  const inputStyle = {
    ...baseFieldStyle,
    border: '1px solid #2D7AFD',
    boxShadow: '0 0 0 3px rgba(45, 122, 253, 0.12)',
  };

  const selectedServices = useMemo(
    () => services.filter((service) => service.selecionado && service.ativo),
    [services],
  );
  const selectedCount = selectedServices.length;
  const totalIndice = useMemo(
    () => selectedServices.reduce((acc, service) => acc + service.indice, 0),
    [selectedServices],
  );

  const toggleService = (id) => {
    setServices((current) =>
      current.map((service) =>
        service.id === id && service.ativo ? { ...service, selecionado: !service.selecionado } : service,
      ),
    );
  };

  const handleSalvar = () => {
    setMensagem({ tipo: 'sucesso', texto: 'Cadastro preparado no layout do Figma.' });
    window.setTimeout(() => setMensagem(null), 2200);
  };

  const handleJpgUpload = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => /\.(jpe?g)$/i.test(file.name));
    setImagensJpg(validFiles);
    event.target.value = '';
  };

  const handleKmlUpload = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => /\.kml$/i.test(file.name));
    setArquivosKml((current) => [...current, ...validFiles]);
    event.target.value = '';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA', color: '#2D2A35', display: 'flex', flexDirection: 'column' }}>
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
          position: 'sticky',
          top: 0,
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
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', lineHeight: 1.1 }}>
              Cadastro de Serviço
            </div>
            <div style={{ fontSize: '12px', color: '#95A0B5', marginTop: '2px' }}>{codigoServico}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#54607A', fontWeight: 700 }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '999px',
              background: '#10B981',
              boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.16)',
            }}
          />
          Fase 1 - Captacao & Geoprocessamento
        </div>
      </header>

      {mensagem ? (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            background: mensagem.tipo === 'sucesso' ? '#EAF8F3' : '#FEECEC',
            color: mensagem.tipo === 'sucesso' ? '#0F8B6B' : '#C24141',
            border: `1px solid ${mensagem.tipo === 'sucesso' ? 'rgba(16, 163, 127, 0.18)' : 'rgba(248, 113, 113, 0.18)'}`,
            borderRadius: '14px',
            padding: '10px 14px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.10)',
            zIndex: 40,
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {mensagem.texto}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 470px', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        <PainelMapa viewMode={viewMode} setViewMode={setViewMode} />

        <aside
          style={{
            background: '#FFFFFF',
            borderLeft: '1px solid rgba(15, 23, 42, 0.08)',
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '26px' }}>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1'}}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <Building2 size={14} /> Cliente
                </span>
              <input
                value={cliente}
                onChange={(event) => setCliente(event.target.value)}
                onFocus={() => setCampoAtivo('cliente')}
                onBlur={() => setCampoAtivo(null)}
                placeholder="Nome do Cliente"
                style={{
                  ...baseFieldStyle,
                  ...(campoAtivo === 'cliente' ? activeFieldStyle : {}),
                }}
              />
              
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <MessageSquare size={14} /> Contato
                </span>
                <input
                  value={contato}
                  onChange={(event) => setContato(event.target.value)}
                  onFocus={() => setCampoAtivo('contato')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Contato do Cliente"
                  style={{
                    ...baseFieldStyle,
                    ...(campoAtivo === 'contato' ? activeFieldStyle : {}),
                  }}
                />
              </label>

               <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <MessageSquare size={14} /> Matrícula
                </span>
                <input
                  value={matricula}
                  onChange={(event) => setMatricula(event.target.value)}
                  onFocus={() => setCampoAtivo('matricula')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Matrícula do Imóvel"
                  style={{
                    ...baseFieldStyle,
                    ...(campoAtivo === 'matricula' ? activeFieldStyle : {}),
                  }}
                />
              </label>

              <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '16px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelStyle}>Terreno</span>
                  <div style={optionRowStyle}>
                    <OptionButton ativo={terreno === 'Urbano'} onClick={() => setTerreno('Urbano')}>
                      Urbano
                    </OptionButton>
                    <OptionButton ativo={terreno === 'Rural'} onClick={() => setTerreno('Rural')}>
                      Rural
                    </OptionButton>
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelStyle}>Possui CAR</span>
                  <div style={optionRowStyle}>
                    <OptionButton ativo={possuiCar === 'Sim'} onClick={() => setPossuiCar('Sim')}>
                      Sim
                    </OptionButton>
                    <OptionButton ativo={possuiCar === 'Não'} onClick={() => setPossuiCar('Não')}>
                      Não
                    </OptionButton>
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelStyle}>Possui Certificação</span>
                  <div style={optionRowStyle}>
                    <OptionButton ativo={possuiCertificacao === 'Sim'} onClick={() => setPossuiCertificacao('Sim')}>
                      Sim
                    </OptionButton>
                    <OptionButton ativo={possuiCertificacao === 'Não'} onClick={() => setPossuiCertificacao('Não')}>
                      Não
                    </OptionButton>
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelStyle}>Confronta com Certificação</span>
                  <div style={optionRowStyle}>
                    <OptionButton ativo={confrontaCertificacao === 'Sim'} onClick={() => setConfrontaCertificacao('Sim')}>
                      Sim
                    </OptionButton>
                    <OptionButton ativo={confrontaCertificacao === 'Não'} onClick={() => setConfrontaCertificacao('Não')}>
                      Não
                    </OptionButton>
                  </div>
                </label>

                {confrontaCertificacao === 'Sim' ? (
                  <>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={labelStyle}>Cód do Res Técn</span>
                      <input
                        value={codRespTecn}
                        onChange={(e) => setCodRespTecn(e.target.value)}
                        onFocus={() => setCampoAtivo('codRespTecn')}
                        onBlur={() => setCampoAtivo(null)}
                        placeholder="Código do Técnico"
                        style={{
                          ...baseFieldStyle,
                          ...(campoAtivo === 'codRespTecn' ? activeFieldStyle : {}),
                        }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={labelStyle}>Resp Técn</span>
                      <input
                        value={respTecn}
                        onChange={(e) => setRespTecn(e.target.value)}
                        onFocus={() => setCampoAtivo('respTecn')}
                        onBlur={() => setCampoAtivo(null)}
                        placeholder="Nome do Técnico"
                        style={{
                          ...baseFieldStyle,
                          ...(campoAtivo === 'respTecn' ? activeFieldStyle : {}),
                        }}
                      />
                    </label>
                  </>
                ) : null}
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <MapPin size={14} /> Área (m²)
                </span>
                <input
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  onFocus={() => setCampoAtivo('area')}
                  onBlur={() => setCampoAtivo(null)}
                  style={{
                    ...baseFieldStyle,
                    ...(campoAtivo === 'area' ? activeFieldStyle : {}),
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <Building2 size={14} /> Município
                </span>
                <select
                  value={municipio}
                  onChange={(event) => setMunicipio(event.target.value)}
                  onFocus={() => setCampoAtivo('municipio')}
                  onBlur={() => setCampoAtivo(null)}
                  style={{
                    ...baseFieldStyle,
                    ...(campoAtivo === 'municipio' ? activeFieldStyle : {}),
                    cursor: 'pointer',
                  }}
                >
                  <option value="Sao Bento do Sul" style={{ background: '#FFFFFF', color: '#1F2937', padding: '8px' }}>São Bento do Sul</option>
                  <option value="Campo Alegre" style={{ background: '#FFFFFF', color: '#1F2937', padding: '8px' }}>Campo Alegre</option>
                  <option value="Rio Negrinho" style={{ background: '#FFFFFF', color: '#1F2937', padding: '8px' }}>Rio Negrinho</option>
                  <option value="Corupa" style={{ background: '#FFFFFF', color: '#1F2937', padding: '8px' }}>Corupá</option>
                  <option value="Outro" style={{ background: '#FFFFFF', color: '#1F2937', padding: '8px' }}>Outro</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <MapPin size={14} /> Perímetro L.Seca (km)
                </span>
                <input
                  value={perimetroLSeca}
                  onChange={(event) => setPerimetroLSeca(event.target.value)}
                  onFocus={() => setCampoAtivo('perimetro-lseca')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Ex.: 1,25"
                  style={{
                    ...baseFieldStyle,
                    ...(campoAtivo === 'perimetro-lseca' ? activeFieldStyle : {}),
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <MapPin size={14} /> Perímetro Rio (km) 
                </span>
                <input
                  value={perimetroRio}
                  onChange={(event) => setPerimetroRio(event.target.value)}
                  onFocus={() => setCampoAtivo('perimetro-rio')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Ex.: 0,80"
                  style={{
                    ...baseFieldStyle,
                    ...(campoAtivo === 'perimetro-rio' ? activeFieldStyle : {}),
                  }}
                />
              </label>
              <div style={{ gridColumn: '1 / -1', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '14px', padding: '14px', background: '#FAFBFE' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Arquivos do orçamento
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#5F6B83' }}>Imagem JPG</span>
                    <input
                      ref={jpgInputRef}
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      onChange={handleJpgUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => jpgInputRef.current?.click()}
                      style={{
                        ...baseFieldStyle,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                      }}
                    >
                      Selecionar imagem JPG
                    </button>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#5F6B83' }}>Arquivos KML</span>
                    <input
                      ref={kmlInputRef}
                      type="file"
                      accept=".kml,application/vnd.google-earth.kml+xml"
                      multiple
                      onChange={handleKmlUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => kmlInputRef.current?.click()}
                      style={{
                        ...baseFieldStyle,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                      }}
                    >
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
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Serviços
              </div>
              <div style={{ fontSize: '12px', color: '#8A94A6', fontWeight: 700 }}>
                Índice (somente leitura)
              </div>
            </div>

            <motion.div
              variants={serviceGridVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', paddingBottom: '8px' }}
            >
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={service.selecionado && service.ativo}
                  onToggle={toggleService}
                />
              ))}
            </motion.div>
          </div>

          <div style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', background: '#FFFFFF', padding: '16px 20px 20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: '16px',
                background: '#F5F7FB',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 800, color: '#5A6780' }}>
                SELECIONADOS
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={selectedCount}
                    initial={{ opacity: 0, scale: 0.75, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.75, y: -4 }}
                    transition={{ duration: 0.16 }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '28px',
                      height: '28px',
                      borderRadius: '999px',
                      background: '#E8EEFF',
                      color: '#3D63F1',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    {selectedCount}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div style={{ fontSize: '13px', color: '#7B879B', fontWeight: 700, textAlign: 'right' }}>
                Índice total
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={totalIndice.toFixed(1)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16 }}
                    style={{ color: '#1F2937', fontSize: '14px' }}
                  >
                    {formatIndex(totalIndice)}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.25fr', gap: '12px' }}>
              <motion.button
                type="button"
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
                <FolderPlus size={16} /> Pasta
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
                onClick={handleSalvar}
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
                <Save size={16} /> Salvar Cadastro
              </motion.button>
            </div>
          </div>
        </aside>
      </div>
        <AnimatePresence>
        {notasAberta ? (
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
            onClick={() => setNotasAberta(false)}
          >
            <div
              style={{
                width: 'min(720px, 100%)',
                background: '#FFFFFF',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: '0 24px 80px rgba(15, 23, 42, 0.22)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Notas do Serviço</h3>
                <button type="button" onClick={() => setNotasAberta(false)}>
                  Fechar
                </button>
              </div>

              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
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
                <button type="button" onClick={() => setNotasAberta(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => { setNotasAberta(false); }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
