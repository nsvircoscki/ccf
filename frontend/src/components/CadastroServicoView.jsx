import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, Check, FolderPlus, MessageSquare, Save, MapPin } from 'lucide-react';
import PainelMapa from '../page/PainelMapa.jsx';

const initialServices = [
  { id: 1, nome: 'Levantamento Topografico', indice: 4.0, ativo: true, selecionado: false },
  { id: 2, nome: 'Retificacao', indice: 1.5, ativo: true, selecionado: true },
  { id: 3, nome: 'Desmembramento', indice: 1.0, ativo: true, selecionado: false },
  { id: 4, nome: 'Unificacao', indice: 1.0, ativo: true, selecionado: false },
  { id: 5, nome: 'Usucapiao', indice: 1.0, ativo: true, selecionado: false },
  { id: 6, nome: 'Certificacao', indice: 1.0, ativo: true, selecionado: false },
  { id: 7, nome: 'CAR', indice: 0.5, ativo: true, selecionado: false },
  { id: 8, nome: 'Escritura', indice: 1.0, ativo: true, selecionado: false },
  { id: 9, nome: 'Cadastral', indice: 1.0, ativo: true, selecionado: false },
  { id: 10, nome: 'Conferencia', indice: 1.0, ativo: true, selecionado: false },
  { id: 11, nome: 'Movimentacao de Terra', indice: 1.0, ativo: true, selecionado: false },
  { id: 12, nome: 'Locacao', indice: 1.0, ativo: true, selecionado: false },
  { id: 13, nome: 'Atualizacao', indice: 1.0, ativo: true, selecionado: false },
];

const formatIndex = (value) => value.toFixed(1).replace('.', ',');

