import { useEffect, useRef, useState } from 'react'

/* ────────────────────────────────────────────────────────────
   CCF — Cadastros (Cliente · Imóvel · Vinculação)
   Redesign: seções visuais, campos condicionais animados,
   abas na vinculação, chips de confrontantes.
   ──────────────────────────────────────────────────────────── */

const C = {
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
}
const MONT = '"Montserrat", sans-serif'
const SANS = '"Open Sans", sans-serif'

/* ── Icons ── */
function Icon({ name, size = 15 }: { name: string; size?: number }) {
  const p: Record<string, React.ReactNode> = {
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
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {p[name] ?? null}
    </svg>
  )
}

/* ── Masks & helpers ── */
const digits = (s: string) => s.replace(/\D/g, '')
const maskCPF = (v: string) => digits(v).slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
const maskCNPJ = (v: string) => digits(v).slice(0, 14)
  .replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
const maskPhone = (v: string) => {
  const d = digits(v).slice(0, 11)
  return d.length <= 10
    ? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
    : d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}
const maskCEP = (v: string) => digits(v).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2')

/* ── Sample data for searchable selects ── */
const PEOPLE = [
  { value: 'p1', label: 'João Batista Moreira', sub: 'CPF 123.456.789-00' },
  { value: 'p2', label: 'Maria Aparecida Souza', sub: 'CPF 987.654.321-00' },
  { value: 'p3', label: 'Antônio Carlos Ferreira', sub: 'CPF 456.789.123-00' },
  { value: 'p4', label: 'Helena Ribeiro Campos', sub: 'CPF 321.654.987-00' },
  { value: 'j1', label: 'Agropecuária Vale Verde Ltda.', sub: 'CNPJ 12.345.678/0001-90' },
]
const IMOVEIS = [
  { value: 'i1', label: 'Matrícula 12.457', sub: 'João Batista Moreira' },
  { value: 'i2', label: 'Matrícula 8.902', sub: 'Maria Aparecida Souza' },
  { value: 'i3', label: 'Transcrição 3.114', sub: 'Antônio Carlos Ferreira' },
  { value: 'i4', label: 'Matrícula 15.006', sub: 'Agropecuária Vale Verde Ltda.' },
]
const SERVICOS = [
  { value: 's1', label: 'Serviço 2024-0187', sub: 'Fazenda Santa Rita — Retificação de área' },
  { value: 's2', label: 'Serviço 2024-0203', sub: 'Loteamento Bosque Real — Desmembramento' },
  { value: 's3', label: 'Serviço 2024-0221', sub: 'Parque Eólico Ventania — Unificação' },
]

/* ─────────────── Primitives ─────────────── */

function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: open ? '1fr' : '0fr',
      opacity: open ? 1 : 0,
      transition: 'grid-template-rows 0.38s cubic-bezier(0.22,0.61,0.36,1), opacity 0.3s ease',
    }}>
      <div style={{ overflow: 'hidden', minHeight: 0 }}>{children}</div>
    </div>
  )
}

function Field({
  label, icon, value, onChange, placeholder, type = 'text', span = 1,
  textarea, rows = 3, disabled, onBlur, hint,
}: {
  label: string; icon?: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; span?: 1 | 2; textarea?: boolean
  rows?: number; disabled?: boolean; onBlur?: () => void; hint?: string
}) {
  const [focus, setFocus] = useState(false)
  const base: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: `1.5px solid ${focus ? C.navy : C.border}`,
    borderRadius: 10, background: disabled ? '#f6f8fc' : '#fff',
    fontFamily: SANS, fontSize: 14, color: C.text, outline: 'none',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    boxShadow: focus ? `0 0 0 3px ${C.navy}1f` : 'none',
    padding: icon && !textarea ? '11px 14px 11px 38px' : '11px 14px',
    resize: 'vertical' as const,
  }
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
            onBlur={() => { setFocus(false); onBlur?.() }} style={base} />
        ) : (
          <input type={type} value={value} placeholder={placeholder} disabled={disabled}
            onChange={e => onChange(e.target.value)} onFocus={() => setFocus(true)}
            onBlur={() => { setFocus(false); onBlur?.() }} style={base} />
        )}
      </div>
      {hint && <p style={{ fontFamily: SANS, fontSize: 11, color: C.muted, margin: '5px 2px 0' }}>{hint}</p>}
    </div>
  )
}

