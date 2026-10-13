import { useRegisterSW } from 'virtual:pwa-register/react';

// Registra o service worker (app abre sem rede) e avisa quando há versão nova.
// A atualização nunca é forçada no meio do uso: a pessoa toca em "Atualizar"
// quando quiser. Os pontos guardados no aparelho (IndexedDB) não são afetados.
// Enquanto estiver aberto, confere a cada hora se saiu versão nova.
const UMA_HORA = 60 * 60 * 1000;

export default function AvisoNovaVersao() {
  const { needRefresh: [temNovaVersao, setTemNovaVersao], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (registro) setInterval(() => { if (navigator.onLine) registro.update().catch(() => {}); }, UMA_HORA);
    },
  });

  if (!temNovaVersao) return null;
  return (
    <div role="status" className="no-print" style={{
      position: 'fixed', left: '50%', bottom: 16, transform: 'translateX(-50%)', zIndex: 200,
      width: 'min(420px, calc(100% - 32px))', boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
      background: '#0f172a', color: '#fff', boxShadow: '0 14px 30px rgba(15,35,70,.3)', fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ flex: 1 }}>Nova versão do sistema disponível.</span>
      <button type="button" onClick={() => setTemNovaVersao(false)} style={{ border: 0, background: 'transparent', color: '#cbd5e1', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Depois</button>
      <button type="button" onClick={() => updateServiceWorker(true)} style={{ border: 0, borderRadius: 8, padding: '7px 12px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>Atualizar</button>
    </div>
  );
}
