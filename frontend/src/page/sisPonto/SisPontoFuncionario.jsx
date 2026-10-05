import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, CloudOff, CloudUpload, FileText, LogOut, Hourglass, Image as ImageIcon, LogIn, Pencil, TimerReset, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useEhCelular } from '../../hooks/useEhCelular';
import { registrarBatida, pendentesDoFuncionario, inscrever, obterEstado, sincronizarPendentes } from '../../services/pontoOffline.js';
import { meses, diasSemana, JUSTIFICATIVA_CORES, PADROES_HORARIO_PADRAO, JUSTIFICATIVA_TIPOS, rotuloTipoJustificativa, PRAZO_JUSTIFICATIVA_PADRAO_HORAS } from './sisPontoData.js';
import { chaveData, hora, calcularBancoHoras, carregarFeriados, montarItensParaJustificar, extrairRegistrosFuncionario, statusJustificativaSlotsFaltantes, statusCalendarioDoDia, expectativasDoFuncionario, statusRegistroComExpectativa, pendenciasDeJustificativa, ehHorista, toleranciaEntrada, fimDoPrazo, diaSemRegistro } from './sisPontoUtils.js';
import { Card, ConfirmacaoPonto, BancoHoras, Legenda, MenuPonto, ModalRegistros, Resumo, navButton } from './SisPontoComponents.jsx';
import './sisPonto.css';

