import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Search, LayoutGrid, Calculator, FileText, Users, Home, Link2, Settings2, KeyRound, ListChecks,
} from 'lucide-react';
import { AlterarSenhaModal } from '../modals/AlterarSenhaModal.jsx';

// Mesmo ícone/cor de cada módulo no ModuleSelectorView.jsx — mantém os dois
// selecionáveis (a tela de módulos e a navbar) visualmente consistentes.
const ITENS = [
  { id: 'dashboard', label: 'Pesquisa', icon: Search, color: '#2e8b2e' },
  { id: 'kanban', label: 'SIS SOS', icon: LayoutGrid, color: '#0e7490' },
  { id: 'orcamento', label: 'Orçamento', icon: Calculator, color: '#b45309' },
  { id: 'emissao-documentos', label: 'OS/Contrato', icon: FileText, color: '#0f766e' },
  { id: 'clientes', label: 'Pessoas', icon: Users, color: '#be185d' },
  { id: 'imoveis', label: 'Imóveis', icon: Home, color: '#7c3aed' },
  { id: 'vinculacao', label: 'SIS DOC', icon: Link2, color: '#1a3a8a' },
  { id: 'config', label: 'Configurações', icon: Settings2, color: '#64748b' },
];

// Sub-opções do item "Configurações" — clicar nele abre este menu em vez de
// ir direto pra uma tela, igual ao seletor de módulos. "Etapas" só aparece
// pro usuário Charles (mesma restrição da tela em si).
const SUBMENU_CONFIG = [
  { id: 'config-documentos', label: 'Documentos', icon: FileText, color: '#64748b' },
  { id: 'config-etapas', label: 'Etapas', icon: ListChecks, color: '#9333ea', apenasCharles: true },
];

function NavItem({ ativo, onClick, item }) {
  const [hover, setHover] = useState(false);
  const Icon = item.icon;
  const destacado = ativo || hover;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        border: 'none',
        background: 'transparent',
        padding: '6px 2px 4px',
        cursor: 'pointer',
        outline: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: `linear-gradient(150deg, ${item.color} 0%, ${item.color}cc 100%)`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: destacado ? `0 8px 16px ${item.color}55` : `0 3px 8px ${item.color}30`,
          transform: destacado ? 'translateY(-2px) scale(1.05)' : 'none',
          transition: 'transform 0.22s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.22s ease',
        }}
      >
        <Icon size={16} strokeWidth={2} />
      </div>
      <span style={{
        fontSize: '10.5px',
        fontWeight: ativo ? 800 : 600,
        color: ativo ? '#0F172A' : '#64748B',
        transition: 'color 0.18s ease',
      }}>
        {item.label}
      </span>
      {ativo ? (
        <motion.span
          layoutId="navbar-underline"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          style={{
            width: '18px',
            height: '2.5px',
            borderRadius: '2px',
            background: item.color,
          }}
        />
      ) : (
        <span style={{ height: '2.5px' }} />
      )}
    </button>
  );
}

