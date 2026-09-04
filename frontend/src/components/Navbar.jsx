import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Search, LayoutGrid, Calculator, FileText, Users, Home, Link2, Settings2, KeyRound, ListChecks, Bell,
  Wallet, BookOpen, FileSpreadsheet, Table, Receipt, ClipboardCheck, Clock3,
} from 'lucide-react';
import { AlterarSenhaModal } from '../modals/AlterarSenhaModal.jsx';
import { api } from '../services/api';
import { temAcessoAoModulo } from '../utils/permissoes';

// Mesmo ícone/cor de cada módulo no ModuleSelectorView.jsx — mantém os dois
// selecionáveis (a tela de módulos e a navbar) visualmente consistentes.
const ITENS = [
  { id: 'dashboard', label: 'Pesquisa', icon: Search, color: '#2e8b2e' },
  { id: 'kanban', label: 'SIS SOS', icon: LayoutGrid, color: '#0e7490' },
  { id: 'orcamento', label: 'Orçamento', icon: Calculator, color: '#b45309' },
  { id: 'emissao-documentos', label: 'OS/Contrato', icon: FileText, color: '#0f766e' },
  { id: 'sis-caixa', label: 'SIS CAIXA', icon: Wallet, color: '#065f46', wip: true },
  { id: 'clientes', label: 'Pessoas', icon: Users, color: '#be185d' },
  { id: 'imoveis', label: 'Imóveis', icon: Home, color: '#7c3aed' },
  { id: 'vinculacao', label: 'SIS DOC', icon: Link2, color: '#1a3a8a' },
  { id: 'sis-mon', label: 'SIS MON', icon: BookOpen, color: '#92400e', wip: true },
  { id: 'importar-pontos', label: 'Pontos', icon: FileSpreadsheet, color: '#0369a1' },
  { id: 'tabela-servicos', label: 'Tabela de Serviços', icon: Table, color: '#4d7c0f' },
  { id: 'faturamento', label: 'Faturamento', icon: Receipt, color: '#b91c1c' },
  { id: 'tarefas', label: 'Tarefas', icon: ClipboardCheck, color: '#ea580c' },
  { id: 'sis-ponto', label: 'SIS Ponto', icon: Clock3, color: '#2563eb' },
  { id: 'config', label: 'Configurações', icon: Settings2, color: '#64748b' },
];

// Sub-opções do item "Configurações" — clicar nele abre este menu em vez de
// ir direto pra uma tela, igual ao seletor de módulos. "Etapas" só aparece
// pro usuário ENG (mesma restrição da tela em si).
const SUBMENU_CONFIG = [
  { id: 'config-documentos', label: 'Documentos', icon: FileText, color: '#64748b' },
  { id: 'config-etapas', label: 'Etapas', icon: ListChecks, color: '#9333ea', apenasEng: true },
];

