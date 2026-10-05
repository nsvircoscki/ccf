import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Trash2, X } from 'lucide-react';
import { hora, formatMinutos, formatSaldoMinutos } from './sisPontoUtils.js';

export const navButton = { width: 38, height: 38, border: '1px solid #dfe7f2', borderRadius: 8, background: '#fff', color: '#405371', display: 'grid', placeItems: 'center', cursor: 'pointer' };

export function ConfirmacaoPonto({ titulo, mensagem, confirmar, onClose, icone, destrutivo = false }) {
  const Icone = icone || (destrutivo ? Trash2 : Clock3);
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(18, 37, 74, .32)', backdropFilter: 'blur(3px)' }}>
    <motion.section initial={{ opacity: 0, y: 12, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} style={{ width: 'min(390px, 100%)', border: '1px solid #dbe7f7', borderRadius: 18, padding: 24, background: '#fff', boxShadow: '0 24px 70px rgba(20, 48, 95, .22)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 12, background: destrutivo ? '#ffecef' : '#eaf2ff', color: destrutivo ? '#c23b34' : '#1767e8' }}><Icone size={21} /></span><div><h2 style={{ margin: 0, color: '#1d3156', fontSize: 18 }}>{titulo}</h2><p style={{ margin: '5px 0 0', color: '#7183a3', fontSize: 12, fontWeight: 600 }}>SIS Ponto</p></div></div>
      <p style={{ margin: '22px 0', color: '#405371', fontSize: 14, lineHeight: 1.5 }}>{mensagem}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}><button type="button" onClick={onClose} style={{ border: '1px solid #d8e4f3', borderRadius: 9, padding: '10px 15px', background: '#fff', color: '#52637f', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button><button type="button" onClick={confirmar} style={{ border: 0, borderRadius: 9, padding: '10px 17px', background: destrutivo ? '#e5484d' : '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Confirmar</button></div>
    </motion.section>
  </motion.div>;
}

// Switch deslizante (arrasta/clica pra direita = ligado) — usado no lugar de
// checkbox sempre que a opção é binária e vale mostrar o estado visualmente.
export function Switch({ ligado, onChange, corLigado = '#e4544e' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => onChange(!ligado)}
      style={{ position: 'relative', width: 44, height: 24, borderRadius: 999, border: 0, padding: 0, cursor: 'pointer', background: ligado ? corLigado : '#cbd5e1', transition: 'background .18s ease', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: 2, left: ligado ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.3)', transition: 'left .18s ease' }} />
    </button>
  );
}

// Popup próprio para coletar texto (nome, setor etc.), no lugar de window.prompt.
export function FormularioModal({ titulo, campos, textoConfirmar = 'Salvar', confirmar, onClose }) {
  const [valores, setValores] = useState(() => Object.fromEntries(campos.map((campo) => [campo.nome, campo.tipo === 'switch' ? Boolean(campo.valorInicial) : (campo.valorInicial || '')])));
  const podeConfirmar = campos.every((campo) => campo.tipo === 'switch' || !campo.obrigatorio || valores[campo.nome]?.trim());
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(18, 37, 74, .32)', backdropFilter: 'blur(3px)' }}>
    <motion.section initial={{ opacity: 0, y: 12, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} style={{ width: 'min(390px, 100%)', border: '1px solid #dbe7f7', borderRadius: 18, padding: 24, background: '#fff', boxShadow: '0 24px 70px rgba(20, 48, 95, .22)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}><span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 12, background: '#eaf2ff', color: '#1767e8' }}><Clock3 size={21} /></span><div><h2 style={{ margin: 0, color: '#1d3156', fontSize: 18 }}>{titulo}</h2><p style={{ margin: '5px 0 0', color: '#7183a3', fontSize: 12, fontWeight: 600 }}>SIS Ponto</p></div></div>
      <div style={{ display: 'grid', gap: 12 }}>
        {campos.map((campo) => campo.tipo === 'switch' ? (
          <div key={campo.nome} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 9, background: valores[campo.nome] ? '#fff1f0' : '#f8fbff', border: `1px solid ${valores[campo.nome] ? '#f6c8c4' : '#e5edf8'}` }}>
            <span>
              <strong style={{ display: 'block', color: '#243755', fontSize: 12 }}>{campo.label}</strong>
              {campo.descricao && <span style={{ color: '#7183a3', fontSize: 11, fontWeight: 600 }}>{campo.descricao}</span>}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: valores[campo.nome] ? '#be3747' : '#2b8761' }}>{valores[campo.nome] ? (campo.rotuloLigado || 'Sim') : (campo.rotuloDesligado || 'Não')}</span>
              <Switch ligado={Boolean(valores[campo.nome])} onChange={(novoValor) => setValores((atuais) => ({ ...atuais, [campo.nome]: novoValor }))} />
            </span>
          </div>
        ) : (
          <label key={campo.nome} style={{ display: 'grid', gap: 5, fontSize: 11, fontWeight: 800, color: '#7183a3' }}>{campo.label}
            <input autoFocus={campo === campos[0]} value={valores[campo.nome]} placeholder={campo.placeholder} onChange={(event) => setValores((atuais) => ({ ...atuais, [campo.nome]: event.target.value }))} style={{ height: 40, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 10px', fontSize: 13, fontWeight: 700, color: '#405371' }} />
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 22 }}><button type="button" onClick={onClose} style={{ border: '1px solid #d8e4f3', borderRadius: 9, padding: '10px 15px', background: '#fff', color: '#52637f', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button><button type="button" disabled={!podeConfirmar} onClick={() => confirmar(valores)} style={{ border: 0, borderRadius: 9, padding: '10px 17px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: podeConfirmar ? 'pointer' : 'default', opacity: podeConfirmar ? 1 : .6 }}>{textoConfirmar}</button></div>
    </motion.section>
  </motion.div>;
}

export function Card({ children, style }) {
  return <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32, ease: 'easeOut' }} style={{ background: '#fff', border: '1px solid #e7edf6', borderRadius: 14, boxShadow: '0 4px 18px rgba(15, 35, 70, .035)', ...style }}>{children}</motion.section>;
}

export function MenuPonto({ ativo, icon, texto, onClick, badge = 0 }) {
  return <motion.button type="button" whileHover={{ x: 3 }} whileTap={{ scale: .98 }} onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '11px 10px', border: 0, borderRadius: 9, cursor: 'pointer', background: ativo ? '#eaf2ff' : 'transparent', color: ativo ? '#1767e8' : '#5b6d89', fontSize: 12, fontWeight: 800, textAlign: 'left' }}>
    {icon}{texto}
    {badge > 0 && (
      <span style={{ marginLeft: 'auto', minWidth: 20, height: 20, padding: '0 5px', borderRadius: 999, background: '#e5484d', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: ativo ? '0 0 0 2px #eaf2ff' : '0 0 0 2px #fff' }}>
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </motion.button>;
}

export function Legenda({ cor, texto }) { return <span style={{ display: 'flex', gap: 7, alignItems: 'center' }}><i style={{ width: 9, height: 9, borderRadius: '50%', background: cor }} />{texto}</span>; }

export function Resumo({ icon, cor, label, valor }) { return <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid #eef2f7' }}><span style={{ color: cor }}>{icon}</span><span style={{ flex: 1, color: '#62738f', fontSize: 13, fontWeight: 700 }}>{label}</span><strong>{valor}</strong></div>; }

export function Justificativas() {
  return <Card style={{ padding: 26, minHeight: 410 }}><h2 style={{ margin: 0, fontSize: 20 }}>Justificativas</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Envie documentos e acompanhe solicitações de ausência, atraso ou atestado.</p><button type="button" style={{ border: 0, borderRadius: 9, padding: '11px 15px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Nova justificativa</button><div style={{ marginTop: 24, padding: 28, border: '1px dashed #cbd8eb', borderRadius: 12, textAlign: 'center', color: '#7183a3', fontSize: 13 }}>Nenhuma justificativa cadastrada neste protótipo.</div></Card>;
}

export function Saldo({ titulo, valor, cor }) { return <div style={{ padding: 18, borderRadius: 11, background: '#f8faff', border: '1px solid #e5edf8' }}><div style={{ color: '#7183a3', fontSize: 12, fontWeight: 800 }}>{titulo}</div><strong style={{ display: 'block', marginTop: 8, fontSize: 24, color: cor }}>{valor}</strong></div>; }

// Banco de horas acumulado no mês (ver calcularBancoHoras em sisPontoUtils.js).
// itens: [{ id, nome, setor, banco }] — banco = resultado de calcularBancoHoras.
export function BancoHoras({ itens = [], rotulo = '', onExcluirLancamento, children }) {
  const comBanco = itens.filter((item) => !item.banco?.semBanco);
  const soma = (campo) => comBanco.reduce((acc, item) => acc + (item.banco?.[campo] || 0), 0);
  const trabalhado = itens.reduce((acc, item) => acc + (item.banco?.trabalhado || 0), 0);
  const saldo = soma('saldo');
  // Hoje fica fora do saldo (só fecha amanhã), mas aparece com as horas até agora.
  const comHoje = itens.filter((item) => item.banco?.hoje);
  const hojeTrabalhado = comHoje.reduce((acc, item) => acc + item.banco.hoje.trabalhado, 0);
  const previstoUnico = comHoje.length === 1 ? comHoje[0].banco.hoje.previsto : 0;
  const textoHoje = (hoje) => [
    formatMinutos(hoje.trabalhado) + (hoje.previsto ? ` de ${formatMinutos(hoje.previsto)}` : ''),
    hoje.feriado,
    hoje.emAndamento ? 'em andamento' : null,
  ].filter(Boolean).join(' · ');
  return <Card style={{ padding: 26, minHeight: 410 }}>
    <h2 style={{ margin: 0, fontSize: 20 }}>Banco de horas</h2>
    <p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Saldo acumulado {rotulo ? `de ${rotulo}` : 'do mês'}, só com dias já encerrados: horas trabalhadas + justificativas aceitas − jornada prevista.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
      <Saldo titulo="Horas registradas" valor={formatMinutos(trabalhado)} cor="#1767e8" />
      <Saldo titulo="Créditos" valor={formatSaldoMinutos(soma('creditos'))} cor="#38bc7b" />
      <Saldo titulo="Débitos" valor={formatSaldoMinutos(-soma('debitos'))} cor="#ff5d66" />
      <Saldo titulo="Saldo" valor={formatSaldoMinutos(saldo)} cor={saldo < 0 ? '#ff5d66' : '#38bc7b'} />
      {comHoje.length > 0 && <Saldo titulo={comHoje.length === 1 ? `Hoje até agora${previstoUnico ? ` (de ${formatMinutos(previstoUnico)})` : ''}` : 'Hoje até agora (todos)'} valor={formatMinutos(hojeTrabalhado)} cor="#7c3aed" />}
    </div>
    {comHoje.length > 0 && <p style={{ margin: '10px 0 0', color: '#7183a3', fontSize: 11, fontWeight: 600 }}>As horas de hoje entram no saldo amanhã, quando o dia fecha.</p>}
    {children}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginTop: 20 }}>
      {itens.length ? itens.map((item) => {
        const banco = item.banco || {};
        return <div key={item.id} style={{ padding: 14, borderRadius: 10, border: '1px solid #e5edf8', background: '#f8fbff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 12, fontWeight: 900, color: '#1d3156' }}>{item.nome}</span><span style={{ fontSize: 11, fontWeight: 800, color: '#7183a3' }}>{item.setor}</span></div>
          <div style={{ display: 'grid', gap: 7, marginTop: 12, color: '#405371', fontSize: 11, fontWeight: 700 }}>
            <span>Horas: <b style={{ color: '#1767e8' }}>{formatMinutos(banco.trabalhado || 0)}</b></span>
            {banco.hoje && <span>Hoje: <b style={{ color: '#7c3aed' }}>{textoHoje(banco.hoje)}</b></span>}
            {banco.semBanco
              ? <span style={{ color: '#7183a3' }}>Sem banco (horista ou sem jornada)</span>
              : <>
                <span>Créditos: <b style={{ color: '#38bc7b' }}>{formatSaldoMinutos(banco.creditos || 0)}</b> · Débitos: <b style={{ color: '#ff5d66' }}>{formatSaldoMinutos(-(banco.debitos || 0))}</b></span>
                <span>Saldo: <b style={{ color: (banco.saldo || 0) < 0 ? '#ff5d66' : '#38bc7b' }}>{formatSaldoMinutos(banco.saldo || 0)}</b></span>
                {banco.lancamentos?.length > 0 && <div style={{ display: 'grid', gap: 4, paddingTop: 6, borderTop: '1px dashed #d8e6fc' }}>
                  {banco.lancamentos.map((l) => <span key={l.id} title={`Lançado por ${l.por || '—'}`} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <b style={{ color: l.minutos < 0 ? '#ff5d66' : '#38bc7b', whiteSpace: 'nowrap' }}>{formatSaldoMinutos(l.minutos)}</b>
                    <span style={{ color: '#7183a3', minWidth: 0 }}>{l.dia.split('-').reverse().slice(0, 2).join('/')} · {l.motivo}</span>
                    {onExcluirLancamento && <button type="button" onClick={() => onExcluirLancamento(l)} aria-label="Excluir lançamento" title="Excluir lançamento" style={{ marginLeft: 'auto', border: 0, background: 'none', color: '#be3747', cursor: 'pointer', fontWeight: 900, padding: 0 }}>×</button>}
                  </span>)}
                </div>}
              </>}
          </div>
        </div>;
      }) : <div style={{ color: '#7183a3', fontSize: 13 }}>Sem funcionários registrados.</div>}
    </div>
  </Card>;
}

// Lançamento manual no banco de horas (só a gestão do ponto): saldo trazido de
// antes do sistema, crédito ou débito combinado. Motivo obrigatório.
export function FormLancamentoBanco({ funcionarios = [], onLancar }) {
  const hoje = new Date();
  const vazio = { funcionarioId: '', dia: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`, sinal: 1, horas: '', minutos: '', motivo: '' };
  const [form, setForm] = useState(vazio);
  const [estado, setEstado] = useState({ enviando: false, erro: null, ok: null });
  const mudar = (campo) => (e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }));
  const enviar = async () => {
    const total = (Number(form.horas) || 0) * 60 + (Number(form.minutos) || 0);
    if (!form.funcionarioId) { setEstado({ enviando: false, erro: 'Escolha o funcionário.', ok: null }); return; }
    if (!total) { setEstado({ enviando: false, erro: 'Informe as horas.', ok: null }); return; }
    if (form.motivo.trim().length < 3) { setEstado({ enviando: false, erro: 'Informe o motivo.', ok: null }); return; }
    setEstado({ enviando: true, erro: null, ok: null });
    try {
      await onLancar({ funcionarioId: form.funcionarioId, dia: form.dia, minutos: Number(form.sinal) * total, motivo: form.motivo.trim() });
      setForm({ ...vazio, funcionarioId: form.funcionarioId, dia: form.dia });
      setEstado({ enviando: false, erro: null, ok: 'Lançado. Entra no saldo do mês do dia escolhido.' });
    } catch (e) {
      setEstado({ enviando: false, erro: e?.message || 'Não foi possível lançar.', ok: null });
    }
  };
  const rotulo = { display: 'grid', gap: 5, fontSize: 11, fontWeight: 800, color: '#7183a3', minWidth: 0 };
  return <div style={{ marginTop: 20, padding: 16, borderRadius: 12, border: '1px solid #e5edf8', background: '#fbfdff' }}>
    <h3 style={{ margin: 0, fontSize: 14, color: '#1d3156' }}>Lançar horas no banco</h3>
    <p style={{ margin: '4px 0 12px', color: '#7183a3', fontSize: 12, fontWeight: 600 }}>Saldo de antes do sistema, crédito ou débito combinado. Aparece para o funcionário com o motivo.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10 }}>
      <label style={rotulo}>Funcionário
        <select value={form.funcionarioId} onChange={mudar('funcionarioId')} style={{ ...campoCorrecao, width: '100%' }}>
          <option value="">Selecione...</option>
          {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </label>
      <label style={rotulo}>Dia
        <input type="date" value={form.dia} onChange={mudar('dia')} style={{ ...campoCorrecao, width: '100%', boxSizing: 'border-box' }} />
      </label>
      <label style={rotulo}>Tipo
        <select value={form.sinal} onChange={mudar('sinal')} style={{ ...campoCorrecao, width: '100%' }}>
          <option value={1}>Crédito (+)</option>
          <option value={-1}>Débito (−)</option>
        </select>
      </label>
      <div style={rotulo}>Horas
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="number" min={0} max={999} placeholder="h" value={form.horas} onChange={mudar('horas')} aria-label="Horas" style={{ ...campoCorrecao, width: 70 }} />
          <span>:</span>
          <input type="number" min={0} max={59} placeholder="min" value={form.minutos} onChange={mudar('minutos')} aria-label="Minutos" style={{ ...campoCorrecao, width: 70 }} />
        </div>
      </div>
    </div>
    <label style={{ ...rotulo, marginTop: 10 }}>Motivo
      <input type="text" maxLength={500} value={form.motivo} onChange={mudar('motivo')} placeholder="Ex.: saldo do banco antes do sistema" style={{ ...campoCorrecao, width: '100%', boxSizing: 'border-box' }} />
    </label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
      <button type="button" disabled={estado.enviando} onClick={enviar} style={{ border: 0, borderRadius: 8, padding: '9px 16px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer', opacity: estado.enviando ? .7 : 1 }}>{estado.enviando ? 'Lançando...' : 'Lançar'}</button>
      {estado.ok && <span style={{ color: '#1f9d63', fontSize: 12, fontWeight: 700 }}>{estado.ok}</span>}
      {estado.erro && <span style={{ color: '#c23b34', fontSize: 12, fontWeight: 700 }}>{estado.erro}</span>}
    </div>
  </div>;
}

const campoCorrecao = { height: 36, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 8px', fontSize: 13, fontWeight: 700, color: '#405371', background: '#fff' };
const textoCorrecao = { ...campoCorrecao, height: 'auto', minHeight: 56, padding: 8, fontWeight: 600, fontFamily: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' };

// Inclusão de batida pelo ENG dentro do "Corrigir". O tipo sugerido segue a
// alternância (depois de uma entrada, uma saída) e o horário é o da jornada.
// Motivo obrigatório: fica gravado junto do ajuste.
function FormAdicionarBatida({ onAdicionar, tipoSugerido, horaSugerida }) {
  const [tipo, setTipo] = useState(tipoSugerido);
  const [horario, setHorario] = useState(horaSugerida || '');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const enviar = async () => {
    if (!/^\d{2}:\d{2}$/.test(horario)) { setErro('Informe o horário.'); return; }
    if (motivo.trim().length < 5) { setErro('Informe o motivo da inclusão.'); return; }
    setEnviando(true);
    setErro(null);
    try {
      await onAdicionar({ tipo, horario, motivo: motivo.trim() });
      setHorario('');
      setMotivo('');
    } catch (e) {
      setErro(e?.message || 'Não foi possível incluir o registro.');
    } finally {
      setEnviando(false);
    }
  };
  return <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#f6faff', border: '1px solid #e2ebf8' }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: '#7183a3', marginBottom: 8 }}>INCLUIR BATIDA</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={campoCorrecao}><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option></select>
      <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} style={campoCorrecao} />
    </div>
    <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da inclusão (obrigatório). Ex.: esqueceu de bater a saída, confirmado com a chefia." style={{ ...textoCorrecao, marginTop: 8 }} />
    <button type="button" disabled={enviando} onClick={enviar} style={{ marginTop: 8, border: 0, borderRadius: 8, padding: '0 14px', height: 36, background: '#1767e8', color: '#fff', fontSize: 12, fontWeight: 800, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? .7 : 1 }}>{enviando ? 'Incluindo...' : 'Incluir registro'}</button>
    {erro && <div style={{ marginTop: 8, color: '#c23b34', fontSize: 12, fontWeight: 700 }}>{erro}</div>}
  </div>;
}

// Exclusão pelo ENG: pede o motivo no próprio item antes de excluir.
function ConfirmarExclusao({ onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const confirmar = async () => {
    if (motivo.trim().length < 5) { setErro('Informe o motivo da exclusão.'); return; }
    setEnviando(true);
    setErro(null);
    try {
      await onConfirmar(motivo.trim());
    } catch (e) {
      setErro(e?.message || 'Não foi possível excluir o registro.');
      setEnviando(false);
    }
  };
  return <div style={{ padding: '0 0 12px 22px' }}>
    <textarea autoFocus value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da exclusão (obrigatório). Ex.: registro duplicado." style={textoCorrecao} />
    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
      <button type="button" disabled={enviando} onClick={confirmar} style={{ border: 0, borderRadius: 8, padding: '7px 12px', background: '#e5484d', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>{enviando ? 'Excluindo...' : 'Excluir registro'}</button>
      <button type="button" disabled={enviando} onClick={onCancelar} style={{ border: '1px solid #d8e4f3', borderRadius: 8, padding: '7px 12px', background: '#fff', color: '#52637f', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
    </div>
    {erro && <div style={{ marginTop: 6, color: '#c23b34', fontSize: 12, fontWeight: 700 }}>{erro}</div>}
  </div>;
}

// Batidas de um dia. Com onExcluir/onAdicionar (só o ENG), vira a tela de
// correção. `ajustes`: Map(iso -> { motivo, por }) das batidas incluídas pelo ENG.
export function ModalRegistros({ registros, statusRegistro, horarioEsperado, onExcluir, onAdicionar, onClose, titulo = 'Registros de hoje', ajustes = new Map() }) {
  const [excluindo, setExcluindo] = useState(null);
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15,30,55,.42)', zIndex: 80 }}>
    <motion.section initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} role="dialog" aria-modal="true" aria-label={titulo} onMouseDown={(event) => event.stopPropagation()} style={{ width: 'min(460px, 100%)', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 22px 60px rgba(0,0,0,.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div><h2 style={{ margin: 0, fontSize: 18 }}>{titulo}</h2><p style={{ margin: '4px 0 16px', color: '#7183a3', fontSize: 12 }}>Lapso temporal da jornada</p></div>
        <button type="button" onClick={onClose} aria-label="Fechar" style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
      </div>
      {registros.map((registro, indice) => {
        const status = statusRegistro(registro, indice, registros);
        const previsto = horarioEsperado(indice, registros)[1];
        const ajuste = ajustes.get(registro);
        return <div key={registro} style={{ borderTop: '1px solid #edf1f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'Normal' ? (indice % 2 ? '#ef5350' : '#38bc7b') : '#ffb24a' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{indice % 2 ? 'Saída' : 'Entrada'}</strong>
              <div style={{ marginTop: 2, color: status === 'Normal' ? '#7183a3' : '#d97706', fontSize: 11, fontWeight: 700 }}>{status}{previsto ? ` · previsto ${previsto}` : ''}</div>
              {ajuste && <div style={{ marginTop: 3, color: '#7c3aed', fontSize: 11, fontWeight: 700 }}>Ajuste do ENG{ajuste.por ? ` (${ajuste.por})` : ''}: {ajuste.motivo || 'sem motivo registrado'}</div>}
            </div>
            <span style={{ color: '#4e607e', fontWeight: 700 }}>{hora(new Date(registro))}</span>
            {onExcluir && <button type="button" onClick={() => setExcluindo(excluindo === indice ? null : indice)} aria-label={`Excluir registro de ${indice % 2 ? 'saída' : 'entrada'}`} title="Excluir registro" style={{ border: 0, borderRadius: 7, background: '#fff0f1', color: '#e5484d', padding: 7, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Trash2 size={15} /></button>}
          </div>
          {onExcluir && excluindo === indice && <ConfirmarExclusao onCancelar={() => setExcluindo(null)} onConfirmar={async (motivo) => { await onExcluir(indice, motivo); setExcluindo(null); }} />}
        </div>;
      })}
      {!registros.length && <p style={{ margin: '4px 0 0', color: '#7183a3', fontSize: 12, fontWeight: 700 }}>Nenhum registro neste dia.</p>}
      {onAdicionar && <FormAdicionarBatida key={registros.length} onAdicionar={onAdicionar} tipoSugerido={registros.length % 2 ? 'SAIDA' : 'ENTRADA'} horaSugerida={horarioEsperado(registros.length, registros)[1]} />}
      <p style={{ margin: '16px 0 0', padding: 12, background: '#f4f8ff', borderRadius: 9, color: '#42618d', fontSize: 12, fontWeight: 700 }}>Os intervalos e o total trabalhado são calculados a partir da entrada, intervalo, retorno e saída do dia.</p>
    </motion.section>
  </motion.div>;
}
