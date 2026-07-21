import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const mapModes = ['Satelite', 'Topografico', 'Vetorial'];

const tileLayers = {
  Satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  Topografico: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
  Vetorial: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

function PainelMapa({ viewMode, setViewMode }) {
  const activeLayer = tileLayers[viewMode] || tileLayers.Vetorial;

  return (
    <div style={{ background: '#F4F6FA', position: 'relative', height: 'calc(100vh - 64px)', minHeight: '520px', width: '100%', overflow: 'hidden' }}>
      <MapContainer
        center={[-26.2295, -49.3855]}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl
      >
        <TileLayer
          url={activeLayer.url}
          attribution={activeLayer.attribution}
          maxZoom={activeLayer.maxZoom}
        />
      </MapContainer>

      <div
        style={{
          position: 'absolute',
          top: '18px',
          left: '18px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: '14px',
          padding: '10px 12px',
          fontSize: '12px',
          fontWeight: 800,
          color: '#4E5565',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.10)',
        }}
      >
        Mapa de referência
      </div>

      <div style={{ position: 'absolute', bottom: '24px', left: '24px', display: 'flex', gap: '8px', zIndex: 1000, flexWrap: 'wrap' }}>
        {mapModes.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            style={{
              borderRadius: '20px',
              border: viewMode === mode ? 'none' : '1px solid rgba(45, 42, 53, 0.12)',
              background: viewMode === mode ? '#2D7AFD' : '#FFFFFF',
              color: viewMode === mode ? '#FFFFFF' : '#5F6370',
              padding: '10px 18px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PainelMapa;
