import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, FileText, Hourglass, Image as ImageIcon, LogIn, Pencil, TimerReset, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { meses, diasSemana, JUSTIFICATIVA_CORES } from './sisPontoData.js';
import { chaveData, hora, horariosDoDia, encontrarJustificativaAceita, buildEngFuncionariosFromStorage, extrairRegistrosFuncionario, statusJustificativaSlotsFaltantes, statusCalendarioDoDia } from './sisPontoUtils.js';
import { Card, ConfirmacaoPonto, FormularioModal, BancoHoras, Legenda, MenuPonto, ModalRegistros, Resumo, navButton } from './SisPontoComponents.jsx';
import './sisPonto.css';

export default function SisPontoFuncionarioScreen({ usuarioLogado }) {
  const [agora, setAgora] = useState(new Date());
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [aba, setAba] = useState('calendario');
  const [modalRegistros, setModalRegistros] = useState(false);
  const [diaModal, setDiaModal] = useState(null);
  const [mesesAberto, setMesesAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [novoFuncionarioModal, setNovoFuncionarioModal] = useState(false);
  const [erroPonto, setErroPonto] = useState(null);
  const [justificativas, setJustificativas] = useState([]);
  const funcionariosKey = `ccf-sis-ponto-funcionarios-${usuarioLogado}`;
  const [funcionariosSetor, setFuncionariosSetor] = useState(() => {
    try {
      const cadastrados = JSON.parse(localStorage.getItem(funcionariosKey));
      return Array.isArray(cadastrados) && cadastrados.length ? cadastrados : [{ id: usuarioLogado, nome: usuarioLogado }];
    } catch { return [{ id: usuarioLogado, nome: usuarioLogado }]; }
  });
  const [funcionarioId, setFuncionarioId] = useState(usuarioLogado);
  const funcionarioAtual = funcionariosSetor.find((funcionario) => funcionario.id === funcionarioId) || funcionariosSetor[0];
  const [registros, setRegistros] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => localStorage.setItem(funcionariosKey, JSON.stringify(funcionariosSetor)), [funcionariosKey, funcionariosSetor]);
  // O backend é a fonte da verdade: a lista deste setor é sempre substituída
  // pelo que vier de lá, nunca só mesclada — do contrário um funcionário
  // excluído pelo ENG admin continuaria selecionável aqui (e a versão antiga
  // deste efeito chegava a recriá-lo no backend, "ressuscitando-o").
  const carregarFuncionarios = () => api.getSispontoFuncionarios().then((lista) => {
    if (!Array.isArray(lista)) return;
    const doSetor = lista.filter((funcionario) => funcionario.setor === usuarioLogado);
    setFuncionariosSetor(doSetor.length ? doSetor : [{ id: usuarioLogado, nome: usuarioLogado }]);
  }).catch(() => {
    // fallback: mantém a lista local (ex.: sem conexão) até a próxima sincronização.
  });
  useEffect(() => { carregarFuncionarios(); }, [usuarioLogado, aba]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!funcionariosSetor.some((funcionario) => funcionario.id === funcionarioId)) {
      setFuncionarioId(funcionariosSetor[0]?.id || usuarioLogado);
    }
  }, [funcionariosSetor, funcionarioId, usuarioLogado]);
  const carregarJustificativas = () => api.getSispontoJustificativas()
    .then((lista) => setJustificativas(Array.isArray(lista) ? lista : []))
    .catch(() => setJustificativas([]));
  useEffect(() => { carregarJustificativas(); }, [funcionarioAtual?.id, aba]);
  const carregarRegistros = () => {
    const idAtual = funcionarioAtual?.id || usuarioLogado;
    return api.getSispontoRegistros()
      .then((registrosBackend) => setRegistros(extrairRegistrosFuncionario(registrosBackend, idAtual)))
      .catch(() => {});
  };
  useEffect(() => { carregarRegistros(); }, [funcionarioAtual?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hoje = chaveData(agora);
  const registrosHoje = registros[hoje] || [];
  const proximoEhEntrada = registrosHoje.length % 2 === 0;
  const registrarPonto = () => {
    const acao = proximoEhEntrada ? 'iniciar o horário de entrada' : 'registrar a saída';
    setConfirmacao({ titulo: proximoEhEntrada ? 'Confirmar entrada' : 'Confirmar saída', mensagem: `Deseja realmente ${acao}?`, confirmar: registrarPontoConfirmado });
  };
  const registrarPontoConfirmado = () => {
    const momento = new Date();
    const chave = chaveData(momento);
    const tempoIso = momento.toISOString();
    const idAtual = funcionarioAtual?.id || usuarioLogado;

    const [tipo, horarioEsperadoStr] = proximoEsperado;
    const [horaEsperada, minutoEsperado] = horarioEsperadoStr.split(':').map(Number);
    const diferenca = (momento.getHours() * 60 + momento.getMinutes()) - (horaEsperada * 60 + minutoEsperado);
    const atrasado = (tipo === 'Entrada' && diferenca >= 5) || (tipo === 'Saída' && diferenca <= -5);

    setRegistros((atuais) => ({ ...atuais, [chave]: [...(atuais[chave] || []), tempoIso] }));
    setConfirmacao(null);
    if (atrasado) {
      setErroPonto('Esse registro ficou fora do horário. Não esqueça de enviar uma justificativa na aba Justificativas.');
      window.setTimeout(() => setErroPonto(null), 6000);
    }
    api.registrarSispontoPonto({ funcionarioId: idAtual, data: chave, tempo: tempoIso, atrasado, minutosAtraso: Math.abs(diferenca), tipo }).catch(() => {
      carregarRegistros();
    });
  };
  const selecionarFuncionario = (id) => {
    setFuncionarioId(id);
    setDiaModal(null);
  };
  const adicionarFuncionario = () => setNovoFuncionarioModal(true);
  const criarFuncionario = ({ nome }) => {
    setNovoFuncionarioModal(false);
    if (!nome?.trim()) return;
    const id = `${usuarioLogado}-${Date.now()}`;
    const novoFuncionario = { id, nome: nome.trim(), setor: usuarioLogado };
    setFuncionariosSetor((atuais) => [...atuais, novoFuncionario]);
    setFuncionarioId(id);
    setRegistros({});
    api.createSispontoFuncionario(novoFuncionario).catch(() => {
      // fallback: o funcionário continua salvo localmente e será sincronizado
      // com o backend na próxima vez que a tela carregar.
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
    return horariosDoDia(dataRegistro)[indice % 4];
  };
  const proximoEsperado = horarioEsperado(registrosHoje.length, registrosHoje);
  const statusRegistro = (registro, indice, registrosDoDia = [], chaveDia = hoje) => {
    const [horaEsperada, minutoEsperado] = horarioEsperado(indice, registrosDoDia)[1].split(':').map(Number);
    const instante = new Date(registro);
    const diferenca = (instante.getHours() * 60 + instante.getMinutes()) - (horaEsperada * 60 + minutoEsperado);
    const tipo = horarioEsperado(indice, registrosDoDia)[0];
    const foraDoHorario = (tipo === 'Entrada' && diferenca >= 5) || (tipo === 'Saída' && diferenca <= -5);
    if (!foraDoHorario) return 'Normal';
    if (encontrarJustificativaAceita(justificativas, funcionarioAtual?.id, chaveDia, hora(instante))) return 'Justificado';
    return 'Atrasado/Saída Antecipada';
  };
  const excluirRegistro = (indice) => {
    setConfirmacao({ titulo: 'Excluir registro', mensagem: 'Deseja realmente excluir este registro de ponto?', destrutivo: true, confirmar: () => {
      const idAtual = funcionarioAtual?.id || usuarioLogado;
      const tempo = (registros[diaModal] || [])[indice];
      setRegistros((atuais) => ({ ...atuais, [diaModal]: (atuais[diaModal] || []).filter((_, itemIndice) => itemIndice !== indice) }));
      setConfirmacao(null);
      if (!tempo) return;
      api.deleteSispontoRegistro({ funcionarioId: idAtual, data: diaModal, tempo }).catch((erro) => {
        setErroPonto(erro?.message || 'Não foi possível excluir o registro. Tente novamente.');
        window.setTimeout(() => setErroPonto(null), 4500);
        carregarRegistros();
      });
    } });
  };
  const atrasosNoMes = registrosNoMes.reduce((total, [data, itens]) => total + itens.filter((registro, indice) => statusRegistro(registro, indice, itens, data) === 'Atrasado/Saída Antecipada').length, 0);
  const diasDoMesSemRegistroJustificados = Array.from({ length: new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate() }, (_, indice) => new Date(mes.getFullYear(), mes.getMonth(), indice + 1))
    .filter((dia) => { const chaveDia = chaveData(dia); const itensDia = registros[chaveDia] || []; return statusJustificativaSlotsFaltantes(justificativas, funcionarioAtual?.id, chaveDia, horariosDoDia(dia), itensDia.length) === 'Aceita'; }).length;
  const justificadasNoMes = registrosNoMes.reduce((total, [data, itens]) => total + itens.filter((registro, indice) => statusRegistro(registro, indice, itens, data) === 'Justificado').length, 0) + diasDoMesSemRegistroJustificados;
  const registrosDoModal = diaModal ? registros[diaModal] || [] : [];
  const statusRegistroDoModal = (registro, indice, registrosDoDia) => statusRegistro(registro, indice, registrosDoDia, diaModal);
  const idFuncionarioAtual = funcionarioAtual?.id || usuarioLogado;
  const registrosBackendFuncionario = useMemo(() => {
    const porData = {};
    Object.entries(registros).forEach(([chave, lista]) => { porData[chave] = { [idFuncionarioAtual]: lista }; });
    return porData;
  }, [registros, idFuncionarioAtual]);
  const bancoHorasFuncionario = useMemo(() => buildEngFuncionariosFromStorage(hoje, undefined, [{ id: idFuncionarioAtual, nome: funcionarioAtual?.nome || usuarioLogado, setor: usuarioLogado }], justificativas, registrosBackendFuncionario), [hoje, idFuncionarioAtual, funcionarioAtual, usuarioLogado, justificativas, registrosBackendFuncionario]);

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
              <label style={{ color: '#7183a3', fontSize: 10, fontWeight: 800 }}>Funcionário</label>
              <select value={funcionarioId} onChange={(event) => selecionarFuncionario(event.target.value)} style={{ width: '100%', minWidth: 0, padding: '9px 7px', border: '1px solid #d8e6fc', borderRadius: 8, color: '#405371', fontSize: 11, fontWeight: 700 }}>
                {funcionariosSetor.map((funcionario) => <option key={funcionario.id} value={funcionario.id}>{funcionario.nome}</option>)}
              </select>
              <button type="button" onClick={adicionarFuncionario} style={{ border: 0, borderRadius: 8, background: '#eef4ff', color: '#1767e8', padding: '8px 7px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+ Novo funcionário</button>
            </div>
            <MenuPonto ativo={aba === 'calendario'} onClick={() => setAba('calendario')} icon={<CalendarDays size={17} />} texto="Calendário" />
            <MenuPonto ativo={aba === 'justificativas'} onClick={() => setAba('justificativas')} icon={<FileText size={17} />} texto="Justificativas" />
            
          </aside>
          {aba === 'calendario' ? <div className="ponto-grid">
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
                const chave = chaveData(dia); const itens = registros[chave] || []; const ehHoje = chave === hoje; const horariosDia = horariosDoDia(dia); const statusItens = itens.map((registro, indice) => statusRegistro(registro, indice, itens, chave)); const { temAtraso, temJustificado, temJustificadoPendente, horariosPreenchidos } = statusCalendarioDoDia(itens, statusItens, horariosDia, justificativas, funcionarioAtual?.id, chave);
                return <motion.div key={chave} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .2 }} whileHover={{ backgroundColor: '#f8fbff' }} className="ponto-dia" style={{ background: pertenceAoMes ? '#fff' : '#f4f7fb', boxShadow: ehHoje ? 'inset 0 0 0 2px #3682ff' : 'none', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: ehHoje ? 800 : 700, color: ehHoje ? '#1767e8' : pertenceAoMes ? '#344766' : '#a7b4c9' }}><span style={ehHoje ? { display: 'grid', placeItems: 'center', width: 23, height: 23, borderRadius: '50%', background: '#1767e8', color: '#fff' } : {}}>{dia.getDate()}</span>{itens.length > 0 && <span title={temAtraso ? 'Há registro em atraso' : temJustificado ? 'Atraso justificado' : 'Registros no horário'} style={{ width: 8, height: 8, borderRadius: '50%', background: temAtraso ? '#ffb24a' : temJustificadoPendente ? '#f2c14e' : temJustificado ? '#4b83f5' : itens.length % 2 ? '#ffad42' : '#38bc7b' }} />}{itens.length === 0 && temJustificado && <span title="Justificado" style={{ width: 8, height: 8, borderRadius: '50%', background: temJustificadoPendente ? '#f2c14e' : '#4b83f5' }} />}</div>
                  {(itens.length > 0 || horariosPreenchidos.some(Boolean)) && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '5px 8px', marginTop: 9 }}>
                    {itens.slice(0, 4).map((item, index) => { const entrada = horariosDia[index % 4][0] === 'Entrada'; const statusItem = statusItens[index]; return <span key={item} title={`${horariosDia[index % 4][0]} ${hora(new Date(item))}`} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: 11, fontWeight: 800, color: statusItem === 'Normal' ? '#425574' : statusItem === 'Justificado' ? '#2f5bd6' : '#d97706' }}><LogIn size={12} style={entrada ? undefined : { transform: 'rotate(180deg)' }} /><span>{hora(new Date(item)).slice(0, 5)}</span></span>; })}
                    {horariosPreenchidos.map((horarioJustificado, index) => { if (!horarioJustificado || index < itens.length) return null; const entrada = horariosDia[index][0] === 'Entrada'; return <span key={`justificado-${chave}-${index}`} title={`${horariosDia[index][0]} ${horarioJustificado} · preenchido pela justificativa aprovada`} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: 11, fontWeight: 800, fontStyle: 'italic', color: '#2f5bd6' }}><LogIn size={12} style={entrada ? undefined : { transform: 'rotate(180deg)' }} /><span>{horarioJustificado}</span></span>; })}
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

          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Card style={{ padding: 22, textAlign: 'center' }}>
              <h2 style={{ margin: 0, textAlign: 'left', fontSize: 16 }}>Registrar Ponto</h2><p style={{ margin: '4px 0 22px', textAlign: 'left', fontSize: 12, color: '#7183a3', fontWeight: 600 }}>Faça seu registro de ponto</p>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.04em', color: '#14264b' }}>{hora(agora)}</div>
              <p style={{ margin: '7px 0 22px', textTransform: 'capitalize', color: '#7183a3', fontSize: 12, fontWeight: 700 }}>{tituloData}</p>
              <div style={{ textAlign: 'left', padding: 14, border: '1px solid #d8e6fc', borderRadius: 10, background: '#f6faff', marginBottom: 16 }}>
                <div style={{ color: '#7183a3', fontSize: 11, fontWeight: 800 }}>PRÓXIMO REGISTRO ESPERADO</div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#243755' }}><LogIn size={17} color={proximoEsperado[0] === 'Entrada' ? '#38bc7b' : '#ef5350'} style={proximoEsperado[0] === 'Entrada' ? undefined : { transform: 'rotate(180deg)' }} />{proximoEsperado[0]} <span style={{ marginLeft: 'auto', color: '#1767e8' }}>{proximoEsperado[1]}</span></div>
              </div>
              <button type="button" onClick={registrarPonto} style={{ width: '100%', border: 0, borderRadius: 9, background: '#1767e8', color: '#fff', padding: '13px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 14px #1767e833' }}>Confirmar {proximoEhEntrada ? 'entrada' : 'saída'}</button>
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
          </div> : aba === 'justificativas' ? <SisPontoJustificativaForm funcionarioId={funcionarioAtual?.id || usuarioLogado} nome={funcionarioAtual?.nome || usuarioLogado} setor={usuarioLogado} justificativas={justificativas} onAtualizado={carregarJustificativas} /> : BancoHoras(bancoHorasFuncionario)}
        </div>
      </div>
      {modalRegistros && <ModalRegistros registros={registrosDoModal} statusRegistro={statusRegistroDoModal} horarioEsperado={horarioEsperado} onExcluir={excluirRegistro} onClose={() => { setModalRegistros(false); setDiaModal(null); }} />}
      {confirmacao && <ConfirmacaoPonto {...confirmacao} onClose={() => setConfirmacao(null)} />}
      {novoFuncionarioModal && <FormularioModal titulo="Novo funcionário" campos={[{ nome: 'nome', label: 'Nome do funcionário', obrigatorio: true }]} textoConfirmar="Adicionar" confirmar={criarFuncionario} onClose={() => setNovoFuncionarioModal(false)} />}
      {erroPonto && <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 120, padding: '12px 18px', borderRadius: 10, background: '#c23b34', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 14px 30px rgba(15,35,70,.25)' }}>{erroPonto}</div>}
    </main>
  );
}