function SelectField({
  label, icon, value, onChange, options, span = 1,
}: {
  label: string; icon?: string; value: string; onChange: (v: string) => void
  options: string[]; span?: 1 | 2
}) {
  const [focus, setFocus] = useState(false)
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
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

type Opt = { value: string; label: string; sub?: string }
function SearchableSelect({
  label, icon, options, value, onChange, placeholder = 'Buscar…', span = 1, accent = C.navy,
}: {
  label?: string; icon?: string; options: Opt[]; value: string | null
  onChange: (v: string | null) => void; placeholder?: string; span?: 1 | 2; accent?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value) ?? null

  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(q.toLowerCase()) || (o.sub ?? '').toLowerCase().includes(q.toLowerCase()))

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
              <button type="button" onClick={() => { onChange(null); setOpen(false); setQ('') }} style={{
                width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, color: C.danger,
              }}>Limpar seleção</button>
            )}
            {filtered.map(o => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false); setQ('') }}
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
  )
}

function Segmented({ options, value, onChange, accent = C.navy }: {
  options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; accent?: string
}) {
  return (
    <div style={{ display: 'inline-flex', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 3, gap: 3 }}>
      {options.map(o => {
        const on = o.value === value
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{
            padding: '8px 18px', border: 'none', borderRadius: 8, cursor: 'pointer',
            fontFamily: MONT, fontWeight: 600, fontSize: 12.5,
            color: on ? '#fff' : C.label,
            background: on ? `linear-gradient(135deg, ${accent}, ${C.green})` : 'transparent',
            boxShadow: on ? `0 4px 12px ${accent}44` : 'none', transition: 'all 0.2s ease',
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
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
  )
}

function Section({ icon, title, desc, children, accent = C.navy }: {
  icon: string; title: string; desc?: string; children: React.ReactNode; accent?: string
}) {
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
  )
}

function Toast({ msg, kind }: { msg: string; kind: 'ok' | 'err' }) {
  const color = kind === 'ok' ? C.green : C.danger
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
  )
}

/* ── Screen shell (header + centered column) ── */
function Shell({ user, title, subtitle, onBack, accent, children, wide }: {
  user: string; title: string; subtitle: string; onBack: () => void; accent: string
  children: React.ReactNode; wide?: boolean
}) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, animation: 'fadeUp 0.4s ease both' }}>
      <header style={{
        background: '#fff', borderBottom: `1px solid ${C.border}`, height: 64, position: 'sticky', top: 0, zIndex: 20,
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
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: MONT, fontWeight: 700, fontSize: 17, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>{title}</h1>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: accent, margin: 0, fontWeight: 600 }}>{subtitle}</p>
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${C.navy}, ${C.green})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONT, fontWeight: 700, fontSize: 13, color: '#fff',
        }}>{user.charAt(0).toUpperCase()}</div>
      </header>
      <main style={{ maxWidth: wide ? 820 : 720, margin: '0 auto', padding: '26px 24px 60px' }}>
        {children}
      </main>
    </div>
  )
}

/* ── Save / Delete action bar ── */
function Actions({ editing, accent, onSave, onDelete }: {
  editing: boolean; accent: string; onSave: () => void; onDelete?: () => void
}) {
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
      <button onClick={onSave} style={{
        padding: '12px 34px', borderRadius: 11, border: 'none',
        background: `linear-gradient(135deg, ${accent} 0%, ${C.green} 100%)`,
        color: '#fff', fontFamily: MONT, fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', cursor: 'pointer',
        boxShadow: `0 6px 20px ${accent}44`, transition: 'transform 0.15s, opacity 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '0.92' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1' }}>
        {editing ? 'Salvar alterações' : 'Salvar cadastro'}
      </button>
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null)
  const show = (msg: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 2600)
  }
  return { toast, show }
}

