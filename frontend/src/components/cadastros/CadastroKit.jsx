import { useEffect, useRef, useState } from 'react';

/* ────────────────────────────────────────────────────────────
   Kit de UI compartilhado pelas telas de Cadastro (Cliente,
   Imóvel, Vinculação) — portado do design feito no Figma Make.
   ──────────────────────────────────────────────────────────── */

export const C = {
  // Azul padrão dos botões/ações primárias em todas as telas — o mesmo tom
  // usado na tela de Orçamento (#2D7AFD). Separado de "navy" porque navy é a
  // cor de marca (logo, avatar, login) e não deve mudar junto.
  accent: '#2D7AFD',
  navy: '#1a3a8a',
  navyDark: '#0e2549',
  green: '#2e8b2e',
  bg: '#f4f6fa',
  card: '#ffffff',
  border: '#e0e7f2',
  borderSoft: '#eef2f8',
  label: '#3a4a6b',
  muted: '#8899bb',
  text: '#0e2549',
  danger: '#be123c',
};
export const MONT = '"Montserrat", sans-serif';
export const SANS = '"Open Sans", sans-serif';

/* ── Icons ── */
export function Icon({ name, size = 15 }) {
  const p = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    id: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h3M15 12h3M7 15h10"/></>,
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>,
    map: <><path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3z"/><path d="M9 7v13M15 4v13"/></>,
    pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>,
    home: <><path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></>,
    doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
    brief: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    ring: <><circle cx="12" cy="14" r="6"/><path d="M9 7l3-4 3 4"/></>,
    folder: <path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2z"/>,
    hash: <><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></>,
    ruler: <path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4zM7 12l2 2M11 8l2 2M15 4l2 2"/>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
    scale: <><path d="M12 3v18M5 21h14M6 8l-3 6h6zM18 8l-3 6h6zM7 6l5-2 5 2"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {p[name] ?? null}
    </svg>
  );
}

/* ── Reveal (animação de abrir/fechar campos condicionais) ── */
export function Reveal({ open, children }) {
  // overflow só fica escondido enquanto fechado/animando — depois de aberto
  // precisa ficar visível, senão corta o painel flutuante de qualquer
  // SearchableSelect que esteja dentro (ex.: cônjuge, usufrutuário).
  const [overflowVisible, setOverflowVisible] = useState(open);
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setOverflowVisible(true), 380);
      return () => clearTimeout(t);
    }
    setOverflowVisible(false);
  }, [open]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: open ? '1fr' : '0fr',
      opacity: open ? 1 : 0,
      transition: 'grid-template-rows 0.38s cubic-bezier(0.22,0.61,0.36,1), opacity 0.3s ease',
    }}>
      <div style={{ overflow: overflowVisible ? 'visible' : 'hidden', minHeight: 0 }}>{children}</div>
    </div>
  );
}

/* ── Campo de texto ── */
export function Field({
  label, icon, value, onChange, placeholder, type = 'text', span = 1,
  textarea, rows = 3, disabled, onBlur, hint, list,
}) {
  const [focus, setFocus] = useState(false);
  const base = {
    width: '100%', boxSizing: 'border-box',
    border: `1.5px solid ${focus ? C.navy : C.border}`,
    borderRadius: 10, background: disabled ? '#f6f8fc' : '#fff',
    fontFamily: SANS, fontSize: 14, color: C.text, outline: 'none',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    boxShadow: focus ? `0 0 0 3px ${C.navy}1f` : 'none',
    padding: icon && !textarea ? '11px 14px 11px 38px' : '11px 14px',
    resize: 'vertical',
  };
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : 'auto' }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: MONT, fontWeight: 600, fontSize: 10.5, color: C.label,
        letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        {icon && <span style={{ color: C.muted, display: 'inline-flex' }}><Icon name={icon} size={13} /></span>}
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && !textarea && (
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: focus ? C.navy : C.muted, pointerEvents: 'none', display: 'inline-flex', transition: 'color 0.18s' }}>
            <Icon name={icon} size={15} />
          </span>
        )}
        {textarea ? (
          <textarea rows={rows} value={value} placeholder={placeholder} disabled={disabled}
            onChange={e => onChange(e.target.value)} onFocus={() => setFocus(true)}
            onBlur={() => { setFocus(false); onBlur?.(); }} style={{ ...base, fontFamily: 'inherit' }} />
        ) : (
          <input type={type} value={value} placeholder={placeholder} disabled={disabled} list={list}
            onChange={e => onChange(e.target.value)} onFocus={() => setFocus(true)}
            onBlur={() => { setFocus(false); onBlur?.(); }} style={base} />
        )}
      </div>
      {hint && <p style={{ fontFamily: SANS, fontSize: 11, color: C.muted, margin: '5px 2px 0' }}>{hint}</p>}
    </div>
  );
}

