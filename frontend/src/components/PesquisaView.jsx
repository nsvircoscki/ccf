import React, { useState } from 'react';
import { FiSearch, FiList, FiTrello, FiX } from 'react-icons/fi';
import { AnimatedDropdown } from './AnimatedDropdown';

const TIPOS_PROCESSO = ["Retificação", "Desmembramento", "Unificação", "Usucapião", "Alteração de Divisas", "CAR", "Certificação INCRA", "Escritura", "Conferência", "Cadastral", "Locação", "Movimentação de Terra", "Danc"];

// Mesmo mapa usado no Orçamento/Cadastro de Serviço — aqui serve só pra
// mostrar o tipo de forma compacta nos resultados da busca.
const SIGLA_POR_TIPO = {
  'Retificação': 'Ret',
  'Desmembramento': 'Desm',
  'Unificação': 'Uni',
  'Usucapião': 'Usu',
  'Alteração de Divisas': 'At',
  'CAR': 'CAR',
  'Certificação INCRA': 'Cert',
  'Escritura': 'Escritura',
  'Conferência': 'Conf',
  'Cadastral': 'Cad',
  'Locação': 'Loc',
  'Movimentação de Terra': 'Mov de Terra',
  'Outros': 'Outros',
  'Extremação': 'Ext',
};

