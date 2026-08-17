import { Globe2 } from 'lucide-react';

// Ocupa o lugar do mapa interativo (removido) enquanto nenhuma imagem foi
// anexada ao cadastro/orçamento — só um placeholder visual, sem interação.
function PlaceholderMapa() {
  return (
    <div
      style={{
        background: '#F4F6FA',
        height: '100%',
        minHeight: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Globe2 size={34} color="#94A3B8" strokeWidth={1.6} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#4E5565' }}>Nenhuma imagem anexada</div>
        <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px' }}>
          Anexe uma imagem (ex.: print do Google Earth) do local do imóvel
        </div>
      </div>
    </div>
  );
}

export default PlaceholderMapa;