/* ── Select simples (nativo) ── */
export function SelectField({ label, icon, value, onChange, options, span = 1 }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : 'auto' }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONT, fontWeight: 600,
        fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        {icon && <span style={{ color: C.muted, display: 'inline-flex' }}><Icon name={icon} size={13} /></span>}
        {label}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '11px 14px',
          border: `1.5px solid ${focus ? C.navy : C.border}`, borderRadius: 10,
          background: '#fff', fontFamily: SANS, fontSize: 14, color: value ? C.text : C.muted,
          outline: 'none', cursor: 'pointer', appearance: 'none',
          boxShadow: focus ? `0 0 0 3px ${C.navy}1f` : 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238899bb' stroke-width='2' stroke-linecap='round'><path d='M4 6l4 4 4-4'/></svg>")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        }}>
        <option value="" disabled>Selecione…</option>
        {options.map(o => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );
}

/* ── Select pesquisável ── */
export function SearchableSelect({
  label, icon, options, value, onChange, placeholder = 'Buscar…', span = 1, accent = C.navy,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const boxRef = useRef(null);
  const selected = options.find(o => o.value === value) ?? null;

  useEffect(() => {
    const h = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(q.toLowerCase()) || (o.sub ?? '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : 'auto', position: 'relative' }} ref={boxRef}>
      {label && (
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONT, fontWeight: 600,
          fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          {icon && <span style={{ color: C.muted, display: 'inline-flex' }}><Icon name={icon} size={13} /></span>}
          {label}
        </label>
      )}
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', boxSizing: 'border-box', padding: '11px 40px 11px 14px', textAlign: 'left',
        border: `1.5px solid ${open ? accent : C.border}`, borderRadius: 10, background: '#fff',
        cursor: 'pointer', outline: 'none', position: 'relative',
        boxShadow: open ? `0 0 0 3px ${accent}1f` : 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
      }}>
        {selected ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.text }}>{selected.label}</span>
            {selected.sub && <span style={{ fontFamily: SANS, fontSize: 11.5, color: C.muted }}>{selected.sub}</span>}
          </span>
        ) : (
          <span style={{ fontFamily: SANS, fontSize: 14, color: C.muted }}>{placeholder}</span>
        )}
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'inline-flex' }}>
          <Icon name="search" size={16} />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', zIndex: 30, top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
          boxShadow: '0 12px 34px rgba(14,37,73,0.14)', overflow: 'hidden',
          animation: 'fadeUp 0.18s ease both',
        }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${C.borderSoft}` }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Digite para filtrar…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: `1.5px solid ${C.border}`,
                borderRadius: 8, fontFamily: SANS, fontSize: 13.5, color: C.text, outline: 'none' }} />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {value && (
              <button type="button" onClick={() => { onChange(null); setOpen(false); setQ(''); }} style={{
                width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, color: C.danger,
              }}>Limpar seleção</button>
            )}
            {filtered.map(o => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px', background: value === o.value ? `${accent}0f` : 'none',
                  border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 1,
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${accent}0f`}
                onMouseLeave={e => e.currentTarget.style.background = value === o.value ? `${accent}0f` : 'transparent'}>
                <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.text }}>{o.label}</span>
                {o.sub && <span style={{ fontFamily: SANS, fontSize: 11.5, color: C.muted }}>{o.sub}</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '18px 14px', fontFamily: SANS, fontSize: 13, color: C.muted, textAlign: 'center' }}>
                Nenhum registro encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Toggle segmentado (ex.: Matrícula/Transcrição) ── */
