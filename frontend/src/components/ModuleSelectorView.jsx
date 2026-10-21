import { useState } from 'react';
import {
  Search, LayoutGrid, Calculator, FileText, ArrowLeft,
  BookOpen, Receipt, ClipboardCheck, Clock3, Archive,
} from 'lucide-react';
import imgDiscord from '../assets/discord_icon.png';
import { temAcessoAoModulo } from '../utils/permissoes';
import { GRUPOS, ehGrupo, subitensDoGrupo, podeAbrirSubitem, grupoAcessivel } from '../utils/gruposMenu';

const MONT = '"Montserrat", sans-serif';
const SANS = '"Open Sans", sans-serif';
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const POP_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const CAMINHO_SIS_CAIXA_KEY = 'ccf:sis-caixa:caminho';

function caminhoRedeParaUrl(caminho) {
  const normalizado = caminho.trim().replace(/\\/g, '/');
  if (!normalizado.startsWith('//')) {
    throw new Error('Informe um caminho de rede começando com \\\\servidor\\.');
  }
  return `file:${normalizado}`;
}

// Tiles de grupo (Cadastros, Relatórios, Configurações) abrem uma segunda
// tela com as opções de dentro — definidos em utils/gruposMenu.js, que a
// navbar também usa.
const tileDeGrupo = (id) => ({ id, label: GRUPOS[id].label, desc: GRUPOS[id].desc, icon: GRUPOS[id].icon, color: GRUPOS[id].color });

// wip: ainda não têm tela — o tile aparece pra dar visibilidade do que vem
// por aí, mas fica desabilitado (ver ModuleTile) até a tela existir.
const MODULOS = [
  tileDeGrupo('cadastros'),
  { id: 'dashboard', label: 'Pesquisa', desc: 'Buscar serviços por cliente, matrícula ou etapa', icon: Search, color: '#2e8b2e' },
  { id: 'kanban', label: 'Kanban', desc: 'Acompanhar o andamento dos projetos por etapa', icon: LayoutGrid, color: '#0e7490' },
  { id: 'orcamento', label: 'Orçamento', desc: 'Montar e aprovar orçamentos de serviço', icon: Calculator, color: '#b45309' },
  { id: 'emissao-documentos', label: 'OS/Contrato', desc: 'Ordem de serviço e contrato do serviço', icon: FileText, color: '#0f766e', wip: true },
  { id: 'sis-caixa', label: 'SIS CAIXA', desc: 'Abrir planilha de caixa', icon: Archive, color: '#065f46' },
  tileDeGrupo('sis-doc'),
  tileDeGrupo('config'),
  { id: 'sis-mon', label: 'SIS MON', desc: 'Sistema de monografia', icon: BookOpen, color: '#92400e', wip: true },
  tileDeGrupo('relatorios'),
  { id: 'faturamento', label: 'Faturamento', desc: 'Emitir boletos e notas fiscais', icon: Receipt, color: '#b91c1c' },
  { id: 'tarefas', label: 'Tarefas', desc: 'Planilha de atividades por setor, com histórico do que já foi concluído', icon: ClipboardCheck, color: '#ea580c' },
  { id: 'sis-ponto', label: 'SIS Ponto', desc: 'Sistema para bater o ponto dos funcionários', icon: Clock3, color: '#2563eb' },
  { id: 'discord', label: 'Discord', desc: 'Abrir o aplicativo Discord', icon: imgDiscord, color: '#5865f2', externalUrl: 'discord://-/' },
];

