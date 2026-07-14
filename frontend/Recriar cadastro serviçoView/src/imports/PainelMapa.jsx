import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import omnivore from 'leaflet-omnivore';
import tokml from 'tokml';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
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

const drawStyle = {
  color: '#2D7AFD',
  weight: 3,
  opacity: 0.95,
  fillColor: '#2D7AFD',
  fillOpacity: 0.18,
};

const buttonStyle = (variant = 'default') => ({
  borderRadius: '12px',
  border: variant === 'primary' ? 'none' : '1px solid rgba(45, 42, 53, 0.12)',
  background: variant === 'primary' ? '#2D7AFD' : '#FFFFFF',
  color: variant === 'primary' ? '#FFFFFF' : '#4E5565',
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
});

const countFeatures = (geoJson) => {
  if (!geoJson) return 0;
  if (geoJson.type === 'FeatureCollection') return geoJson.features.length;
  return 1;
};

function MapDrawingManager({ apiRef, onGeoJsonChange }) {
  const map = useMap();
  const drawnItemsRef = useRef(null);

  useEffect(() => {
    const drawnItems = L.featureGroup().addTo(map);
    drawnItemsRef.current = drawnItems;

    const syncGeoJson = () => {
      const geoJson = drawnItems.toGeoJSON();
      onGeoJsonChange(geoJson);
    };

    const prepareLayer = (layer) => {
      if (layer.setStyle) {
        layer.setStyle(drawStyle);
      }

      layer.on('pm:edit', syncGeoJson);
      layer.on('pm:dragend', syncGeoJson);
      layer.on('pm:update', syncGeoJson);
      return layer;
    };

    const addImportedLayers = (importedLayer) => {
      importedLayer.eachLayer((layer) => {
        prepareLayer(layer);
        drawnItems.addLayer(layer);
      });

      const bounds = drawnItems.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [28, 28] });
      }

      syncGeoJson();
    };

    map.pm.addControls({
      position: 'topleft',
      drawCircle: false,
      drawCircleMarker: false,
      drawMarker: true,
      drawPolygon: true,
      drawPolyline: true,
      drawRectangle: true,
      drawText: false,
      editMode: true,
      dragMode: true,
      removalMode: true,
      cutPolygon: false,
      rotateMode: false,
    });

    map.on('pm:create', (event) => {
      const layer = prepareLayer(event.layer);
      drawnItems.addLayer(layer);
      syncGeoJson();
    });

    map.on('pm:remove', (event) => {
      drawnItems.removeLayer(event.layer);
      syncGeoJson();
    });

    apiRef.current = {
      clear: () => {
        drawnItems.clearLayers();
        syncGeoJson();
      },
      exportKml: () => {
        const geoJson = drawnItems.toGeoJSON();
        if (!geoJson.features.length) {
          window.alert('Desenhe ou importe ao menos uma forma antes de exportar.');
          return;
        }

        const kml = tokml(geoJson);
        const blob = new Blob([kml], {
          type: 'application/vnd.google-earth.kml+xml;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `mapa-${new Date().toISOString().slice(0, 10)}.kml`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      },
      importKmlText: (kmlText) => {
        let importedLayer;
        let added = false;

        const addOnce = () => {
          if (added || !importedLayer) return;
          added = true;
          addImportedLayers(importedLayer);
        };

        try {
          importedLayer = omnivore.kml.parse(kmlText, null, L.geoJSON(null, { style: drawStyle }));
          importedLayer.on('ready', addOnce);
          importedLayer.on('error', () => {
            window.alert('Nao foi possivel ler este arquivo KML.');
          });
          window.setTimeout(addOnce, 0);
        } catch {
          window.alert('Nao foi possivel ler este arquivo KML.');
        }
      },
    };

    syncGeoJson();

    return () => {
      apiRef.current = {};
      map.pm.removeControls();
      map.off('pm:create');
      map.off('pm:remove');
      drawnItems.clearLayers();
      drawnItems.remove();
    };
  }, [apiRef, map, onGeoJsonChange]);

  return null;
}

function PainelMapa({ viewMode, setViewMode }) {
  const activeLayer = tileLayers[viewMode] || tileLayers.Vetorial;
  const drawingApiRef = useRef({});
  const fileInputRef = useRef(null);
  const [featureCount, setFeatureCount] = useState(0);

  const handleGeoJsonChange = (geoJson) => {
    setFeatureCount(countFeatures(geoJson));
  };

  const handleKmlUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.kml')) {
      window.alert('Por enquanto, importe arquivos no formato .kml.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      drawingApiRef.current.importKmlText?.(String(reader.result || ''));
      event.target.value = '';
    };
    reader.onerror = () => {
      window.alert('Nao foi possivel abrir este arquivo.');
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ background: '#F4F6FA', position: 'relative', height: 'calc(100vh - 64px)', minHeight: '520px', width: '100%', overflow: 'hidden' }}>
      <MapContainer
        center={[-26.2295, -49.3855]}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url={activeLayer.url}
          attribution={activeLayer.attribution}
          maxZoom={activeLayer.maxZoom}
        />
        <MapDrawingManager apiRef={drawingApiRef} onGeoJsonChange={handleGeoJsonChange} />
      </MapContainer>

      <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000, alignItems: 'flex-end' }}>
        <div style={{ borderRadius: '14px', background: '#FFFFFF', color: '#4E5565', padding: '10px 14px', fontSize: '12px', fontWeight: 800, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)' }}>
          {featureCount} forma{featureCount === 1 ? '' : 's'} no mapa
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".kml,application/vnd.google-earth.kml+xml"
            onChange={handleKmlUpload}
            style={{ display: 'none' }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={buttonStyle('primary')}>
            Importar KML
          </button>
          <button type="button" onClick={() => drawingApiRef.current.exportKml?.()} style={buttonStyle()}>
            Exportar KML
          </button>
          <button type="button" onClick={() => drawingApiRef.current.clear?.()} style={buttonStyle()}>
            Limpar
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '24px', left: '24px', display: 'flex', gap: '8px', zIndex: 1000 }}>
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
