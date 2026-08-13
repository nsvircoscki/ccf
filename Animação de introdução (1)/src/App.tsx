import { useEffect, useState } from 'react'

/* ── SVG: leaf + water icon ── */
function LeafIcon({ size = 140 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 270" width={size} height={Math.round(size * 1.35)} aria-hidden="true">
      <defs>
        <radialGradient id="lg" cx="38%" cy="30%" r="68%">
          <stop offset="0%"   stopColor="#6fcf6f" />
          <stop offset="55%"  stopColor="#2e8b2e" />
          <stop offset="100%" stopColor="#1a5c1a" />
        </radialGradient>
        <radialGradient id="wg" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#7adaf0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#38aed4" stopOpacity="0.2" />
        </radialGradient>
        <filter id="leafShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      <ellipse cx="100" cy="226" rx="72" ry="22" fill="url(#wg)" />
      <path d="M100,18 C72,58 34,108 34,158 C34,200 64,228 100,228 C136,228 166,200 166,158 C166,108 128,58 100,18 Z" fill="url(#lg)" filter="url(#leafShadow)" />
      <line x1="100" y1="30"  x2="100" y2="222" stroke="white" strokeWidth="2.4" strokeOpacity="0.65" strokeLinecap="round" />
      <line x1="100" y1="85"  x2="58"  y2="118" stroke="white" strokeWidth="1.6" strokeOpacity="0.5"  strokeLinecap="round" />
      <line x1="100" y1="128" x2="50"  y2="156" stroke="white" strokeWidth="1.4" strokeOpacity="0.45" strokeLinecap="round" />
      <line x1="100" y1="165" x2="55"  y2="186" stroke="white" strokeWidth="1.1" strokeOpacity="0.38" strokeLinecap="round" />
      <line x1="100" y1="85"  x2="142" y2="118" stroke="white" strokeWidth="1.6" strokeOpacity="0.5"  strokeLinecap="round" />
      <line x1="100" y1="128" x2="150" y2="156" stroke="white" strokeWidth="1.4" strokeOpacity="0.45" strokeLinecap="round" />
      <line x1="100" y1="165" x2="145" y2="186" stroke="white" strokeWidth="1.1" strokeOpacity="0.38" strokeLinecap="round" />
      <ellipse cx="100" cy="228" rx="52" ry="11"  fill="none" stroke="#7adaf0" strokeWidth="2.2" strokeOpacity="0.9" />
      <ellipse cx="100" cy="233" rx="74" ry="16"  fill="none" stroke="#7adaf0" strokeWidth="1.6" strokeOpacity="0.55" />
      <ellipse cx="100" cy="238" rx="92" ry="20"  fill="none" stroke="#7adaf0" strokeWidth="1.0" strokeOpacity="0.28" />
    </svg>
  )
}

function Ripple({ delay }: { delay: number }) {
  return (
    <div style={{
      position: 'absolute', width: 220, height: 220, borderRadius: '50%',
      border: '1.5px solid rgba(46,139,46,0.25)',
      animation: `rippleOut 2.8s ease-out ${delay}s infinite`,
      top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      pointerEvents: 'none',
    }} />
  )
}

/* ── Intro screen ── */
function IntroScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800)
    return () => clearTimeout(t)
  }, [onDone])

  const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      animation: 'introBgFade 3.8s ease-in-out forwards',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(46,139,46,0.06) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />
      <Ripple delay={1.8} />
      <Ripple delay={2.4} />
      <Ripple delay={3.0} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ animation: `leafRise 0.9s ${ease} 0.1s both` }}>
          <div style={{ animation: 'leafFloat 3s ease-in-out 1.4s infinite' }}>
            <LeafIcon size={130} />
          </div>
        </div>
        <div style={{
          fontFamily: '"Montserrat", sans-serif', fontWeight: 900,
          fontSize: 'clamp(72px, 12vw, 112px)', lineHeight: 1,
          color: '#1a3a8a', letterSpacing: '-0.02em',
          textShadow: '0 2px 16px rgba(26,58,138,0.12)',
          animation: `ccfSlide 0.9s ${ease} 0.55s both`,
        }}>
          CCF
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 48, width: 180, height: 2,
        background: 'rgba(26,58,138,0.10)', borderRadius: 2, overflow: 'hidden',
        animation: `fadeUp 0.5s ${ease} 1.8s both`,
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #7adaf0, #2e8b2e)',
          borderRadius: 2,
          animation: 'lineExpand 1.8s ease-in-out 1.9s both',
          transformOrigin: 'left',
        }} />
      </div>
    </div>
  )
}

