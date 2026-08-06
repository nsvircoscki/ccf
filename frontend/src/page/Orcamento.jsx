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
import { AnimatedDropdown } from '../components/AnimatedDropdown';
import { servicoService } from '../services/servicoService.js';
import { formatarTelefone, formatarMatricula } from '../utils/mascaras.js';
import VisualizadorImagem from './VisualizadorImagem.jsx';
import VisualizadorFicha from './VisualizadorFicha.jsx';


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
  { id: 15, nome: 'Outros', indice: 1.0, ativo: true, selecionado: false },
];

// O banco guarda os tipos com o nome completo do catálogo de processos; a tela
// trabalha com as siglas. Sem essa tradução, abrir um orçamento não recupera os
// serviços que foram pedidos no cadastro.
const SIGLA_POR_TIPO = {
  'Retificação': 'Ret',
  'Desmembramento': 'Desm',
  'Unificação': 'Uni',
  'Usucapião': 'Usu',
  'Alteração de Divisas': 'At',
  'CAR': 'CAR',
  'Certificação INCRA': 'Cert',
  'Escritura': 'Escritura',
  'Conferência': 'Conf',
  'Cadastral': 'Cad',
  'Locação': 'Loc',
  'Movimentação de Terra': 'Mov de Terra',
  'Outros': 'Outros',
  'Extremação': 'Ext',
};

const currency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const formatIndex = (value) => value.toFixed(1).replace('.', ',');

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