export function Segmented({ options, value, onChange, accent = C.navy }) {
  return (
    <div style={{ display: 'inline-flex', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 3, gap: 3 }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{
            padding: '8px 18px', border: 'none', borderRadius: 8, cursor: 'pointer',
            fontFamily: MONT, fontWeight: 600, fontSize: 12.5,
            color: on ? '#fff' : C.label,
            background: on ? `linear-gradient(135deg, ${accent}, ${C.green})` : 'transparent',
            boxShadow: on ? `0 4px 12px ${accent}44` : 'none', transition: 'all 0.2s ease',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

/* ── Switch (Sim/Não) ── */
export function Switch({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} role="switch" aria-checked={value} style={{
      width: 52, height: 28, borderRadius: 20, border: 'none', cursor: 'pointer', position: 'relative',
      background: value ? `linear-gradient(135deg, ${C.navy}, ${C.green})` : '#cbd5e8',
      transition: 'background 0.25s ease', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: value ? 27 : 3, width: 22, height: 22, borderRadius: '50%',
        background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </button>
  );
}

/* ── Seleção múltipla: busca pra adicionar + chips removíveis ── */
export function ChipList({
  label, icon, options, values, onChange, placeholder = 'Buscar…', span = 2, accent = C.navy, emptyHint,
}) {
  const disponiveis = options.filter((o) => !values.includes(o.value));
  const selecionados = values.map((v) => options.find((o) => o.value === v)).filter(Boolean);

  const adicionar = (v) => { if (v && !values.includes(v)) onChange([...values, v]); };
  const remover = (v) => onChange(values.filter((id) => id !== v));

  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : 'auto' }}>
      <SearchableSelect label={label} icon={icon} accent={accent} span={span}
        options={disponiveis} value={null} onChange={adicionar} placeholder={placeholder} />
      {selecionados.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {selecionados.map((o) => (
            <span key={o.value} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 8px 7px 13px', borderRadius: 20,
              background: `${accent}12`, color: accent, fontFamily: MONT, fontWeight: 600, fontSize: 12.5,
            }}>
              {o.label}{o.sub ? <span style={{ fontWeight: 400, opacity: 0.8 }}> · {o.sub}</span> : null}
              <button type="button" onClick={() => remover(o.value)} aria-label="Remover" style={{
                width: 20, height: 20, borderRadius: '50%', border: 'none', background: `${accent}22`, color: accent,
                cursor: 'pointer', fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </span>
          ))}
        </div>
      ) : emptyHint ? (
        <p style={{ margin: '10px 2px 0', fontFamily: SANS, fontSize: 11.5, color: C.muted }}>{emptyHint}</p>
      ) : null}
    </div>
  );
}

/* ── Lista de checkboxes (ex.: escolher quais documentos gerar) ── */
export function CheckboxList({ options, values, onChange, accent = C.navy, span = 2 }) {
  const toggle = (v) => {
    onChange(values.includes(v) ? values.filter((id) => id !== v) : [...values, v]);
  };
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <label key={o.value} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
            border: `1.5px solid ${on ? accent : C.border}`, background: on ? `${accent}0d` : '#fff',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}>
            <input type="checkbox" checked={on} onChange={() => toggle(o.value)}
              style={{ width: 16, height: 16, accentColor: accent, cursor: 'pointer', flexShrink: 0 }} />
            <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: C.text }}>{o.label}</span>
          </label>
        );
      })}
      {options.length === 0 && (
        <p style={{ margin: 0, fontFamily: SANS, fontSize: 12.5, color: C.muted }}>Nenhum documento disponível.</p>
      )}
    </div>
  );
}