const formularioJustificativaVazio = { dia: chaveData(new Date()), horaInicio: '08:00', horaFim: '12:00', motivo: '' };

function lerArquivoComoDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

function SisPontoJustificativaForm({ funcionarioId, nome, setor, justificativas, onAtualizado }) {
  const [form, setForm] = useState(formularioJustificativaVazio);
  const [anexo, setAnexo] = useState(null);
  const [anexoExistente, setAnexoExistente] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState(null);
  const inputArquivoRef = useRef(null);

  const minhasJustificativas = useMemo(() => justificativas
    .filter((item) => item.funcionarioId === funcionarioId)
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)), [justificativas, funcionarioId]);

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
    setForm({ dia: justificativa.dia, horaInicio: justificativa.horaInicio, horaFim: justificativa.horaFim, motivo: justificativa.motivo });
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
    if (!form.dia || !form.horaInicio || !form.horaFim || !form.motivo.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Preencha o dia, o período e a explicação.' });
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

        <label style={{ display: 'grid', gap: 5, marginTop: 12, fontSize: 11, fontWeight: 800, color: '#7183a3' }}>Explicação
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
                <p style={{ margin: '8px 0 0', color: '#405371', fontSize: 12, fontWeight: 600 }}>{justificativa.motivo}</p>
                {justificativa.anexoNome && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, color: '#7183a3', fontSize: 11, fontWeight: 700 }}><FileText size={13} /> {justificativa.anexoNome}</span>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {justificativa.status === 'Inválida' && <button type="button" onClick={() => refazer(justificativa)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 0, borderRadius: 8, padding: '8px 12px', background: '#c2650a', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}><Pencil size={12} /> Refazer justificativa</button>}
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
