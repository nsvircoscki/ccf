import { ExternalLink, Loader2 } from 'lucide-react';

// Mostra a prévia da ficha gerada pelo backend. A URL é um object URL de um
// blob PDF; quem monta e revoga é o Orçamento, que controla o ciclo de vida.
export default function VisualizadorFicha({ url, carregando, onAbrirNovaAba }) {
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: '#334155' }}>
      {url ? (
        <iframe
          src={`${url}#toolbar=0&navpanes=0&view=FitH`}
          title="Prévia da ficha do serviço"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      ) : (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#CBD5E1',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {carregando ? 'Gerando a ficha...' : 'Selecione um orçamento para ver a ficha.'}
        </div>
      )}

      {/* Indicador discreto: a ficha continua visível enquanto a nova é gerada,
          para a prévia não piscar a cada tecla digitada. */}
      {carregando && url ? (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 12px',
            borderRadius: '999px',
            background: 'rgba(15, 23, 42, 0.86)',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          <Loader2 size={13} className="girando" /> Atualizando
        </div>
      ) : null}

      {url ? (
        <button
          type="button"
          onClick={onAbrirNovaAba}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '32px',
            padding: '0 12px',
            borderRadius: '999px',
            border: 'none',
            background: 'rgba(15, 23, 42, 0.86)',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ExternalLink size={13} /> Abrir em nova aba
        </button>
      ) : null}
    </div>
  );
}