/* ── Login screen ── */
function LoginScreen({ onLogin }: { onLogin: (user: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) onLogin(email.split('@')[0])
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#f4f7fb',
      animation: `fadeUp 0.7s ${ease} forwards`,
    }}>
      {/* Left — brand panel */}
      <div style={{
        flex: '0 0 52%',
        background: 'linear-gradient(155deg, #0e2549 0%, #1a3a8a 60%, #1d4f9e 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{
          position: 'absolute', width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,139,46,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <div style={{ animation: 'leafFloat 4s ease-in-out infinite' }}>
            <LeafIcon size={160} />
          </div>
          <div style={{
            fontFamily: '"Montserrat", sans-serif', fontWeight: 900,
            fontSize: 72, lineHeight: 1, color: '#ffffff', letterSpacing: '-0.02em',
          }}>CCF</div>
        </div>
        <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)' }}>
          {[80, 140, 200].map((r, i) => (
            <div key={i} style={{
              position: 'absolute', width: r * 2, height: r * 2, borderRadius: '50%',
              border: '1px solid rgba(122,218,240,0.15)',
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            }} />
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{
              fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
              fontSize: 28, color: '#0e2549', margin: '0 0 8px', letterSpacing: '-0.01em',
            }}>Bem-vindo</h1>
            <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 14, color: '#6b7a99', margin: 0 }}>
              Acesse o sistema CCF Consultores
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{
                display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 600,
                fontSize: 12, color: '#3a4a6b', letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: 7,
              }}>E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid #d8e0f0', borderRadius: 10,
                  fontFamily: '"Open Sans", sans-serif', fontSize: 14,
                  color: '#0e2549', background: '#ffffff', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = '#1a3a8a')}
                onBlur={e => (e.target.style.borderColor = '#d8e0f0')}
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 600,
                fontSize: 12, color: '#3a4a6b', letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: 7,
              }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{
                    width: '100%', padding: '12px 44px 12px 16px',
                    border: '1.5px solid #d8e0f0', borderRadius: 10,
                    fontFamily: '"Open Sans", sans-serif', fontSize: 14,
                    color: '#0e2549', background: '#ffffff', outline: 'none',
                    transition: 'border-color 0.2s', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#1a3a8a')}
                  onBlur={e => (e.target.style.borderColor = '#d8e0f0')}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: '#8899bb', fontSize: 16, lineHeight: 1,
                }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <a href="#" style={{
                fontFamily: '"Open Sans", sans-serif', fontSize: 13,
                color: '#1a3a8a', textDecoration: 'none', opacity: 0.8,
              }}>Esqueci a senha</a>
            </div>

            <button type="submit" style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg, #1a3a8a 0%, #2e8b2e 100%)',
              border: 'none', borderRadius: 10,
              fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
              fontSize: 14, letterSpacing: '0.06em', color: '#ffffff',
              cursor: 'pointer', transition: 'opacity 0.2s, transform 0.15s', marginTop: 4,
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >ENTRAR</button>
          </div>

          <p style={{
            fontFamily: '"Open Sans", sans-serif', fontSize: 12,
            color: '#9aabcc', textAlign: 'center', marginTop: 36,
          }}>
            © {new Date().getFullYear()} CCF Consultores
          </p>
        </form>
      </div>
    </div>
  )
}

