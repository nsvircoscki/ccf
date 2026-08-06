import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';

const CORES = {
  'Charles': '#FBC02D',
  'Topografia': '#1E88E5',
  'Desenho': '#43A047',
  'Coordenação': '#795548',
};

const ITENS = [
  { id: 'cadastro', label: 'Cadastro de Serviço' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'emissao-documentos', label: 'Emissão de Documentos'},
  { id: 'clientes', label: 'Clientes' },
  { id: 'imoveis', label: 'Imóveis' },
  { id: 'confrontantes', label: 'Confrontantes' },
  { id: 'vinculacao', label: 'Vinculação' },
];

// A busca só é consumida pelo Dashboard e pelo Kanban — mostrá-la nas outras
// telas seria um campo que não faz nada.
const TELAS_COM_BUSCA = ['dashboard', 'kanban'];

function NavItem({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '8px 2px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: ativo ? 700 : 500,
        color: ativo ? '#0F172A' : '#64748B',
        transition: 'color 0.18s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(event) => { if (!ativo) event.currentTarget.style.color = '#0F172A'; }}
      onMouseLeave={(event) => { if (!ativo) event.currentTarget.style.color = '#64748B'; }}
    >
      {children}
      {ativo ? (
        <motion.span
          layoutId="navbar-underline"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '-2px',
            height: '2px',
            borderRadius: '2px',
            background: '#0F172A',
          }}
        />
      ) : null}
    </button>
  );
}

export function Navbar({
  telaAtiva,
  setTelaAtiva,
  buscaTexto,
  setBuscaTexto,
  usuarioLogado,
  setUsuarioLogado,
  onAbrirNovoProjeto,
}) {
  const mostrarBusca = TELAS_COM_BUSCA.includes(telaAtiva);

  return (
    <header
      style={{
        flexShrink: 0,
        height: '64px',
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '24px',
        padding: '0 28px',
        zIndex: 30,
      }}
    >
      {/* Esquerda: marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <img src="/ccf_icon.png" alt="" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
        <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
          CCF
        </span>
      </div>

      {/* Centro: navegação */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        {ITENS.map((item) => (
          <NavItem
            key={item.id}
            ativo={telaAtiva === item.id}
            onClick={() => setTelaAtiva(item.id)}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>

      {/* Direita: busca, ação principal e sessão */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', minWidth: 0 }}>
        {mostrarBusca ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={buscaTexto}
              onChange={(event) => setBuscaTexto(event.target.value)}
              style={{
                height: '38px',
                width: '210px',
                borderRadius: '999px',
                border: '1px solid transparent',
                background: '#F1F5F9',
                padding: '0 14px 0 34px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none',
                transition: 'background 0.18s ease, border-color 0.18s ease',
              }}
              onFocus={(event) => {
                event.currentTarget.style.background = '#FFFFFF';
                event.currentTarget.style.borderColor = '#CBD5E1';
              }}
              onBlur={(event) => {
                event.currentTarget.style.background = '#F1F5F9';
                event.currentTarget.style.borderColor = 'transparent';
              }}
            />
          </div>
        ) : null}

        <motion.button
          type="button"
          onClick={onAbrirNovoProjeto}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          style={{
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 16px',
            borderRadius: '999px',
            border: 'none',
            background: '#0F172A',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={15} strokeWidth={2.5} /> Novo Projeto
        </motion.button>

        <div style={{ width: '1px', height: '24px', background: 'rgba(15, 23, 42, 0.10)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              background: CORES[usuarioLogado] || '#94A3B8',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#0F172A',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {usuarioLogado}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setUsuarioLogado(null)}
          style={{
            height: '38px',
            padding: '0 14px',
            borderRadius: '999px',
            border: '1px solid rgba(15, 23, 42, 0.12)',
            background: '#FFFFFF',
            color: '#64748B',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.color = '#DC2626';
            event.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.35)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color = '#64748B';
            event.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.12)';
          }}
        >
          Sair
        </button>
      </div>
    </header>
  );
}
