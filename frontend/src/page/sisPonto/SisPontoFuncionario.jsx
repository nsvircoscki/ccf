import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, CloudOff, CloudUpload, FileText, Hourglass, Image as ImageIcon, LogIn, Pencil, TimerReset, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { registrarBatida, pendentesDoFuncionario, inscrever, obterEstado, sincronizarPendentes } from '../../services/pontoOffline.js';
import { meses, diasSemana, JUSTIFICATIVA_CORES, PADROES_HORARIO_PADRAO, JUSTIFICATIVA_TIPOS, rotuloTipoJustificativa } from './sisPontoData.js';
import { chaveData, hora, calcularBancoHoras, extrairRegistrosFuncionario, statusJustificativaSlotsFaltantes, statusCalendarioDoDia, expectativasDoFuncionario, statusRegistroComExpectativa, pendenciasDeJustificativa, ehHorista } from './sisPontoUtils.js';
import { Card, ConfirmacaoPonto, BancoHoras, Legenda, MenuPonto, ModalRegistros, Resumo, navButton } from './SisPontoComponents.jsx';
import './sisPonto.css';

// `usuario` = a pessoa logada ({ id, nome, setor }). Cada pessoa vê e bate só
// o próprio ponto — o servidor também recusa batida para outra pessoa.
export default function SisPontoFuncionarioScreen({ usuario, destino }) {
  const usuarioLogado = usuario?.setor;
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
  const carregarJustificativas = () => api.getSispontoJustificativas()
    .then((lista) => setJustificativas(Array.isArray(lista) ? lista : []))
    .catch(() => setJustificativas([]));
  useEffect(() => { carregarJustificativas(); }, [funcionarioAtual?.id, aba]);
  const carregarPendentes = () => pendentesDoFuncionario(funcionarioAtual?.id || usuarioLogado).then(setPendentesLocais).catch(() => {});
  const carregarRegistros = () => {
    const idAtual = funcionarioAtual?.id || usuarioLogado;
    carregarPendentes();
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
      atrasado = (tipo === 'Entrada' && diferenca >= 5) || (tipo === 'Saída' && diferenca <= -5);
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
  const bancoDoMes = calcularBancoHoras(funcionarioAtual, registros, padroesHorario, justificativas, mes, hoje);
  // Todo atraso/saída antecipada (em qualquer mês, não só o exibido no
  // calendário), do mais antigo pro mais recente. O badge da aba
  // "Justificativas" conta só quem ainda não teve NENHUMA justificativa
  // enviada — some assim que o funcionário envia, sem esperar o admin
  // aprovar. A sugestão de preenchimento automático pega a mais antiga ainda
  // sem envio: se o mesmo dia tiver atraso de manhã e saída antecipada à
  // tarde, a da manhã aparece primeiro e, assim que enviada, a da tarde
  // entra no lugar dela.
  const pendenciasAtraso = useMemo(() => pendenciasDeJustificativa(registros, funcionarioAtual, padroesHorario, justificativas), [registros, funcionarioAtual, padroesHorario, justificativas]);
  const pendenciasNaoEnviadas = pendenciasAtraso.filter((pendencia) => !pendencia.jaEnviada);
  const pendenciaSugerida = pendenciasNaoEnviadas[0] || null;
  // Justificativas que o admin recusou ou marcou como inválida também
  // disputam o preenchimento automático, com prioridade sobre atrasos ainda
  // nem enviados (o admin já deu um retorno, então isso é mais urgente).
  const pendenciasRefazer = useMemo(() => justificativas
    .filter((item) => item.funcionarioId === idFuncionarioAtual && (item.status === 'Recusada' || item.status === 'Inválida'))
    .sort((a, b) => new Date(a.atualizadoEm || a.criadoEm) - new Date(b.atualizadoEm || b.criadoEm)), [justificativas, idFuncionarioAtual]);
  // Mas só "Recusada" entra no número vermelho da aba — "Inválida" ainda é só
  // um ajuste solicitado pelo admin, não uma rejeição definitiva.
  const pendenciasRefazerNoContador = pendenciasRefazer.filter((item) => item.status === 'Recusada').length;

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
            <MenuPonto ativo={aba === 'justificativas'} onClick={() => setAba('justificativas')} icon={<FileText size={17} />} texto="Justificativas" badge={pendenciasNaoEnviadas.length + pendenciasRefazerNoContador} />
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
                    {itens.slice(0, 4).map((item, index) => { const tipo = horariosDia.length ? horariosDia[index % horariosDia.length][0] : (index % 2 === 0 ? 'Entrada' : 'Saída'); const entrada = tipo === 'Entrada'; const statusItem = statusItens[index]; return <span key={item} title={`${tipo} ${hora(new Date(item))}`} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: 11, fontWeight: 800, color: statusItem === 'Normal' ? '#425574' : statusItem === 'Justificado' ? '#2f5bd6' : '#d97706' }}><LogIn size={12} style={entrada ? undefined : { transform: 'rotate(180deg)' }} /><span>{hora(new Date(item)).slice(0, 5)}</span></span>; })}
                    {horariosPreenchidos.map((horarioJustificado, index) => { if (!horarioJustificado || index < itens.length) return null; const tipo = horariosDia.length ? horariosDia[index % horariosDia.length][0] : (index % 2 === 0 ? 'Entrada' : 'Saída'); const entrada = tipo === 'Entrada'; return <span key={`justificado-${chave}-${index}`} title={`${tipo} ${horarioJustificado} · preenchido pela justificativa aprovada`} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: 11, fontWeight: 800, fontStyle: 'italic', color: '#2f5bd6' }}><LogIn size={12} style={entrada ? undefined : { transform: 'rotate(180deg)' }} /><span>{horarioJustificado}</span></span>; })}
                  </div>}
                  {itens.length > 4 && <button type="button" onClick={() => { setDiaModal(chave); setModalRegistros(true); }} style={{ marginTop: 6, padding: 0, border: 0, background: 'transparent', color: '#1767e8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+{itens.length - 4} registros</button>}
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
          </div> : aba === 'justificativas' ? <SisPontoJustificativaForm funcionarioId={funcionarioAtual?.id || usuarioLogado} nome={funcionarioAtual?.nome || usuarioLogado} setor={usuarioLogado} justificativas={justificativas} onAtualizado={carregarJustificativas} pendenciaSugerida={pendenciaSugerida} pendenciaRefazerSugerida={pendenciasRefazer[0] || null} /> : <BancoHoras itens={[{ id: idFuncionarioAtual, nome: funcionarioAtual?.nome, setor: usuarioLogado, banco: bancoDoMes }]} rotulo={`${meses[mes.getMonth()]} ${mes.getFullYear()}`} />}
        </div>
      </div>
      {modalRegistros && <ModalRegistros registros={registrosDoModal} statusRegistro={statusRegistroDoModal} horarioEsperado={horarioEsperado} onClose={() => { setModalRegistros(false); setDiaModal(null); }} />}
      {confirmacao && <ConfirmacaoPonto {...confirmacao} onClose={() => setConfirmacao(null)} />}
      {erroPonto && <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 120, padding: '12px 18px', borderRadius: 10, background: '#c23b34', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 14px 30px rgba(15,35,70,.25)' }}>{erroPonto}</div>}
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

function SisPontoJustificativaForm({ funcionarioId, nome, setor, justificativas, onAtualizado, pendenciaSugerida, pendenciaRefazerSugerida }) {
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
    if (editandoId) return;
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
  }, [pendenciaSugerida, pendenciaRefazerSugerida, editandoId]);

  const minhasJustificativas = useMemo(() => justificativas
    .filter((item) => item.funcionarioId === funcionarioId)
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)), [justificativas, funcionarioId]);
  const justificativaEmEdicao = editandoId ? minhasJustificativas.find((item) => item.id === editandoId) : null;

  const handleArquivo = (event) => {
    const arquivo = (event.target.files || [])[0];
    event.target.value = '';
    if (!arquivo) return;
    if (!['image/jpeg', 'image/png'].includes(arquivo.type)) {
      setMensagem({ tipo: 'erro', texto: 'O atestado precisa ser uma imagem JPG ou PNG.' });
      window.setTimeout(() => setMensagem(null), 2600);
      return;
    }
    setAnexo(arquivo);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setForm(formularioJustificativaVazio);
    setAnexo(null);
    setAnexoExistente(null);
  };

  const refazer = (justificativa) => {
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
  const enviar = async () => {
    if (!form.dia || !form.horaInicio || !form.horaFim || !form.tipo) {
      setMensagem({ tipo: 'erro', texto: 'Preencha o dia, o período e o motivo.' });
      window.setTimeout(() => setMensagem(null), 2600);
      return;
    }
    if (form.tipo === 'outro' && !form.motivo.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Explique o motivo quando escolher "Outro".' });
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

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card style={{ padding: 26 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>{editandoId ? 'Refazer justificativa' : 'Nova justificativa'}</h2>
        <p style={{ margin: '6px 0 20px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Explique uma ausência, atraso ou saída antecipada e, se tiver, anexe o atestado.</p>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <label style={{ display: 'grid', gap: 5, fontSize: 11, fontWeight: 800, color: '#7183a3' }}>Dia a justificar
            <input type="date" value={form.dia} onChange={(event) => setForm((atual) => ({ ...atual, dia: event.target.value }))} style={{ height: 40, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 10px', fontSize: 13, fontWeight: 700, color: '#405371' }} />
          </label>
          <label style={{ display: 'grid', gap: 5, fontSize: 11, fontWeight: 800, color: '#7183a3' }}>Do horário
            <input type="time" value={form.horaInicio} onChange={(event) => setForm((atual) => ({ ...atual, horaInicio: event.target.value }))} style={{ height: 40, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 10px', fontSize: 13, fontWeight: 700, color: '#405371' }} />
          </label>
          <label style={{ display: 'grid', gap: 5, fontSize: 11, fontWeight: 800, color: '#7183a3' }}>Até o horário
            <input type="time" value={form.horaFim} onChange={(event) => setForm((atual) => ({ ...atual, horaFim: event.target.value }))} style={{ height: 40, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 10px', fontSize: 13, fontWeight: 700, color: '#405371' }} />
          </label>
        </div>

        <label style={{ display: 'grid', gap: 5, marginTop: 12, fontSize: 11, fontWeight: 800, color: '#7183a3' }}>Motivo
          <select value={form.tipo} onChange={(event) => setForm((atual) => ({ ...atual, tipo: event.target.value }))} style={{ height: 40, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 10px', fontSize: 13, fontWeight: 700, color: form.tipo ? '#405371' : '#8a99b1', background: '#fff' }}>
            <option value="">Selecione o motivo...</option>
            {JUSTIFICATIVA_TIPOS.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 5, marginTop: 12, fontSize: 11, fontWeight: 800, color: '#7183a3' }}>{form.tipo === 'outro' ? 'Explicação' : 'Explicação (opcional)'}
          <textarea value={form.motivo} onChange={(event) => setForm((atual) => ({ ...atual, motivo: event.target.value }))} rows={3} placeholder="Descreva o motivo da ausência, atraso ou saída antecipada..." style={{ borderRadius: 8, border: '1px solid #d8e6fc', padding: 10, fontSize: 13, fontWeight: 600, color: '#405371', resize: 'vertical', fontFamily: 'inherit' }} />
        </label>

        <div style={{ marginTop: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#7183a3' }}>Atestado (imagem, opcional)</span>
          <input ref={inputArquivoRef} type="file" accept="image/jpeg,image/png" onChange={handleArquivo} style={{ display: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <button type="button" onClick={() => inputArquivoRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid #d8e6fc', borderRadius: 8, padding: '9px 13px', background: '#f6faff', color: '#1767e8', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}><ImageIcon size={15} /> Selecionar imagem</button>
            <span style={{ fontSize: 12, color: '#7183a3', fontWeight: 700 }}>{anexo ? anexo.name : anexoExistente ? anexoExistente.nome : 'Nenhum arquivo anexado.'}</span>
          </div>
        </div>

        {mensagem && <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: mensagem.tipo === 'erro' ? '#fff4f3' : '#effaf6', color: mensagem.tipo === 'erro' ? '#c23b34' : '#1f9d63' }}>{mensagem.texto}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button type="button" disabled={enviando} onClick={enviar} style={{ border: 0, borderRadius: 9, padding: '11px 18px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? .7 : 1 }}>{enviando ? 'Enviando...' : editandoId ? 'Reenviar justificativa' : 'Enviar justificativa'}</button>
          {editandoId && <button type="button" onClick={cancelarEdicao} style={{ border: '1px solid #d8e4f3', borderRadius: 9, padding: '11px 15px', background: '#fff', color: '#52637f', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>}
        </div>
      </Card>

      <Card style={{ padding: 26 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Minhas justificativas</h2>
        <p style={{ margin: '4px 0 16px', fontSize: 12, color: '#7183a3', fontWeight: 600 }}>Acompanhe o status de cada solicitação enviada.</p>
        {!minhasJustificativas.length ? (
          <div style={{ padding: 24, border: '1px dashed #cbd8eb', borderRadius: 12, textAlign: 'center', color: '#7183a3', fontSize: 13 }}>Você ainda não enviou nenhuma justificativa.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {minhasJustificativas.map((justificativa) => {
              const cor = JUSTIFICATIVA_CORES[justificativa.status] || JUSTIFICATIVA_CORES['Em análise'];
              return <motion.div key={justificativa.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ border: `1px solid ${cor.borda}`, background: cor.fundo, borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 900, color: '#1d3156', fontSize: 13 }}>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${justificativa.dia}T12:00:00`))} · {justificativa.horaInicio}–{justificativa.horaFim}</span>
                  <span style={{ padding: '4px 10px', borderRadius: 99, background: cor.texto, color: '#fff', fontSize: 10, fontWeight: 900 }}>{justificativa.status}</span>
                </div>
                {rotuloTipoJustificativa(justificativa.tipo) && <p style={{ margin: '8px 0 0', color: '#1d3156', fontSize: 12, fontWeight: 800 }}>{rotuloTipoJustificativa(justificativa.tipo)}</p>}
                {justificativa.motivo && <p style={{ margin: '4px 0 0', color: '#405371', fontSize: 12, fontWeight: 600 }}>{justificativa.motivo}</p>}
                {justificativa.anexoNome && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, color: '#7183a3', fontSize: 11, fontWeight: 700 }}><FileText size={13} /> {justificativa.anexoNome}</span>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {(justificativa.status === 'Inválida' || justificativa.status === 'Recusada') && <button type="button" onClick={() => refazer(justificativa)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 0, borderRadius: 8, padding: '8px 12px', background: '#c2650a', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}><Pencil size={12} /> Refazer justificativa</button>}
                  <button type="button" onClick={() => excluir(justificativa)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e5cdd0', borderRadius: 8, padding: '8px 12px', background: '#fff', color: '#8a4a4f', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}><Trash2 size={12} /> Excluir</button>
                </div>
              </motion.div>;
            })}
          </div>
        )}
      </Card>
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