/* ── Cartão de seção com título/ícone + grid de 2 colunas ── */
export function Section({ icon, title, desc, children, accent = C.navy }) {
  return (
    <section style={{
      background: C.card, borderRadius: 18, border: `1px solid ${C.borderSoft}`,
      boxShadow: '0 4px 20px rgba(14,37,73,0.05)', padding: 24, marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0, color: '#fff',
          background: `linear-gradient(150deg, ${accent}, ${accent}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 5px 14px ${accent}3a`,
        }}><Icon name={icon} size={18} /></div>
        <div>
          <h3 style={{ fontFamily: MONT, fontWeight: 700, fontSize: 15, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
          {desc && <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.muted, margin: '1px 0 0' }}>{desc}</p>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 18px' }}>
        {children}
      </div>
    </section>
  );
}

/* ── Toast de sucesso/erro ── */
export function Toast({ msg, kind }) {
  const color = kind === 'ok' ? C.green : C.danger;
  return (
    <div style={{
      position: 'fixed', top: 78, right: 24, zIndex: 200, background: '#fff',
      borderRadius: 12, border: `1px solid ${color}33`, borderLeft: `4px solid ${color}`,
      boxShadow: '0 10px 30px rgba(14,37,73,0.16)', padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp 0.3s ease both',
      maxWidth: 340,
    }}>
      <div style={{ color, display: 'inline-flex' }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {kind === 'ok' ? <path d="M20 6 9 17l-5-5" /> : <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>}
        </svg>
      </div>
      <span style={{ fontFamily: SANS, fontSize: 13.5, color: C.text, fontWeight: 600 }}>{msg}</span>
    </div>
  );
}

/* ── Casca da tela (cabeçalho + coluna central) ── */
export function Shell({ user, title, subtitle, onBack, accent, children, wide }) {
  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeUp 0.4s ease both' }}>
      <header style={{
        background: '#fff', borderBottom: `1px solid ${C.border}`, height: 64, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px',
      }}>
        <button onClick={onBack} aria-label="Voltar" style={{
          width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff',
          cursor: 'pointer', color: C.label, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: MONT, fontWeight: 700, fontSize: 17, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>{title}</h1>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: accent, margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
        </div>
        {user && (
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${C.navy}, ${C.green})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONT, fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0,
          }}>{user.charAt(0).toUpperCase()}</div>
        )}
      </header>
      <main className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', maxWidth: wide ? 820 : 720, width: '100%', margin: '0 auto', padding: '26px 24px 60px', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  );
}

/* ── Barra de ações (Salvar/Excluir) ── */
export function Actions({ editing, accent, onSave, onDelete, saving, saveLabel }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 22, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      {editing && onDelete && (
        <button onClick={onDelete} style={{
          padding: '12px 24px', borderRadius: 11, border: `1.5px solid ${C.danger}`, background: '#fff',
          color: C.danger, fontFamily: MONT, fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', cursor: 'pointer',
          transition: 'background 0.18s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = `${C.danger}0d`}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
          Excluir
        </button>
      )}
      <button onClick={onSave} disabled={saving} style={{
        padding: '12px 34px', borderRadius: 11, border: 'none',
        background: `linear-gradient(135deg, ${accent} 0%, ${C.green} 100%)`,
        color: '#fff', fontFamily: MONT, fontWeight: 700, fontSize: 13, letterSpacing: '0.06em',
        cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
        boxShadow: `0 6px 20px ${accent}44`, transition: 'transform 0.15s, opacity 0.15s',
      }}
        onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '0.92'; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = saving ? '0.7' : '1'; }}>
        {saveLabel || (saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Salvar cadastro')}
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, kind = 'ok') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  };
  return { toast, show };
}
