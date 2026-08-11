import { useState } from 'react';
import {
  ClipboardList, Search, LayoutGrid, Calculator, FileText, Users, Home, Link2, Settings2,
} from 'lucide-react';

const MONT = '"Montserrat", sans-serif';
const SANS = '"Open Sans", sans-serif';
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const POP_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const MODULOS = [
  { id: 'cadastro', label: 'Cadastro de Serviço', desc: 'Abrir um novo serviço e escolher os tipos de processo', icon: ClipboardList, color: '#1a3a8a' },
  { id: 'dashboard', label: 'Pesquisa', desc: 'Buscar serviços por cliente, matrícula ou etapa', icon: Search, color: '#2e8b2e' },
  { id: 'kanban', label: 'Kanban', desc: 'Acompanhar o andamento dos projetos por etapa', icon: LayoutGrid, color: '#0e7490' },
  { id: 'orcamento', label: 'Orçamento', desc: 'Montar e aprovar orçamentos de serviço', icon: Calculator, color: '#b45309' },
  { id: 'emissao-documentos', label: 'OS/Contrato', desc: 'Gerar requerimentos e declarações a partir de modelos', icon: FileText, color: '#0f766e' },
  { id: 'clientes', label: 'Pessoas', desc: 'Cadastro de clientes, pessoas físicas e jurídicas', icon: Users, color: '#be185d' },
  { id: 'imoveis', label: 'Imóveis', desc: 'Cadastro de imóveis, proprietários e usufrutuários', icon: Home, color: '#7c3aed' },
  { id: 'vinculacao', label: 'SIS DOC', desc: 'Vincular proprietários, imóvel e confrontantes ao serviço', icon: Link2, color: '#1a3a8a' },
  { id: 'config-documentos', label: 'Documentos × Tipos', desc: 'Configurar quais documentos aparecem para cada tipo de serviço', icon: Settings2, color: '#64748b' },
];

function ModuleTile({ mod, index, onOpen }) {
  const Icon = mod.icon;
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        background: 'none', border: 'none', padding: 0, cursor: 'pointer', outline: 'none',
        animation: `moduloPop 0.5s ${POP_EASE} ${index * 0.045 + 0.05}s both`,
      }}
    >
      <div
        style={{
          position: 'relative', width: 84, height: 84, borderRadius: 24,
          background: `linear-gradient(150deg, ${mod.color} 0%, ${mod.color}cc 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          boxShadow: hover
            ? `0 14px 30px ${mod.color}66`
            : `0 8px 20px ${mod.color}3a, inset 0 1px 0 rgba(255,255,255,0.25)`,
          transform: hover ? 'translateY(-4px) scale(1.04)' : 'none',
          transition: `transform 0.28s ${EASE}, box-shadow 0.25s ease`,
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '46%',
          borderRadius: '24px 24px 38px 38px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.28), transparent)',
          pointerEvents: 'none',
        }} />
        <Icon size={32} strokeWidth={1.8} />
      </div>
      <span style={{
        fontFamily: SANS, fontWeight: 600, fontSize: 12.5,
        color: hover ? mod.color : '#3a4a6b', textAlign: 'center', maxWidth: 100,
        transition: 'color 0.2s ease',
      }}>
        {mod.label}
      </span>
      <span style={{
        fontFamily: SANS, fontSize: 11, color: '#9aabcc', textAlign: 'center', maxWidth: 120,
        opacity: hover ? 1 : 0, transition: 'opacity 0.2s ease', minHeight: 14,
      }}>
        {mod.desc}
      </span>
    </button>
  );
}

export default function ModuleSelectorView({ usuarioLogado, onAbrirModulo }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#f4f7fb', display: 'flex', flexDirection: 'column',
      animation: `fadeUp 0.5s ${EASE} forwards`,
    }}>
      <style>{`
        @keyframes moduloPop { from { opacity: 0; transform: translateY(14px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <header style={{
        background: '#ffffff', borderBottom: '1px solid #e8edf5', padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/ccf_icon.png" alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <span style={{ fontFamily: MONT, fontWeight: 900, fontSize: 22, color: '#1a3a8a', letterSpacing: '-0.02em' }}>CCF</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a3a8a, #2e8b2e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: MONT, fontWeight: 700, fontSize: 14, color: '#fff',
          }}>
            {(usuarioLogado || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: MONT, fontWeight: 600, fontSize: 13, color: '#0e2549' }}>{usuarioLogado}</div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: '#9aabcc' }}>CCF Consultores</div>
          </div>
        </div>
      </header>

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '48px 24px 60px', overflowY: 'auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <p style={{
            fontFamily: MONT, fontWeight: 600, fontSize: 11, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#2e8b2e', margin: '0 0 8px',
          }}>
            SISTEMA CCF
          </p>
          <h2 style={{ fontFamily: MONT, fontWeight: 700, fontSize: 24, color: '#0e2549', margin: 0, letterSpacing: '-0.01em' }}>
            Selecione um módulo
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
          gap: '30px 22px', width: '100%', maxWidth: 640, justifyItems: 'center',
        }}>
          {MODULOS.map((mod, i) => (
            <ModuleTile
              key={mod.id}
              mod={mod}
              index={i}
              onOpen={() => onAbrirModulo(mod.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
