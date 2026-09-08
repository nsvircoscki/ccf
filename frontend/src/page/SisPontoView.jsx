import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, FileText, Hourglass, LogIn, TimerReset, Trash2, X, ChartNoAxesColumn, Files, User } from 'lucide-react';

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HORARIOS_ESPERADOS = [['Entrada', '07:30'], ['Saída', '12:00'], ['Entrada', '13:00'], ['Saída', '17:30']];
const chaveData = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
const hora = (data) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(data);

function Card({ children, style }) {
  return <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32, ease: 'easeOut' }} style={{ background: '#fff', border: '1px solid #e7edf6', borderRadius: 14, boxShadow: '0 4px 18px rgba(15, 35, 70, .035)', ...style }}>{children}</motion.section>;
}

export default function SisPontoView({ usuarioLogado }) {
  if (usuarioLogado === 'ENG') {
    return <EngAdminSisPontoScreen usuarioLogado={usuarioLogado} />;
  }

  const [agora, setAgora] = useState(new Date());
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [aba, setAba] = useState('calendario');
  const [modalRegistros, setModalRegistros] = useState(false);
  const [diaModal, setDiaModal] = useState(null);
  const [mesesAberto, setMesesAberto] = useState(false);
  const storageKey = `ccf-ponto-${usuarioLogado}`;
  const [registros, setRegistros] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
  });

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(registros)), [registros, storageKey]);

  const hoje = chaveData(agora);
  const registrosHoje = registros[hoje] || [];
  const proximoEhEntrada = registrosHoje.length % 2 === 0;
  const registrarPonto = () => {
    const acao = proximoEhEntrada ? 'iniciar o horário de entrada' : 'registrar a saída';
    if (!window.confirm(`Deseja realmente ${acao}?`)) return;
    const momento = new Date();
    const chave = chaveData(momento);
    setRegistros((atuais) => ({ ...atuais, [chave]: [...(atuais[chave] || []), momento.toISOString()] }));
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
    const tipo = HORARIOS_ESPERADOS[indice % 4][0];
    if (tipo === 'Saída' && registrosDoDia[indice - 1]) {
      const previsao = new Date(registrosDoDia[indice - 1]);
      previsao.setMinutes(previsao.getMinutes() + (4 * 60) + 30);
      return [tipo, hora(previsao).slice(0, 5)];
    }
    return HORARIOS_ESPERADOS[indice % 4];
  };
  const proximoEsperado = horarioEsperado(registrosHoje.length, registrosHoje);
  const statusRegistro = (registro, indice, registrosDoDia = []) => {
    const [horaEsperada, minutoEsperado] = horarioEsperado(indice, registrosDoDia)[1].split(':').map(Number);
    const instante = new Date(registro);
    const diferenca = (instante.getHours() * 60 + instante.getMinutes()) - (horaEsperada * 60 + minutoEsperado);
    if (HORARIOS_ESPERADOS[indice % 4][0] === 'Entrada' && diferenca > 0) return 'Atrasado';
    if (HORARIOS_ESPERADOS[indice % 4][0] === 'Saída' && diferenca < 0) return 'Saída antecipada';
    return 'Normal';
  };
  const excluirRegistro = (indice) => {
    if (!window.confirm('Deseja realmente excluir este registro de ponto?')) return;
    setRegistros((atuais) => ({ ...atuais, [diaModal]: (atuais[diaModal] || []).filter((_, itemIndice) => itemIndice !== indice) }));
  };
  const atrasosNoMes = registrosNoMes.reduce((total, [, itens]) => total + itens.filter((registro, indice) => statusRegistro(registro, indice, itens) !== 'Normal').length, 0);
  const registrosDoModal = diaModal ? registros[diaModal] || [] : [];

  return (
    <main style={{ height: '100%', overflow: 'auto', background: '#f8fafc', color: '#13254a' }}>
      <style>{`
        .ponto-shell { display:grid; grid-template-columns:190px minmax(0, 1fr); gap:18px; }
        .ponto-grid { display:grid; grid-template-columns:minmax(620px, 1fr) 330px; gap:16px; }
        .ponto-cal { display:grid; grid-template-columns:repeat(7,minmax(70px,1fr)); }
        .ponto-dia { min-height:105px; padding:11px 12px; border-right:1px solid #e7edf6; border-bottom:1px solid #e7edf6; background:#fff; }
        .ponto-dia:nth-child(7n) { border-right:none; }
        @media (max-width: 950px) { .ponto-shell, .ponto-grid { grid-template-columns:1fr; } .ponto-menu { display:flex; gap:8px; } .ponto-menu button { flex:1; } }
        @media (max-width: 620px) { .ponto-page { padding:18px !important; } .ponto-dia { min-height:76px; padding:7px; } .ponto-cal { font-size:11px; } }
      `}</style>
      <div className="ponto-page" style={{ padding: '28px 30px 36px', maxWidth: 1600, margin: '0 auto' }}>
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: '#eaf2ff', color: '#1767e8' }}><Clock3 size={19} /></span>
            <div><h1 style={{ margin: 0, fontSize: 23, letterSpacing: '-.03em' }}>SIS Ponto</h1><p style={{ margin: '3px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Visualize e registre seus horários de trabalho</p></div>
          </div>
        </motion.header>

        <div className="ponto-shell">
          <aside className="ponto-menu" style={{ alignSelf: 'start', padding: 8, borderRadius: 14, background: '#fff', border: '1px solid #e7edf6' }}>
            <p style={{ margin: '8px 10px 12px', color: '#8a99b1', fontSize: 10, fontWeight: 800, letterSpacing: '.09em' }}>SIS PONTO</p>
            <MenuPonto ativo={aba === 'calendario'} onClick={() => setAba('calendario')} icon={<CalendarDays size={17} />} texto="Calendário" />
            <MenuPonto ativo={aba === 'justificativas'} onClick={() => setAba('justificativas')} icon={<FileText size={17} />} texto="Justificativas" />
            <MenuPonto ativo={aba === 'banco'} onClick={() => setAba('banco')} icon={<Hourglass size={17} />} texto="Banco de horas" />
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
                const chave = chaveData(dia); const itens = registros[chave] || []; const ehHoje = chave === hoje; const temAtraso = itens.some((registro, indice) => statusRegistro(registro, indice, itens) !== 'Normal');
                return <motion.div key={chave} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .2 }} whileHover={{ backgroundColor: '#f8fbff' }} className="ponto-dia" style={{ background: pertenceAoMes ? '#fff' : '#f4f7fb', boxShadow: ehHoje ? 'inset 0 0 0 2px #3682ff' : 'none', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: ehHoje ? 800 : 700, color: ehHoje ? '#1767e8' : pertenceAoMes ? '#344766' : '#a7b4c9' }}><span style={ehHoje ? { display: 'grid', placeItems: 'center', width: 23, height: 23, borderRadius: '50%', background: '#1767e8', color: '#fff' } : {}}>{dia.getDate()}</span>{itens.length > 0 && <span title={temAtraso ? 'Há registro em atraso' : 'Registros no horário'} style={{ width: 8, height: 8, borderRadius: '50%', background: temAtraso ? '#ffb24a' : itens.length % 2 ? '#ffad42' : '#38bc7b' }} />}</div>
                  {itens.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '5px 8px', marginTop: 9 }}>{itens.slice(0, 4).map((item, index) => { const entrada = HORARIOS_ESPERADOS[index % 4][0] === 'Entrada'; return <span key={item} title={`${HORARIOS_ESPERADOS[index % 4][0]} ${hora(new Date(item))}`} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: 11, fontWeight: 800, color: statusRegistro(item, index, itens) === 'Normal' ? '#425574' : '#d97706' }}><LogIn size={12} style={entrada ? undefined : { transform: 'rotate(180deg)' }} /><span>{hora(new Date(item)).slice(0, 5)}</span></span>; })}</div>}
                  {itens.length > 4 && <button type="button" onClick={() => { setDiaModal(chave); setModalRegistros(true); }} style={{ marginTop: 6, padding: 0, border: 0, background: 'transparent', color: '#1767e8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>+{itens.length - 4} registros</button>}
                  {temAtraso && <div style={{ marginTop: 5, color: '#d97706', fontSize: 10, fontWeight: 800 }}>Atrasado / saída antecipada</div>}
                </motion.div>;
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, padding: '15px 18px', fontSize: 12, color: '#52637f', fontWeight: 700 }}>
              <Legenda cor="#38bc7b" texto="Normal" /><Legenda cor="#ffb24a" texto="Atrasado / saída antecipada" /><Legenda cor="#ff5d66" texto="Falta" /><Legenda cor="#4b83f5" texto="Justificado" /><Legenda cor="#a855f7" texto="Atestado" /><Legenda cor="#8e9bb0" texto="Feriado" /><Legenda cor="#b4bdca" texto="Folga" />
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
              <Resumo icon={<CircleAlert size={16} />} cor="#ffb24a" label="Atrasado / saída antecipada" valor={atrasosNoMes} />
              <Resumo icon={<CircleAlert size={16} />} cor="#ff5d66" label="Faltas" valor="0" />
              <Resumo icon={<FileText size={16} />} cor="#4b83f5" label="Justificadas" valor="0" />
              <Resumo icon={<CalendarDays size={16} />} cor="#a855f7" label="Atestados" valor="0" />
              <Resumo icon={<TimerReset size={16} />} cor="#1767e8" label="Registros realizados" valor={totalRegistros} />
            </Card>
          </div>
          </div> : aba === 'justificativas' ? <Justificativas /> : <BancoHoras />}
        </div>
      </div>
      {modalRegistros && <ModalRegistros registros={registrosDoModal} statusRegistro={statusRegistro} horarioEsperado={horarioEsperado} onExcluir={excluirRegistro} onClose={() => { setModalRegistros(false); setDiaModal(null); }} />}
    </main>
  );
}

