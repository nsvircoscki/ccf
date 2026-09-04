import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, FileText, Hourglass, LogIn, TimerReset, Trash2, X } from 'lucide-react';

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HORARIOS_ESPERADOS = [['Entrada', '07:30'], ['Saída', '12:00'], ['Entrada', '13:00'], ['Saída', '17:30']];
const chaveData = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
const hora = (data) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(data);

function Card({ children, style }) {
  return <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32, ease: 'easeOut' }} style={{ background: '#fff', border: '1px solid #e7edf6', borderRadius: 14, boxShadow: '0 4px 18px rgba(15, 35, 70, .035)', ...style }}>{children}</motion.section>;
}

export default function SisPontoView({ usuarioLogado }) {
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