/* ═══════════════ 1. CLIENTE ═══════════════ */
function ClienteForm({ user, onBack }: { user: string; onBack: () => void }) {
  const accent = '#b45309'
  const { toast, show } = useToast()
  const [existing, setExisting] = useState<string | null>(null)
  const [tipo, setTipo] = useState<'pf' | 'pj' | null>(null)
  const [f, setF] = useState<Record<string, string>>({})
  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }))
  const editing = !!existing
  const showConjuge = f.estadoCivil === 'Casado(a)' || f.estadoCivil === 'União estável'

  const cepLookup = async () => {
    const d = digits(f.cep || '')
    if (d.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`)
      const j = await r.json()
      if (!j.erro) setF(p => ({ ...p, logradouro: j.logradouro || p.logradouro, municipio: j.localidade ? `${j.localidade}/${j.uf}` : p.municipio }))
    } catch { /* offline: ignore */ }
  }

  return (
    <Shell user={user} title="Cadastro de Cliente" accent={accent}
      subtitle={editing ? 'Editando cliente' : tipo ? `Novo cliente — ${tipo === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}` : 'Novo cliente'}
      onBack={onBack}>
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      {/* Existing picker */}
      <div style={{ marginBottom: 18 }}>
        <SearchableSelect label="Selecionar cliente existente" icon="user" accent={accent}
          options={PEOPLE} value={existing} placeholder="Buscar cliente para editar, ou preencha abaixo…"
          onChange={v => { setExisting(v); if (v) setTipo(v.startsWith('j') ? 'pj' : 'pf') }} />
      </div>

      {/* Type chooser — only before a type is decided */}
      {!tipo && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, animation: 'fadeUp 0.3s ease both' }}>
          {([['pf', 'user', 'Pessoa Física', 'CPF, RG, estado civil, cônjuge'], ['pj', 'brief', 'Pessoa Jurídica', 'CNPJ, representante legal, pasta']] as const).map(([t, ic, tt, ds]) => (
            <button key={t} onClick={() => setTipo(t)} style={{
              background: '#fff', border: `1.5px solid ${C.borderSoft}`, borderRadius: 18, padding: '28px 22px',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 3px 14px rgba(14,37,73,0.05)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${accent}22` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(14,37,73,0.05)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, color: '#fff', marginBottom: 16,
                background: `linear-gradient(150deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 18px ${accent}3a` }}>
                <Icon name={ic} size={26} />
              </div>
              <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 17, color: C.text }}>{tt}</div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: C.muted, marginTop: 4 }}>{ds}</div>
            </button>
          ))}
        </div>
      )}

      {tipo && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          {/* Type indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 20,
              background: `${accent}14`, color: accent, fontFamily: MONT, fontWeight: 700, fontSize: 11.5,
            }}>
              <Icon name={tipo === 'pf' ? 'user' : 'brief'} size={14} />
              {tipo === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </span>
            {!editing && (
              <button onClick={() => { setTipo(null); setF({}) }} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONT, fontWeight: 600,
                fontSize: 12, color: C.muted, textDecoration: 'underline',
              }}>trocar tipo</button>
            )}
          </div>

          <Section icon="id" title="Dados principais" accent={accent}>
            <Field label={tipo === 'pf' ? 'Nome completo' : 'Razão social'} icon="user" span={2}
              value={f.nome || ''} onChange={set('nome')} placeholder={tipo === 'pf' ? 'Ex.: João Batista Moreira' : 'Ex.: Vale Verde Ltda.'} />
            <Field label={tipo === 'pf' ? 'CPF' : 'CNPJ'} icon="id"
              value={f.doc || ''} onChange={v => set('doc')(tipo === 'pf' ? maskCPF(v) : maskCNPJ(v))}
              placeholder={tipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'} />
            <Field label="Telefone" icon="phone" value={f.tel || ''} onChange={v => set('tel')(maskPhone(v))} placeholder="(00) 00000-0000" />
            <Field label="E-mail" icon="mail" type="email" span={2} value={f.email || ''} onChange={set('email')} placeholder="contato@email.com" />
          </Section>

          <Section icon="pin" title="Endereço" accent={accent}>
            <Field label="CEP" icon="pin" value={f.cep || ''} onChange={v => set('cep')(maskCEP(v))} onBlur={cepLookup} placeholder="00000-000" hint="Preenche o endereço automaticamente" />
            <Field label="Município / UF" icon="map" value={f.municipio || ''} onChange={set('municipio')} placeholder="Cidade / UF" />
            <Field label="Logradouro" icon="home" span={2} value={f.logradouro || ''} onChange={set('logradouro')} placeholder="Rua, número, bairro" />
          </Section>

          {tipo === 'pf' && (
            <Section icon="doc" title="Documentos & situação" accent={accent}>
              <Field label="RG" icon="id" value={f.rg || ''} onChange={set('rg')} placeholder="00.000.000-0" />
              <Field label="Órgão emissor" icon="doc" value={f.orgao || ''} onChange={set('orgao')} placeholder="SSP/UF" />
              <Field label="Nacionalidade" icon="user" value={f.nacionalidade || ''} onChange={set('nacionalidade')} placeholder="Brasileira" />
              <Field label="Profissão" icon="brief" value={f.profissao || ''} onChange={set('profissao')} placeholder="Ex.: Agricultor" />
              <SelectField label="Estado civil" icon="ring" value={f.estadoCivil || ''} onChange={set('estadoCivil')}
                options={['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Viúvo(a)']} />
              <SelectField label="Situação" icon="user" value={f.situacao || ''} onChange={set('situacao')} options={['Vivo(a)', 'Falecido(a)']} />

              <div style={{ gridColumn: '1 / -1' }}>
                <Reveal open={showConjuge}>
                  <div style={{ paddingTop: 4 }}>
                    <SearchableSelect label="Cônjuge" icon="ring" accent={accent}
                      options={PEOPLE.filter(p => !p.value.startsWith('j'))} value={f.conjuge || null}
                      onChange={v => set('conjuge')(v || '')} placeholder="Buscar pessoa cadastrada…" span={2} />
                  </div>
                </Reveal>
              </div>
            </Section>
          )}

          {tipo === 'pj' && (
            <Section icon="brief" title="Dados da empresa" accent={accent}>
              <Field label="Link da pasta (Drive)" icon="folder" span={2} value={f.pasta || ''} onChange={set('pasta')} placeholder="https://drive.google.com/…" />
              <div style={{ gridColumn: '1 / -1', height: 1, background: C.borderSoft, margin: '4px 0' }} />
              <Field label="Representante legal" icon="user" value={f.repNome || ''} onChange={set('repNome')} placeholder="Nome do representante" />
              <Field label="CPF do representante" icon="id" value={f.repCpf || ''} onChange={v => set('repCpf')(maskCPF(v))} placeholder="000.000.000-00" />
              <Field label="Cargo" icon="brief" span={2} value={f.repCargo || ''} onChange={set('repCargo')} placeholder="Ex.: Sócio-administrador" />
            </Section>
          )}

          <Actions editing={editing} accent={accent}
            onSave={() => show(editing ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.')}
            onDelete={() => show('Cliente excluído.', 'err')} />
        </div>
      )}
    </Shell>
  )
}

/* ═══════════════ 2. IMÓVEL ═══════════════ */
function ImovelForm({ user, onBack }: { user: string; onBack: () => void }) {
  const accent = '#0f766e'
  const { toast, show } = useToast()
  const [existing, setExisting] = useState<string | null>(null)
  const [f, setF] = useState<Record<string, string>>({})
  const [tipoTitulo, setTipoTitulo] = useState('matricula')
  const [usufruto, setUsufruto] = useState(false)
  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }))
  const editing = !!existing
  const tituloLabel = tipoTitulo === 'matricula' ? 'Número da Matrícula' : 'Número da Transcrição'

  return (
    <Shell user={user} title="Cadastro de Imóvel" accent={accent}
      subtitle={editing ? 'Editando imóvel' : 'Novo imóvel'} onBack={onBack}>
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <div style={{ marginBottom: 18 }}>
        <SearchableSelect label="Selecionar imóvel existente" icon="home" accent={accent}
          options={IMOVEIS} value={existing} placeholder="Buscar imóvel para editar, ou preencha abaixo…"
          onChange={setExisting} />
      </div>

      <Section icon="doc" title="Registro" desc="Dados cartorários do imóvel" accent={accent}>
        <SearchableSelect label="Cliente proprietário" icon="user" accent={accent} span={2}
          options={PEOPLE} value={f.proprietario || null} onChange={v => set('proprietario')(v || '')}
          placeholder="Buscar proprietário cadastrado…" />
        <Field label="Cartório" icon="doc" value={f.cartorio || ''} onChange={set('cartorio')} placeholder="Ex.: 1º Ofício de Registro" />
        <Field label="Comarca" icon="scale" value={f.comarca || ''} onChange={set('comarca')} placeholder="Ex.: Uberaba" />

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontFamily: MONT, fontWeight: 600, fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Tipo de título</label>
          <Segmented accent={accent} value={tipoTitulo} onChange={setTipoTitulo}
            options={[{ value: 'matricula', label: 'Matrícula' }, { value: 'transcricao', label: 'Transcrição' }]} />
        </div>

        <Field label={tituloLabel} icon="hash" value={f.numTitulo || ''} onChange={set('numTitulo')} placeholder="Nº do registro" />
        <Field label="CNS" icon="hash" value={f.cns || ''} onChange={set('cns')} placeholder="Código Nacional de Serventia" />
        <Field label="Código INCRA" icon="hash" value={f.incra || ''} onChange={set('incra')} placeholder="000.000.000.000-0" />
        <Field label="CIB / NIRF" icon="hash" value={f.cib || ''} onChange={set('cib')} placeholder="Cadastro do imóvel rural" />
      </Section>

      <Section icon="pin" title="Localização" desc="Endereço e caracterização" accent={accent}>
        <Field label="Logradouro" icon="home" span={2} value={f.logradouro || ''} onChange={set('logradouro')} placeholder="Localização do imóvel" />
        <Field label="Município / UF" icon="map" value={f.municipio || ''} onChange={set('municipio')} placeholder="Cidade / UF" />
        <Field label="Área registrada (ha)" icon="ruler" value={f.area || ''} onChange={set('area')} placeholder="0,0000" />
        <Field label="Zoneamento" icon="layers" span={2} value={f.zoneamento || ''} onChange={set('zoneamento')} placeholder="Ex.: Zona rural / ZEE" />
        <Field label="Descrição do imóvel" icon="doc" span={2} textarea rows={4} value={f.descricao || ''} onChange={set('descricao')} placeholder="Descrição completa do imóvel…" />
      </Section>

      <Section icon="user" title="Usufruto" desc="Há usufrutuário sobre o imóvel?" accent={accent}>
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Switch value={usufruto} onChange={setUsufruto} />
          <span style={{ fontFamily: SANS, fontSize: 14, color: C.text, fontWeight: 600 }}>
            {usufruto ? 'Sim — há usufruto' : 'Não há usufruto'}
          </span>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Reveal open={usufruto}>
            <div style={{ paddingTop: 14 }}>
              <SearchableSelect label="Usufrutuário" icon="user" accent={accent}
                options={PEOPLE} value={f.usufrutuario || null} onChange={v => set('usufrutuario')(v || '')}
                placeholder="Buscar pessoa cadastrada…" span={2} />
            </div>
          </Reveal>
        </div>
      </Section>

      <Actions editing={editing} accent={accent}
        onSave={() => show(editing ? 'Imóvel atualizado com sucesso.' : 'Imóvel cadastrado com sucesso.')}
        onDelete={() => show('Imóvel excluído.', 'err')} />
    </Shell>
  )
}

