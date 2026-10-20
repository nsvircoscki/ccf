import { useSyncExternalStore } from 'react';

// Tela de celular: mesmo corte do CSS do ponto (sisPonto.css, max-width: 620px).
// No celular o app abre direto no registro de ponto (ver App.jsx).
const CONSULTA_CELULAR = '(max-width: 620px)';

function assinar(avisar) {
  const consulta = window.matchMedia(CONSULTA_CELULAR);
  consulta.addEventListener('change', avisar);
  return () => consulta.removeEventListener('change', avisar);
}

export function useEhCelular() {
  return useSyncExternalStore(assinar, () => window.matchMedia(CONSULTA_CELULAR).matches, () => false);
}