function formatHorario(data) {
  if (!data) return '—';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data);
}

function formatDuracaoEmHoras(inicio, fim) {
  if (!inicio || !fim) return '00h00';
  const diffMin = Math.max(0, Math.round((fim - inicio) / 60000));
  const horas = Math.floor(diffMin / 60);
  const minutos = diffMin % 60;
  return `${String(horas).padStart(2, '0')}h${String(minutos).padStart(2, '0')}`;
}

function buildEngFuncionariosFromStorage(selectedDate = chaveData(new Date())) {
  try {
    const keys = Object.keys(localStorage || {}).filter((key) => key.startsWith('ccf-ponto-') && key !== 'ccf-ponto-ENG');
    if (!keys.length) return [];

    return keys.map((storageKey) => {
      const perfil = storageKey.replace('ccf-ponto-', '');
      const blob = JSON.parse(localStorage.getItem(storageKey)) || {};
      const registrosDia = (blob[selectedDate] || []).map((iso) => new Date(iso)).sort((a, b) => a - b);
      const entrada = registrosDia[0] ?? null;
      const intervalo = registrosDia[1] ?? null;
      const retorno = registrosDia[2] ?? null;
      const saida = registrosDia[registrosDia.length - 1] ?? null;
      const total = entrada && saida ? formatDuracaoEmHoras(entrada, saida) : '00h00';
      const status = registrosDia.length === 0 ? 'Ausente' : (registrosDia.length > 2 ? 'Trabalhando' : 'Normal');

      return {
        nome: perfil,
        setor: perfil,
        cargo: 'Colaborador',
        entrada: formatHorario(entrada),
        intervalo: formatHorario(intervalo),
        retorno: formatHorario(retorno),
        saida: formatHorario(saida),
        total,
        status,
        justificativa: 0,
        jornadaPrevista: '08:00',
        jornadaRealizada: total,
        jornadaTipo: 'Jornada prevista',
        banco: '+00h00',
      };
    });
  } catch {
    return [];
  }
}

