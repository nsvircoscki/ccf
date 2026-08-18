import geomartIcon from '../assets/geomart_icon.png';
import earthIcon from '../assets/google.png';
import geobensulIcon from '../assets/Geobensul.png';

const GOOGLE_EARTH_APP_URL = 'googleearth://';
const GOOGLE_EARTH_WEB_URL = 'https://earth.google.com/web/'; // alternativa se o app não abrir


// O navegador não tem como confirmar se um protocolo customizado
// (ex: "googleearth://") está registrado na máquina — só dá pra tentar
// navegar até ele e observar o que acontece:
//   1. Se o app abrir, o sistema tira o foco da aba (evento "visibilitychange").
//   2. Se não houver nada instalado, a aba nunca perde o foco. Depois de um
//      tempo curto sem isso acontecer, assumimos que falhou e abrimos a
//      versão web como alternativa.

const ATALHOS = [
  {
    id: 'earth',
    label: 'Google Earth',
    iconUrl: earthIcon,
    iconSize: 60,
    onClick: abrirGoogleEarth
  },
  {
    id: 'registro-rural',
    label: 'Registro Rural',
    iconUrl: 'https://www.google.com/s2/favicons?domain=registrorural.com.br&sz=64',
    onClick: () => window.open('https://www.registrorural.com.br/search', '_blank', 'noopener,noreferrer'),
  },
  {
    id: 'geomart',
    label: 'Geomart',
    iconUrl: geomartIcon,
    iconSize: 60,
    onClick: () => window.open('https://geomart.com.br/', '_blank', 'noopener,noreferrer'),
  },
  {
    id: 'geobensul',
    label: 'Geobensul',
    iconUrl: geobensulIcon,
    iconSize: 80,
    onClick: () => window.open('https://geo.saobentodosul.sc.gov.br/?page=Dados-Abertos', '_blank', 'noopener, noreferrer'),
  },
];


function abrirGoogleEarth() {
  let appAbriu = false;

  function aoPerderFoco() {
    appAbriu = true;
  }
  document.addEventListener('visibilitychange', aoPerderFoco);

  // Dispara a tentativa de abrir o app instalado.
  window.location.href = GOOGLE_EARTH_APP_URL;

  // Se depois de 1,2s a aba continuar em primeiro plano, o protocolo
  // provavelmente não está registrado nessa máquina — cai no fallback web.
  setTimeout(() => {
    document.removeEventListener('visibilitychange', aoPerderFoco);
    if (!appAbriu) {
      window.open(GOOGLE_EARTH_WEB_URL, '_blank', 'noopener,noreferrer');
    }
  }, 1200);
}

// Ocupa o lugar do mapa interativo (removido) enquanto nenhuma imagem foi
// anexada ao cadastro/orçamento. O ícone é um atalho de verdade — tenta abrir
// o Google Earth instalado na máquina (e cai na versão web se não conseguir).
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
      <div style={{ display: 'flex', gap: '18px' }}>
      {ATALHOS.map((atalho) => (
        <button
          key={atalho.id}
          type="button"
          onClick={atalho.onClick}
          title={atalho.label}
          style={{ 
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            cursor: 'pointer',
           }}
        >
          <img
            src={atalho.iconUrl}
            alt={atalho.label}
            style={{
              width: `${atalho.iconSize || 28}px`,
              height: `${atalho.iconSize || 28}px`,
              objectFit: 'contain',
            }}
          />     
          </button>
          ))}
    </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#4E5565' }}>Nenhuma imagem anexada</div>
        <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px' }}>
          Clique no ícone para abrir o Google Earth e tirar um print do local
        </div>
      </div>
    </div>
  );
}

export default PlaceholderMapa;