/* ── Module data ── */
const MODULES = [
  {
    id: 'projetos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    label: 'Projetos',
    desc: 'Gestão de projetos ambientais',
    color: '#1a3a8a',
    bg: '#eef2ff',
  },
  {
    id: 'laudos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
    label: 'Laudos',
    desc: 'Emissão de laudos técnicos',
    color: '#2e8b2e',
    bg: '#edfaed',
  },
  {
    id: 'licenciamento',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    label: 'Licenciamento',
    desc: 'Processos de licença ambiental',
    color: '#0e7490',
    bg: '#ecfbff',
  },
  {
    id: 'monitoramento',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    ),
    label: 'Monitoramento',
    desc: 'Monitoramento ambiental contínuo',
    color: '#7c3aed',
    bg: '#f3eeff',
  },
  {
    id: 'clientes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Clientes',
    desc: 'Cadastro e gestão de clientes',
    color: '#b45309',
    bg: '#fff8ec',
  },
  {
    id: 'relatorios',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    label: 'Relatórios',
    desc: 'Relatórios e indicadores',
    color: '#be185d',
    bg: '#fff0f8',
  },
  {
    id: 'documentos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    label: 'Documentos',
    desc: 'Gestão documental',
    color: '#0f766e',
    bg: '#f0fdfa',
  },
  {
    id: 'financeiro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    label: 'Financeiro',
    desc: 'Controle financeiro e faturamento',
    color: '#1a3a8a',
    bg: '#f0f4ff',
  },
]

/* ── App icon (squircle, iOS springboard style) ── */
function AppIcon({
  mod, index, selected, onSelect,
}: {
  mod: (typeof MODULES)[number]
  index: number
  selected: boolean
  onSelect: () => void
}) {
  const ease = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  return (
    <button
      type="button"
      aria-label={mod.label}
      aria-pressed={selected}
      onClick={onSelect}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        outline: 'none',
        animation: `appPop 0.5s ${ease} ${index * 0.05 + 0.05}s both`,
      }}
      onMouseEnter={e => {
        const t = e.currentTarget.querySelector('[data-tile]') as HTMLElement
        if (t) t.style.transform = 'translateY(-6px) scale(1.06)'
      }}
      onMouseLeave={e => {
        const t = e.currentTarget.querySelector('[data-tile]') as HTMLElement
        if (t) t.style.transform = 'translateY(0) scale(1)'
      }}
      onMouseDown={e => {
        const t = e.currentTarget.querySelector('[data-tile]') as HTMLElement
        if (t) t.style.transform = 'scale(0.9)'
      }}
      onMouseUp={e => {
        const t = e.currentTarget.querySelector('[data-tile]') as HTMLElement
        if (t) t.style.transform = 'translateY(-6px) scale(1.06)'
      }}
    >
      <div
        data-tile
        style={{
          position: 'relative',
          width: 88,
          height: 88,
          /* squircle: high radius + smooth corners */
          borderRadius: 26,
          background: `linear-gradient(150deg, ${mod.color} 0%, ${mod.color}cc 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: selected
            ? `0 0 0 3px #ffffff, 0 0 0 6px ${mod.color}, 0 14px 30px ${mod.color}66`
            : `0 8px 20px ${mod.color}3a, inset 0 1px 0 rgba(255,255,255,0.25)`,
          transition: `transform 0.32s ${ease}, box-shadow 0.25s ease`,
        }}
      >
        {/* top glossy highlight */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '46%',
          borderRadius: '26px 26px 40px 40px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.28), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {mod.icon}
        </div>
      </div>
      <span style={{
        fontFamily: '"Open Sans", sans-serif',
        fontWeight: 600,
        fontSize: 12.5,
        color: selected ? mod.color : '#3a4a6b',
        letterSpacing: '0.01em',
        textAlign: 'center',
        transition: 'color 0.2s ease',
      }}>
        {mod.label}
      </span>
    </button>
  )
}

