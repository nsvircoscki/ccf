// IntroLogin.tsx — copie para src/components/IntroLogin.tsx no seu projeto
// Dependências: nenhuma além do React
// Fonte: adicione no seu index.html ou index.css:
//   @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;900&family=Open+Sans:wght@400;600&display=swap');
//
// Adicione estas keyframes no seu CSS global:
//
// @keyframes leafRise {
//   from { opacity: 0; transform: translateY(48px) scale(0.8); }
//   to   { opacity: 1; transform: translateY(0) scale(1); }
// }
// @keyframes ccfSlide {
//   from { opacity: 0; transform: translateX(36px); }
//   to   { opacity: 1; transform: translateX(0); }
// }
// @keyframes lineExpand {
//   from { transform: scaleX(0); }
//   to   { transform: scaleX(1); }
// }
// @keyframes fadeUp {
//   from { opacity: 0; transform: translateY(18px); }
//   to   { opacity: 1; transform: translateY(0); }
// }
// @keyframes rippleOut {
//   0%   { transform: scale(0.7); opacity: 0.7; }
//   100% { transform: scale(2.6); opacity: 0; }
// }
// @keyframes introBgFade {
//   0%   { opacity: 1; }
//   80%  { opacity: 1; }
//   100% { opacity: 0; }
// }
// @keyframes leafFloat {
//   0%, 100% { transform: translateY(0); }
//   50%       { transform: translateY(-6px); }
// }

import { useEffect, useState } from 'react'

function LeafIcon({ size = 140 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 270" width={size} height={Math.round(size * 1.35)} aria-hidden="true">
      <defs>
        <radialGradient id="ccf-lg" cx="38%" cy="30%" r="68%">
          <stop offset="0%"   stopColor="#6fcf6f" />
          <stop offset="55%"  stopColor="#2e8b2e" />
          <stop offset="100%" stopColor="#1a5c1a" />
        </radialGradient>
        <radialGradient id="ccf-wg" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#7adaf0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#38aed4" stopOpacity="0.2" />
        </radialGradient>
        <filter id="ccf-shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      <ellipse cx="100" cy="226" rx="72" ry="22" fill="url(#ccf-wg)" />
      <path d="M100,18 C72,58 34,108 34,158 C34,200 64,228 100,228 C136,228 166,200 166,158 C166,108 128,58 100,18 Z" fill="url(#ccf-lg)" filter="url(#ccf-shadow)" />
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

function IntroScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800)
    return () => clearTimeout(t)
  }, [onDone])

  const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
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
          animation: `lineExpand 1.8s ease-in-out 1.9s both`,
          transformOrigin: 'left',
        }} />
      </div>
    </div>
  )
}

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

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
          }}>
            CCF
          </div>
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
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{
              fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
              fontSize: 28, color: '#0e2549', margin: '0 0 8px', letterSpacing: '-0.01em',
            }}>
              Bem-vindo
            </h1>
            <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 14, color: '#6b7a99', margin: 0 }}>
              Acesse o sistema CCF Consultores
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{
                display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 600,
                fontSize: 12, color: '#3a4a6b', letterSpacing: '0.06em',
                textTransform: 'uppercase' as const, marginBottom: 7,
              }}>E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid #d8e0f0', borderRadius: 10,
                  fontFamily: '"Open Sans", sans-serif', fontSize: 14,
                  color: '#0e2549', background: '#ffffff', outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
                }}
                onFocus={e => (e.target.style.borderColor = '#1a3a8a')}
                onBlur={e => (e.target.style.borderColor = '#d8e0f0')}
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 600,
                fontSize: 12, color: '#3a4a6b', letterSpacing: '0.06em',
                textTransform: 'uppercase' as const, marginBottom: 7,
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
                    transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
                  }}
                  onFocus={e => (e.target.style.borderColor = '#1a3a8a')}
                  onBlur={e => (e.target.style.borderColor = '#d8e0f0')}
                />
                <button
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: '#8899bb', fontSize: 16, lineHeight: 1,
                  }}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
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

            <button
              style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #1a3a8a 0%, #2e8b2e 100%)',
                border: 'none', borderRadius: 10,
                fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
                fontSize: 14, letterSpacing: '0.06em', color: '#ffffff',
                cursor: 'pointer', transition: 'opacity 0.2s, transform 0.15s', marginTop: 4,
              }}
              onMouseEnter={e => {
                (e.currentTarget.style.opacity = '0.9')
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              ENTRAR
            </button>
          </div>

          <p style={{
            fontFamily: '"Open Sans", sans-serif', fontSize: 12,
            color: '#9aabcc', textAlign: 'center', marginTop: 36,
          }}>
            © {new Date().getFullYear()} CCF Consultores
          </p>
        </div>
      </div>
    </div>
  )
}

// Use este componente no seu App.tsx ou na rota de login:
//
//   import { IntroLogin } from './components/IntroLogin'
//   ...
//   <IntroLogin onLogin={(email, password) => { /* sua lógica de auth */ }} />
//
export function IntroLogin({ onLogin }: { onLogin?: (email: string, password: string) => void }) {
  const [done, setDone] = useState(false)
  return (
    <>
      {!done && <IntroScreen onDone={() => setDone(true)} />}
      {done && <LoginScreen />}
    </>
  )
}

export default IntroLogin