// `usuario` = a pessoa logada ({ id, nome, setor }). Cada pessoa vê e bate só
// o próprio ponto — o servidor também recusa batida para outra pessoa.
// onSair: só no celular, onde esta tela ocupa o app inteiro (ver App.jsx).
export default function SisPontoFuncionarioScreen({ usuario, destino, onSair }) {
  const usuarioLogado = usuario?.setor;
  const ehCelular = useEhCelular();
  const [agora, setAgora] = useState(new Date());
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [aba, setAba] = useState('calendario');
  // Leva direto pra aba "Justificativas" quando o funcionário chega por uma
  // notificação de atraso/saída antecipada (ver Navbar.jsx) — sem isso, ele
  // só abria o módulo na tela padrão (Calendário) e precisava achar a aba
  // sozinho. O "ts" garante que o efeito roda de novo mesmo clicando na
  // mesma notificação (ou tipo) duas vezes seguidas.
  useEffect(() => {
    if (destino?.pagina) setAba(destino.pagina);
  }, [destino?.pagina, destino?.ts]);
  const [modalRegistros, setModalRegistros] = useState(false);
  const [diaModal, setDiaModal] = useState(null);
  const [mesesAberto, setMesesAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [erroPonto, setErroPonto] = useState(null);
  const [justificativas, setJustificativas] = useState([]);
  // Cadastro de ponto da própria pessoa (jornada, horista), guardado no
  // aparelho pra tela funcionar offline. null = ainda não carregou;
  // false = a pessoa não está marcada para registrar ponto.
  const chaveCadastro = `ccf-sis-ponto-cadastro-${usuario.id}`;
  const [cadastro, setCadastro] = useState(() => {
    try { return JSON.parse(localStorage.getItem(chaveCadastro)); } catch { return null; }
  });
  const funcionarioAtual = useMemo(
    () => ({ id: usuario.id, nome: usuario.nome, setor: usuario.setor, ...(cadastro || {}) }),
    [usuario.id, usuario.nome, usuario.setor, cadastro],
  );
  const naoRegistraPonto = cadastro === false;
  // O que o servidor já confirmou + o que ainda está na fila do aparelho
  // (batida offline). A tela mostra os dois juntos.
  const [registrosServidor, setRegistrosServidor] = useState({});
  const [pendentesLocais, setPendentesLocais] = useState([]);
  const [sync, setSync] = useState(obterEstado);
  const registros = useMemo(() => {
    const junto = Object.fromEntries(Object.entries(registrosServidor).map(([dia, lista]) => [dia, [...lista]]));
    pendentesLocais.forEach((batida) => {
      const dia = chaveData(new Date(batida.batidoEm));
      if (!(junto[dia] ||= []).includes(batida.batidoEm)) junto[dia].push(batida.batidoEm);
    });
    Object.values(junto).forEach((lista) => lista.sort());
    return junto;
  }, [registrosServidor, pendentesLocais]);
  // Mesma fonte que o admin (SisPontoEngAdmin) usa pra alocar cada funcionário
  // num padrão de horário, agora vinda do backend — sem isso, este painel
  // sempre usava o horário padrão de fábrica e ignorava a alocação feita lá.
  // Guardado no aparelho pra tela abrir offline com a jornada certa.
  const CHAVE_PADROES = 'ccf-sis-ponto-padroes-horario';
  const [padroesHorario, setPadroesHorario] = useState(() => {
    try { return { ...PADROES_HORARIO_PADRAO, ...(JSON.parse(localStorage.getItem(CHAVE_PADROES)) || {}) }; } catch { return PADROES_HORARIO_PADRAO; }
  });
  useEffect(() => {
    api.getSispontoPadroesHorario().then((dados) => {
      if (!dados || typeof dados !== 'object') return;
      localStorage.setItem(CHAVE_PADROES, JSON.stringify(dados));
      setPadroesHorario({ ...PADROES_HORARIO_PADRAO, ...dados });
    }).catch(() => {});
  }, [usuarioLogado, aba]);
  const expectativasHoje = expectativasDoFuncionario(funcionarioAtual, padroesHorario, agora) || [];
  const funcionarioEhHorista = ehHorista(funcionarioAtual);

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  // O backend é a fonte da verdade (jornada e "registra ponto" mudam no
  // cadastro de Usuários); sem conexão, vale o que ficou guardado.
  useEffect(() => {
    api.getSispontoFuncionarios().then((lista) => {
      if (!Array.isArray(lista)) return;
      const eu = lista.find((funcionario) => funcionario.id === usuario.id) || false;
      localStorage.setItem(chaveCadastro, JSON.stringify(eu));
      setCadastro(eu);
    }).catch(() => {});
  }, [usuario.id, chaveCadastro, aba]);
  // Horários da jornada que ficaram sem batida (o servidor registra como
  // previstos): entram na lista "Pendentes" para justificar.
  const [esquecimentos, setEsquecimentos] = useState([]);
  const carregarJustificativas = () => api.getSispontoMeusEsquecimentos()
    .then((lista) => setEsquecimentos(Array.isArray(lista) ? lista : []))
    .catch(() => {})
    .then(() => api.getSispontoJustificativas())
    .then((lista) => setJustificativas(Array.isArray(lista) ? lista : []))
    .catch(() => setJustificativas([]));
  useEffect(() => { carregarJustificativas(); }, [funcionarioAtual?.id, aba]);
  const carregarPendentes = () => pendentesDoFuncionario(funcionarioAtual?.id || usuarioLogado).then(setPendentesLocais).catch(() => {});
  // Feriados do ano exibido (calendário e banco de horas).
  const [prazoHoras, setPrazoHoras] = useState(PRAZO_JUSTIFICATIVA_PADRAO_HORAS);
  useEffect(() => {
    api.getSispontoRegras().then((regras) => setPrazoHoras(regras.prazoJustificativaHoras || PRAZO_JUSTIFICATIVA_PADRAO_HORAS)).catch(() => {});
  }, []);
  const [lancamentosBanco, setLancamentosBanco] = useState([]);
  useEffect(() => {
    api.getSispontoLancamentosBanco().then((lista) => setLancamentosBanco(Array.isArray(lista) ? lista : [])).catch(() => {});
  }, []);
  const [feriados, setFeriados] = useState(new Map());
  const anoExibido = mes.getFullYear();
  useEffect(() => {
    let ativo = true;
    carregarFeriados(api, anoExibido).then((mapa) => { if (ativo) setFeriados(mapa); });
    return () => { ativo = false; };
  }, [anoExibido]);
  // Batidas que o ENG incluiu no meu ponto (iso -> { motivo, por }): aparecem marcadas.
  const [ajustes, setAjustes] = useState(new Map());
  const carregarRegistros = () => {
    const idAtual = funcionarioAtual?.id || usuarioLogado;
    carregarPendentes();
    api.getSispontoAjustes()
      .then((lista) => setAjustes(new Map((Array.isArray(lista) ? lista : []).filter((a) => a.funcionarioId === idAtual).map((a) => [a.batidoEm, a]))))
      .catch(() => {});
    return api.getSispontoRegistros()
      .then((registrosBackend) => setRegistrosServidor(extrairRegistrosFuncionario(registrosBackend, idAtual)))
      .catch(() => {});
  };
  useEffect(() => { carregarRegistros(); }, [funcionarioAtual?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // A fila andou (batida nova, envio confirmado): atualiza contador e lista.
  // Quando algo sobe pro servidor, recarrega dele pra trocar "pendente" por confirmado.
  const ultimoEnvioVisto = useRef(sync.ultimoEnvio);
  useEffect(() => inscrever((estado) => {
    setSync(estado);
    if (estado.ultimoEnvio !== ultimoEnvioVisto.current) {
      ultimoEnvioVisto.current = estado.ultimoEnvio;
      carregarRegistros();
    } else {
      carregarPendentes();
    }
  }), [funcionarioAtual?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hoje = chaveData(agora);
  const registrosHoje = registros[hoje] || [];
  const proximoEhEntrada = registrosHoje.length % 2 === 0;
  const registrarPonto = () => {
    const acao = proximoEhEntrada ? 'iniciar o horário de entrada' : 'registrar a saída';
    setConfirmacao({ titulo: proximoEhEntrada ? 'Confirmar entrada' : 'Confirmar saída', mensagem: `Deseja realmente ${acao}?`, confirmar: registrarPontoConfirmado });
  };
  const registrarPontoConfirmado = () => {
    const momento = new Date();
    const tempoIso = momento.toISOString();
    const idAtual = funcionarioAtual?.id || usuarioLogado;

    const [tipo] = proximoEsperado;
    let atrasado = false;
    let minutosAtraso = 0;
    if (expectativasHoje.length) {
      const [, horarioEsperadoStr] = proximoEsperado;
      const [horaEsperada, minutoEsperado] = horarioEsperadoStr.split(':').map(Number);
      const diferenca = (momento.getHours() * 60 + momento.getMinutes()) - (horaEsperada * 60 + minutoEsperado);
      atrasado = (tipo === 'Entrada' && diferenca >= toleranciaEntrada(registrosHoje.length, expectativasHoje)) || (tipo === 'Saída' && diferenca <= -5);
      minutosAtraso = Math.abs(diferenca);
    }

    setConfirmacao(null);
    if (atrasado) {
      setErroPonto('Esse registro ficou fora do horário. Não esqueça de enviar uma justificativa na aba Justificativas.');
      window.setTimeout(() => setErroPonto(null), 6000);
    }
    // Grava primeiro no aparelho (vale mesmo sem internet); o envio ao
    // servidor acontece em seguida ou quando a conexão voltar.
    setPendentesLocais((atuais) => [...atuais, { batidoEm: tempoIso }]);
    registrarBatida({ funcionarioId: idAtual, tipo: tipo === 'Saída' ? 'SAIDA' : 'ENTRADA', batidoEm: tempoIso, atrasado, minutosAtraso })
      .then(carregarPendentes)
      .catch(() => {
        carregarPendentes();
        setErroPonto('Não foi possível guardar o ponto neste aparelho. Tente de novo.');
        window.setTimeout(() => setErroPonto(null), 6000);
      });
  };

  const diasCalendario = useMemo(() => {
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const primeiraCelula = new Date(mes.getFullYear(), mes.getMonth(), 1 - inicio.getDay());
    const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    const totalCelulas = Math.ceil((inicio.getDay() + ultimoDia.getDate()) / 7) * 7;
    return Array.from({ length: totalCelulas }, (_, index) => {
      const data = new Date(primeiraCelula.getFullYear(), primeiraCelula.getMonth(), primeiraCelula.getDate() + index);
      return { data, pertenceAoMes: data.getFullYear() === mes.getFullYear() && data.getMonth() === mes.getMonth() };
    });
  }, [mes]);
  const registrosNoMes = Object.entries(registros).filter(([data, itens]) => data.startsWith(`${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`) && itens.length > 0);
  const diasTrabalhados = registrosNoMes.length;
  const totalRegistros = registrosNoMes.reduce((total, [, itens]) => total + itens.length, 0);
  const tituloData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' }).format(agora);
  const navegar = (direcao) => setMes((atual) => new Date(atual.getFullYear(), atual.getMonth() + direcao, 1));
  const irParaHoje = () => {
    setMes(new Date(agora.getFullYear(), agora.getMonth(), 1));
  };
  const horarioEsperado = (indice, registrosDoDia = []) => {
    const dataRegistro = registrosDoDia[indice] ? new Date(registrosDoDia[indice]) : agora;
    const expectativas = expectativasDoFuncionario(funcionarioAtual, padroesHorario, dataRegistro) || [];
    if (!expectativas.length) return [indice % 2 === 0 ? 'Entrada' : 'Saída', null];
    return expectativas[indice % expectativas.length];
  };
  const proximoEsperado = horarioEsperado(registrosHoje.length, registrosHoje);
  const statusRegistro = (registro, indice, registrosDoDia = [], chaveDia = hoje) => {
    const dataRegistro = registrosDoDia[indice] ? new Date(registrosDoDia[indice]) : new Date(`${chaveDia}T12:00:00`);
    const expectativas = expectativasDoFuncionario(funcionarioAtual, padroesHorario, dataRegistro) || [];
    return statusRegistroComExpectativa(registro, indice, expectativas, justificativas, funcionarioAtual?.id, chaveDia);
  };
  const atrasosNoMes = registrosNoMes.reduce((total, [data, itens]) => total + itens.filter((registro, indice) => statusRegistro(registro, indice, itens, data) === 'Atrasado/Saída Antecipada').length, 0);
  const diasDoMesSemRegistroJustificados = Array.from({ length: new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate() }, (_, indice) => new Date(mes.getFullYear(), mes.getMonth(), indice + 1))
    .filter((dia) => { const chaveDia = chaveData(dia); const itensDia = registros[chaveDia] || []; const expectativasDia = expectativasDoFuncionario(funcionarioAtual, padroesHorario, dia) || []; return statusJustificativaSlotsFaltantes(justificativas, funcionarioAtual?.id, chaveDia, expectativasDia, itensDia.length) === 'Aceita'; }).length;
  const justificadasNoMes = registrosNoMes.reduce((total, [data, itens]) => total + itens.filter((registro, indice) => statusRegistro(registro, indice, itens, data) === 'Justificado').length, 0) + diasDoMesSemRegistroJustificados;
  const registrosDoModal = diaModal ? registros[diaModal] || [] : [];
  const statusRegistroDoModal = (registro, indice, registrosDoDia) => statusRegistro(registro, indice, registrosDoDia, diaModal);
  const idFuncionarioAtual = funcionarioAtual?.id || usuarioLogado;
  // Banco de horas acumulado do mês exibido no calendário (no máximo 31 dias:
  // barato o bastante para recalcular a cada render).
  const bancoDoMes = calcularBancoHoras(funcionarioAtual, registros, padroesHorario, justificativas, mes, hoje, feriados, agora, lancamentosBanco);
  // Todo atraso/saída antecipada (em qualquer mês, não só o exibido no
  // calendário), do mais antigo pro mais recente. O badge da aba
  // "Justificativas" conta só quem ainda não teve NENHUMA justificativa
  // enviada — some assim que o funcionário envia, sem esperar o admin
  // aprovar. A sugestão de preenchimento automático pega a mais antiga ainda
  // sem envio: se o mesmo dia tiver atraso de manhã e saída antecipada à
  // tarde, a da manhã aparece primeiro e, assim que enviada, a da tarde
  // entra no lugar dela.
  const pendenciasAtraso = useMemo(() => pendenciasDeJustificativa(registros, funcionarioAtual, padroesHorario, justificativas), [registros, funcionarioAtual, padroesHorario, justificativas]);
  const pendenciasNaoEnviadas = pendenciasAtraso.filter((pendencia) => !pendencia.jaEnviada && agora <= fimDoPrazo(pendencia.dia, pendencia.horaFim, prazoHoras));
  const pendenciaSugerida = pendenciasNaoEnviadas[0] || null;
  const itensParaJustificar = montarItensParaJustificar({ atrasos: pendenciasAtraso, esquecimentos, funcionario: funcionarioAtual, padroes: padroesHorario, justificativas, prazoHoras, agora });
  const itensNaoEnviados = itensParaJustificar.filter((item) => !item.jaEnviada && !item.prazoEncerrado);
  // Justificativas que o admin recusou ou marcou como inválida também
  // disputam o preenchimento automático, com prioridade sobre atrasos ainda
  // nem enviados (o admin já deu um retorno, então isso é mais urgente).
  const pendenciasRefazer = useMemo(() => justificativas
    .filter((item) => item.funcionarioId === idFuncionarioAtual && (item.status === 'Recusada' || item.status === 'Inválida'))
    .sort((a, b) => new Date(a.atualizadoEm || a.criadoEm) - new Date(b.atualizadoEm || b.criadoEm)), [justificativas, idFuncionarioAtual]);
  // Mas só "Recusada" entra no número vermelho da aba — "Inválida" ainda é só
  // um ajuste solicitado pelo admin, não uma rejeição definitiva.
  const pendenciasRefazerNoContador = pendenciasRefazer.filter((item) => item.status === 'Recusada').length;

  const cartaoRegistrar = (
    <Card style={{ padding: 22, textAlign: 'center' }}>
      <h2 style={{ margin: 0, textAlign: 'left', fontSize: 16 }}>Registrar Ponto</h2><p style={{ margin: '4px 0 22px', textAlign: 'left', fontSize: 12, color: '#7183a3', fontWeight: 600 }}>Faça seu registro de ponto</p>
      <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.04em', color: '#14264b' }}>{hora(agora)}</div>
      <p style={{ margin: '7px 0 22px', textTransform: 'capitalize', color: '#7183a3', fontSize: 12, fontWeight: 700 }}>{tituloData}</p>
      <div style={{ textAlign: 'left', padding: 14, border: '1px solid #d8e6fc', borderRadius: 10, background: '#f6faff', marginBottom: 16 }}>
        <div style={{ color: '#7183a3', fontSize: 11, fontWeight: 800 }}>{expectativasHoje.length ? 'PRÓXIMO REGISTRO ESPERADO' : 'PRÓXIMO REGISTRO'}</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#243755' }}><LogIn size={17} color={proximoEsperado[0] === 'Entrada' ? '#38bc7b' : '#ef5350'} style={proximoEsperado[0] === 'Entrada' ? undefined : { transform: 'rotate(180deg)' }} />{proximoEsperado[0]} <span style={{ marginLeft: 'auto', color: '#1767e8' }}>{expectativasHoje.length ? proximoEsperado[1] : (funcionarioEhHorista ? 'Horista' : 'Sem horário')}</span></div>
      </div>
      {naoRegistraPonto
        ? <p style={{ margin: 0, padding: 12, borderRadius: 9, background: '#fff8ee', color: '#b9770e', fontSize: 12, fontWeight: 700 }}>Seu usuário não está marcado para registrar ponto. Peça à administração para ligar "Registra ponto" em Configurações → Usuários.</p>
        : <button type="button" onClick={registrarPonto} style={{ width: '100%', border: 0, borderRadius: 9, background: '#1767e8', color: '#fff', padding: '13px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 14px #1767e833' }}>Confirmar {proximoEhEntrada ? 'entrada' : 'saída'}</button>}
      {registrosHoje.length > 0 && <button type="button" onClick={() => { setDiaModal(hoje); setModalRegistros(true); }} style={{ margin: '14px 0 0', color: '#1767e8', background: 'none', border: 0, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Ver registros de hoje ({registrosHoje.length})</button>}
    </Card>
  );
  const badgeJustificativas = itensNaoEnviados.length + pendenciasRefazerNoContador;
  const modais = <>
    {modalRegistros && <ModalRegistros registros={registrosDoModal} statusRegistro={statusRegistroDoModal} horarioEsperado={horarioEsperado} ajustes={ajustes} onClose={() => { setModalRegistros(false); setDiaModal(null); }} />}
    {confirmacao && <ConfirmacaoPonto {...confirmacao} onClose={() => setConfirmacao(null)} />}
    {erroPonto && <div style={{ position: 'fixed', bottom: ehCelular ? 84 : 22, left: '50%', transform: 'translateX(-50%)', zIndex: 120, width: ehCelular ? 'calc(100% - 32px)' : undefined, padding: '12px 18px', borderRadius: 10, background: '#c23b34', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 14px 30px rgba(15,35,70,.25)' }}>{erroPonto}</div>}
  </>;

  // Celular: só registrar ponto e justificativas, com uma barra de dois
  // botões no rodapé. Calendário e banco de horas ficam para a tela grande.
  if (ehCelular) {
    const abaCelular = aba === 'justificativas' ? 'justificativas' : 'ponto';
    const botaoAba = (ativo) => ({ flex: 1, display: 'grid', placeItems: 'center', gap: 3, padding: '8px 0 6px', border: 0, background: 'transparent', color: ativo ? '#1767e8' : '#7183a3', fontSize: 10.5, fontWeight: 800, cursor: 'pointer', position: 'relative' });
    return (
      <main style={{ height: '100%', overflowY: 'auto', background: '#f8fafc', color: '#13254a', paddingBottom: 76, boxSizing: 'border-box' }}>
        <div style={{ padding: '14px 14px 8px', display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 9, background: '#eaf2ff', color: '#1767e8' }}><Clock3 size={16} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.02em' }}>SIS Ponto</div>
              <div style={{ color: '#7183a3', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.nome}</div>
            </div>
            {onSair && <button type="button" onClick={onSair} aria-label="Sair" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #e2ebf8', borderRadius: 8, padding: '6px 9px', background: '#fff', color: '#52637f', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}><LogOut size={14} />Sair</button>}
          </div>
          <IndicadorSincronizacao sync={sync} />
        </div>
        <div style={{ padding: '4px 14px 14px' }}>
          {abaCelular === 'ponto'
            ? cartaoRegistrar
            : <SisPontoJustificativaForm compacto funcionarioId={funcionarioAtual?.id || usuarioLogado} nome={funcionarioAtual?.nome || usuarioLogado} setor={usuarioLogado} justificativas={justificativas} onAtualizado={carregarJustificativas} pendenciaSugerida={pendenciaSugerida} pendenciaRefazerSugerida={pendenciasRefazer[0] || null} pendenciasRefazer={pendenciasRefazer} itensPendentes={itensParaJustificar} prazoHoras={prazoHoras} />}
        </div>
        <nav aria-label="Seções do ponto" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 90, display: 'flex', background: '#fff', borderTop: '1px solid #e2ebf8', boxShadow: '0 -6px 18px rgba(15,35,70,.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <button type="button" onClick={() => setAba('calendario')} aria-current={abaCelular === 'ponto' ? 'page' : undefined} style={botaoAba(abaCelular === 'ponto')}>
            <Clock3 size={18} />Ponto
          </button>
          <button type="button" onClick={() => setAba('justificativas')} aria-current={abaCelular === 'justificativas' ? 'page' : undefined} style={botaoAba(abaCelular === 'justificativas')}>
            <FileText size={18} />Justificativas
            {badgeJustificativas > 0 && <span style={{ position: 'absolute', top: 4, left: 'calc(50% + 6px)', minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99, background: '#e5484d', color: '#fff', fontSize: 9.5, fontWeight: 900, display: 'grid', placeItems: 'center' }}>{badgeJustificativas > 9 ? '9+' : badgeJustificativas}</span>}
          </button>
        </nav>
        {modais}
      </main>
    );
  }

  return (
    <main style={{ height: '100%', overflow: 'auto', background: '#f8fafc', color: '#13254a' }}>
      <div className="ponto-page" style={{ padding: '28px 30px 36px', maxWidth: 1600, margin: '0 auto' }}>
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: '#eaf2ff', color: '#1767e8' }}><Clock3 size={19} /></span>
            <div><h1 style={{ margin: 0, fontSize: 23, letterSpacing: '-.03em' }}>SIS Ponto</h1><p style={{ margin: '3px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Visualize e registre seus horários de trabalho</p></div>
          </div>
        </motion.header>

        <div className="ponto-shell">
          <aside className="ponto-menu" style={{ alignSelf: 'start', padding: 8, borderRadius: 14, background: '#fff', border: '1px solid #e7edf6' }}>
            <p style={{ margin: '8px 10px 12px', color: '#8a99b1', fontSize: 10, fontWeight: 800, letterSpacing: '.09em' }}>SIS PONTO · {usuarioLogado}</p>
            <div style={{ padding: '0 6px 12px', display: 'grid', gap: 7 }}>
              <span style={{ color: '#7183a3', fontSize: 10, fontWeight: 800 }}>Funcionário</span>
              <span style={{ padding: '9px 7px', border: '1px solid #e2ebf8', borderRadius: 8, background: '#f8fbff', color: '#405371', fontSize: 11, fontWeight: 800 }}>{usuario.nome}</span>
              <IndicadorSincronizacao sync={sync} />
            </div>
            <MenuPonto ativo={aba === 'calendario'} onClick={() => setAba('calendario')} icon={<CalendarDays size={17} />} texto="Calendário" />
            <MenuPonto ativo={aba === 'justificativas'} onClick={() => setAba('justificativas')} icon={<FileText size={17} />} texto="Justificativas" badge={badgeJustificativas} />
            <MenuPonto ativo={aba === 'banco'} onClick={() => setAba('banco')} icon={<Hourglass size={17} />} texto="Banco de horas" />
            
          </aside>
          {aba === 'calendario' ? <div className="ponto-grid">
          <div className="ponto-calendario-mobile-hide">
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #e7edf6', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => navegar(-1)} aria-label="Mês anterior" style={navButton}><ChevronLeft size={18} /></button>
                <button type="button" onClick={irParaHoje} style={{ ...navButton, width: 'auto', padding: '0 14px', fontWeight: 700 }}>Hoje</button>
                <button type="button" onClick={() => navegar(1)} aria-label="Próximo mês" style={navButton}><ChevronRight size={18} /></button>
              </div>
              <div style={{ position: 'relative' }}>
                <motion.button type="button" whileTap={{ scale: .97 }} onClick={() => setMesesAberto((aberto) => !aberto)} style={{ display: 'flex', alignItems: 'center', gap: 7, border: 0, background: 'transparent', color: '#13254a', fontSize: 19, fontWeight: 800, cursor: 'pointer' }}>{meses[mes.getMonth()]} {mes.getFullYear()}<motion.span animate={{ rotate: mesesAberto ? 180 : 0 }}><ChevronDown size={17} /></motion.span></motion.button>
                <AnimatePresence>
                  {mesesAberto && <motion.div initial={{ opacity: 0, y: -8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .97 }} transition={{ duration: .18 }} style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20, width: 210, maxHeight: 290, overflowY: 'auto', padding: 6, background: '#fff', border: '1px solid #dbe6f5', borderRadius: 12, boxShadow: '0 14px 30px rgba(15,35,70,.18)' }}>
                    {meses.map((nome, indice) => <motion.button key={nome} type="button" whileHover={{ x: 3 }} onClick={() => { setMes(new Date(mes.getFullYear(), indice, 1)); setMesesAberto(false); }} style={{ width: '100%', display: 'flex', padding: '10px 12px', border: 0, borderRadius: 8, background: indice === mes.getMonth() ? '#eaf2ff' : 'transparent', color: indice === mes.getMonth() ? '#1767e8' : '#41536f', cursor: 'pointer', fontSize: 13, fontWeight: 700, textAlign: 'left' }}>{nome} {mes.getFullYear()}</motion.button>)}
                  </motion.div>}
                </AnimatePresence>
              </div>
              <span style={{ color: '#1767e8', background: '#eef5ff', padding: '9px 13px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>Mês</span>
            </div>
            <div className="ponto-cal" style={{ borderBottom: '1px solid #e7edf6', background: '#fbfdff' }}>
              {diasSemana.map((dia) => <div key={dia} style={{ padding: '13px 8px', textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#52637f' }}>{dia}</div>)}
            </div>
            <div className="ponto-cal">
              {diasCalendario.map(({ data: dia, pertenceAoMes }) => {
                const chave = chaveData(dia); const itens = registros[chave] || []; const ehHoje = chave === hoje; const horariosDia = expectativasDoFuncionario(funcionarioAtual, padroesHorario, dia) || []; const statusItens = itens.map((registro, indice) => statusRegistro(registro, indice, itens, chave)); const { temAtraso, temJustificado, temJustificadoPendente, horariosPreenchidos } = statusCalendarioDoDia(itens, statusItens, horariosDia, justificativas, funcionarioAtual?.id, chave);
                return <motion.div key={chave} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .2 }} whileHover={{ backgroundColor: '#f8fbff' }} className="ponto-dia" style={{ background: pertenceAoMes ? '#fff' : '#f4f7fb', boxShadow: ehHoje ? 'inset 0 0 0 2px #3682ff' : 'none', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: ehHoje ? 800 : 700, color: ehHoje ? '#1767e8' : pertenceAoMes ? '#344766' : '#a7b4c9' }}><span style={ehHoje ? { display: 'grid', placeItems: 'center', width: 23, height: 23, borderRadius: '50%', background: '#1767e8', color: '#fff' } : {}}>{dia.getDate()}</span>{itens.length > 0 && <span title={temAtraso ? 'Há registro em atraso' : temJustificado ? 'Atraso justificado' : 'Registros no horário'} style={{ width: 8, height: 8, borderRadius: '50%', background: temAtraso ? '#ffb24a' : temJustificadoPendente ? '#f2c14e' : temJustificado ? '#4b83f5' : itens.length % 2 ? '#ffad42' : '#38bc7b' }} />}{itens.length === 0 && temJustificado && <span title="Justificado" style={{ width: 8, height: 8, borderRadius: '50%', background: temJustificadoPendente ? '#f2c14e' : '#4b83f5' }} />}</div>
                  {(itens.length > 0 || horariosPreenchidos.some(Boolean)) && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '5px 8px', marginTop: 9 }}>
                    {itens.slice(0, 4).map((item, index) => { const tipo = horariosDia.length ? horariosDia[index % horariosDia.length][0] : (index % 2 === 0 ? 'Entrada' : 'Saída'); const entrada = tipo === 'Entrada'; const statusItem = statusItens[index]; const ajuste = ajustes.get(item); return <span key={item} title={ajuste ? `${tipo} ${hora(new Date(item))} · ajuste do ENG${ajuste.por ? ` (${ajuste.por})` : ''}: ${ajuste.motivo || ''}` : `${tipo} ${hora(new Date(item))}`} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: 11, fontWeight: 800, fontStyle: ajuste ? 'italic' : undefined, color: ajuste ? '#7c3aed' : statusItem === 'Normal' ? '#425574' : statusItem === 'Justificado' ? '#2f5bd6' : '#d97706' }}><LogIn size={12} style={entrada ? undefined : { transform: 'rotate(180deg)' }} /><span>{hora(new Date(item)).slice(0, 5)}{ajuste ? '*' : ''}</span></span>; })}
                    {horariosPreenchidos.map((horarioJustificado, index) => { if (!horarioJustificado || index < itens.length) return null; const tipo = horariosDia.length ? horariosDia[index % horariosDia.length][0] : (index % 2 === 0 ? 'Entrada' : 'Saída'); const entrada = tipo === 'Entrada'; return <span key={`justificado-${chave}-${index}`} title={`${tipo} ${horarioJustificado} · preenchido pela justificativa aprovada`} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: 11, fontWeight: 800, fontStyle: 'italic', color: '#2f5bd6' }}><LogIn size={12} style={entrada ? undefined : { transform: 'rotate(180deg)' }} /><span>{horarioJustificado}</span></span>; })}
                  </div>}
                  {itens.length > 4 && <button type="button" onClick={() => { setDiaModal(chave); setModalRegistros(true); }} style={{ marginTop: 6, padding: 0, border: 0, background: 'transparent', color: '#1767e8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+{itens.length - 4} registros</button>}
                  {feriados.get(chave) && <div title="Feriado" style={{ marginTop: 5, color: '#8e9bb0', fontSize: 10, fontWeight: 800 }}>{feriados.get(chave)}</div>}
                  {pertenceAoMes && diaSemRegistro({ chave, hoje, itens, horariosDia, feriado: feriados.get(chave), temJustificado, pontoDesde: funcionarioAtual?.pontoDesde }) && <div title="Dia de trabalho sem nenhum registro: desconta do banco de horas" style={{ marginTop: 5, color: '#e5484d', fontSize: 10, fontWeight: 800 }}>Falta</div>}
                  {temAtraso && <div style={{ marginTop: 5, color: '#d97706', fontSize: 10, fontWeight: 800 }}>Atrasado/Saída Antecipada</div>}
                  {!temAtraso && temJustificado && <div style={{ marginTop: 5, color: temJustificadoPendente ? '#b9770e' : '#2f5bd6', fontSize: 10, fontWeight: 800 }}>Justificado</div>}
                </motion.div>;
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, padding: '15px 18px', fontSize: 12, color: '#52637f', fontWeight: 700 }}>
              <Legenda cor="#38bc7b" texto="Normal" /><Legenda cor="#ffb24a" texto="Atrasado/Saída Antecipada" /><Legenda cor="#ff5d66" texto="Falta" /><Legenda cor="#4b83f5" texto="Justificado" /><Legenda cor="#a855f7" texto="Atestado" /><Legenda cor="#8e9bb0" texto="Feriado" /><Legenda cor="#b4bdca" texto="Folga" />
            </div>
          </Card>
          </div>

          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            {cartaoRegistrar}
            <Card style={{ padding: 22 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Resumo do mês</h2><p style={{ margin: '4px 0 18px', fontSize: 12, color: '#7183a3', fontWeight: 600 }}>Seus registros em {meses[mes.getMonth()].toLowerCase()}</p>
              <Resumo icon={<CalendarDays size={16} />} cor="#38bc7b" label="Dias trabalhados" valor={diasTrabalhados} />
              <Resumo icon={<CircleAlert size={16} />} cor="#ffb24a" label="Atrasado/Saída Antecipada" valor={atrasosNoMes} />
              <Resumo icon={<CircleAlert size={16} />} cor="#ff5d66" label="Faltas" valor="0" />
              <Resumo icon={<FileText size={16} />} cor="#4b83f5" label="Justificadas" valor={justificadasNoMes} />
              <Resumo icon={<CalendarDays size={16} />} cor="#a855f7" label="Atestados" valor="0" />
              <Resumo icon={<TimerReset size={16} />} cor="#1767e8" label="Registros realizados" valor={totalRegistros} />
            </Card>
          </div>
          </div> : aba === 'justificativas' ? <SisPontoJustificativaForm funcionarioId={funcionarioAtual?.id || usuarioLogado} nome={funcionarioAtual?.nome || usuarioLogado} setor={usuarioLogado} justificativas={justificativas} onAtualizado={carregarJustificativas} pendenciaSugerida={pendenciaSugerida} pendenciaRefazerSugerida={pendenciasRefazer[0] || null} pendenciasRefazer={pendenciasRefazer} itensPendentes={itensParaJustificar} prazoHoras={prazoHoras} /> : <BancoHoras itens={[{ id: idFuncionarioAtual, nome: funcionarioAtual?.nome, setor: usuarioLogado, banco: bancoDoMes }]} rotulo={`${meses[mes.getMonth()]} ${mes.getFullYear()}`} />}
        </div>
      </div>
      {modais}
    </main>
  );
}

const formularioJustificativaVazio = { dia: chaveData(new Date()), horaInicio: '08:00', horaFim: '12:00', tipo: '', motivo: '' };

function lerArquivoComoDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

// compacto (celular): formulário mais enxuto e sem a aba "Minhas" — o que o
// ENG devolveu (recusada/inválida) aparece em "Pendentes" para refazer.
// itensPendentes: o que ainda dá para justificar (montarItensParaJustificar).
// Dá para justificar um item só ou marcar vários e enviar de uma vez com o
// mesmo motivo — vira uma justificativa por item, e o ENG decide cada uma.
function SisPontoJustificativaForm({ funcionarioId, nome, setor, justificativas, onAtualizado, pendenciaSugerida, pendenciaRefazerSugerida, compacto = false, itensPendentes = [], pendenciasRefazer = [], prazoHoras = 48 }) {
  const [secao, setSecao] = useState('pendentes');
  const [selecionados, setSelecionados] = useState(() => new Set());
  // lote = itens marcados sendo justificados juntos (null = formulário de um dia só).
  const [lote, setLote] = useState(null);
  const [form, setForm] = useState(formularioJustificativaVazio);
  const [anexo, setAnexo] = useState(null);
  const [anexoExistente, setAnexoExistente] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState(null);
  const inputArquivoRef = useRef(null);
  // Preenche o formulário sozinho com o que precisa de ação, em ordem de
  // prioridade: 1) uma justificativa que o admin recusou ou marcou como
  // inválida (o admin já deu um retorno, é mais urgente) — entra direto no
  // modo "Refazer", igual ao botão manual da lista; 2) senão, a pendência de
  // atraso/saída antecipada mais antiga ainda nem enviada. Guarda a última
  // sugestão já aplicada (não um "só uma vez"): assim que o funcionário
  // resolve uma, a próxima entra no lugar automaticamente, sem precisar sair
  // e voltar na aba. Só não mexe enquanto a sugestão não muda (pra não
  // sobrescrever o que o funcionário está digitando) nem durante uma edição
  // já em andamento.
  const ultimaSugestaoAplicadaRef = useRef(null);
  useEffect(() => {
    if (editandoId || lote) return;
    if (pendenciaRefazerSugerida) {
      const chave = `refazer-${pendenciaRefazerSugerida.id}`;
      if (ultimaSugestaoAplicadaRef.current === chave) return;
      ultimaSugestaoAplicadaRef.current = chave;
      setEditandoId(pendenciaRefazerSugerida.id);
      setForm({ dia: pendenciaRefazerSugerida.dia, horaInicio: pendenciaRefazerSugerida.horaInicio, horaFim: pendenciaRefazerSugerida.horaFim, tipo: pendenciaRefazerSugerida.tipo || '', motivo: pendenciaRefazerSugerida.motivo });
      setAnexo(null);
      setAnexoExistente(pendenciaRefazerSugerida.anexoNome ? { nome: pendenciaRefazerSugerida.anexoNome, dataUrl: pendenciaRefazerSugerida.anexoDataUrl } : null);
      return;
    }
    if (!pendenciaSugerida) return;
    const chave = `atraso-${pendenciaSugerida.dia}|${pendenciaSugerida.horaInicio}|${pendenciaSugerida.horaFim}`;
    if (ultimaSugestaoAplicadaRef.current === chave) return;
    ultimaSugestaoAplicadaRef.current = chave;
    setForm({ dia: pendenciaSugerida.dia, horaInicio: pendenciaSugerida.horaInicio, horaFim: pendenciaSugerida.horaFim, tipo: '', motivo: '' });
  }, [pendenciaSugerida, pendenciaRefazerSugerida, editandoId, lote]);

  const minhasJustificativas = useMemo(() => justificativas
    .filter((item) => item.funcionarioId === funcionarioId)
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)), [justificativas, funcionarioId]);
  const justificativaEmEdicao = editandoId ? minhasJustificativas.find((item) => item.id === editandoId) : null;

  const handleArquivo = (event) => {
    const arquivo = (event.target.files || [])[0];
    event.target.value = '';
    if (!arquivo) return;
    if (!['image/jpeg', 'image/png'].includes(arquivo.type)) {
      setMensagem({ tipo: 'erro', texto: 'O documento precisa ser uma imagem JPG ou PNG.' });
      window.setTimeout(() => setMensagem(null), 2600);
      return;
    }
    setAnexo(arquivo);
  };

  const itensAbertos = itensPendentes.filter((item) => !item.jaEnviada && !item.prazoEncerrado);
  const itensVisiveis = itensPendentes.filter((item) => !item.prazoEncerrado);
  const encerrados = itensPendentes.filter((item) => !item.jaEnviada && item.prazoEncerrado).length;
  const formatarPrazo = (data) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(data);
  const alternarSelecao = (chave) => setSelecionados((atual) => {
    const proximo = new Set(atual);
    if (proximo.has(chave)) proximo.delete(chave); else proximo.add(chave);
    return proximo;
  });
  const justificarUm = (item) => {
    setLote(null);
    setEditandoId(null);
    setAnexo(null);
    setAnexoExistente(null);
    setForm({ dia: item.dia, horaInicio: item.horaInicio, horaFim: item.horaFim, tipo: item.sugestaoTipo || '', motivo: '' });
    setSecao('nova');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const justificarSelecionados = () => {
    const escolhidos = itensAbertos.filter((item) => selecionados.has(item.chave));
    if (!escolhidos.length) return;
    const tipos = new Set(escolhidos.map((item) => item.sugestaoTipo));
    setEditandoId(null);
    setLote(escolhidos);
    setForm((atual) => ({ ...atual, tipo: tipos.size === 1 ? [...tipos][0] : '', motivo: '' }));
    setSecao('nova');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setLote(null);
    setEditandoId(null);
    setForm(formularioJustificativaVazio);
    setAnexo(null);
    setAnexoExistente(null);
  };

  const refazer = (justificativa) => {
    setSecao('nova');
    setEditandoId(justificativa.id);
    setForm({ dia: justificativa.dia, horaInicio: justificativa.horaInicio, horaFim: justificativa.horaFim, tipo: justificativa.tipo || '', motivo: justificativa.motivo });
    setAnexo(null);
    setAnexoExistente(justificativa.anexoNome ? { nome: justificativa.anexoNome, dataUrl: justificativa.anexoDataUrl } : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const excluir = (justificativa) => setConfirmacaoExclusao({
    titulo: 'Excluir justificativa',
    mensagem: 'Deseja realmente excluir esta justificativa?',
    destrutivo: true,
    confirmar: async () => {
      setConfirmacaoExclusao(null);
      try {
        await api.deleteSispontoJustificativa(justificativa.id);
        if (editandoId === justificativa.id) cancelarEdicao();
        onAtualizado();
      } catch (erro) {
        setMensagem({ tipo: 'erro', texto: erro.message || 'Erro ao excluir justificativa.' });
        window.setTimeout(() => setMensagem(null), 2600);
      }
    },
  });
  const enviarLote = async () => {
    if (!form.tipo) { setMensagem({ tipo: 'erro', texto: 'Escolha o motivo.' }); window.setTimeout(() => setMensagem(null), 2600); return; }
    if (form.tipo === 'outro' && !form.motivo.trim()) { setMensagem({ tipo: 'erro', texto: 'Escreva a descrição quando escolher "Outro".' }); window.setTimeout(() => setMensagem(null), 2600); return; }
    setEnviando(true);
    let enviadas = 0;
    const falhas = [];
    try {
      // O mesmo anexo (ex.: um atestado de vários dias) vai em todas.
      const anexoDataUrl = anexo ? await lerArquivoComoDataUrl(anexo) : null;
      for (const item of lote) {
        try {
          await api.createSispontoJustificativa({
            funcionarioId, nome, setor, dia: item.dia, horaInicio: item.horaInicio, horaFim: item.horaFim,
            tipo: form.tipo, motivo: form.motivo.trim(), anexoNome: anexo?.name || null, anexoTipo: anexo?.type || null, anexoDataUrl,
          });
          enviadas += 1;
        } catch (erro) {
          falhas.push(`${item.dia}: ${erro.message}`);
        }
      }
    } finally {
      setEnviando(false);
    }
    setMensagem(falhas.length
      ? { tipo: 'erro', texto: `${enviadas} enviada(s); ${falhas.length} com erro — ${falhas[0]}` }
      : { tipo: 'sucesso', texto: `${enviadas} justificativa(s) enviada(s) para análise.` });
    window.setTimeout(() => setMensagem(null), 4000);
    setLote(null);
    setSelecionados(new Set());
    setAnexo(null);
    setForm(formularioJustificativaVazio);
    onAtualizado();
  };

  const enviar = async () => {
    if (lote) { await enviarLote(); return; }
    if (!form.dia || !form.horaInicio || !form.horaFim || !form.tipo) {
      setMensagem({ tipo: 'erro', texto: 'Preencha o dia, o período e o motivo.' });
      window.setTimeout(() => setMensagem(null), 2600);
      return;
    }
    if (form.tipo === 'outro' && !form.motivo.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Escreva a descrição quando escolher "Outro".' });
      window.setTimeout(() => setMensagem(null), 2600);
      return;
    }
    if (form.horaFim <= form.horaInicio) {
      setMensagem({ tipo: 'erro', texto: 'O horário final precisa ser depois do inicial.' });
      window.setTimeout(() => setMensagem(null), 2600);
      return;
    }

    setEnviando(true);
    try {
      const anexoDataUrl = anexo ? await lerArquivoComoDataUrl(anexo) : anexoExistente?.dataUrl ?? null;
      const anexoNome = anexo ? anexo.name : anexoExistente?.nome ?? null;
      const payload = {
        funcionarioId,
        nome,
        setor,
        dia: form.dia,
        horaInicio: form.horaInicio,
        horaFim: form.horaFim,
        tipo: form.tipo,
        motivo: form.motivo.trim(),
        anexoNome,
        anexoTipo: anexo?.type || null,
        anexoDataUrl,
      };

      if (editandoId) {
        await api.updateSispontoJustificativa(editandoId, { ...payload, status: 'Em análise' });
        setMensagem({ tipo: 'sucesso', texto: 'Justificativa reenviada para análise.' });
      } else {
        await api.createSispontoJustificativa(payload);
        setMensagem({ tipo: 'sucesso', texto: 'Justificativa enviada para análise.' });
      }
      cancelarEdicao();
      onAtualizado();
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro.message || 'Erro ao enviar justificativa.' });
    } finally {
      setEnviando(false);
      window.setTimeout(() => setMensagem(null), 2600);
    }
  };

  // Pendentes / Nova / Minhas: uma seção de cada vez ("Minhas" só no computador).
  const mostrarForm = secao === 'nova';
  const mostrarPendentes = secao === 'pendentes' || (compacto && secao === 'minhas');
  const mostrarLista = secao === 'minhas' && !compacto;
  const rotulo = { display: 'grid', gap: 5, minWidth: 0, fontSize: 11, fontWeight: 800, color: '#7183a3' };
  const campo = { height: 40, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 10px', fontSize: 13, fontWeight: 700, color: '#405371', minWidth: 0, width: '100%', boxSizing: 'border-box', background: '#fff', maxWidth: '100%' };
  // iOS dá largura mínima própria a date/time e estoura a tela; sem a aparência nativa ele obedece o width.
  const campoData = { ...campo, WebkitAppearance: 'none', appearance: 'none', display: 'flex', alignItems: 'center' };
  const abaSecao = (ativa) => ({ flex: 1, border: 0, borderRadius: 8, padding: '9px 6px', background: ativa ? '#fff' : 'transparent', color: ativa ? '#1767e8' : '#5b6d89', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: ativa ? '0 1px 4px rgba(15,35,70,.12)' : 'none' });

  return (
    <div style={{ display: 'grid', gap: compacto ? 12 : 16 }}>
      <div role="tablist" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: '#eaf0f8', maxWidth: compacto ? undefined : 560 }}>
        <button type="button" role="tab" aria-selected={secao === 'pendentes'} onClick={() => setSecao('pendentes')} style={abaSecao(secao === 'pendentes')}>Pendentes ({itensAbertos.length})</button>
        <button type="button" role="tab" aria-selected={secao === 'nova'} onClick={() => setSecao('nova')} style={abaSecao(secao === 'nova')}>{editandoId ? 'Refazer' : lote ? `Justificar (${lote.length})` : 'Nova'}</button>
        {!compacto && <button type="button" role="tab" aria-selected={secao === 'minhas'} onClick={() => setSecao('minhas')} style={abaSecao(secao === 'minhas')}>Minhas ({minhasJustificativas.length})</button>}
      </div>
      {mostrarPendentes && <Card style={{ padding: compacto ? 14 : 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16 }}>Pendentes de justificativa</h2>
            {!compacto && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7183a3', fontWeight: 600 }}>Justifique um de cada vez ou marque vários e envie juntos com o mesmo motivo.</p>}
          </div>
          {itensAbertos.length > 1 && <button type="button" onClick={() => setSelecionados(selecionados.size === itensAbertos.length ? new Set() : new Set(itensAbertos.map((item) => item.chave)))} style={{ border: 0, background: 'none', color: '#1767e8', fontSize: 12, fontWeight: 800, cursor: 'pointer', padding: 0 }}>{selecionados.size === itensAbertos.length ? 'Desmarcar todos' : 'Marcar todos'}</button>}
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#7183a3', fontWeight: 700 }}>Prazo para justificar: {prazoHoras} h depois do horário.</p>
        {!itensVisiveis.length && !(compacto && pendenciasRefazer.length) && <p style={{ margin: '12px 0 0', color: '#2b8761', fontSize: 13, fontWeight: 700 }}>Nenhum ponto pendente de justificativa.</p>}
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {compacto && pendenciasRefazer.map((justificativa) => (
            <div key={justificativa.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: '1px solid #ffc4bd', background: '#fff4f3' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: '#1d3156' }}>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${justificativa.dia}T12:00:00`))} · {justificativa.horaInicio}–{justificativa.horaFim}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c23b34' }}>{justificativa.status === 'Recusada' ? 'Justificativa recusada' : 'Justificativa inválida'} — refaça</div>
              </div>
              <button type="button" onClick={() => refazer(justificativa)} style={{ border: 0, borderRadius: 8, padding: '7px 10px', background: '#c2650a', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Refazer</button>
            </div>
          ))}
          {itensVisiveis.map((item) => (
            <div key={item.chave} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: compacto ? '9px 10px' : '10px 12px', borderRadius: 10, border: '1px solid #e2ebf8', background: item.jaEnviada ? '#f6f8fb' : '#fff', opacity: item.jaEnviada ? .7 : 1 }}>
              {!item.jaEnviada && <input type="checkbox" checked={selecionados.has(item.chave)} onChange={() => alternarSelecao(item.chave)} aria-label={`Selecionar ${item.descricao}`} style={{ width: 18, height: 18, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: '#1d3156' }}>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${item.dia}T12:00:00`))}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.categoria === 'atraso' ? '#d97706' : '#be3747' }}>{item.descricao}</div>
                {item.marcadoFalta && <div style={{ fontSize: 11, fontWeight: 800, color: '#be3747' }}>O ENG marcou como falta</div>}
                {item.jaEnviada
                  ? <div style={{ fontSize: 11, fontWeight: 800, color: '#2f5bd6' }}>Justificativa já enviada</div>
                  : <div style={{ fontSize: 11, fontWeight: 700, color: '#7183a3' }}>Justificar até {formatarPrazo(item.prazoAte)}</div>}
              </div>
              {!item.jaEnviada && <button type="button" onClick={() => justificarUm(item)} style={{ border: '1px solid #d8e6fc', borderRadius: 8, padding: '7px 10px', background: '#f6faff', color: '#1767e8', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>{compacto ? 'Justificar' : 'Justificar só este'}</button>}
            </div>
          ))}
        </div>
        {encerrados > 0 && <p style={{ margin: '10px 0 0', fontSize: 11.5, color: '#8a4a4f', fontWeight: 700 }}>{encerrados} {encerrados === 1 ? 'pendência ficou' : 'pendências ficaram'} sem justificativa no prazo — o ENG decide.</p>}
        {selecionados.size > 0 && <button type="button" onClick={justificarSelecionados} style={{ marginTop: 12, width: compacto ? '100%' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: 0, borderRadius: 9, padding: '11px 16px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}><CheckSquare size={15} /> Justificar selecionados ({selecionados.size})</button>}
        <button type="button" onClick={() => { cancelarEdicao(); setSecao('nova'); }} style={{ marginTop: 10, marginLeft: compacto || selecionados.size === 0 ? 0 : 8, width: compacto ? '100%' : undefined, border: '1px solid #d8e4f3', borderRadius: 9, padding: '10px 14px', background: '#fff', color: '#52637f', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Nova justificativa avulsa</button>
      </Card>}

      {mostrarForm && <Card style={{ padding: compacto ? 16 : 26, minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        <h2 style={{ margin: 0, fontSize: compacto ? 16 : 20 }}>{editandoId ? 'Refazer justificativa' : lote ? `Justificar ${lote.length} pendência(s)` : 'Nova justificativa'}</h2>
        {!compacto && <p style={{ margin: '6px 0 20px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Descreva uma ausência, atraso ou saída antecipada e, se tiver, anexe um documento.</p>}
        {compacto && <div style={{ height: 12 }} />}
        {justificativaEmEdicao && (justificativaEmEdicao.status === 'Recusada' || justificativaEmEdicao.status === 'Inválida') && (
          <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#fff4f3', color: '#c23b34' }}>
            {justificativaEmEdicao.status === 'Recusada'
              ? 'Essa justificativa foi recusada.'
              : 'Essa justificativa foi marcada como inválida.'} Ajuste os dados abaixo e reenvie para uma nova análise.
          </div>
        )}
        {!editandoId && pendenciaSugerida && form.dia === pendenciaSugerida.dia && form.horaInicio === pendenciaSugerida.horaInicio && (
          <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#fff8ee', color: '#b9770e' }}>
            Preenchemos abaixo o período em que você não bateu o ponto em {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${pendenciaSugerida.dia}T12:00:00`))} — confira e ajuste se precisar.
          </div>
        )}

        {lote ? (
          <div style={{ display: 'grid', gap: 6, padding: 10, borderRadius: 10, background: '#f6faff', border: '1px solid #e2ebf8' }}>
            {lote.map((item) => <div key={item.chave} style={{ fontSize: 12, fontWeight: 700, color: '#405371' }}><b>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${item.dia}T12:00:00`))}</b> · {item.horaInicio}–{item.horaFim} · {item.descricao}</div>)}
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7183a3' }}>Uma justificativa para cada item, com o motivo e o anexo abaixo.</span>
          </div>
        ) : <div style={{ display: 'grid', gridTemplateColumns: compacto ? '1fr 1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: compacto ? 10 : 12 }}>
          <label style={{ ...rotulo, gridColumn: compacto ? '1 / -1' : undefined }}>Dia a justificar
            <input type="date" value={form.dia} onChange={(event) => setForm((atual) => ({ ...atual, dia: event.target.value }))} style={campoData} />
          </label>
          <label style={rotulo}>{compacto ? 'Das' : 'Do horário'}
            <input type="time" value={form.horaInicio} onChange={(event) => setForm((atual) => ({ ...atual, horaInicio: event.target.value }))} style={campoData} />
          </label>
          <label style={rotulo}>{compacto ? 'Até' : 'Até o horário'}
            <input type="time" value={form.horaFim} onChange={(event) => setForm((atual) => ({ ...atual, horaFim: event.target.value }))} style={campoData} />
          </label>
        </div>}

        <label style={{ display: 'grid', gap: 5, marginTop: 12, minWidth: 0, fontSize: 11, fontWeight: 800, color: '#7183a3' }}>Motivo
          <select value={form.tipo} onChange={(event) => setForm((atual) => ({ ...atual, tipo: event.target.value }))} style={{ ...campo, color: form.tipo ? '#405371' : '#8a99b1', textOverflow: 'ellipsis' }}>
            <option value="">Selecione o motivo...</option>
            {JUSTIFICATIVA_TIPOS.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 5, marginTop: 12, minWidth: 0, fontSize: 11, fontWeight: 800, color: '#7183a3' }}>Descrição
          <textarea value={form.motivo} onChange={(event) => setForm((atual) => ({ ...atual, motivo: event.target.value }))} rows={compacto ? 2 : 3} placeholder="Descreva o motivo da ausência, atraso ou saída antecipada..." style={{ borderRadius: 8, border: '1px solid #d8e6fc', padding: 10, fontSize: 13, fontWeight: 600, color: '#405371', resize: 'vertical', fontFamily: 'inherit', width: '100%', minWidth: 0, boxSizing: 'border-box' }} />
        </label>

        <div style={{ marginTop: 14 }}>
          {!compacto && <span style={{ fontSize: 11, fontWeight: 800, color: '#7183a3' }}>Documento (imagem JPG ou PNG)</span>}
          <input ref={inputArquivoRef} type="file" accept="image/jpeg,image/png" onChange={handleArquivo} style={{ display: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: compacto ? 0 : 6, minWidth: 0 }}>
            <button type="button" onClick={() => inputArquivoRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid #d8e6fc', borderRadius: 8, padding: '9px 13px', background: '#f6faff', color: '#1767e8', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}><ImageIcon size={15} /> Anexar documento</button>
            <span style={{ fontSize: 12, color: '#7183a3', fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anexo ? anexo.name : anexoExistente ? anexoExistente.nome : (compacto ? '' : 'Nenhum arquivo anexado.')}</span>
          </div>
        </div>

        {mensagem && <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: mensagem.tipo === 'erro' ? '#fff4f3' : '#effaf6', color: mensagem.tipo === 'erro' ? '#c23b34' : '#1f9d63' }}>{mensagem.texto}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: compacto ? 14 : 18 }}>
          <button type="button" disabled={enviando} onClick={enviar} style={{ flex: compacto ? 1 : undefined, border: 0, borderRadius: 9, padding: '11px 18px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? .7 : 1 }}>{enviando ? 'Enviando...' : editandoId ? 'Reenviar justificativa' : lote ? `Enviar ${lote.length} justificativa(s)` : 'Enviar justificativa'}</button>
          {(editandoId || lote) && <button type="button" onClick={cancelarEdicao} style={{ border: '1px solid #d8e4f3', borderRadius: 9, padding: '11px 15px', background: '#fff', color: '#52637f', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>}
        </div>
      </Card>}

      {mostrarLista && <Card style={{ padding: compacto ? 14 : 26 }}>
        {!compacto && <h2 style={{ margin: 0, fontSize: 16 }}>Minhas justificativas</h2>}
        {!compacto && <p style={{ margin: '4px 0 16px', fontSize: 12, color: '#7183a3', fontWeight: 600 }}>Acompanhe o status de cada solicitação enviada.</p>}
        {!minhasJustificativas.length ? (
          <div style={{ padding: 24, border: '1px dashed #cbd8eb', borderRadius: 12, textAlign: 'center', color: '#7183a3', fontSize: 13 }}>Você ainda não enviou nenhuma justificativa.</div>
        ) : (
          <div style={{ display: 'grid', gap: compacto ? 8 : 10 }}>
            {minhasJustificativas.map((justificativa) => {
              const cor = JUSTIFICATIVA_CORES[justificativa.status] || JUSTIFICATIVA_CORES['Em análise'];
              return <motion.div key={justificativa.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ border: `1px solid ${cor.borda}`, background: cor.fundo, borderRadius: 12, padding: compacto ? 11 : 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 900, color: '#1d3156', fontSize: 13 }}>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${justificativa.dia}T12:00:00`))} · {justificativa.horaInicio}–{justificativa.horaFim}</span>
                  <span style={{ padding: '4px 10px', borderRadius: 99, background: cor.texto, color: '#fff', fontSize: 10, fontWeight: 900 }}>{justificativa.status}</span>
                </div>
                {rotuloTipoJustificativa(justificativa.tipo) && <p style={{ margin: '8px 0 0', color: '#1d3156', fontSize: 12, fontWeight: 800 }}>{rotuloTipoJustificativa(justificativa.tipo)}</p>}
                {justificativa.motivo && <p style={{ margin: '4px 0 0', color: '#405371', fontSize: 12, fontWeight: 600, ...(compacto ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}) }}>{justificativa.motivo}</p>}
                {justificativa.anexoNome && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, color: '#7183a3', fontSize: 11, fontWeight: 700 }}><FileText size={13} /> {justificativa.anexoNome}</span>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {(justificativa.status === 'Inválida' || justificativa.status === 'Recusada') && <button type="button" onClick={() => refazer(justificativa)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 0, borderRadius: 8, padding: '8px 12px', background: '#c2650a', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}><Pencil size={12} /> Refazer justificativa</button>}
                  <button type="button" onClick={() => excluir(justificativa)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e5cdd0', borderRadius: 8, padding: '8px 12px', background: '#fff', color: '#8a4a4f', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}><Trash2 size={12} /> Excluir</button>
                </div>
              </motion.div>;
            })}
          </div>
        )}
      </Card>}
      {confirmacaoExclusao && <ConfirmacaoPonto {...confirmacaoExclusao} onClose={() => setConfirmacaoExclusao(null)} />}
    </div>
  );
}

// Quantos pontos ainda estão só neste aparelho. Sem rede ou com sessão
// expirada, eles ficam guardados e sobem sozinhos depois.
function IndicadorSincronizacao({ sync }) {
  const { pendentes, online, sincronizando, ultimoErro } = sync;
  if (!pendentes && online && !ultimoErro) return null;
  const cor = pendentes ? '#b9770e' : '#7183a3';
  return (
    <div style={{ display: 'grid', gap: 5, padding: '8px 9px', borderRadius: 8, background: pendentes ? '#fff8ee' : '#f1f4f9', color: cor, fontSize: 11, fontWeight: 700 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {online ? <CloudUpload size={14} /> : <CloudOff size={14} />}
        {online ? (sincronizando ? 'Enviando…' : 'Online') : 'Sem internet'}
        {pendentes > 0 && ` · ${pendentes} ponto${pendentes > 1 ? 's' : ''} pendente${pendentes > 1 ? 's' : ''} de envio`}
      </span>
      {ultimoErro && <span style={{ fontWeight: 600, fontSize: 10, lineHeight: 1.35 }}>{ultimoErro}</span>}
      {online && pendentes > 0 && !sincronizando && (
        <button type="button" onClick={() => sincronizarPendentes()} style={{ border: 0, borderRadius: 6, background: '#fff', color: '#1767e8', padding: '5px 7px', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>Enviar agora</button>
      )}
    </div>
  );
}
