import React, { useEffect } from 'react';
import LeafIcon from './LeafIcon';

// Adaptado de "Animação de introdução/src/IntroLogin.tsx" — só a tela de
// abertura entrou aqui; o login em si é o LoginView, restilizado com a mesma
// identidade visual (ver LeafIcon.jsx, compartilhado entre os dois).

function Ripple({ delay }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: '50%',
        border: '1.5px solid rgba(46,139,46,0.25)',
        animation: `rippleOut 2.8s ease-out ${delay}s infinite`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }}
    />
  );
}

export default function IntroScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, [onDone]);

  const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'introBgFade 3.8s ease-in-out forwards',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes leafRise { from { opacity: 0; transform: translateY(48px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes ccfSlide { from { opacity: 0; transform: translateX(36px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes lineExpand { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rippleOut { 0% { transform: scale(0.7); opacity: 0.7; } 100% { transform: scale(2.6); opacity: 0; } }
        @keyframes introBgFade { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes leafFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      <div
        style={{
          position: 'absolute',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,139,46,0.06) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}
      />

      <Ripple delay={1.8} />
      <Ripple delay={2.4} />
      <Ripple delay={3.0} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ animation: `leafRise 0.9s ${ease} 0.1s both` }}>
          <div style={{ animation: 'leafFloat 3s ease-in-out 1.4s infinite' }}>
            <LeafIcon size={130} />
          </div>
        </div>

        <div
          style={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(72px, 12vw, 112px)',
            lineHeight: 1,
            color: '#1a3a8a',
            letterSpacing: '-0.02em',
            textShadow: '0 2px 16px rgba(26,58,138,0.12)',
            animation: `ccfSlide 0.9s ${ease} 0.55s both`,
          }}
        >
          CCF
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 48,
          width: 180,
          height: 2,
          background: 'rgba(26,58,138,0.10)',
          borderRadius: 2,
          overflow: 'hidden',
          animation: `fadeUp 0.5s ${ease} 1.8s both`,
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #7adaf0, #2e8b2e)',
            borderRadius: 2,
            animation: `lineExpand 1.8s ease-in-out 1.9s both`,
            transformOrigin: 'left',
          }}
        />
      </div>
    </div>
  );
}