function NavItem({ ativo, onClick, item, bloqueado }) {
  const [hover, setHover] = useState(false);
  const Icon = item.icon;
  const destacado = !bloqueado && (ativo || hover);

  return (
    <button
      type="button"
      onClick={bloqueado ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={bloqueado ? (item.wip ? 'Em desenvolvimento — ainda não disponível' : 'Sem permissão de acesso') : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        border: 'none',
        background: 'transparent',
        padding: '6px 2px 4px',
        cursor: bloqueado ? 'default' : 'pointer',
        outline: 'none',
        whiteSpace: 'nowrap',
        opacity: bloqueado ? 0.45 : 1,
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: bloqueado ? 'linear-gradient(150deg, #94a3b8 0%, #94a3b8cc 100%)' : `linear-gradient(150deg, ${item.color} 0%, ${item.color}cc 100%)`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: destacado ? `0 8px 16px ${item.color}55` : `0 3px 8px rgba(148,163,184,0.3)`,
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
  kanban,
}) {
  const [alterarSenhaAberto, setAlterarSenhaAberto] = useState(false);
  const [configMenuAberto, setConfigMenuAberto] = useState(false);
  // Posição calculada na hora de abrir (ver abrirMenuConfig) — o dropdown usa
  // position:fixed pra escapar do overflow-x:auto do <nav> (senão fica
  // cortado, já que fica fora dos limites verticais do container com scroll).
  const [configMenuPos, setConfigMenuPos] = useState({ top: 0, left: 0 });
  const configRef = useRef(null);

  const abrirMenuConfig = () => {
    setConfigMenuAberto((aberto) => {
      if (!aberto && configRef.current) {
        const rect = configRef.current.getBoundingClientRect();
        setConfigMenuPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
      }
      return !aberto;
    });
  };

  // Notificações: avisa o setor responsável quando uma etapa fica pronta pra
  // começar (a anterior, na sequência do projeto, acabou de ser concluída).
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notifMenuAberto, setNotifMenuAberto] = useState(false);
  const [notifMenuPos, setNotifMenuPos] = useState({ top: 0, left: 0 });
  const notifRef = useRef(null);

  const carregarNotificacoes = async () => {
    try {
      const dados = await api.getNotificacoes(usuarioLogado);
      setNotificacoes(dados?.notificacoes || []);
      setNaoLidas(dados?.naoLidas || 0);
    } catch (erro) {
      console.error('Erro ao carregar notificações:', erro);
    }
  };

  useEffect(() => {
    carregarNotificacoes();
    // Como não há WebSocket, um polling simples mantém o contador atualizado
    // mesmo sem o usuário reabrir o menu — cobre notificações geradas por
    // outra pessoa logada em outra máquina.
    const intervalo = setInterval(carregarNotificacoes, 20000);
    return () => clearInterval(intervalo);
  }, [usuarioLogado]);

  // Atualiza na hora (sem esperar o polling) sempre que algum card se move
  // nesta mesma sessão — o passo que acabou de ser concluído pode ter gerado
  // uma notificação nova pro próximo setor.
  useEffect(() => {
    if (kanban?.tickets) carregarNotificacoes();
  }, [kanban?.tickets]);

  const abrirMenuNotificacoes = () => {
    setNotifMenuAberto((aberto) => {
      if (!aberto) {
        if (notifRef.current) {
          const rect = notifRef.current.getBoundingClientRect();
          setNotifMenuPos({ top: rect.bottom + 8, left: rect.right });
        }
        carregarNotificacoes();
      }
      return !aberto;
    });
  };

  const clicarNotificacao = async (notificacao) => {
    setNotifMenuAberto(false);
    if (!notificacao.lida) {
      try {
        await api.marcarNotificacaoComoLida(notificacao.id);
        setNotificacoes((prev) => prev.map((n) => n.id === notificacao.id ? { ...n, lida: true } : n));
        setNaoLidas((prev) => Math.max(0, prev - 1));
      } catch (erro) {
        console.error('Erro ao marcar notificação como lida:', erro);
      }
    }
    if (notificacao.workflowId && kanban?.setWorkflowAtivo) {
      kanban.setWorkflowAtivo(notificacao.workflowId);
    }
    setTelaAtiva('kanban');
  };

  const marcarTodasComoLidas = async () => {
    try {
      await api.marcarTodasNotificacoesComoLidas(usuarioLogado);
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
      setNaoLidas(0);
    } catch (erro) {
      console.error('Erro ao marcar notificações como lidas:', erro);
    }
  };

  useEffect(() => {
    const fecharSeForaDoMenu = (evento) => {
      if (configRef.current && !configRef.current.contains(evento.target)) setConfigMenuAberto(false);
      if (notifRef.current && !notifRef.current.contains(evento.target)) setNotifMenuAberto(false);
    };
    document.addEventListener('mousedown', fecharSeForaDoMenu);
    return () => document.removeEventListener('mousedown', fecharSeForaDoMenu);
  }, []);

  const submenuConfigVisivel = SUBMENU_CONFIG.filter((sub) => !sub.apenasEng ||['ENG', 'DEV'].includes(usuarioLogado));
  const emTelaDeConfig = ['config-documentos', 'config-etapas'].includes(telaAtiva);

  return (
    <header
      style={{
        flexShrink: 0,
        height: '76px',
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        display: 'grid',
        // Esquerda e direita ficam "auto" (nunca encolhem — o nome do
        // usuário e as ações precisam estar sempre visíveis). Quem cede
        // espaço é o menu central: minmax(0, 1fr) permite encolher de
        // verdade, e o overflow-x:auto do <nav> deixa ele rolar em vez de
        // espremer o resto pra fora ou some o nome do usuário.
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
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

      {/* Centro: navegação — rola horizontalmente em vez de espremer os
          lados quando não cabe tudo de uma vez */}
      <nav className="scroll" style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', overflowX: 'auto', overflowY: 'hidden', minWidth: 0, padding: '2px 2px 6px' }}>
        {ITENS.filter((item) => !item.wip && temAcessoAoModulo(usuarioLogado, item.id)).map((item) => {
          return item.id === 'config' ? (
            <div key={item.id} ref={configRef} style={{ position: 'relative' }}>
              <NavItem
                item={item}
                ativo={emTelaDeConfig || configMenuAberto}
                bloqueado={false}
                onClick={abrirMenuConfig}
              />
              {configMenuAberto && (
                <div style={{
                  position: 'fixed', top: configMenuPos.top, left: configMenuPos.left, transform: 'translateX(-50%)',
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
              bloqueado={false}
              onClick={() => setTelaAtiva(item.id)}
            />
          );
        })}
      </nav>

      {/* Direita: ação principal e sessão */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', minWidth: 0 }}>
        {temAcessoAoModulo(usuarioLogado, 'cadastro') && (
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
        )}

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

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={abrirMenuNotificacoes}
            title="Notificações"
            aria-label="Notificações"
            style={{
              width: '36px', height: '36px', borderRadius: '999px', flexShrink: 0,
              border: '1px solid rgba(15, 23, 42, 0.12)', background: notifMenuAberto ? '#EEF4FF' : '#FFFFFF',
              color: notifMenuAberto ? '#1a3a8a' : '#64748B',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', transition: 'all 0.18s ease',
            }}
          >
            <Bell size={15} />
            {naoLidas > 0 && (
              <span style={{
                position: 'absolute', top: '-3px', right: '-3px', minWidth: '16px', height: '16px',
                borderRadius: '999px', background: '#DC2626', color: '#fff', fontSize: '10px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                border: '2px solid #fff',
              }}>
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>

          {notifMenuAberto && (
            <div style={{
              position: 'fixed', top: notifMenuPos.top, left: notifMenuPos.left, transform: 'translateX(-100%)',
              background: '#fff', border: '1px solid rgba(15, 23, 42, 0.10)', borderRadius: 12,
              boxShadow: '0 12px 34px rgba(14,37,73,0.16)', overflow: 'hidden', zIndex: 40,
              width: '320px', maxHeight: '380px', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Notificações</span>
                {naoLidas > 0 && (
                  <button type="button" onClick={marcarTodasComoLidas} style={{ border: 'none', background: 'none', color: '#1a3a8a', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="scroll" style={{ overflowY: 'auto' }}>
                {notificacoes.length === 0 ? (
                  <div style={{ padding: '24px 14px', textAlign: 'center', color: '#94A3B8', fontSize: '12.5px' }}>
                    Nenhuma notificação por aqui.
                  </div>
                ) : (
                  notificacoes.map((notificacao) => (
                    <button
                      key={notificacao.id}
                      type="button"
                      onClick={() => clicarNotificacao(notificacao)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'flex-start', gap: '8px', textAlign: 'left',
                        padding: '12px 14px', border: 'none', borderBottom: '1px solid rgba(15,23,42,0.06)',
                        background: notificacao.lida ? 'transparent' : 'rgba(26, 58, 138, 0.05)', cursor: 'pointer',
                      }}
                    >
                      {!notificacao.lida && (
                        <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: '#1a3a8a', marginTop: '5px', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: notificacao.lida ? 500 : 700, lineHeight: 1.4 }}>
                        {notificacao.mensagem}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
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