export function Navbar({
  telaAtiva,
  setTelaAtiva,
  usuarioLogado,
  setUsuarioLogado,
  onVoltarModulos,
}) {
  const [alterarSenhaAberto, setAlterarSenhaAberto] = useState(false);
  const [configMenuAberto, setConfigMenuAberto] = useState(false);
  const configRef = useRef(null);

  useEffect(() => {
    const fecharSeForaDoMenu = (evento) => {
      if (configRef.current && !configRef.current.contains(evento.target)) setConfigMenuAberto(false);
    };
    document.addEventListener('mousedown', fecharSeForaDoMenu);
    return () => document.removeEventListener('mousedown', fecharSeForaDoMenu);
  }, []);

  const submenuConfigVisivel = SUBMENU_CONFIG.filter((sub) => !sub.apenasCharles || usuarioLogado === 'Charles');
  const emTelaDeConfig = ['config-documentos', 'config-etapas'].includes(telaAtiva);

  return (
    <header
      style={{
        flexShrink: 0,
        height: '76px',
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        display: 'grid',
        // minmax(0, 1fr), não só "1fr": um track "1fr" puro tem mínimo
        // implícito "auto" (do tamanho do conteúdo) — com muitos itens de
        // menu, isso empurrava a coluna da direita (nome do usuário) pra
        // fora da tela em vez de encolher. minmax(0, 1fr) permite encolher
        // até 0 de verdade, deixando o ellipsis do nome fazer o trabalho.
        gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        alignItems: 'center',
        gap: '24px',
        padding: '0 28px',
        zIndex: 30,
      }}
    >
      {/* Esquerda: marca — volta ao seletor de módulos */}
      <button
        type="button"
        onClick={onVoltarModulos}
        title="Voltar ao seletor de módulos"
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0,
          border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
        }}
      >
        <img src="/ccf_icon.png" alt="" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
        <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
          CCF
        </span>
      </button>

      {/* Centro: navegação */}
      <nav style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
        {ITENS.map((item) => (
          item.id === 'config' ? (
            <div key={item.id} ref={configRef} style={{ position: 'relative' }}>
              <NavItem
                item={item}
                ativo={emTelaDeConfig || configMenuAberto}
                onClick={() => setConfigMenuAberto((aberto) => !aberto)}
              />
              {configMenuAberto && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                  background: '#fff', border: '1px solid rgba(15, 23, 42, 0.10)', borderRadius: 12,
                  boxShadow: '0 12px 34px rgba(14,37,73,0.16)', overflow: 'hidden', zIndex: 40,
                  minWidth: 170,
                }}>
                  {submenuConfigVisivel.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => { setTelaAtiva(sub.id); setConfigMenuAberto(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', border: 'none', cursor: 'pointer',
                          background: telaAtiva === sub.id ? `${sub.color}12` : 'transparent',
                          fontSize: 13, fontWeight: 600, color: telaAtiva === sub.id ? sub.color : '#334155',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${sub.color}12`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = telaAtiva === sub.id ? `${sub.color}12` : 'transparent'; }}
                      >
                        <SubIcon size={15} color={sub.color} />
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <NavItem
              key={item.id}
              item={item}
              ativo={telaAtiva === item.id}
              onClick={() => setTelaAtiva(item.id)}
            />
          )
        ))}
      </nav>

      {/* Direita: ação principal e sessão */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', minWidth: 0 }}>
        <motion.button
          type="button"
          onClick={() => setTelaAtiva('cadastro')}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          style={{
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 14px',
            borderRadius: '999px',
            border: '1px solid rgba(26, 58, 138, 0.22)',
            background: 'rgba(26, 58, 138, 0.06)',
            color: '#1a3a8a',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <ClipboardList size={15} strokeWidth={2.1} /> Cadastrar Serviço
        </motion.button>

        <div style={{ width: '1px', height: '24px', background: 'rgba(15, 23, 42, 0.10)', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '28px', flexShrink: 1, overflow: 'hidden' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #1a3a8a, #2e8b2e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '14px', color: '#fff',
          }}>
            {(usuarioLogado || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div
              title={usuarioLogado}
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
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>CCF Consultores</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAlterarSenhaAberto(true)}
          title="Alterar senha"
          aria-label="Alterar senha"
          style={{
            width: '36px', height: '36px', borderRadius: '999px', flexShrink: 0,
            border: '1px solid rgba(15, 23, 42, 0.12)', background: '#FFFFFF', color: '#64748B',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.color = '#1a3a8a';
            event.currentTarget.style.borderColor = 'rgba(26, 58, 138, 0.3)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color = '#64748B';
            event.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.12)';
          }}
        >
          <KeyRound size={15} />
        </button>

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
            flexShrink: 0,
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

      {alterarSenhaAberto && (
        <AlterarSenhaModal usuarioLogado={usuarioLogado} onClose={() => setAlterarSenhaAberto(false)} />
      )}
    </header>
  );
}