/* ── Module selector (iPhone-style springboard) ── */
function ModuleSelector({ user, onOpen }: { user: string; onOpen: (id: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

  const activeMod = MODULES.find(m => m.id === selected)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f7fb',
      display: 'flex',
      flexDirection: 'column',
      animation: `fadeUp 0.6s ${ease} forwards`,
    }}>
      {/* Top bar */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e8edf5',
        padding: '0 40px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LeafIcon size={30} />
          <span style={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 900,
            fontSize: 22,
            color: '#1a3a8a',
            letterSpacing: '-0.02em',
          }}>CCF</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a3a8a, #2e8b2e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 700, fontSize: 14, color: '#fff',
          }}>
            {user.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 600, fontSize: 13, color: '#0e2549' }}>
              {user}
            </div>
            <div style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 11, color: '#9aabcc' }}>
              CCF Consultores
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px 60px',
        overflowX: 'auto',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <p style={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#2e8b2e',
            margin: '0 0 8px',
          }}>
            SISTEMA CCF
          </p>
          <h2 style={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 700,
            fontSize: 24,
            color: '#0e2549',
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            Selecione um módulo
          </h2>
        </div>

        {/* Springboard grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))',
          gap: '30px 20px',
          width: '100%',
          maxWidth: 500,
          justifyItems: 'center',
        }}>
          {MODULES.map((mod, i) => (
            <AppIcon
              key={mod.id}
              mod={mod}
              index={i}
              selected={selected === mod.id}
              onSelect={() => setSelected(s => (s === mod.id ? null : mod.id))}
            />
          ))}
        </div>

        {/* Module info + access button */}
        <div style={{
          marginTop: 8,
          minHeight: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          {activeMod && (
            <>
              <div style={{
                textAlign: 'center',
                animation: `fadeUp 0.35s ${ease} forwards`,
              }}>
                <p style={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: 14,
                  color: '#6b7a99',
                  margin: 0,
                }}>
                  {activeMod.desc}
                </p>
              </div>

              <button
                onClick={() => onOpen(activeMod.id)}
                style={{
                  padding: '13px 44px',
                  background: `linear-gradient(135deg, ${activeMod.color} 0%, #2e8b2e 100%)`,
                  border: 'none',
                  borderRadius: 12,
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '0.1em',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s, transform 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  animation: `fadeUp 0.4s ${ease} 0.05s both`,
                  boxShadow: `0 6px 24px ${activeMod.color}44`,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                ACESSAR {activeMod.label.toUpperCase()}
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

/* ── Shared top bar ── */
function TopBar({ user, left }: { user: string; left?: React.ReactNode }) {
  return (
    <header style={{
      background: '#ffffff', borderBottom: '1px solid #e8edf5',
      padding: '0 32px', height: 64, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {left}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LeafIcon size={30} />
          <span style={{
            fontFamily: '"Montserrat", sans-serif', fontWeight: 900,
            fontSize: 22, color: '#1a3a8a', letterSpacing: '-0.02em',
          }}>CCF</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a3a8a, #2e8b2e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 14, color: '#fff',
        }}>{user.charAt(0).toUpperCase()}</div>
        <div>
          <div style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 600, fontSize: 13, color: '#0e2549' }}>{user}</div>
          <div style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 11, color: '#9aabcc' }}>CCF Consultores</div>
        </div>
      </div>
    </header>
  )
}

/* ── Search records (sample data) ── */
type Status = 'Em andamento' | 'Concluído' | 'Pendente' | 'Atrasado'

const STATUS_COLOR: Record<Status, string> = {
  'Em andamento': '#1a3a8a',
  'Concluído': '#2e8b2e',
  'Pendente': '#b45309',
  'Atrasado': '#be185d',
}

type SearchRecord = {
  matricula: string
  nome: string
  codigo: string
  servico: string
  cliente: string
  responsavel: string
  status: Status
  abertura: string
  prazo: string
  valor: string
  local: string
}

const RECORDS: SearchRecord[] = [
  { matricula: '2024-0187', nome: 'Fazenda Santa Rita', codigo: 'LAU-4521', servico: 'Laudo de fauna e flora', cliente: 'Agropecuária Vale Verde Ltda.', responsavel: 'Eng. Camila Furtado', status: 'Em andamento', abertura: '12/03/2026', prazo: '30/08/2026', valor: 'R$ 48.500,00', local: 'Uberaba, MG' },
  { matricula: '2024-0192', nome: 'Condomínio Ipê Amarelo', codigo: 'LIC-1130', servico: 'Licenciamento ambiental prévio', cliente: 'Construtora Horizonte S.A.', responsavel: 'Eng. Rafael Nogueira', status: 'Pendente', abertura: '05/04/2026', prazo: '15/09/2026', valor: 'R$ 72.900,00', local: 'Goiânia, GO' },
  { matricula: '2023-0455', nome: 'Mineradora Serra Azul', codigo: 'MON-2087', servico: 'Monitoramento de recursos hídricos', cliente: 'Serra Azul Mineração', responsavel: 'Bióloga Larissa Prado', status: 'Concluído', abertura: '20/11/2025', prazo: '20/02/2026', valor: 'R$ 156.000,00', local: 'Nova Lima, MG' },
  { matricula: '2024-0203', nome: 'Loteamento Bosque Real', codigo: 'PRJ-0908', servico: 'Projeto de recuperação de APP', cliente: 'Urbanizadora Bosque Real', responsavel: 'Eng. Camila Furtado', status: 'Atrasado', abertura: '18/01/2026', prazo: '10/07/2026', valor: 'R$ 39.200,00', local: 'Anápolis, GO' },
  { matricula: '2024-0210', nome: 'Usina São Bento', codigo: 'REL-3342', servico: 'Relatório de impacto ambiental (RIMA)', cliente: 'Bioenergia São Bento', responsavel: 'Eng. Rafael Nogueira', status: 'Em andamento', abertura: '02/05/2026', prazo: '30/10/2026', valor: 'R$ 210.000,00', local: 'Ribeirão Preto, SP' },
  { matricula: '2023-0398', nome: 'Frigorífico Boa Carne', codigo: 'LAU-4102', servico: 'Laudo de conformidade de efluentes', cliente: 'Boa Carne Alimentos', responsavel: 'Bióloga Larissa Prado', status: 'Concluído', abertura: '14/09/2025', prazo: '14/12/2025', valor: 'R$ 27.800,00', local: 'Rio Verde, GO' },
  { matricula: '2024-0221', nome: 'Parque Eólico Ventania', codigo: 'LIC-1188', servico: 'Licença de operação', cliente: 'Ventania Energias Renováveis', responsavel: 'Eng. Marina Teixeira', status: 'Pendente', abertura: '22/06/2026', prazo: '20/12/2026', valor: 'R$ 98.400,00', local: 'Caetité, BA' },
  { matricula: '2024-0234', nome: 'Distrito Industrial Norte', codigo: 'MON-2145', servico: 'Monitoramento de qualidade do ar', cliente: 'Prefeitura Municipal', responsavel: 'Eng. Marina Teixeira', status: 'Em andamento', abertura: '10/07/2026', prazo: '10/01/2027', valor: 'R$ 64.300,00', local: 'Palmas, TO' },
]

/* Field icon helper */
const FieldBadge = ({ label, color }: { label: string; color: string }) => (
  <span style={{
    fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 9,
    letterSpacing: '0.08em', textTransform: 'uppercase', color,
    background: `${color}18`, padding: '3px 7px', borderRadius: 5,
  }}>{label}</span>
)

/* ── Search screen (master-detail) ── */
function SearchScreen({ user, moduleId, onBack }: { user: string; moduleId: string; onBack: () => void }) {
  const mod = MODULES.find(m => m.id === moduleId) ?? MODULES[0]
  const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)'
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const results = q
    ? RECORDS.filter(r =>
        r.matricula.toLowerCase().includes(q) ||
        r.nome.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q) ||
        r.cliente.toLowerCase().includes(q))
    : RECORDS

  // Detect which field the query matches for the current query
  const detectField = (r: SearchRecord): { label: string; color: string } | null => {
    if (!q) return null
    if (r.matricula.toLowerCase().includes(q)) return { label: 'Matrícula', color: '#1a3a8a' }
    if (r.codigo.toLowerCase().includes(q)) return { label: 'Código', color: '#0e7490' }
    if (r.cliente.toLowerCase().includes(q)) return { label: 'Cliente', color: '#b45309' }
    if (r.nome.toLowerCase().includes(q)) return { label: 'Nome', color: '#2e8b2e' }
    return null
  }

  const active = RECORDS.find(r => r.matricula === selectedId) ?? results[0] ?? null

  return (
    <div style={{
      minHeight: '100vh', background: '#f4f7fb', display: 'flex', flexDirection: 'column',
      animation: `fadeUp 0.5s ${ease} forwards`,
    }}>
      <TopBar user={user} left={
        <button onClick={onBack} aria-label="Voltar" style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: '1px solid #e0e7f2', borderRadius: 9, padding: '7px 12px',
          cursor: 'pointer', fontFamily: '"Montserrat", sans-serif', fontWeight: 600,
          fontSize: 12, color: '#3a4a6b',
        }}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          Módulos
        </button>
      } />

      <div style={{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: '20px 28px 40px', boxSizing: 'border-box' }}>
        {/* Module title + search bar (single compact row) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(150deg, ${mod.color} 0%, ${mod.color}cc 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: `0 5px 14px ${mod.color}3a`,
            }}>
              <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{mod.icon}</div>
            </div>
            <h2 style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 17, color: '#0e2549', margin: 0, letterSpacing: '-0.01em' }}>{mod.label}</h2>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#8899bb" strokeWidth="2" strokeLinecap="round" width="17" height="17"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              autoFocus
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedId(null) }}
              placeholder="Pesquisar por matrícula, nome, cliente ou código…"
              style={{
                width: '100%', padding: '10px 40px 10px 38px', boxSizing: 'border-box',
                border: '1.5px solid #e0e7f2', borderRadius: 10, background: '#fff',
                fontFamily: '"Open Sans", sans-serif', fontSize: 14, color: '#0e2549',
                outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = mod.color; e.target.style.boxShadow = `0 0 0 3px ${mod.color}22` }}
              onBlur={e => { e.target.style.borderColor = '#e0e7f2'; e.target.style.boxShadow = 'none' }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setSelectedId(null) }} aria-label="Limpar" style={{
                position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                background: '#eef2f8', border: 'none', borderRadius: '50%', width: 22, height: 22,
                cursor: 'pointer', color: '#6b7a99', fontSize: 13, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            )}
          </div>
        </div>

        {/* Master-detail grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(270px, 1fr) minmax(0, 1.5fr)', gap: 16, alignItems: 'start' }}>
          {/* Results list */}
          <div>
            <div style={{
              fontFamily: '"Montserrat", sans-serif', fontWeight: 600, fontSize: 10,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8899bb', margin: '0 2px 8px',
            }}>
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map(r => {
                const isActive = active?.matricula === r.matricula
                const field = detectField(r)
                return (
                  <button
                    key={r.matricula}
                    onClick={() => setSelectedId(r.matricula)}
                    style={{
                      textAlign: 'left', background: '#fff', cursor: 'pointer',
                      border: isActive ? `1px solid ${mod.color}` : '1px solid #eef2f8',
                      borderLeftWidth: 3, borderLeftColor: isActive ? mod.color : '#eef2f8',
                      borderRadius: 9, padding: '9px 12px',
                      boxShadow: isActive ? `0 4px 14px ${mod.color}22` : 'none',
                      transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', gap: 3,
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafd' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                        <span title={r.status} style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[r.status] }} />
                        <span style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 13, color: '#0e2549', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nome}</span>
                      </span>
                      {field && <FieldBadge label={field.label} color={field.color} />}
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontFamily: '"Open Sans", sans-serif', fontSize: 11, color: '#8899bb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#3a4a6b', fontWeight: 600 }}>{r.matricula}</span>
                      <span>·</span>
                      <span style={{ color: '#3a4a6b', fontWeight: 600 }}>{r.codigo}</span>
                      <span>·</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.cliente}</span>
                    </div>
                  </button>
                )
              })}
              {results.length === 0 && (
                <div style={{
                  background: '#fff', border: '1.5px dashed #dbe3f0', borderRadius: 10,
                  padding: '24px 16px', textAlign: 'center', fontFamily: '"Open Sans", sans-serif',
                  fontSize: 13, color: '#8899bb',
                }}>
                  Nenhum resultado para “{query}”.
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div style={{
            position: 'sticky', top: 84, background: '#fff', borderRadius: 12,
            border: '1px solid #eef2f8', boxShadow: '0 4px 20px rgba(14,37,73,0.06)',
            overflow: 'hidden', minHeight: 240,
          }}>
            {active ? (
              <div key={active.matricula} style={{ animation: `fadeUp 0.25s ${ease} both` }}>
                {/* Detail header */}
                <div style={{ padding: '16px 20px', background: `linear-gradient(135deg, ${mod.color} 0%, #0e2549 130%)`, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 3 }}>
                    <h3 style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 17, margin: 0, letterSpacing: '-0.01em' }}>{active.nome}</h3>
                    <span style={{
                      fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 9.5,
                      letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                      background: 'rgba(255,255,255,0.18)', padding: '4px 9px', borderRadius: 20,
                    }}>{active.status}</span>
                  </div>
                  <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 12.5, margin: 0, opacity: 0.85 }}>{active.servico}</p>
                </div>

                {/* Detail body */}
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px 20px' }}>
                  {[
                    ['Matrícula', active.matricula],
                    ['Código do serviço', active.codigo],
                    ['Cliente', active.cliente],
                    ['Responsável técnico', active.responsavel],
                    ['Abertura', active.abertura],
                    ['Prazo', active.prazo],
                    ['Localização', active.local],
                    ['Valor', active.valor],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{
                        fontFamily: '"Montserrat", sans-serif', fontWeight: 600, fontSize: 9.5,
                        letterSpacing: '0.09em', textTransform: 'uppercase', color: '#9aabcc', marginBottom: 2,
                      }}>{label}</div>
                      <div style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13, fontWeight: 600, color: '#0e2549' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 240, gap: 10, color: '#aab6cf', fontFamily: '"Open Sans", sans-serif', fontSize: 13,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Selecione um registro para ver os detalhes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Root ── */
type Screen = 'intro' | 'login' | 'modules' | 'search'

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [user, setUser] = useState('')
  const [moduleId, setModuleId] = useState('projetos')

  return (
    <>
      {screen === 'intro' && <IntroScreen onDone={() => setScreen('login')} />}
      {screen === 'login' && (
        <LoginScreen onLogin={u => { setUser(u); setScreen('modules') }} />
      )}
      {screen === 'modules' && (
        <ModuleSelector user={user} onOpen={id => { setModuleId(id); setScreen('search') }} />
      )}
      {screen === 'search' && (
        <SearchScreen user={user} moduleId={moduleId} onBack={() => setScreen('modules')} />
      )}
    </>
  )
}