const siglasDoTipo = (description) =>
  (description || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(tipo => SIGLA_POR_TIPO[tipo] || tipo)
    .join(', ');

const getCorStatus = (status) => {
  if (status === 'Iniciar') return '#FBC02D';
  if (status === 'Em Andamento') return '#1E88E5';
  if (status === 'Concluído') return '#43A047';
  return '#999';
};

const ETAPAS = ['Iniciar', 'Em Andamento', 'Concluído'];

const normalize = (text) => String(text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const contarEtapas = (projeto) =>
  ETAPAS.reduce((acc, etapa) => {
    acc[etapa] = projeto.tasks.filter(t => (t.currentStep?.step_name || 'Iniciar') === etapa).length;
    return acc;
  }, {});

export function PesquisaView({
  kanban,
  usuarioLogado,
  setTelaAtiva,
  onAbrirAuditoria,
}) {
  const { tickets, workflows, setWorkflowAtivo } = kanban;

  const [query, setQuery] = useState('');
  const [buscaEtapa, setBuscaEtapa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [selectedId, setSelectedId] = useState(null);
  // Só o Charles administra as etapas de todo mundo — por padrão ele já vê
  // tudo; esse toggle deixa ele restringir pra só as etapas dedicadas a ele
  // quando quiser, sem perder a visão geral (fica só um clique de distância).
  const [somenteMinhasEtapas, setSomenteMinhasEtapas] = useState(false);

  const etapaTerm = normalize(buscaEtapa.trim());

  // Mesma lógica de filtro por setor do usuário logado que o Dashboard já usava.
  let tarefas = tickets;
  if (usuarioLogado !== 'Charles') {
    tarefas = tarefas.filter(t => (t.currentStep?.requiredRole?.name || 'Coordenação') === usuarioLogado);
  } else if (somenteMinhasEtapas) {
    tarefas = tarefas.filter(t => (t.currentStep?.requiredRole?.name || 'Coordenação') === 'Charles');
  }
  if (filtroStatus === 'Pendentes') {
    tarefas = tarefas.filter(t => (t.currentStep?.step_name || 'Iniciar') !== 'Concluído');
  } else if (filtroStatus !== 'Todas') {
    tarefas = tarefas.filter(t => (t.currentStep?.step_name || 'Iniciar') === filtroStatus);
  }
  if (filtroTipo !== 'Todos') {
    tarefas = tarefas.filter(t => t.workflow?.description?.includes(filtroTipo));
  }
  if (etapaTerm !== '') {
    tarefas = tarefas.filter(t => {
      const etapaTexto = normalize(t.currentStep?.step_name || 'Iniciar');
      return etapaTexto.includes(etapaTerm) || normalize(t.title).includes(etapaTerm);
    });
  }

  // Progresso global — mesmos números que o Dashboard mostrava, calculados
  // sobre o conjunto já filtrado (status, tipo, etapa).
  const totalTarefas = tarefas.length;
  const concluidasGlobal = tarefas.filter(t => (t.currentStep?.step_name || 'Iniciar') === 'Concluído').length;
  const progressoGlobal = totalTarefas === 0 ? 0 : Math.round((concluidasGlobal / totalTarefas) * 100);
  const raio = 36;
  const circunferencia = 2 * Math.PI * raio;
  const offsetProgresso = circunferencia - (progressoGlobal / 100) * circunferencia;

  // Agrupamento por projeto, igual ao Dashboard — cada projeto carrega junto o
  // nome do cliente e a matrícula (via workflow.servico), pra dar pra buscar.
  const projetos = tarefas.reduce((acc, ticket) => {
    if (!ticket.workflow) return acc;
    let projeto = acc.find(p => p.id === ticket.workflowId);
    if (!projeto) {
      projeto = {
        id: ticket.workflowId,
        name: ticket.workflow.name,
        description: ticket.workflow.description,
        matricula: ticket.workflow.matricula,
        nomeCliente: ticket.workflow.servico?.nomeCliente,
        tasks: [],
      };
      acc.push(projeto);
    }
    projeto.tasks.push(ticket);
    return acc;
  }, []);

  const q = query.trim().toLowerCase();
  const resultados = q
    ? projetos.filter(p =>
        (p.matricula || '').toLowerCase().includes(q) ||
        (p.nomeCliente || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q))
    : projetos;

  const ativo = resultados.find(p => p.id === selectedId) || resultados[0] || null;
  const etapasAtivo = ativo ? contarEtapas(ativo) : null;
  const totalAtivo = ativo ? ativo.tasks.length : 0;
  const concluidasAtivo = etapasAtivo ? etapasAtivo['Concluído'] : 0;
  const progressoAtivo = totalAtivo === 0 ? 0 : Math.round((concluidasAtivo / totalAtivo) * 100);
  const setoresAtivo = ativo ? [...new Set(ativo.tasks.map(t => t.currentStep?.requiredRole?.name || 'Coordenação'))] : [];

  const statusOptions = [
    { value: 'Pendentes', label: 'Pendentes (Iniciar / Em Andamento)' },
    { value: 'Todas', label: 'Todas (Incluindo Concluído)' },
    { value: 'Iniciar', label: 'Apenas Iniciar' },
    { value: 'Em Andamento', label: 'Apenas Em Andamento' },
    { value: 'Concluído', label: 'Apenas Concluído' },
  ];
  const tipoOptions = [{ value: 'Todos', label: 'Todos os Tipos' }, ...TIPOS_PROCESSO.map(tipo => ({ value: tipo, label: tipo }))];

  return (
    <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* Título + progresso global */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '32px' }}>Pesquisar Serviços</h1>
            <p style={{ margin: 0, color: '#777' }}>Busque por matrícula, cliente, projeto ou etapa.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {usuarioLogado === 'Charles' && (
              <div style={{ display: 'flex', background: '#EAEAEA', borderRadius: '20px', padding: '4px' }}>
                <button
                  type="button"
                  onClick={() => setSomenteMinhasEtapas(false)}
                  style={{
                    padding: '8px 16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '13px',
                    background: !somenteMinhasEtapas ? '#2D7AFD' : 'transparent',
                    color: !somenteMinhasEtapas ? '#FFF' : '#787373',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Todas as Etapas
                </button>
                <button
                  type="button"
                  onClick={() => setSomenteMinhasEtapas(true)}
                  title="Ver só as etapas dedicadas a você"
                  style={{
                    padding: '8px 16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '13px',
                    background: somenteMinhasEtapas ? '#2D7AFD' : 'transparent',
                    color: somenteMinhasEtapas ? '#FFF' : '#787373',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Minhas Etapas
                </button>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: '15px', padding: '16px 22px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ position: 'relative', width: '72px', height: '72px' }}>
              <svg width="72" height="72" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={raio} fill="none" stroke="#F0F0F0" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r={raio}
                  fill="none"
                  stroke={progressoGlobal === 100 ? '#22C55E' : '#4A90E2'}
                  strokeWidth="8"
                  strokeDasharray={circunferencia}
                  strokeDashoffset={offsetProgresso}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '900', color: progressoGlobal === 100 ? '#22C55E' : '#4A90E2' }}>
                {progressoGlobal}%
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#333', fontSize: '15px' }}>Progressão Geral</div>
              <div style={{ fontSize: '13px', color: '#777', fontWeight: 'bold' }}>{concluidasGlobal} de {totalTarefas} tarefas finalizadas</div>
            </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#999', marginBottom: '5px' }}>PESQUISAR</label>
            <FiSearch size={17} color="#999" style={{ position: 'absolute', left: '14px', top: '38px' }} />
            <input
              autoFocus
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSelectedId(null); }}
              placeholder="Matrícula, cliente ou nome do projeto..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '13px 40px 13px 40px',
                borderRadius: '12px', border: '1.5px solid #DDD', outline: 'none', fontSize: '14px', background: '#FFF',
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSelectedId(null); }}
                aria-label="Limpar"
                style={{
                  position: 'absolute', right: '12px', top: '38px', transform: 'translateY(2px)',
                  background: '#F0F0F0', border: 'none', borderRadius: '50%', width: '22px', height: '22px',
                  cursor: 'pointer', color: '#777', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <FiX size={13} />
              </button>
            )}
          </div>

          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#999', marginBottom: '5px' }}>BUSCAR ETAPA</label>
            <input
              type="text"
              placeholder="Nome da etapa ou tarefa"
              value={buscaEtapa}
              onChange={e => setBuscaEtapa(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #DDD', outline: 'none', background: '#FFF', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR TIPO</label>
            <AnimatedDropdown
              label="Tipo"
              value={filtroTipo}
              onChange={setFiltroTipo}
              options={tipoOptions}
              width="220px"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR STATUS</label>
            <AnimatedDropdown
              label="Status"
              value={filtroStatus}
              onChange={setFiltroStatus}
              options={statusOptions}
              width="260px"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
          {/* Lista de resultados */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', marginBottom: '10px' }}>
              {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {resultados.map((p) => {
                const isActive = ativo?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      cursor: 'pointer', background: '#fff', borderRadius: '12px', padding: '13px 16px',
                      border: isActive ? '1px solid #1a3a8a' : '1px solid #EEE',
                      borderLeft: isActive ? '4px solid #1a3a8a' : '4px solid #EEE',
                      boxShadow: isActive ? '0 4px 14px rgba(26,58,138,0.15)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#333', fontSize: '15px' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                      {[p.nomeCliente, p.matricula ? `Mat: ${p.matricula}` : null, siglasDoTipo(p.description)].filter(Boolean).join(' — ') || 'Sem cliente/matrícula vinculados'}
                    </div>
                  </div>
                );
              })}
              {resultados.length === 0 && (
                <div style={{
                  background: '#fff', border: '1.5px dashed #DDD', borderRadius: '12px',
                  padding: '24px 16px', textAlign: 'center', color: '#999', fontSize: '13px',
                }}>
                  Nenhum resultado encontrado.
                </div>
              )}
            </div>
          </div>

          {/* Painel de detalhes — estilo mais próximo do Figma: cabeçalho em
              degradê, badge de status, grid de campos e barra de progresso. */}
          <div style={{
            position: 'sticky', top: '20px', background: '#fff', borderRadius: '16px',
            boxShadow: '0px 8px 28px rgba(14,37,73,0.08)', overflow: 'hidden', minHeight: '420px',
          }}>
            {ativo ? (
              <>
                <div style={{
                  padding: '26px 32px', color: '#fff',
                  background: 'linear-gradient(135deg, #1a3a8a 0%, #0e2549 130%)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.01em' }}>{ativo.name}</h3>
                    <span style={{
                      fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase',
                      whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.18)', padding: '6px 12px', borderRadius: '20px',
                    }}>
                      {progressoAtivo}% concluído
                    </span>
                  </div>
                  {ativo.description && (
                    <p style={{ margin: 0, fontSize: '13.5px', opacity: 0.85 }}>{ativo.description}</p>
                  )}
                </div>

                <div style={{ padding: '28px 32px' }}>
                  {/* Barra de progresso do projeto selecionado */}
                  <div style={{ marginBottom: '26px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '6px' }}>
                      <span>Progresso do Projeto</span>
                      <span style={{ color: progressoAtivo === 100 ? '#22C55E' : '#1a3a8a' }}>{progressoAtivo}%</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#EEF2F8', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressoAtivo}%`, height: '100%', background: progressoAtivo === 100 ? '#22C55E' : 'linear-gradient(90deg, #1a3a8a, #2e8b2e)', transition: 'width 0.5s' }} />
                    </div>
                  </div>

                  {/* Grid de campos, estilo Figma */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px 28px', marginBottom: '26px' }}>
                    {[
                      ['Cliente', ativo.nomeCliente || '—'],
                      ['Matrícula', ativo.matricula || '—'],
                      ['Total de tarefas', String(totalAtivo)],
                      ['Setores envolvidos', setoresAtivo.join(', ') || '—'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9aabcc', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0e2549' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Contadores por etapa */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
                    {Object.entries(etapasAtivo).map(([etapa, count]) => (
                      <span key={etapa} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F0F0F0', color: '#555', padding: '8px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getCorStatus(etapa) }} />
                        {etapa}: {count}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => { setWorkflowAtivo(ativo.id); setTelaAtiva('kanban'); }}
                      style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#2D7AFD', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                    >
                      <FiTrello size={16} /> Abrir no Kanban
                    </button>
                    <button
                      onClick={() => onAbrirAuditoria(workflows.find(w => w.id === ativo.id) || ativo)}
                      style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #DDE5F2', background: '#fff', color: '#2D7AFD', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                    >
                      <FiList size={16} /> Ver Etapas
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '420px', gap: '10px', color: '#AAA', fontSize: '13px' }}>
                <FiSearch size={40} />
                Selecione um resultado para ver os detalhes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