function EngAdminSisPontoScreen({ usuarioLogado = 'ENG' }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [date, setDate] = useState(chaveData(new Date()));
  const funcionarios = useMemo(() => buildEngFuncionariosFromStorage(date), [date]);
  const setores = Array.from(new Set(funcionarios.map((f) => f.setor))).sort();
  const [funcionarioFiltro, setFuncionarioFiltro] = useState('Todos os funcionários');
  const [setorFiltro, setSetorFiltro] = useState('Todos os setores');
  const [statusFiltro, setStatusFiltro] = useState('Todos os status');
  const [activeTab, setActiveTab] = useState('resumo');
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(funcionarios[0] || { nome: 'Sem registros', setor: '—', cargo: '—', entrada: '—', intervalo: '—', retorno: '—', saida: '—', total: '00h00', status: 'Ausente', justificativa: 0, jornadaPrevista: '08:00', jornadaRealizada: '00h00', jornadaTipo: 'Jornada prevista', banco: '+00h00' });

  const exportarRelatorio = () => {
    const headers = ['Funcionário', 'Setor', 'Cargo', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Total', 'Status'];
    const linhas = filtered.map((f) => [f.nome, f.setor, f.cargo, f.entrada, f.intervalo, f.retorno, f.saida, f.total, f.status]);
    const csv = [headers, ...linhas].map((linha) => linha.map((campo) => `"${String(campo ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sis-ponto-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    return funcionarios.filter((f) => {
      const okFuncionario = funcionarioFiltro === 'Todos os funcionários' || f.nome === funcionarioFiltro;
      const okSetor = setorFiltro === 'Todos os setores' || f.setor === setorFiltro;
      const okStatus = statusFiltro === 'Todos os status' || f.status === statusFiltro;
      return okFuncionario && okSetor && okStatus;
    });
  }, [funcionarioFiltro, setorFiltro, statusFiltro]);

  const presentes = funcionarios.filter((f) => f.status === 'Normal').length;
  const atrasados = funcionarios.filter((f) => f.status === 'Atrasado').length;
  const ausentes = funcionarios.filter((f) => f.status === 'Ausente').length;

  return (
    <main className="sis-ponto-admin-screen">
      <style>{`
        :root { --text: #1c2440; --muted: #718398; --title: #2d3c59; --blue: #3177dd; --blue-deep: #244c91; --blue-soft: #eef4ff; --green: #2aba72; --green-soft: #ddfbe9; --orange: #ff9c2e; --orange-soft: #ffeede; --red: #e4544e; --red-soft: #ffecef; --line: #ccd9ea; --paper: #ffffff; --body: #eef4f9; --shadow: rgba(31,47,87,.12); }
        .sis-ponto-admin-screen { min-height: 100vh; background: var(--body); color: var(--text); font-family: Inter, 'Segoe UI', Arial, sans-serif; }
        .sis-ponto-admin-screen * { box-sizing: border-box; }
        .sis-admin-layout { min-height: 100vh; display: flex; background: var(--body); }
        .sis-admin-sidebar { width: 220px; background: #f8fbff; border-right: 1px solid var(--line); padding: 16px 12px; }
        .sis-admin-nav { display: flex; flex-direction: column; gap: 10px; }
        .sis-admin-nav-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; border: 0; background: transparent; color: #4b607d; font-size: 14px; font-weight: 800; cursor: pointer; text-align: left; }
        .sis-admin-nav-item.active { background: var(--blue); color: #fff; }
        .sis-admin-nav-item:hover { background: var(--blue-soft); color: var(--blue); }
        .sis-admin-nav-item.active:hover { background: var(--blue); color: #fff; }

        .sis-admin-content { flex: 1; padding: 26px 30px; max-height: calc(100vh - 80px); overflow-y: auto; }
        .sis-title { margin: 0; font-size: 30px; font-weight: 900; color: #2a3c68; letter-spacing: -.03em; }
        .sis-subtitle { margin: 4px 0 14px; color: var(--muted); font-size: 14px; font-weight: 700; }

        .sis-metrics { display: grid; grid-template-columns: repeat(4, minmax(160px, auto)); gap: 14px; margin-bottom: 16px; }
        .sis-metric-card { background: var(--paper); border-radius: 12px; border: 1px solid var(--line); padding: 16px; display: flex; align-items: center; gap: 12px; min-height: 80px; box-shadow: 0 5px 11px var(--shadow); }
        .sis-metric-card .icon { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; color: white; }
        .sis-metric-card.total { border-color: #b9d9ff; background: #eef4ff; color: var(--blue-deep); }
        .sis-metric-card.total .icon { background: var(--blue); color: white; }
        .sis-metric-card.present { border-color: #b7f0d6; background: #effaf6; color: var(--green); }
        .sis-metric-card.present .icon { background: var(--green); color: white; }
        .sis-metric-card.late { border-color: #ffd8aa; background: #fff8ee; color: var(--orange); }
        .sis-metric-card.late .icon { background: var(--orange); color: white; }
        .sis-metric-card.absent { border-color: #ffc4bd; background: #fff4f3; color: var(--red); }
        .sis-metric-card.absent .icon { background: var(--red); color: white; }
        .sis-metric-card .number { font-size: 27px; font-weight: 900; color: var(--text); margin: 0; line-height: 1.4; }
        .sis-metric-card .label { font-size: 12px; color: var(--muted); font-weight: 800; }

        .sis-filterbar { background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; box-shadow: 0 4px 10px var(--shadow); }
        .sis-filter-group { display: flex; align-items: center; gap: 8px; }
        .sis-filterbar input, .sis-filterbar select { height: 38px; border-radius: 8px; border: 1px solid var(--line); background: #fff; color: var(--text); padding: 7px 10px; font-size: 12px; font-weight: 700; }
        .sis-filterbar input[type='date'] { min-width: 150px; }
        .sis-filterbar select { min-width: 170px; }
        .sis-export-button { margin-left: auto; height: 38px; padding: 0 16px; border-radius: 8px; border: 0; background: var(--blue); color: white; font-size: 12px; font-weight: 900; cursor: pointer; }

        .sis-grid { display: grid; grid-template-columns: minmax(640px, auto) 280px; gap: 14px; margin-top: 16px; align-items: start; }
        .sis-table-card { background: var(--paper); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 8px 16px var(--shadow); overflow: hidden; max-height: calc(100vh - 280px); overflow-y: auto; }
        .sis-table-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--line); }
        .sis-table-head .left { color: #2d3c59; font-size: 16px; font-weight: 900; }
        .sis-table-head .right { color: #718398; font-size: 12px; font-weight: 800; }
        .sis-table { width: 100%; border-collapse: collapse; } 
        .sis-table th { background: #eef4ff; color: #43546c; font-size: 11px; font-weight: 900; padding: 12px 8px; border-bottom: 1px solid var(--line); text-align: center; }
        .sis-table td { padding: 11px 8px; border-bottom: 1px solid var(--line); font-size: 11px; color: var(--text); text-align: center; }
        .sis-table tbody tr { transition: background .2s; }
        .sis-table tbody tr:hover { background: #f7faff; }
        .sis-employee { display: flex; align-items: center; gap: 10px; min-width: 160px; }
        .sis-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--blue); color: #fff; display: grid; place-items: center; font-size: 12px; font-weight: 900; border: 2px solid #eaf2ff; }
        .sis-person { text-align: left; }
        .sis-person b { display: block; color: var(--text); font-size: 12px; }
        .sis-person small { display: block; color: var(--muted); font-size: 11px; }
        .sis-status { min-width: 78px; display: inline-flex; align-items: center; justify-content: center; padding: 6px 8px; border-radius: 99px; color: white; font-size: 11px; font-weight: 900; }
        .sis-status.Normal { background: var(--green); }
        .sis-status.Atrasado { background: var(--orange); }
        .sis-status.Ausente { background: var(--red); }
        .sis-status.Trabalhando { background: var(--blue); }
        .sis-arrow { width: 34px; height: 34px; border-radius: 50%; border: none; background: var(--blue); color: #fff; display: grid; place-items: center; cursor: pointer; font-size: 16px; }

        .sis-detail-panel { background: var(--paper); border-radius: 14px; border: 1px solid var(--line); box-shadow: 0 8px 16px var(--shadow); padding: 14px; max-height: calc(100vh - 280px); overflow-y: auto; }
        .sis-person-detail { background: #f8fbff; border-radius: 12px; padding: 14px; border: 1px solid var(--line); }
        .sis-detail-head { display: flex; align-items: center; gap: 12px; }
        .sis-detail-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--blue); color: white; display: grid; place-items: center; font-size: 14px; font-weight: 900; }
        .sis-detail-person-name { font-size: 20px; font-weight: 900; color: var(--text); }
        .sis-detail-person-setor { font-size: 11px; color: var(--muted); font-weight: 800; }
        .sis-detail-tabs { display: flex; gap: 10px; border-bottom: 1px solid var(--line); margin: 12px 0 0; padding-bottom: 8px; }
        .sis-detail-tabs button { background: transparent; border: 0; padding: 8px 10px; color: var(--muted); font-size: 11px; font-weight: 900; cursor: pointer; border-bottom: 2px solid transparent; }
        .sis-detail-tabs button.active { color: var(--blue); border-bottom-color: var(--blue); }
        .sis-detail-date { color: var(--text); font-size: 12px; font-weight: 900; margin-top: 12px; }
        .sis-detail-list { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
        .sis-detail-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line); font-size: 11px; }
        .sis-detail-row .label { color: var(--muted); font-weight: 800; }
        .sis-detail-row .value { color: var(--text); font-weight: 900; }
        .sis-detail-status { background: var(--green); color: #fff; border-radius: 8px; padding: 9px 12px; text-align: center; font-size: 11px; font-weight: 900; margin-top: 12px; }
        @media (max-width: 980px) { .sis-grid { grid-template-columns: 1fr; } .sis-admin-layout { flex-direction: column; } .sis-admin-sidebar { width: 100%; } .sis-metrics { grid-template-columns: repeat(2, minmax(160px, auto)); } }
      `}</style>

      <div className="sis-admin-layout">
        <aside className="sis-admin-sidebar">
          <nav className="sis-admin-nav">
            <button className={`sis-admin-nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}><CalendarDays size={16} /> Dashboard</button>
            <button className={`sis-admin-nav-item ${activePage === 'funcionarios' ? 'active' : ''}`} onClick={() => setActivePage('funcionarios')}><User size={16} /> Funcionários</button>
            <button className={`sis-admin-nav-item ${activePage === 'registros' ? 'active' : ''}`} onClick={() => setActivePage('registros')}><ChartNoAxesColumn size={16} /> Registros</button>
            <button className={`sis-admin-nav-item ${activePage === 'calendario' ? 'active' : ''}`} onClick={() => setActivePage('calendario')}><CalendarDays size={16} /> Calendário</button>
            <button className={`sis-admin-nav-item ${activePage === 'banco' ? 'active' : ''}`} onClick={() => setActivePage('banco')}><Clock3 size={16} /> Banco de horas</button>
            <button className={`sis-admin-nav-item ${activePage === 'justificativas' ? 'active' : ''}`} onClick={() => setActivePage('justificativas')}><Files size={16} /> Justificativas</button>
            <button className={`sis-admin-nav-item ${activePage === 'relatorios' ? 'active' : ''}`} onClick={() => setActivePage('relatorios')}><ChartNoAxesColumn size={16} /> Relatórios</button>
            <button className={`sis-admin-nav-item ${activePage === 'configuracoes' ? 'active' : ''}`} onClick={() => setActivePage('configuracoes')}><X size={16} /> Configurações</button>
          </nav>
        </aside>

        <section className="sis-admin-content">
          <header>
            <h1 className="sis-title">SIS Ponto</h1>
            <p className="sis-subtitle">Acompanhe a jornada da sua equipe</p>
          </header>

          {activePage === 'dashboard' && <>
          <section className="sis-metrics">
            <div className="sis-metric-card total">
              <span className="icon"><User size={22} /></span>
              <div>
                <div className="number">{funcionarios.length}</div>
                <div className="label">Total de colaboradores</div>
              </div>
            </div>
            <div className="sis-metric-card present">
              <span className="icon"><CalendarDays size={22} /></span>
              <div>
                <div className="number">{presentes}</div>
                <div className="label">Presentes</div>
              </div>
            </div>
            <div className="sis-metric-card late">
              <span className="icon"><Clock3 size={22} /></span>
              <div>
                <div className="number">{atrasados}</div>
                <div className="label">Atrasados</div>
              </div>
            </div>
            <div className="sis-metric-card absent">
              <span className="icon"><X size={22} /></span>
              <div>
                <div className="number">{ausentes}</div>
                <div className="label">Ausentes</div>
              </div>
            </div>
          </section>

          <section className="sis-filterbar">
            <div className="sis-filter-group">
              <CalendarDays size={16} color="#3177dd" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="sis-filter-group">
              <User size={16} color="#3177dd" />
              <select value={funcionarioFiltro} onChange={(e) => { setFuncionarioFiltro(e.target.value); const f = funcionarios.find((x) => x.nome === e.target.value); if (f) setFuncionarioSelecionado(f); }}>
                <option>Todos os funcionários</option>
                {funcionarios.map((f) => <option key={f.nome}>{f.nome}</option>)}
              </select>
            </div>
            <div className="sis-filter-group">
              <ChartNoAxesColumn size={16} color="#3177dd" />
              <select value={setorFiltro} onChange={(e) => setSetorFiltro(e.target.value)}>
                <option>Todos os setores</option>
                {setores.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sis-filter-group">
              <Clock3 size={16} color="#3177dd" />
              <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
                <option>Todos os status</option>
                <option>Normal</option>
                <option>Atrasado</option>
                <option>Ausente</option>
                <option>Trabalhando</option>
              </select>
            </div>
            <button className="sis-export-button" onClick={exportarRelatorio}>Exportar relatório</button>
          </section>

          <section className="sis-grid">
            <section className="sis-table-card">
              <div className="sis-table-head">
                <span className="left">Funcionários</span>
                <span className="right">{filtered.length} funcionários</span>
              </div>
              <table className="sis-table">
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Entrada</th>
                    <th>Intervalo</th>
                    <th>Retorno</th>
                    <th>Saída</th>
                    <th>Total de horas</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="sis-employee">
                          <span className="sis-avatar">{f.nome.split(' ').map((n) => n[0]).slice(0,2).join('').toUpperCase()}</span>
                          <span className="sis-person">
                            <b>{f.nome}</b>
                            <small>{f.cargo}</small>
                          </span>
                        </div>
                      </td>
                      <td>{f.entrada}</td>
                      <td>{f.intervalo}</td>
                      <td>{f.retorno}</td>
                      <td>{f.saida}</td>
                      <td>{f.total}</td>
                      <td><span className={`sis-status ${f.status}`}>{f.status}</span></td>
                      <td><button className="sis-arrow" onClick={() => { setFuncionarioSelecionado(f); setActiveTab('resumo'); }}>›</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <aside className="sis-detail-panel">
              <div className="sis-person-detail">
                <div className="sis-detail-head">
                  <span className="sis-detail-avatar">{funcionarioSelecionado.nome.split(' ').map((n) => n[0]).slice(0,2).join('').toUpperCase()}</span>
                  <div>
                    <div className="sis-detail-person-name">{funcionarioSelecionado.nome}</div>
                    <div className="sis-detail-person-setor">{funcionarioSelecionado.setor} · {funcionarioSelecionado.cargo}</div>
                  </div>
                </div>
                <div className="sis-detail-tabs">
                  <button className={activeTab === 'resumo' ? 'active' : ''} onClick={() => setActiveTab('resumo')}>Resumo</button>
                  <button className={activeTab === 'historico' ? 'active' : ''} onClick={() => setActiveTab('historico')}>Histórico</button>
                  <button className={activeTab === 'justificativas' ? 'active' : ''} onClick={() => setActiveTab('justificativas')}>Justificativas</button>
                </div>

                {activeTab === 'resumo' && (
                  <>
                    <div className="sis-detail-date">Hoje — {date}</div>
                    <div className="sis-detail-list">
                      <div className="sis-detail-row"><span className="label">Entrada</span><span className="value">{funcionarioSelecionado.entrada}</span></div>
                      <div className="sis-detail-row"><span className="label">Intervalo</span><span className="value">{funcionarioSelecionado.intervalo}</span></div>
                      <div className="sis-detail-row"><span className="label">Retorno</span><span className="value">{funcionarioSelecionado.retorno}</span></div>
                      <div className="sis-detail-row"><span className="label">Saída</span><span className="value">{funcionarioSelecionado.saida}</span></div>
                      <div className="sis-detail-row"><span className="label">Jornada prevista</span><span className="value">{funcionarioSelecionado.jornadaPrevista}</span></div>
                      <div className="sis-detail-row"><span className="label">Jornada realizada</span><span className="value">{funcionarioSelecionado.jornadaRealizada}</span></div>
                      <div className="sis-detail-row"><span className="label">Saldo banco</span><span className="value">{funcionarioSelecionado.banco}</span></div>
                    </div>
                    <div className="sis-detail-status">{funcionarioSelecionado.status}</div>
                  </>
                )}

                {activeTab === 'historico' && (
                  <>
                    <div className="sis-detail-date">Histórico do mês</div>
                    <div className="sis-detail-list">
                      <div className="sis-detail-row"><span className="label">Semana 01</span><span className="value">40h</span></div>
                      <div className="sis-detail-row"><span className="label">Semana 02</span><span className="value">42h</span></div>
                      <div className="sis-detail-row"><span className="label">Semana 03</span><span className="value">39h</span></div>
                      <div className="sis-detail-row"><span className="label">Semana 04</span><span className="value">41h</span></div>
                    </div>
                  </>
                )}

                {activeTab === 'justificativas' && (
                  <>
                    <div className="sis-detail-date">Justificativas</div>
                    <div className="sis-detail-list">
                      <div className="sis-detail-row"><span className="label">Atestado</span><span className="value">01 dia</span></div>
                      <div className="sis-detail-row"><span className="label">Atraso</span><span className="value">02 ocorr.</span></div>
                      <div className="sis-detail-row"><span className="label">Ausência</span><span className="value">Sem</span></div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                  <button className="sis-arrow" onClick={() => {
                    const idx = funcionarios.findIndex((f) => f.nome === funcionarioSelecionado.nome);
                    const next = funcionarios[(idx + 1) % funcionarios.length];
                    setFuncionarioSelecionado(next);
                    setFuncionarioFiltro(next.nome);
                  }}>›</button>
                  <span style={{ color: '#718398', fontSize: 11, fontWeight: 800 }}>Detalhe do funcionário</span>
                </div>
              </div>
            </aside>
          </section>
          </>}

          {activePage === 'banco' && (
            <section className="sis-banco-view">
              {BancoHoras()}
            </section>
          )}

          {activePage === 'justificativas' && (
            <section className="sis-justificativas-view">
              {Justificativas()}
            </section>
          )}

          {activePage === 'relatorios' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 26, minHeight: 280 }}><h2 style={{ margin: 0, fontSize: 20 }}>Relatórios</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Relatórios e exportações do SIS Ponto aparecerão aqui.</p><button onClick={exportarRelatorio} type="button" style={{ border: 0, borderRadius: 9, padding: '11px 15px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Exportar relatório</button></Card>
            </section>
          )}

          {activePage === 'configuracoes' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 26, minHeight: 280 }}><h2 style={{ margin: 0, fontSize: 20 }}>Configurações</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Configuração de controle de ponto e regras da jornada.</p></Card>
            </section>
          )}

          {activePage === 'funcionarios' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 26, minHeight: 280 }}><h2 style={{ margin: 0, fontSize: 20 }}>Funcionários</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Painel de colaboradores com a visão do dia selecionado.</p><div className="sis-filterbar"><span style={{ fontSize: 12, fontWeight: 800, color: '#52637f' }}>{funcionarios.length} colaboradores</span></div></Card>
            </section>
          )}

          {activePage === 'registros' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 26, minHeight: 280 }}><h2 style={{ margin: 0, fontSize: 20 }}>Registros</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Acompanhe os registros legíveis do dia e do perfil.</p><button onClick={exportarRelatorio} type="button" style={{ border: 0, borderRadius: 9, padding: '11px 15px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Exportar relatório</button></Card>
            </section>
          )}

          {activePage === 'calendario' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 26, minHeight: 280 }}><h2 style={{ margin: 0, fontSize: 20 }}>Calendário</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Calendário do SIS Ponto com a data escolhida: {date}</p><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Card>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

const navButton = { width: 38, height: 38, border: '1px solid #dfe7f2', borderRadius: 8, background: '#fff', color: '#405371', display: 'grid', placeItems: 'center', cursor: 'pointer' };
function MenuPonto({ ativo, icon, texto, onClick }) {
  return <motion.button type="button" whileHover={{ x: 3 }} whileTap={{ scale: .98 }} onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '11px 10px', border: 0, borderRadius: 9, cursor: 'pointer', background: ativo ? '#eaf2ff' : 'transparent', color: ativo ? '#1767e8' : '#5b6d89', fontSize: 12, fontWeight: 800, textAlign: 'left' }}>{icon}{texto}</motion.button>;
}
function Legenda({ cor, texto }) { return <span style={{ display: 'flex', gap: 7, alignItems: 'center' }}><i style={{ width: 9, height: 9, borderRadius: '50%', background: cor }} />{texto}</span>; }
function Resumo({ icon, cor, label, valor }) { return <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid #eef2f7' }}><span style={{ color: cor }}>{icon}</span><span style={{ flex: 1, color: '#62738f', fontSize: 13, fontWeight: 700 }}>{label}</span><strong>{valor}</strong></div>; }

function Justificativas() {
  return <Card style={{ padding: 26, minHeight: 410 }}><h2 style={{ margin: 0, fontSize: 20 }}>Justificativas</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Envie documentos e acompanhe solicitações de ausência, atraso ou atestado.</p><button type="button" style={{ border: 0, borderRadius: 9, padding: '11px 15px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Nova justificativa</button><div style={{ marginTop: 24, padding: 28, border: '1px dashed #cbd8eb', borderRadius: 12, textAlign: 'center', color: '#7183a3', fontSize: 13 }}>Nenhuma justificativa cadastrada neste protótipo.</div></Card>;
}
function BancoHoras() {
  return <Card style={{ padding: 26, minHeight: 410 }}><h2 style={{ margin: 0, fontSize: 20 }}>Banco de horas</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Acompanhe o saldo de horas e as compensações do período.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}><Saldo titulo="Saldo atual" valor="00:00" cor="#1767e8" /><Saldo titulo="Créditos" valor="00:00" cor="#38bc7b" /><Saldo titulo="Débitos" valor="00:00" cor="#ff5d66" /></div><div style={{ marginTop: 24, padding: 28, border: '1px dashed #cbd8eb', borderRadius: 12, textAlign: 'center', color: '#7183a3', fontSize: 13 }}>O histórico de compensações aparecerá aqui.</div></Card>;
}
function Saldo({ titulo, valor, cor }) { return <div style={{ padding: 18, borderRadius: 11, background: '#f8faff', border: '1px solid #e5edf8' }}><div style={{ color: '#7183a3', fontSize: 12, fontWeight: 800 }}>{titulo}</div><strong style={{ display: 'block', marginTop: 8, fontSize: 24, color: cor }}>{valor}</strong></div>; }
function ModalRegistros({ registros, statusRegistro, horarioEsperado, onExcluir, onClose }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15,30,55,.42)', zIndex: 80 }}><motion.section initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} role="dialog" aria-modal="true" aria-label="Registros de hoje" onMouseDown={(event) => event.stopPropagation()} style={{ width: 'min(440px, 100%)', background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 22px 60px rgba(0,0,0,.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}><div><h2 style={{ margin: 0, fontSize: 18 }}>Registros de hoje</h2><p style={{ margin: '4px 0 16px', color: '#7183a3', fontSize: 12 }}>Lapso temporal da sua jornada</p></div><button type="button" onClick={onClose} aria-label="Fechar" style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button></div>{registros.map((registro, indice) => { const status = statusRegistro(registro, indice, registros); const previsto = horarioEsperado(indice, registros)[1]; return <div key={registro} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid #edf1f6' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'Normal' ? (indice % 2 ? '#ef5350' : '#38bc7b') : '#ffb24a' }} /><div style={{ flex: 1 }}><strong>{indice % 2 ? 'Saída' : 'Entrada'}</strong><div style={{ marginTop: 2, color: status === 'Normal' ? '#7183a3' : '#d97706', fontSize: 11, fontWeight: 700 }}>{status} · previsto {previsto}</div></div><span style={{ color: '#4e607e', fontWeight: 700 }}>{hora(new Date(registro))}</span><button type="button" onClick={() => onExcluir(indice)} aria-label={`Excluir registro de ${indice % 2 ? 'saída' : 'entrada'}`} title="Excluir registro" style={{ border: 0, borderRadius: 7, background: '#fff0f1', color: '#e5484d', padding: 7, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Trash2 size={15} /></button></div>; })}<p style={{ margin: '16px 0 0', padding: 12, background: '#f4f8ff', borderRadius: 9, color: '#42618d', fontSize: 12, fontWeight: 700 }}>Os intervalos e o total trabalhado serão calculados quando o SIS Ponto estiver integrado ao banco de dados.</p></motion.section></motion.div>; }