function ServiceCard({ service, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(service.id)}
      style={{
        position: 'relative',
        padding: '13px 12px 12px',
        borderRadius: '12px',
        border: selected ? '1px solid #AFC3FF' : '1px solid rgba(15, 23, 42, 0.10)',
        background: selected ? '#EDF3FF' : '#FFFFFF',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: selected ? '0 4px 14px rgba(45, 122, 253, 0.08)' : '0 1px 2px rgba(15, 23, 42, 0.03)',
        minHeight: '92px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.25, color: '#1F2A44', maxWidth: '120px' }}>
          {service.nome}
        </div>
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '6px',
            border: selected ? '1px solid #2D7AFD' : '1px solid #CBD5E1',
            background: selected ? '#2D7AFD' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {selected ? <Check size={12} strokeWidth={3} color="#FFFFFF" /> : null}
        </div>
      </div>

      <div style={{ marginTop: '18px', fontSize: '12px', color: selected ? '#5B7EEA' : '#7C8AA5', fontWeight: 600 }}>
        Índice {formatIndex(service.indice)}
      </div>
    </button>
  );
}

export default function CadastroServicoView({ onBack }) {
  const [viewMode, setViewMode] = useState('Topografico');
  const [services, setServices] = useState(initialServices);
  const [area, setArea] = useState('0,00');
  const [municipio, setMunicipio] = useState('Sao Bento do Sul');
  const [codigoServico] = useState(() => `20260714-${Math.floor(100 + Math.random() * 900)}-TOP`);
  const [mensagem, setMensagem] = useState(null);
  const [cliente, setCliente] = useState('');

  const selectedServices = useMemo(
    () => services.filter((service) => service.selecionado && service.ativo),
    [services],
  );
  const selectedCount = selectedServices.length;
  const totalIndice = useMemo(
    () => selectedServices.reduce((acc, service) => acc + service.indice, 0),
    [selectedServices],
  );

  const toggleService = (id) => {
    setServices((current) =>
      current.map((service) =>
        service.id === id && service.ativo ? { ...service, selecionado: !service.selecionado } : service,
      ),
    );
  };

  const handleSalvar = () => {
    setMensagem({ tipo: 'sucesso', texto: 'Cadastro preparado no layout do Figma.' });
    window.setTimeout(() => setMensagem(null), 2200);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA', color: '#2D2A35', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          height: '64px',
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: '1px solid rgba(15, 23, 42, 0.12)',
              background: '#FFFFFF',
              color: '#54607A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', lineHeight: 1.1 }}>
              Cadastro de Serviço
            </div>
            <div style={{ fontSize: '12px', color: '#95A0B5', marginTop: '2px' }}>{codigoServico}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#54607A', fontWeight: 700 }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '999px',
              background: '#10B981',
              boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.16)',
            }}
          />
          Fase 1 - Captacao & Geoprocessamento
        </div>
      </header>

      {mensagem ? (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            background: mensagem.tipo === 'sucesso' ? '#EAF8F3' : '#FEECEC',
            color: mensagem.tipo === 'sucesso' ? '#0F8B6B' : '#C24141',
            border: `1px solid ${mensagem.tipo === 'sucesso' ? 'rgba(16, 163, 127, 0.18)' : 'rgba(248, 113, 113, 0.18)'}`,
            borderRadius: '14px',
            padding: '10px 14px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.10)',
            zIndex: 40,
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {mensagem.texto}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 470px', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        <PainelMapa viewMode={viewMode} setViewMode={setViewMode} />

        <aside
          style={{
            background: '#FFFFFF',
            borderLeft: '1px solid rgba(15, 23, 42, 0.08)',
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '26px' }}>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1'}}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <Building2 size={14} /> Cliente
               </span>
              <input
                value={cliente}
                onChange={(event) => setCliente(event.target.value)}
                placeholder='Nome do Cliente'
                style={{
                  height: '44px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15, 23, 43, 0.12',
                  background: '#F8FAFD',
                  padding: '0 14px',
                  fontSize: '14px',
                  outline: 'none',
                  color: '#1F2937',
                }}
              />
              
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <MapPin size={14} /> Área (ha)
                </span>
                <input
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  style={{
                    height: '44px',
                    borderRadius: '12px',
                    border: '1px solid rgba(15, 23, 42, 0.12)',
                    background: '#F8FAFD',
                    padding: '0 14px',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#1F2937',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase' }}>
                  <Building2 size={14} /> Município
                </span>
                <select
                  value={municipio}
                  onChange={(event) => setMunicipio(event.target.value)}
                  style={{
                    height: '44px',
                    borderRadius: '12px',
                    border: '1px solid rgba(15, 23, 42, 0.12)',
                    background: '#F8FAFD',
                    padding: '0 14px',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#1F2937',
                  }}
                >
                  <option value="Sao Bento do Sul">São Bento do Sul</option>
                  <option value="Campo Alegre">Campo Alegre</option>
                  <option value="Rio Negrinho">Rio Negrinho</option>
                  <option value="Corupa">Corupá</option>
                  <option value="Outro">Outro</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Serviços
              </div>
              <div style={{ fontSize: '12px', color: '#8A94A6', fontWeight: 700 }}>
                Índice (somente leitura)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', paddingBottom: '8px' }}>
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={service.selecionado && service.ativo}
                  onToggle={toggleService}
                />
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', background: '#FFFFFF', padding: '16px 20px 20px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: '16px',
                background: '#F5F7FB',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 800, color: '#5A6780' }}>
                SELECIONADOS
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '999px',
                    background: '#E8EEFF',
                    color: '#3D63F1',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  {selectedCount}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#7B879B', fontWeight: 700, textAlign: 'right' }}>
                Índice total <span style={{ color: '#1F2937', fontSize: '14px' }}>{formatIndex(totalIndice)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.25fr', gap: '12px' }}>
              <button
                type="button"
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15, 23, 42, 0.10)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#4E5970',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <FolderPlus size={16} />
                Pasta
              </button>
              <button
                type="button"
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: '1px solid rgba(15, 23, 42, 0.10)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#4E5970',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <MessageSquare size={16} />
                Notas
              </button>
              <button
                type="button"
                onClick={handleSalvar}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #14B38B 0%, #0F9E7A 100%)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 10px 20px rgba(15, 163, 127, 0.22)',
                }}
              >
                <Save size={16} />
                Salvar Cadastro
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