/* ═══════════════ 3. VINCULAÇÃO ═══════════════ */
function VinculacaoForm({ user, onBack }: { user: string; onBack: () => void }) {
  const accent = '#7c3aed'
  const { toast, show } = useToast()
  const [servico, setServico] = useState<string | null>(null)
  const [tab, setTab] = useState<'vinc' | 'retif' | 'docs'>('vinc')
  const [f, setF] = useState<Record<string, string>>({})
  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }))
  const [confront, setConfront] = useState<string[]>([])

  const addConfront = (v: string | null) => {
    if (v && !confront.includes(v)) setConfront(c => [...c, v])
  }
  const svcData = SERVICOS.find(s => s.value === servico)

  const TABS = [
    { id: 'vinc', label: 'Vínculos', icon: 'link', desc: 'Proprietário, imóvel e confrontantes' },
    { id: 'retif', label: 'Descrição', icon: 'ruler', desc: 'Descrição atual e memorial descritivo' },
    { id: 'docs', label: 'Documentos', icon: 'doc', desc: 'Lotes, averbações e protocolos' },
  ] as const

  return (
    <Shell user={user} title="Vinculação" wide accent={accent}
      subtitle={svcData ? svcData.label : 'Selecione um serviço para começar'} onBack={onBack}>
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <div style={{ marginBottom: 20 }}>
        <SearchableSelect label="Serviço" icon="brief" accent={accent}
          options={SERVICOS} value={servico} onChange={setServico}
          placeholder="Buscar serviço (número — cliente)…" />
      </div>

      {!servico ? (
        <div style={{
          background: '#fff', border: `1.5px dashed ${C.border}`, borderRadius: 18, padding: '48px 24px',
          textAlign: 'center', color: C.muted,
        }}>
          <div style={{ color: accent, display: 'inline-flex', marginBottom: 12 }}><Icon name="link" size={34} /></div>
          <p style={{ fontFamily: MONT, fontWeight: 700, fontSize: 15, color: C.text, margin: '0 0 4px' }}>Escolha um serviço</p>
          <p style={{ fontFamily: SANS, fontSize: 13.5, margin: 0 }}>
            Ao selecionar, você poderá vincular proprietário, imóvel, confrontantes e preencher só os documentos que o serviço exige.
          </p>
        </div>
      ) : (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const on = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: '1 1 200px', textAlign: 'left', cursor: 'pointer',
                  background: on ? '#fff' : 'transparent',
                  border: `1.5px solid ${on ? accent : C.border}`, borderRadius: 14, padding: '13px 16px',
                  boxShadow: on ? `0 6px 18px ${accent}22` : 'none', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 11,
                }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? `linear-gradient(150deg, ${accent}, ${accent}cc)` : C.bg,
                    color: on ? '#fff' : C.muted,
                  }}><Icon name={t.icon} size={17} /></span>
                  <span>
                    <span style={{ display: 'block', fontFamily: MONT, fontWeight: 700, fontSize: 13, color: on ? C.text : C.label }}>{t.label}</span>
                    <span style={{ display: 'block', fontFamily: SANS, fontSize: 11, color: C.muted }}>{t.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tab: Vínculos */}
          {tab === 'vinc' && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <Section icon="link" title="Vínculos do serviço" accent={accent}>
                <SearchableSelect label="Proprietário" icon="user" accent={accent}
                  options={PEOPLE} value={f.proprietario || null} onChange={v => set('proprietario')(v || '')} placeholder="Buscar cliente…" />
                <SelectField label="Situação neste serviço" icon="scale" value={f.situacao || ''} onChange={set('situacao')}
                  options={['Proprietário', 'Herdeiro', 'Inventariante', 'Representante']} />
                <SearchableSelect label="Imóvel" icon="home" accent={accent} span={2}
                  options={IMOVEIS} value={f.imovel || null} onChange={v => set('imovel')(v || '')} placeholder="Buscar imóvel (matrícula — proprietário)…" />

                <div style={{ gridColumn: '1 / -1' }}>
                  <SearchableSelect label="Adicionar confrontante" icon="plus" accent={accent}
                    options={IMOVEIS.filter(i => !confront.includes(i.value))} value={null}
                    onChange={addConfront} placeholder="Buscar imóvel confrontante para adicionar…" span={2} />
                  {confront.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      {confront.map(cid => {
                        const im = IMOVEIS.find(i => i.value === cid)
                        return (
                          <span key={cid} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 8px 7px 13px', borderRadius: 20,
                            background: `${accent}12`, color: accent, fontFamily: MONT, fontWeight: 600, fontSize: 12.5,
                          }}>
                            {im?.label} · <span style={{ fontWeight: 400, opacity: 0.8 }}>{im?.sub}</span>
                            <button onClick={() => setConfront(c => c.filter(x => x !== cid))} aria-label="Remover" style={{
                              width: 20, height: 20, borderRadius: '50%', border: 'none', background: `${accent}22`, color: accent,
                              cursor: 'pointer', fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>×</button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* Tab: Retificação */}
          {tab === 'retif' && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <Section icon="ruler" title="Descrição do imóvel" desc="Descrição atual e memorial descritivo" accent={accent}>
                <Field label="Descrição atual do imóvel" icon="doc" span={2} textarea rows={4} value={f.descAtual || ''} onChange={set('descAtual')} placeholder="Como o imóvel está descrito hoje…" />
                <Field label="Memorial descritivo" icon="doc" span={2} textarea rows={8} value={f.memorial || ''} onChange={set('memorial')} placeholder="Memorial descritivo completo…" />
              </Section>
            </div>
          )}

          {/* Tab: Documentos */}
          {tab === 'docs' && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <Section icon="doc" title="Dados para outros documentos" desc="Campos usados conforme o documento a gerar" accent={accent}>
                <Field label="Número de lotes" icon="hash" value={f.lotes || ''} onChange={set('lotes')} placeholder="Para Consulta Prévia (PMSBS)" />
                <div />
                <Field label="Averbações" icon="doc" span={2} textarea rows={3} value={f.averbacoes || ''} onChange={set('averbacoes')} placeholder="Averbações a registrar…" />
                <Field label="Áreas do desmembramento" icon="ruler" span={2} textarea rows={3} value={f.desmembramento || ''} onChange={set('desmembramento')} placeholder="Descrição das áreas resultantes…" />
                <Field label="Lista do protocolo de entrega" icon="doc" span={2} textarea rows={4} value={f.protocolo || ''} onChange={set('protocolo')} placeholder="Documentos que compõem o protocolo…" />
              </Section>
            </div>
          )}

          <Actions editing accent={accent} onSave={() => show('Vinculação salva com sucesso.')} />
        </div>
      )}
    </Shell>
  )
}

