import React from 'react';

// Compartilhado entre IntroScreen e LoginView — mesma marca nos dois lugares.
export default function LeafIcon({ size = 140 }) {
  return (
    <svg viewBox="0 0 200 270" width={size} height={Math.round(size * 1.35)} aria-hidden="true">
      <defs>
        <radialGradient id="ccf-lg" cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#6fcf6f" />
          <stop offset="55%" stopColor="#2e8b2e" />
          <stop offset="100%" stopColor="#1a5c1a" />
        </radialGradient>
        <radialGradient id="ccf-wg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#7adaf0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#38aed4" stopOpacity="0.2" />
        </radialGradient>
        <filter id="ccf-shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>
      <ellipse cx="100" cy="226" rx="72" ry="22" fill="url(#ccf-wg)" />
      <path
        d="M100,18 C72,58 34,108 34,158 C34,200 64,228 100,228 C136,228 166,200 166,158 C166,108 128,58 100,18 Z"
        fill="url(#ccf-lg)"
        filter="url(#ccf-shadow)"
      />
      <line x1="100" y1="30" x2="100" y2="222" stroke="white" strokeWidth="2.4" strokeOpacity="0.65" strokeLinecap="round" />
      <line x1="100" y1="85" x2="58" y2="118" stroke="white" strokeWidth="1.6" strokeOpacity="0.5" strokeLinecap="round" />
      <line x1="100" y1="128" x2="50" y2="156" stroke="white" strokeWidth="1.4" strokeOpacity="0.45" strokeLinecap="round" />
      <line x1="100" y1="165" x2="55" y2="186" stroke="white" strokeWidth="1.1" strokeOpacity="0.38" strokeLinecap="round" />
      <line x1="100" y1="85" x2="142" y2="118" stroke="white" strokeWidth="1.6" strokeOpacity="0.5" strokeLinecap="round" />
      <line x1="100" y1="128" x2="150" y2="156" stroke="white" strokeWidth="1.4" strokeOpacity="0.45" strokeLinecap="round" />
      <line x1="100" y1="165" x2="145" y2="186" stroke="white" strokeWidth="1.1" strokeOpacity="0.38" strokeLinecap="round" />
      <ellipse cx="100" cy="228" rx="52" ry="11" fill="none" stroke="#7adaf0" strokeWidth="2.2" strokeOpacity="0.9" />
      <ellipse cx="100" cy="233" rx="74" ry="16" fill="none" stroke="#7adaf0" strokeWidth="1.6" strokeOpacity="0.55" />
      <ellipse cx="100" cy="238" rx="92" ry="20" fill="none" stroke="#7adaf0" strokeWidth="1.0" strokeOpacity="0.28" />
    </svg>
  );
}
