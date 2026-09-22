import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Trash2, X } from 'lucide-react';
import { hora } from './sisPontoUtils.js';

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

export function MenuPonto({ ativo, icon, texto, onClick }) {
  return <motion.button type="button" whileHover={{ x: 3 }} whileTap={{ scale: .98 }} onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '11px 10px', border: 0, borderRadius: 9, cursor: 'pointer', background: ativo ? '#eaf2ff' : 'transparent', color: ativo ? '#1767e8' : '#5b6d89', fontSize: 12, fontWeight: 800, textAlign: 'left' }}>{icon}{texto}</motion.button>;
}

export function Legenda({ cor, texto }) { return <span style={{ display: 'flex', gap: 7, alignItems: 'center' }}><i style={{ width: 9, height: 9, borderRadius: '50%', background: cor }} />{texto}</span>; }

export function Resumo({ icon, cor, label, valor }) { return <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid #eef2f7' }}><span style={{ color: cor }}>{icon}</span><span style={{ flex: 1, color: '#62738f', fontSize: 13, fontWeight: 700 }}>{label}</span><strong>{valor}</strong></div>; }

export function Justificativas() {
  return <Card style={{ padding: 26, minHeight: 410 }}><h2 style={{ margin: 0, fontSize: 20 }}>Justificativas</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Envie documentos e acompanhe solicitações de ausência, atraso ou atestado.</p><button type="button" style={{ border: 0, borderRadius: 9, padding: '11px 15px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Nova justificativa</button><div style={{ marginTop: 24, padding: 28, border: '1px dashed #cbd8eb', borderRadius: 12, textAlign: 'center', color: '#7183a3', fontSize: 13 }}>Nenhuma justificativa cadastrada neste protótipo.</div></Card>;
}

export function Saldo({ titulo, valor, cor }) { return <div style={{ padding: 18, borderRadius: 11, background: '#f8faff', border: '1px solid #e5edf8' }}><div style={{ color: '#7183a3', fontSize: 12, fontWeight: 800 }}>{titulo}</div><strong style={{ display: 'block', marginTop: 8, fontSize: 24, color: cor }}>{valor}</strong></div>; }

export function BancoHoras(funcionarios = []) {
  const saldoTotal = funcionarios.reduce((acc, funcionario) => acc + (parseInt(funcionario.total?.replace(/h/g, ''), 10) || 0), 0);
  return <Card style={{ padding: 26, minHeight: 410 }}><h2 style={{ margin: 0, fontSize: 20 }}>Banco de horas</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Acompanhe o saldo de horas e as compensações do período.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}><Saldo titulo="Horas registradas" valor={`${String(Math.round(saldoTotal)).padStart(2, '0')}h00`} cor="#1767e8" /><Saldo titulo="Créditos" valor="00:00" cor="#38bc7b" /><Saldo titulo="Débitos" valor="00:00" cor="#ff5d66" /></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginTop: 20 }}>
      {funcionarios.length ? funcionarios.map((funcionario) => <div key={`${funcionario.nome}-${funcionario.setor}`} style={{ padding: 14, borderRadius: 10, border: '1px solid #e5edf8', background: '#f8fbff' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 12, fontWeight: 900, color: '#1d3156' }}>{funcionario.nome}</span><span style={{ fontSize: 11, fontWeight: 800, color: '#7183a3' }}>{funcionario.setor}</span></div><div style={{ display: 'grid', gap: 7, marginTop: 12, color: '#405371', fontSize: 11, fontWeight: 700 }}><span>Horas: <b style={{ color: '#1767e8' }}>{funcionario.total}</b></span><span>Banco: <b style={{ color: '#38bc7b' }}>{funcionario.banco || '+00h00'}</b></span><span>Status: <b>{funcionario.status}</b></span></div></div>) : <div style={{ color: '#7183a3', fontSize: 13 }}>Sem funcionários registrados.</div>}
    </div>
  </Card>;
}

export function ModalRegistros({ registros, statusRegistro, horarioEsperado, onExcluir, onClose }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15,30,55,.42)', zIndex: 80 }}><motion.section initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} role="dialog" aria-modal="true" aria-label="Registros de hoje" onMouseDown={(event) => event.stopPropagation()} style={{ width: 'min(440px, 100%)', background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 22px 60px rgba(0,0,0,.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}><div><h2 style={{ margin: 0, fontSize: 18 }}>Registros de hoje</h2><p style={{ margin: '4px 0 16px', color: '#7183a3', fontSize: 12 }}>Lapso temporal da sua jornada</p></div><button type="button" onClick={onClose} aria-label="Fechar" style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button></div>{registros.map((registro, indice) => { const status = statusRegistro(registro, indice, registros); const previsto = horarioEsperado(indice, registros)[1]; return <div key={registro} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid #edf1f6' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'Normal' ? (indice % 2 ? '#ef5350' : '#38bc7b') : '#ffb24a' }} /><div style={{ flex: 1 }}><strong>{indice % 2 ? 'Saída' : 'Entrada'}</strong><div style={{ marginTop: 2, color: status === 'Normal' ? '#7183a3' : '#d97706', fontSize: 11, fontWeight: 700 }}>{status}{previsto ? ` · previsto ${previsto}` : ''}</div></div><span style={{ color: '#4e607e', fontWeight: 700 }}>{hora(new Date(registro))}</span><button type="button" onClick={() => onExcluir(indice)} aria-label={`Excluir registro de ${indice % 2 ? 'saída' : 'entrada'}`} title="Excluir registro" style={{ border: 0, borderRadius: 7, background: '#fff0f1', color: '#e5484d', padding: 7, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Trash2 size={15} /></button></div>; })}<p style={{ margin: '16px 0 0', padding: 12, background: '#f4f8ff', borderRadius: 9, color: '#42618d', fontSize: 12, fontWeight: 700 }}>Os intervalos e o total trabalhado são calculados a partir da entrada, intervalo, retorno e saída do dia.</p></motion.section></motion.div>; }