/* ═══════════════ Hub ═══════════════ */
export type CadastroTab = 'cliente' | 'imovel' | 'vinculacao'

export default function Cadastros({ user, initial = 'cliente', onBack }: {
  user: string; initial?: CadastroTab; onBack: () => void
}) {
  const [tab, setTab] = useState<CadastroTab>(initial)

  const nav = (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      display: 'flex', gap: 4, background: '#fff', padding: 5, borderRadius: 16,
      boxShadow: '0 10px 30px rgba(14,37,73,0.18)', border: `1px solid ${C.border}`,
    }}>
      {([['cliente', 'user', 'Cliente'], ['imovel', 'home', 'Imóvel'], ['vinculacao', 'link', 'Vinculação']] as const).map(([id, ic, lb]) => {
        const on = tab === id
        return (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontFamily: MONT, fontWeight: 700, fontSize: 13,
            color: on ? '#fff' : C.label,
            background: on ? `linear-gradient(135deg, ${C.navy}, ${C.green})` : 'transparent',
            transition: 'all 0.2s ease',
          }}>
            <Icon name={ic} size={16} />{lb}
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      {tab === 'cliente' && <ClienteForm user={user} onBack={onBack} />}
      {tab === 'imovel' && <ImovelForm user={user} onBack={onBack} />}
      {tab === 'vinculacao' && <VinculacaoForm user={user} onBack={onBack} />}
      {nav}
    </>
  )
}