function ModuleTile({ mod, index, onOpen, onConfigure, semPermissao }) {
  const Icon = mod.icon;
  const [hover, setHover] = useState(false);
  const wip = Boolean(mod.wip);
  // Bloqueado tanto pra quem ainda não tem tela (wip) quanto pra quem não tem
  // permissão de acesso — visualmente idêntico (cinza, sem clique), só muda
  // a mensagem que explica o motivo.
  const bloqueado = wip || semPermissao;

  return (
    <button
      type="button"
      onClick={bloqueado ? undefined : onOpen}
      onContextMenu={(evento) => {
        if (mod.id !== 'sis-caixa' || bloqueado || !onConfigure) return;
        evento.preventDefault();
        onConfigure();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={
        wip
          ? 'Em desenvolvimento — ainda não disponível'
          : semPermissao
            ? 'Sem permissão de acesso'
            : mod.id === 'sis-caixa'
              ? 'Clique para abrir; botão direito para alterar o caminho'
              : undefined
      }
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        background: 'none', border: 'none', padding: 0, cursor: bloqueado ? 'default' : 'pointer', outline: 'none',
        animation: `moduloPop 0.5s ${POP_EASE} ${index * 0.045 + 0.05}s both`,
        opacity: bloqueado ? 0.55 : 1,
      }}
    >
      <div
        style={{
          position: 'relative', width: 84, height: 84, borderRadius: 24,
          background: bloqueado ? 'linear-gradient(150deg, #94a3b8 0%, #94a3b8cc 100%)' : `linear-gradient(150deg, ${mod.color} 0%, ${mod.color}cc 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          boxShadow: !bloqueado && hover
            ? `0 14px 30px ${mod.color}66`
            : `0 8px 20px rgba(148,163,184,0.3), inset 0 1px 0 rgba(255,255,255,0.25)`,
          transform: !bloqueado && hover ? 'translateY(-4px) scale(1.04)' : 'none',
          transition: `transform 0.28s ${EASE}, box-shadow 0.25s ease`,
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '46%',
          borderRadius: '24px 24px 38px 38px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.28), transparent)',
          pointerEvents: 'none',
        }} />
        {typeof Icon === 'string'
          ? <img src={Icon} alt="" style={{ display: 'block', position: 'relative', zIndex: 1, width: 32, height: 32, objectFit: 'contain', borderRadius: 8 }} />
          : <Icon size={32} strokeWidth={1.8} />}
      </div>
      <span style={{
        fontFamily: SANS, fontWeight: 600, fontSize: 12.5,
        color: !bloqueado && hover ? mod.color : '#3a4a6b', textAlign: 'center', maxWidth: 100,
        transition: 'color 0.2s ease',
      }}>
        {mod.label}
      </span>
      <span style={{
        fontFamily: SANS, fontSize: 11, color: '#9aabcc', textAlign: 'center', maxWidth: 120,
        opacity: hover ? 1 : 0, transition: 'opacity 0.2s ease', minHeight: 14,
      }}>
        {wip ? 'Em desenvolvimento' : semPermissao ? 'Sem permissão de acesso' : mod.desc}
      </span>
    </button>
  );
}

export default function ModuleSelectorView({ usuarioLogado, usuarioAtual, onAbrirModulo }) {
  // Grupo aberto na segunda tela (Cadastros, Relatórios, Configurações), ou null.
  const [submenu, setSubmenu] = useState(null);
  const [modalCaminhoAberto, setModalCaminhoAberto] = useState(false);
  const [caminhoDigitado, setCaminhoDigitado] = useState('');
  const [erroCaminho, setErroCaminho] = useState('');

  const abrirModalCaminho = () => {
    setCaminhoDigitado(window.localStorage.getItem(CAMINHO_SIS_CAIXA_KEY) || '');
    setErroCaminho('');
    setModalCaminhoAberto(true);
  };

  const salvarCaminhoSisCaixa = (evento) => {
    evento.preventDefault();
    const caminho = caminhoDigitado.trim();
    try {
      const url = caminhoRedeParaUrl(caminho);
      window.localStorage.setItem(CAMINHO_SIS_CAIXA_KEY, caminho);
      setModalCaminhoAberto(false);
      setErroCaminho('');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (erro) {
      setErroCaminho(erro.message);
    }
  };

  const abrirSisCaixa = () => {
    const caminho = window.localStorage.getItem(CAMINHO_SIS_CAIXA_KEY);
    if (!caminho) {
      abrirModalCaminho();
      return;
    }
    try {
      window.open(caminhoRedeParaUrl(caminho), '_blank', 'noopener,noreferrer');
    } catch {
      window.localStorage.removeItem(CAMINHO_SIS_CAIXA_KEY);
      abrirModalCaminho();
    }
  };

  // Grupo fica bloqueado se a pessoa não abre nada dentro dele; tela comum
  // segue permissoes.js.
  const semPermissao = (mod) => (
    mod.externalUrl
    ? false
    : ehGrupo(mod.id) 
    ? !grupoAcessivel(mod.id, usuarioLogado) 
    : !temAcessoAoModulo(usuarioLogado, mod.id)
  );

  const abrirTilePrincipal = (mod) => {
    if (mod.wip || semPermissao(mod)) return;

    if (mod.externalUrl) {
      window.open(mod.externalUrl, '_blank', 'noopener, noreferrer');
      return;
    }

    if (mod.id === 'sis-caixa') {
      abrirSisCaixa();
      return;
    }

    if (ehGrupo(mod.id)) {
      setSubmenu(mod.id);
      return;
    }
    onAbrirModulo(mod.id);
  };

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
            {(usuarioAtual?.nome || usuarioLogado || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: MONT, fontWeight: 600, fontSize: 13, color: '#0e2549' }}>{usuarioAtual?.nome || usuarioLogado}</div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: '#9aabcc' }}>{usuarioLogado} · CCF Consultores</div>
          </div>
        </div>
      </header>

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 24px', overflowY: 'auto',
      }}>
        {/* maxWidth mais largo cabe os 13 tiles em só 2 linhas (7 por linha) —
            estreito demais e o último sobra sozinho numa 3ª linha, exigindo
            rolar a tela pra aparecer. */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', width: '100%', maxWidth: 900 }}>
          {submenu && (
            <button
              type="button"
              onClick={() => setSubmenu(null)}
              aria-label="Voltar aos módulos"
              style={{
                position: 'absolute', left: 0, top: 0, width: 36, height: 36, borderRadius: 10,
                border: '1px solid #e0e7f2', background: '#fff', color: '#3a4a6b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <ArrowLeft size={17} />
            </button>
          )}
          <p style={{
            fontFamily: MONT, fontWeight: 600, fontSize: 11, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#2e8b2e', margin: '0 0 8px',
          }}>
            SISTEMA CCF
          </p>
          <h2 style={{ fontFamily: MONT, fontWeight: 700, fontSize: 24, color: '#0e2549', margin: 0, letterSpacing: '-0.01em' }}>
            {submenu ? GRUPOS[submenu].titulo : 'Selecione um módulo'}
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
          gap: '26px 22px', width: '100%', maxWidth: 900, justifyItems: 'center',
        }}>
          {submenu
            ? subitensDoGrupo(submenu, usuarioLogado).map((sub, i) => (
              <ModuleTile
                key={sub.id}
                mod={sub}
                index={i}
                semPermissao={!podeAbrirSubitem(submenu, sub, usuarioLogado)}
                onOpen={() => onAbrirModulo(sub.id)}
              />
            ))
            : MODULOS.map((mod, i) => (
              <ModuleTile
                key={mod.id}
                mod={mod}
                index={i}
                semPermissao={semPermissao(mod)}
                onOpen={() => abrirTilePrincipal(mod)}
                onConfigure={mod.id === 'sis-caixa' ? abrirModalCaminho : undefined}
              />
            ))}
        </div>
        {modalCaminhoAberto && (
          <div
            role="presentation"
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget) setModalCaminhoAberto(false);
            }}
            style={{
              position: 'fixed', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center',
              padding: 20, background: 'rgba(14, 37, 73, .42)',
            }}
          >
            <form
              onSubmit={salvarCaminhoSisCaixa}
              style={{
                width: 'min(440px, 100%)', padding: 26, borderRadius: 18, background: '#fff',
                boxShadow: '0 24px 70px rgba(14, 37, 73, .25)', textAlign: 'left',
              }}
            >
              <h3 style={{ margin: 0, color: '#0e2549', fontFamily: MONT, fontSize: 19 }}>Configurar SIS CAIXA</h3>
              <p style={{ margin: '8px 0 18px', color: '#7183a3', fontFamily: SANS, fontSize: 13, lineHeight: 1.5 }}>
                Informe o caminho de rede do arquivo Excel usado neste computador.
              </p>
              <label htmlFor="caminho-sis-caixa" style={{ display: 'block', marginBottom: 7, color: '#3a4a6b', fontFamily: SANS, fontSize: 12, fontWeight: 700 }}>
                Caminho do arquivo
              </label>
              <input
                id="caminho-sis-caixa"
                autoFocus
                value={caminhoDigitado}
                onChange={(evento) => {
                  setCaminhoDigitado(evento.target.value);
                  setErroCaminho('');
                }}
                placeholder="\\\\servidor\\pasta\\caixa.xlsx"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '11px 12px', border: `1px solid ${erroCaminho ? '#d94b4b' : '#d8e4f3'}`,
                  borderRadius: 9, outline: 'none', color: '#243755', fontFamily: SANS, fontSize: 13,
                }}
              />
              {erroCaminho && <p style={{ margin: '7px 0 0', color: '#c43d3d', fontFamily: SANS, fontSize: 12 }}>{erroCaminho}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                <button type="button" onClick={() => setModalCaminhoAberto(false)} style={{ border: '1px solid #d8e4f3', borderRadius: 9, padding: '9px 14px', background: '#fff', color: '#52637f', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ border: 0, borderRadius: 9, padding: '9px 16px', background: '#065f46', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Salvar e abrir</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
