import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  User,
  MapPin,
  Ruler,
  Building2,
  Hash,
  Plus,
  FolderPlus,
  MessageSquare,
  Check,
} from 'lucide-react';

// @ts-expect-error - PainelMapa é um módulo JSX sem tipos
import PainelMapa from '../../imports/PainelMapa.jsx';

type Servico = {
  id: number;
  nome: string;
  sigla: string;
  lseca_km?: string;
  lseca_fator?: string;
  rio_km?: string;
  rio_fator?: string;
  indice: number;
  detalhe?: string;
  ativo: boolean;
  selecionado: boolean;
};

const initialServices: Servico[] = [
  {
    id: 1,
    nome: 'Levantamento Topográfico',
    sigla: 'Topografia',
    lseca_km: '2,0',
    lseca_fator: '1,0',
    rio_km: '2,0',
    rio_fator: '1,0',
    indice: 4.0,
    ativo: true,
    selecionado: false,
  },
  { id: 2, nome: 'Retificação', sigla: 'Retif.', detalhe: 'x1.5', indice: 1.5, ativo: true, selecionado: true },
  { id: 3, nome: 'Desmembramento', sigla: 'Desmemb.', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 4, nome: 'Unificação', sigla: 'Unif.', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 5, nome: 'Usucapião', sigla: 'Usucap.', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 6, nome: 'Certificação', sigla: 'Certif.', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 7, nome: 'CAR', sigla: 'CAR', detalhe: 'x0.5', indice: 0.5, ativo: true, selecionado: false },
  { id: 8, nome: 'Escritura', sigla: 'Escrit.', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 9, nome: 'Cadastral', sigla: 'Cadastro', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 10, nome: 'Conferência', sigla: 'Conf.', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 11, nome: 'Movimentação de Terra', sigla: 'Mov. Terra', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 12, nome: 'Locação', sigla: 'Locação', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 13, nome: 'Atualização', sigla: 'Atualiz.', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
];

const savedServicos = [
  { numero: '20250117-011-TOP', cliente: 'Hermes', matricula: 'MT-1001' },
  { numero: '20250118-012-RET', cliente: 'Lúcia', matricula: 'MT-1002' },
];

const uniqueValues = (items: Record<string, string>[], key: string) =>
  [...new Set(items.map((item) => item[key]).filter(Boolean))];

const COLORS = {
  bg: '#F6F8FB',
  surface: '#FFFFFF',
  border: 'rgba(30, 41, 59, 0.08)',
  borderStrong: 'rgba(30, 41, 59, 0.14)',
  text: '#1E293B',
  textSoft: '#64748B',
  textFaint: '#94A3B8',
  field: '#F8FAFC',
  accent: '#2563EB',
  accentSoft: '#EFF4FF',
  success: '#0F9D77',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '8px',
  color: COLORS.textSoft,
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: '42px',
  borderRadius: '10px',
  border: `1px solid ${COLORS.border}`,
  background: COLORS.field,
  padding: '0 14px',
  fontSize: '14px',
  color: COLORS.text,
  outline: 'none',
  transition: COLORS.transition,
};

function CadastroServico() {
  const [services, setServices] = useState<Servico[]>(initialServices);
  const [viewMode, setViewMode] = useState('Topografico');
  const [numero, setNumero] = useState(`20260714-${Math.floor(100 + Math.random() * 900)}-TOP`);
  const [cliente, setCliente] = useState('');
  const [matricula, setMatricula] = useState('');
  const [area, setArea] = useState('0,00');
  const [municipio, setMunicipio] = useState('São Bento do Sul');
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [focado, setFocado] = useState<string | null>(null);

  const numerosServico = useMemo(() => uniqueValues(savedServicos, 'numero'), []);
  const clientes = useMemo(() => uniqueValues(savedServicos, 'cliente'), []);
  const matriculas = useMemo(() => uniqueValues(savedServicos, 'matricula'), []);

  const totalSelecionados = services.filter((s) => s.selecionado && s.ativo).length;

  const totalIndice = useMemo(
    () =>
      services
        .filter((s) => s.selecionado && s.ativo)
        .reduce((acc, s) => acc + s.indice, 0),
    [services],
  );

  const toggleService = (id: number) => {
    setServices((curr) =>
      curr.map((s) => (s.id === id && s.ativo ? { ...s, selecionado: !s.selecionado } : s)),
    );
  };

  const handleServicoChange = (value: string) => {
    setNumero(value);
    const registro = savedServicos.find((item) => item.numero === value);
    if (registro) {
      setCliente(registro.cliente);
      setMatricula(registro.matricula);
    }
  };

  const handleClienteChange = (value: string) => {
    setCliente(value);
    const registro = savedServicos.find((item) => item.cliente === value);
    if (registro) {
      setNumero(registro.numero);
      setMatricula(registro.matricula);
    }
  };

  const handleMatriculaChange = (value: string) => {
    setMatricula(value);
    const registro = savedServicos.find((item) => item.matricula === value);
    if (registro) {
      setNumero(registro.numero);
      setCliente(registro.cliente);
    }
  };

  const handleNovoServico = () => {
    setNumero(`20260714-${Math.floor(100 + Math.random() * 900)}-TOP`);
    setCliente('');
    setMatricula('');
    setArea('0,00');
    setMensagem(null);
  };

  const handleSalvar = () => {
    if (totalSelecionados === 0) {
      setMensagem({ tipo: 'erro', texto: 'Selecione pelo menos um serviço para registrar este cadastro.' });
      return;
    }
    setMensagem({ tipo: 'ok', texto: 'Serviço cadastrado e encaminhado para orçamento técnico.' });
  };

  const fieldProps = (name: string) => ({
    onFocus: () => setFocado(name),
    onBlur: () => setFocado(null),
    style: {
      ...inputStyle,
      borderColor: focado === name ? COLORS.accent : COLORS.border,
      background: focado === name ? COLORS.surface : COLORS.field,
      boxShadow: focado === name ? `0 0 0 3px ${COLORS.accentSoft}` : 'none',
    },
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
        color: COLORS.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cabeçalho */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 100,
        }}
      >
        <button
          type="button"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px',
            color: COLORS.textSoft,
            transition: COLORS.transition,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.field;
            e.currentTarget.style.color = COLORS.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = COLORS.surface;
            e.currentTarget.style.color = COLORS.textSoft;
          }}
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em' }}>
            Cadastro de Serviço
          </span>
          <span style={{ fontSize: '12px', color: COLORS.textFaint }}>{numero}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: COLORS.success,
              boxShadow: `0 0 0 3px rgba(15, 157, 119, 0.15)`,
            }}
          />
          <span style={{ fontSize: '12px', color: COLORS.textSoft, fontWeight: 500 }}>
            Fase 1 · Captação &amp; Geoprocessamento
          </span>
        </div>
      </header>

      <div style={{ marginTop: '64px', display: 'grid', gridTemplateColumns: '1fr 460px', flex: 1 }}>
        <PainelMapa viewMode={viewMode} setViewMode={setViewMode} />

        {/* Painel direito */}
        <div
          style={{
            background: COLORS.surface,
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 64px)',
            overflow: 'hidden',
            borderLeft: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
            {mensagem ? (
              <div style={{ padding: '20px 24px 0' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: mensagem.tipo === 'erro' ? '#FEF2F2' : '#F0FBF7',
                    border: `1px solid ${mensagem.tipo === 'erro' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(15, 157, 119, 0.18)'}`,
                    color: mensagem.tipo === 'erro' ? '#B91C1C' : '#0C7A5C',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {mensagem.texto}
                </div>
              </div>
            ) : null}

            {/* Formulário */}
            <div style={{ padding: '28px 24px', borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  <Hash size={13} strokeWidth={1.8} /> Código do Serviço
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={numero}
                    list="servicos-salvos"
                    onChange={(e) => handleServicoChange(e.target.value)}
                    placeholder="Digite ou selecione"
                    {...fieldProps('numero')}
                    style={{ ...fieldProps('numero').style, flex: 1 }}
                  />
                  <datalist id="servicos-salvos">
                    {numerosServico.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={handleNovoServico}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      height: '42px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      background: COLORS.accent,
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      whiteSpace: 'nowrap',
                      transition: COLORS.transition,
                      boxShadow: '0 1px 2px rgba(37, 99, 235, 0.25)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1D4ED8')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.accent)}
                  >
                    <Plus size={15} strokeWidth={2} /> Novo
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>
                    <User size={13} strokeWidth={1.8} /> Cliente
                  </label>
                  <input
                    value={cliente}
                    list="clientes-salvos"
                    onChange={(e) => handleClienteChange(e.target.value)}
                    placeholder="Nome ou Razão Social"
                    {...fieldProps('cliente')}
                  />
                  <datalist id="clientes-salvos">
                    {clientes.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label style={labelStyle}>
                    <MapPin size={13} strokeWidth={1.8} /> Matrícula
                  </label>
                  <input
                    value={matricula}
                    list="matriculas-salvas"
                    placeholder="Digite ou selecione"
                    onChange={(e) => handleMatriculaChange(e.target.value)}
                    {...fieldProps('matricula')}
                  />
                  <datalist id="matriculas-salvas">
                    {matriculas.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>
                    <Ruler size={13} strokeWidth={1.8} /> Área (ha)
                  </label>
                  <input value={area} onChange={(e) => setArea(e.target.value)} {...fieldProps('area')} />
                </div>
                <div>
                  <label style={labelStyle}>
                    <Building2 size={13} strokeWidth={1.8} /> Município
                  </label>
                  <select
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    {...fieldProps('municipio')}
                    style={{ ...fieldProps('municipio').style, cursor: 'pointer', padding: '0 10px' }}
                  >
                    <option value="São Bento do Sul">São Bento do Sul</option>
                    <option value="Campo Alegre">Campo Alegre</option>
                    <option value="Rio Negrinho">Rio Negrinho</option>
                    <option value="Corupá">Corupá</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cabeçalho da lista */}
            <div style={{ padding: '18px 24px 10px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    color: COLORS.textSoft,
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  Serviços
                </span>
                <span style={{ color: COLORS.textFaint, fontSize: '11px', fontWeight: 500 }}>
                  Índice (somente leitura)
                </span>
              </div>
            </div>

            {/* Grade de Serviços (chips) */}
            <div
              style={{
                padding: '0 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {services.map((service) => {
                const isSelected = service.selecionado && service.ativo;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    title={service.nome}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                      minHeight: '64px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: `1px solid ${isSelected ? 'rgba(37, 99, 235, 0.4)' : COLORS.border}`,
                      background: isSelected ? COLORS.accentSoft : COLORS.surface,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: COLORS.transition,
                      boxShadow: isSelected ? '0 1px 2px rgba(37, 99, 235, 0.12)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = COLORS.borderStrong;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = COLORS.border;
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '5px',
                        border: `1.5px solid ${isSelected ? COLORS.accent : COLORS.borderStrong}`,
                        background: isSelected ? COLORS.accent : COLORS.surface,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: COLORS.transition,
                      }}
                    >
                      {isSelected ? <Check size={11} strokeWidth={3} color="#FFFFFF" /> : null}
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        lineHeight: '1.25',
                        color: isSelected ? COLORS.accent : COLORS.text,
                        paddingRight: '18px',
                      }}
                    >
                      {service.nome}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: isSelected ? 'rgba(37, 99, 235, 0.7)' : COLORS.textFaint,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      Índice {service.indice.toFixed(1).replace('.', ',')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Painel de perímetros do Levantamento Topográfico (quando selecionado) */}
            {services[0].selecionado && services[0].ativo ? (
              <div style={{ padding: '12px 24px 0' }}>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: `1px solid rgba(37, 99, 235, 0.2)`,
                    background: COLORS.accentSoft,
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                      color: COLORS.accent,
                      marginBottom: '10px',
                    }}
                  >
                    Perímetros · Topografia
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'L. Seca (Km)', value: services[0].lseca_km },
                      { label: 'Rio (Km)', value: services[0].rio_km },
                    ].map((campo) => (
                      <label
                        key={campo.label}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                          fontSize: '11px',
                          color: COLORS.textSoft,
                          fontWeight: 500,
                        }}
                      >
                        {campo.label}
                        <input
                          type="text"
                          value={campo.value || ''}
                          readOnly
                          style={{
                            height: '34px',
                            borderRadius: '8px',
                            border: `1px solid ${COLORS.border}`,
                            background: COLORS.surface,
                            padding: '0 10px',
                            fontSize: '12px',
                            color: COLORS.textSoft,
                            textAlign: 'center',
                            outline: 'none',
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Resumo */}
          <div style={{ padding: '12px 24px', borderTop: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: '12px',
                background: COLORS.field,
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: COLORS.textSoft, fontSize: '12px', letterSpacing: '0.02em' }}>
                  SELECIONADOS
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '26px',
                    height: '26px',
                    padding: '0 8px',
                    borderRadius: '20px',
                    background: COLORS.accentSoft,
                    color: COLORS.accent,
                    fontSize: '12px',
                  }}
                >
                  {totalSelecionados}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: COLORS.textFaint, fontSize: '11px', fontWeight: 500 }}>Índice total</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{totalIndice.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Rodapé de ações */}
          <div
            style={{
              padding: '14px 24px 22px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1.2fr',
              gap: '10px',
              borderTop: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
            }}
          >
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                borderRadius: '10px',
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                padding: '11px 12px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '13px',
                color: COLORS.textSoft,
                transition: COLORS.transition,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.field)}
              onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.surface)}
            >
              <FolderPlus size={15} strokeWidth={1.8} /> Pasta
            </button>
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                borderRadius: '10px',
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                padding: '11px 12px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '13px',
                color: COLORS.textSoft,
                transition: COLORS.transition,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.field)}
              onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.surface)}
            >
              <MessageSquare size={15} strokeWidth={1.8} /> Notas
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                borderRadius: '10px',
                border: 'none',
                background: COLORS.success,
                color: '#FFFFFF',
                padding: '11px 12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: COLORS.transition,
                boxShadow: '0 1px 2px rgba(15, 157, 119, 0.25)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0C8666')}
              onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.success)}
            >
              <Check size={16} strokeWidth={2.2} /> Salvar Cadastro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CadastroServico;