// Cliente e matrícula vêm do orçamento escolhido no dropdown — são dados
// derivados, não campos de entrada. O visual apagado sinaliza isso.
const readOnlyFieldStyle = {
  ...baseFieldStyle,
  background: '#ECEEF4',
  color: '#5F6B83',
  cursor: 'default',
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

function FieldLabel({ icon: Icon, unidade, children }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', ...labelTextStyle }}>
      {Icon ? <Icon size={14} /> : null}
      {children}
      {/* A unidade fica fora do uppercase do rótulo, senão "m²" e "Km" saem
          como "M²" e "KM". */}
      {unidade ? <span style={{ textTransform: 'none' }}>({unidade})</span> : null}
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

function Orcamento({ onBack, onOrcamentoDecidido }) {
  const [services, setServices] = useState(initialServices);
  const [viewMode, setViewMode] = useState('Topografico');
  const [orcamentos, setOrcamentos] = useState([]);
  const [numero, setNumero] = useState('');
  const [orcamentoId, setOrcamentoId] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [pagamento, setPagamento] = useState(null);
  // null enquanto ninguém decidiu ainda (statusOrcamento = PENDENTE).
  const [decisaoOrcamento, setDecisaoOrcamento] = useState(null);
  const [imagemSalvaUrl, setImagemSalvaUrl] = useState(null);
  const [fichaAberta, setFichaAberta] = useState(false);
  const [fichaUrl, setFichaUrl] = useState(null);
  const [gerandoFicha, setGerandoFicha] = useState(false);
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
  const [codRespTecnPossui, setCodRespTecnPossui] = useState('');
  const [respTecnPossui, setRespTecnPossui] = useState('');
  const [codRespTecn, setCodRespTecn] = useState('');
  const [respTecn, setRespTecn] = useState('');
  const [municipio, setMunicipio] = useState('Sao Bento do Sul');
  const [perimetroLSeca, setPerimetroLSeca] = useState('');
  const [perimetroRio, setPerimetroRio] = useState('');
  const [imagensJpg, setImagensJpg] = useState([]);
  const [arquivosKml, setArquivosKml] = useState([]);
  const jpgInputRef = useRef(null);
  const kmlInputRef = useRef(null);

  // Declarado antes do useEffect que o chama: o react-hooks acusa acesso a
  // const antes da declaração, mesmo sendo seguro em tempo de execução.
  const applyBudget = (budget) => {
    setOrcamentoId(budget.id);
    setNumero(budget.numero);
    setCliente(budget.cliente);
    // Passa pelos formatadores para que dado vindo do banco apareça igual ao
    // que o usuário digitaria — cadastros antigos foram salvos sem máscara.
    setContato(formatarTelefone(budget.contato || ''));
    setMatricula(formatarMatricula(budget.matricula || ''));
    setTerreno(budget.terreno || '');
  };

  // Busca o serviço completo para repor o orçamento já gravado: índices
  // editados, valor de referência e condições de pagamento.
  const carregarOrcamentoSalvo = async (id) => {
    try {
      const servico = await servicoService.buscarPorId(id);
      if (!servico || servico.error) return;

      // A imagem anexada no cadastro fica no servidor: exibe ela no painel da
      // esquerda em vez do mapa, igual acontece logo após o upload.
      setImagemSalvaUrl(servico.temImagem ? servicoService.urlImagem(id, servico.updated_at) : null);

      setArea(servico.area != null ? String(servico.area).replace('.', ',') : '0,00');
      setMunicipio(servico.municipio || 'Sao Bento do Sul');
      setPerimetroLSeca(servico.linhaSecaKm != null ? String(servico.linhaSecaKm).replace('.', ',') : '');
      setPerimetroRio(servico.rioKm != null ? String(servico.rioKm).replace('.', ',') : '');
      setPossuiCar(servico.possuiCar || '');
      setPossuiCertificacao(servico.possuiCertificacao || '');
      setConfrontaCertificacao(servico.confrontaCertificacao || '');
      setCodRespTecnPossui(servico.codRespTecnPossui || '');
      setRespTecnPossui(servico.respTecnPossui || '');
      setCodRespTecn(servico.codRespTecn || '');
      setRespTecn(servico.respTecn || '');
      setNotas(servico.notas || '');
      if (servico.valorReferencia) setSalarioMinimo(servico.valorReferencia);
      setDecisaoOrcamento(
        servico.statusOrcamento === 'APROVADO' || servico.statusOrcamento === 'REPROVADO'
          ? servico.statusOrcamento
          : null,
      );

      const itens = servico.itensOrcamento || [];
      if (itens.length > 0) {
        // Orçamento já trabalhado: repõe índices e marcações salvos.
        setServices((atuais) =>
          atuais.map((service) => {
            const salvo = itens.find((item) => item.nome === service.nome);
            return salvo
              ? { ...service, indice: salvo.indice, selecionado: salvo.selecionado }
              : { ...service, selecionado: false };
          }),
        );
      } else {
        // Primeira abertura: parte dos serviços pedidos no cadastro.
        const siglasPedidas = (servico.tiposSolicitados || []).map((tipo) => SIGLA_POR_TIPO[tipo] || tipo);
        setServices((atuais) =>
          atuais.map((service) => ({ ...service, selecionado: siglasPedidas.includes(service.nome) })),
        );
      }

      setPagamento({
        descontoValor: servico.descontoValor,
        descontoPercentual: servico.descontoPercentual,
        valorFinal: servico.valorFinal,
        entradaValor: servico.entradaValor,
        entradaData: servico.entradaData ? servico.entradaData.slice(0, 10) : null,
        numeroParcelas: servico.numeroParcelas,
        jurosAtivo: servico.jurosAtivo,
        taxaJuros: servico.taxaJuros,
        tipoJuros: servico.tipoJuros,
        baseJuros: servico.baseJuros,
        parcelas: servico.parcelas || [],
      });
    } catch (erro) {
      console.error('Erro ao carregar o orçamento salvo:', erro);
    }
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

  useEffect(() => {
    if (possuiCertificacao === 'Sim') return;

    setCodRespTecnPossui('');
    setRespTecnPossui('');
  }, [possuiCertificacao]);

  useEffect(() => {
    if (confrontaCertificacao === 'Sim') return;

    setCodRespTecn('');
    setRespTecn('');
  }, [confrontaCertificacao]);

  const mostrarRespTecnico = possuiCertificacao === 'Sim' || confrontaCertificacao === 'Sim';

  const fieldStyle = (name) => ({
    ...baseFieldStyle,
    ...(campoAtivo === name ? activeFieldStyle : {}),
  });

  const handleOrcamentoChange = (id) => {
    const budget = orcamentos.find((item) => item.id === id);
    if (budget) {
      applyBudget(budget);
      carregarOrcamentoSalvo(id);
    } else {
      setOrcamentoId(null);
      setNumero('');
      setPagamento(null);
      setImagemSalvaUrl(null);
      setDecisaoOrcamento(null);
    }
  };

  const abrirFicha = () => {
    if (!orcamentoId) return;
    window.open(servicoService.urlPdf(orcamentoId), '_blank', 'noopener');
  };

  // Tudo que o Orçamento pode mudar e que aparece na ficha. É useMemo para a
  // identidade só mudar quando um valor muda de fato — é isso que impede o
  // efeito da prévia de disparar a cada render.
  const dadosFicha = useMemo(() => ({
    nomeCliente: cliente,
    contato,
    matricula,
    terreno,
    municipio,
    area,
    linhaSecaKm: perimetroLSeca,
    rioKm: perimetroRio,
    possuiCar,
    possuiCertificacao,
    confrontaCertificacao,
    codRespTecnPossui,
    respTecnPossui,
    codRespTecn,
    respTecn,
    notas,
    valorTotal: totalValor,
    servicosSelecionados: selectedServices.map((service) => service.nome),
    ...(pagamento || {}),
  }), [
    cliente, contato, matricula, terreno, municipio, area, perimetroLSeca, perimetroRio,
    possuiCar, possuiCertificacao, confrontaCertificacao, codRespTecnPossui, respTecnPossui, codRespTecn, respTecn, notas,
    totalValor, selectedServices, pagamento,
  ]);

  // Regera a prévia ao parar de digitar. O abort cancela a requisição anterior
  // para uma resposta atrasada não sobrescrever uma prévia mais nova.
  useEffect(() => {
    if (!fichaAberta || !orcamentoId) return undefined;

    const controlador = new AbortController();

    const temporizador = window.setTimeout(async () => {
      // Só sinaliza quando a requisição realmente começa — durante a espera do
      // debounce não há nada acontecendo para mostrar.
      setGerandoFicha(true);
      try {
        const blob = await servicoService.gerarPreviaPdf(orcamentoId, dadosFicha, controlador.signal);
        if (blob) setFichaUrl((anterior) => {
          if (anterior) URL.revokeObjectURL(anterior);
          return URL.createObjectURL(blob);
        });
      } catch (erro) {
        if (erro.name !== 'AbortError') console.error('Erro ao gerar a prévia da ficha:', erro);
      } finally {
        setGerandoFicha(false);
      }
    }, 600);

    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
  }, [fichaAberta, orcamentoId, dadosFicha]);

  // Libera o último object URL ao desmontar, senão o blob fica na memória.
  useEffect(() => () => { if (fichaUrl) URL.revokeObjectURL(fichaUrl); }, [fichaUrl]);

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

  // Valida pelo tipo real do arquivo, não pela extensão do nome: prints de tela
  // saem como PNG mesmo quando são chamados de "JPG", e o filtro por nome os
  // descartava em silêncio. JPEG e PNG são os dois formatos que o gerador da
  // ficha consegue embutir — qualquer outro avisa em vez de sumir.
  const handleJpgUpload = (event) => {
    const arquivo = (event.target.files || [])[0];
    event.target.value = '';
    if (!arquivo) return;

    if (!['image/jpeg', 'image/png'].includes(arquivo.type)) {
      setMensagem({ tipo: 'erro', texto: 'A imagem precisa ser JPG ou PNG.' });
      window.setTimeout(() => setMensagem(null), 2600);
      return;
    }

    setImagensJpg([arquivo]);
  };

  const handleKmlUpload = (event) => {
    const files = Array.from(event.target.files || []);
    setArquivosKml((current) => [...current, ...files.filter((file) => /\.kml$/i.test(file.name))]);
    event.target.value = '';
  };

  const handleConfirmar = async () => {
    if (!orcamentoId) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um orçamento antes de confirmar.' });
      window.setTimeout(() => setMensagem(null), 2200);
      return;
    }

    setConfirmando(true);
    try {
      // 1) Grava o orçamento (valores, índices e condições de pagamento).
      const salvo = await servicoService.salvarOrcamento(orcamentoId, {
        valorReferencia: salarioMinimo,
        valorTotal: totalValor,
        ...(pagamento || {}),
        itens: servicesWithCalculatedTopo.map((service) => ({
          nome: service.nome,
          indice: service.indice,
          valor: service.indice * salarioMinimo,
          selecionado: service.selecionado && service.ativo,
        })),
      });

      if (!salvo.ok) {
        setMensagem({ tipo: 'erro', texto: salvo.data?.error || 'Erro ao gravar o orçamento.' });
        return;
      }

      // 2) Sem decisão marcada (Aprovado/Não aprovado), só grava os valores e
      // deixa o status como está — não faz sentido chamar a aprovação sem
      // uma escolha explícita do usuário.
      if (!decisaoOrcamento) {
        setMensagem({ tipo: 'sucesso', texto: 'Orçamento salvo.' });
        return;
      }

      // Aprovado fabrica um projeto por tipo no Kanban; se já estava aprovado,
      // o orçamento continua gravado — por isso isso é reportado como
      // atualização, não erro.
      const resultado = await servicoService.aprovarOrcamento(orcamentoId, decisaoOrcamento);

      if (resultado.error) {
        const jaAprovado = /já foi aprovado/i.test(resultado.error);
        setMensagem({
          tipo: jaAprovado ? 'sucesso' : 'erro',
          texto: jaAprovado ? 'Orçamento atualizado.' : resultado.error,
        });
        return;
      }

      setMensagem({ tipo: 'sucesso', texto: resultado.message || 'Orçamento atualizado com sucesso!' });

      // Quando aprovado, projetos novos nascem no Kanban — sem este aviso eles
      // só apareceriam ao recarregar a página (mesmo caso do Cadastro).
      if (decisaoOrcamento === 'APROVADO') await onOrcamentoDecidido?.();
    } catch (erro) {
      console.error(erro);
      setMensagem({ tipo: 'erro', texto: 'Erro ao conectar com o servidor.' });
    } finally {
      setConfirmando(false);
      window.setTimeout(() => setMensagem(null), 2200);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0, background: '#F4F6FA', color: '#2D2A35', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

      {mensagem ? (
        <div
          style={{
            // Absoluto em relação à própria tela de Orçamento (e não à
            // viewport), senão o toast cobre a barra de navegação do App.
            position: 'absolute',
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

      {/* gridTemplateRows definido: sem ele a linha é dimensionada pelo conteúdo
          e uma imagem alta estica o painel inteiro, empurrando os botões para
          fora da tela. Com a linha definida, o maxHeight:100% da imagem passa a
          valer e o painel respeita a altura disponível. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 470px', gridTemplateRows: 'minmax(0, 1fr)', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {fichaAberta ? (
          <VisualizadorFicha
            url={fichaUrl}
            carregando={gerandoFicha}
            onAbrirNovaAba={abrirFicha}
          />
        ) : imagensJpg.length > 0 || imagemSalvaUrl ? (
          <VisualizadorImagem arquivo={imagensJpg[0]} url={imagemSalvaUrl} />
        ) : (
          <PainelMapa viewMode={viewMode} setViewMode={setViewMode} />
        )}

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
              <div style={{ gridColumn: '1 / -1' }}>
                <AnimatedDropdown
                  label="Orçamento"
                  value={orcamentoId || ''}
                  onChange={handleOrcamentoChange}
                  options={[
                    { value: '', label: orcamentos.length ? 'Selecione um orçamento' : 'Nenhum orçamento cadastrado' },
                    ...orcamentos.map((orc) => ({ value: orc.id, label: orc.numero })),
                  ]}
                  width="100%"
                  searchable
                  searchPlaceholder="Pesquisar orçamento"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={labelTextStyle}>Aprovação do Orçamento</span>
                <div style={{ ...optionRowStyle, marginTop: '8px' }}>
                  <OptionButton
                    ativo={decisaoOrcamento === 'APROVADO'}
                    onClick={() => setDecisaoOrcamento('APROVADO')}
                  >
                    Aprovado
                  </OptionButton>
                  <OptionButton
                    ativo={decisaoOrcamento === 'REPROVADO'}
                    onClick={() => setDecisaoOrcamento('REPROVADO')}
                  >
                    Não aprovado
                  </OptionButton>
                </div>
                {/* Aprovar já fabrica o projeto no Kanban — sem volta fácil,
                    então avisa antes de o usuário clicar em Confirmar. */}
                {decisaoOrcamento === 'APROVADO' ? (
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#8A94A6' }}>
                    Ao confirmar, um projeto é criado no Kanban para cada serviço selecionado.
                  </p>
                ) : null}
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={Building2}>Cliente</FieldLabel>
                <input
                  value={cliente}
                  onChange={(event) => setCliente(event.target.value)}
                  onFocus={() => setCampoAtivo('cliente')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Nome do Cliente"
                  style={fieldStyle('cliente')}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <FieldLabel icon={MessageSquare}>Contato</FieldLabel>
                <input
                  value={contato}
                  onChange={(event) => setContato(formatarTelefone(event.target.value))}
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
                  readOnly
                  placeholder="Selecione um orçamento"
                  style={readOnlyFieldStyle}
                />
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

                {possuiCertificacao === 'Sim' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={labelTextStyle}>Cod do Res Tecn Certificacao</span>
                      <input
                        value={codRespTecnPossui}
                        onChange={(event) => setCodRespTecnPossui(event.target.value)}
                        onFocus={() => setCampoAtivo('codRespTecnPossui')}
                        onBlur={() => setCampoAtivo(null)}
                        placeholder="Codigo"
                        style={fieldStyle('codRespTecnPossui')}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={labelTextStyle}>Resp Tecn Certificacao</span>
                      <input
                        value={respTecnPossui}
                        onChange={(event) => setRespTecnPossui(event.target.value)}
                        onFocus={() => setCampoAtivo('respTecnPossui')}
                        onBlur={() => setCampoAtivo(null)}
                        placeholder="Nome do tecnico"
                        style={fieldStyle('respTecnPossui')}
                      />
                    </label>
                  </div>
                ) : null}

                {confrontaCertificacao === 'Sim' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={labelTextStyle}>Cod do Res Tecn Confronto</span>
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
                      <span style={labelTextStyle}>Resp Tecn Confronto</span>
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
                <FieldLabel icon={MapPin} unidade="m²">Área</FieldLabel>
                <input value={area} onChange={(event) => setArea(event.target.value)} onFocus={() => setCampoAtivo('area')} onBlur={() => setCampoAtivo(null)} style={fieldStyle('area')} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FieldLabel icon={Building2}>Município</FieldLabel>
                <input
                  value={municipio}
                  list="municipios-sugeridos"
                  onChange={(event) => setMunicipio(event.target.value)}
                  onFocus={() => setCampoAtivo('municipio')}
                  onBlur={() => setCampoAtivo(null)}
                  placeholder="Digite ou selecione a cidade"
                  style={fieldStyle('municipio')}
                />
                {/* datalist só sugere; o valor digitado pode ser qualquer texto,
                    então cidades fora das quatro mais comuns também funcionam. */}
                <datalist id="municipios-sugeridos">
                  <option value="Sao Bento do Sul" />
                  <option value="Campo Alegre" />
                  <option value="Rio Negrinho" />
                  <option value="Corupa" />
                </datalist>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FieldLabel icon={MapPin} unidade="Km">Perímetro L.Seca</FieldLabel>
                <input value={perimetroLSeca} onChange={(event) => setPerimetroLSeca(event.target.value)} onFocus={() => setCampoAtivo('perimetro-lseca')} onBlur={() => setCampoAtivo(null)} placeholder="Ex.: 1,25" style={fieldStyle('perimetro-lseca')} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FieldLabel icon={MapPin} unidade="Km">Perímetro Rio</FieldLabel>
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
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#5F6B83' }}>Imagem do mapa</span>
                    <input ref={jpgInputRef} type="file" accept="image/jpeg,image/png" onChange={handleJpgUpload} style={{ display: 'none' }} />
                    <button type="button" onClick={() => jpgInputRef.current?.click()} style={{ ...baseFieldStyle, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                      Selecionar imagem (JPG ou PNG)
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
                    {imagensJpg.length ? `Imagem anexada: ${imagensJpg[0].name}` : 'Nenhuma imagem anexada.'}
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

            <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1fr 0.85fr 1.2fr', gap: '10px' }}>
              <motion.button
                type="button"
                onClick={() => setFichaAberta((aberta) => !aberta)}
                disabled={!orcamentoId}
                title={orcamentoId ? 'Ver a ficha atualizando em tempo real' : 'Selecione um orçamento'}
                whileHover={orcamentoId ? { scale: 1.03, y: -1 } : undefined}
                whileTap={orcamentoId ? { scale: 0.98 } : undefined}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: fichaAberta ? '1px solid #2D7AFD' : '1px solid rgba(15, 23, 42, 0.10)',
                  background: fichaAberta ? '#E8F0FF' : '#FFFFFF',
                  cursor: orcamentoId ? 'pointer' : 'not-allowed',
                  opacity: orcamentoId ? 1 : 0.5,
                  fontSize: '13px',
                  fontWeight: 800,
                  color: fichaAberta ? '#2D7AFD' : '#4E5970',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <FileText size={16} /> Ficha
              </motion.button>
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
                onClick={handleConfirmar}
                disabled={confirmando}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #14B38B 0%, #0F9E7A 100%)',
                  cursor: confirmando ? 'not-allowed' : 'pointer',
                  opacity: confirmando ? 0.7 : 1,
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
                <Save size={16} /> {confirmando ? 'Confirmando...' : 'Confirmar'}
              </motion.button>
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {notasAberta ? <NotesModal notas={notas} setNotas={setNotas} onClose={() => setNotasAberta(false)} /> : null}
      </AnimatePresence>

      {pagamentoAberto ? (
        <ModalPagamento
          totalValor={totalValor}
          valoresIniciais={pagamento}
          onChange={setPagamento}
          onClose={() => setPagamentoAberto(false)}
        />
      ) : null}
    </div>
  );
}

export default Orcamento;
