import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function App() {
  const [tickets, setTickets] = useState([]);
  
  const USUARIOS = ['Desenho', 'Topografia', 'Charles', 'Coordenação'];
  const [usuarioLogado, setUsuarioLogado] = useState(null); 
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioSelecionadoLogin, setUsuarioSelecionadoLogin] = useState('Charles');
  
  // SISTEMA DE NAVEGAÇÃO
  const [telaAtiva, setTelaAtiva] = useState('dashboard'); // 'dashboard' ou 'kanban'

  const [modalAberto, setModalAberto] = useState(false);
  const [nomeNovoProjeto, setNomeNovoProjeto] = useState("");
  const [carregandoCriacao, setCarregandoCriacao] = useState(false);
  
  const [workflows, setWorkflows] = useState([]);
  const [workflowAtivo, setWorkflowAtivo] = useState(null);
  const [filtroResponsavel, setFiltroResponsavel] = useState('Todos'); 
  const [ticketArrastado, setTicketArrastado] = useState(null);

  const CORES = {
    'Charles': { bg: '#BBDEFB', borda: '#1565C0', icone: '👨‍💻' },      
    'Topografia': { bg: '#E1BEE7', borda: '#6A1B9A', icone: '🗺️' },   
    'Desenho': { bg: '#C8E6C9', borda: '#2E7D32', icone: '📐' },      
    'Coordenação': { bg: '#FFF9C4', borda: '#F57F17', icone: '📋' }   
  };

  const carregarDados = async () => {
    try {
      const resWf = await fetch('http://localhost:3000/workflows');
      const dadosWf = await resWf.json();
      if (Array.isArray(dadosWf)) {
        setWorkflows(dadosWf);
        if (dadosWf.length > 0 && !workflowAtivo) setWorkflowAtivo(dadosWf[0].id);
      }

      const resTk = await fetch('http://localhost:3000/tickets');
      const dadosTk = await resTk.json();
      if (Array.isArray(dadosTk)) setTickets(dadosTk);
      else setTickets([]);
    } catch (err) { 
      console.error("Erro na API:", err); 
      setTickets([]);
    }
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    carregarDados();
  }, []);

  const projeto = workflows.find(w => w.id === workflowAtivo);
  const colunasDaTela = projeto?.steps.filter(s => s.requiredRole?.name === 'Charles') || [];

  const handleLogin = (e) => {
    e.preventDefault();
    if (senhaInput === '123' || senhaInput === '') setUsuarioLogado(usuarioSelecionadoLogin);
  };

  const criarProjetoCompleto = async () => {
    if (!nomeNovoProjeto.trim()) return;
    setCarregandoCriacao(true);
    
    try {
      await fetch('http://localhost:3000/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nomeNovoProjeto })
      });
      
      await carregarDados(); 
      setModalAberto(false);
      setNomeNovoProjeto("");
      
      const resWf = await fetch('http://localhost:3000/workflows');
      const wfAtualizados = await resWf.json();
      if (Array.isArray(wfAtualizados) && wfAtualizados.length > 0) {
        setWorkflowAtivo(wfAtualizados[0].id); 
        setTelaAtiva('kanban'); // Joga o usuário direto pro quadro criado
      }
    } catch (erro) { console.error(erro); }
    finally { setCarregandoCriacao(false); }
  };

  const handleDrop = async (e, nomeColunaDestino) => {
    e.preventDefault();
    if (!ticketArrastado) return;
    
    const setorDoCard = ticketArrastado.currentStep?.requiredRole?.name;
    const proximaEtapa = projeto.steps.find(s => s.step_name === nomeColunaDestino && s.requiredRole.name === setorDoCard);
    
    if (!proximaEtapa || ticketArrastado.currentStepId === proximaEtapa.id) {
      setTicketArrastado(null); return;
    }
    
    const ticketId = ticketArrastado.id;
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, currentStepId: proximaEtapa.id, currentStep: proximaEtapa } : t));
    
    try {
      await fetch('http://localhost:3000/tickets/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, toStepId: proximaEtapa.id, userId: usuarioLogado }) 
      });
    } catch (err) { console.error(err); }
    setTicketArrastado(null);
  };

  const excluirTicket = async (id) => {
    if(!window.confirm("Deseja mesmo remover esta tarefa do projeto?")) return;
    await fetch(`http://localhost:3000/tickets/${id}`, { method: 'DELETE' });
    setTickets(prev => prev.filter(t => t.id !== id));
  };

  const acionarImpressao = () => window.print();

  const globalCss = (
    <style>{`
      * { font-family: 'Roboto', sans-serif !important; }
      .scroll::-webkit-scrollbar { width: 6px; height: 6px; }
      .scroll::-webkit-scrollbar-thumb { background: #BDBDBD; border-radius: 10px; }
      .print-only { display: none; }

      @media print {
        @page { margin: 20mm; }
        body { background: white; margin: 0; padding: 0; }
        .no-print { display: none !important; }
        .print-only { display: block !important; width: 100%; color: black; }
        .print-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .print-table th, .print-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .print-table th { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
      }
    `}</style>
  );

  if (!usuarioLogado) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {globalCss}
        <div style={{ background: '#CCCBCB', padding: '40px', borderRadius: '20px', width: '360px' }}>
          <h1 style={{ textAlign: 'center', color: '#787373', margin: '0 0 20px' }}>Acesso ao Sistema</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <select value={usuarioSelecionadoLogin} onChange={e => setUsuarioSelecionadoLogin(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: 'none' }}>
              {USUARIOS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input type="password" placeholder="Senha..." value={senhaInput} onChange={e => setSenhaInput(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: 'none' }} />
            <button type="submit" style={{ padding: '12px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // LÓGICA DO DASHBOARD (SUPER ADMIN PARA O CHARLES)
  // ============================================================================
  
  // Trazemos apenas tarefas pendentes (excluímos as "Concluídas")
  const tarefasGerais = tickets.filter(t => t.currentStep?.step_name !== 'Concluído');
  
  // A Regra de Ouro: Charles vê tudo, os outros veem só o próprio setor
  const tarefasDoDashboard = usuarioLogado === 'Charles' 
    ? tarefasGerais 
    : tarefasGerais.filter(t => t.currentStep?.requiredRole?.name === usuarioLogado);

  const totalProjetos = workflows.length;
  const totalTarefasPendentes = tarefasDoDashboard.length;

  return (
    <>
      {globalCss}
      
      <div className="no-print" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '0', boxSizing: 'border-box', background: '#F5F5F5' }}>
        
        {/* TOPBAR CORPORATIVA */}
        <div style={{ background: '#FFFFFF', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0px 2px 10px rgba(0,0,0,0.05)', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#333', fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>WORKSPACE</h2>
            
            {/* NAVEGAÇÃO */}
            <div style={{ display: 'flex', gap: '10px', background: '#F0F0F0', padding: '5px', borderRadius: '10px' }}>
              <button 
                onClick={() => setTelaAtiva('dashboard')} 
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: telaAtiva === 'dashboard' ? '#FFFFFF' : 'transparent', color: telaAtiva === 'dashboard' ? '#22C55E' : '#777', fontWeight: 'bold', cursor: 'pointer', boxShadow: telaAtiva === 'dashboard' ? '0px 2px 5px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Dashboard Geral
              </button>
              <button 
                onClick={() => setTelaAtiva('kanban')} 
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: telaAtiva === 'kanban' ? '#FFFFFF' : 'transparent', color: telaAtiva === 'kanban' ? '#22C55E' : '#777', fontWeight: 'bold', cursor: 'pointer', boxShadow: telaAtiva === 'kanban' ? '0px 2px 5px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Quadro Kanban
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => setModalAberto(true)} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Novo Projeto</button>
            <div style={{ width: '1px', height: '30px', background: '#DDD' }}></div>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Logado: <span style={{ color: CORES[usuarioLogado]?.borda || '#333' }}>{usuarioLogado}</span></span>
            <button onClick={() => setUsuarioLogado(null)} style={{ padding: '8px 15px', background: '#FF5252', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
          </div>
        </div>

        {/* --------------------------------------------------- */}
        {/* TELA 1: DASHBOARD GERAL                             */}
        {/* --------------------------------------------------- */}
        {telaAtiva === 'dashboard' && (
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
                <div>
                  <h1 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '32px' }}>Visão Geral</h1>
                  <p style={{ margin: 0, color: '#777' }}>
                    {usuarioLogado === 'Charles' 
                      ? 'Monitorando Processos.' 
                      : `Bem-vindo à sua mesa de trabalho, equipe de ${usuarioLogado}.`}
                  </p>
                </div>
                <button onClick={acionarImpressao} style={{ padding: '10px 20px', background: '#4A90E2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Relatório A4</button>
              </div>

              {/* KPIs (Cards de Resumo) */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#999', fontSize: '14px' }}>PROJETOS ATIVOS</h4>
                  <span style={{ fontSize: '36px', fontWeight: '900', color: '#333' }}>{totalProjetos}</span>
                </div>
                <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#999', fontSize: '14px' }}>TAREFAS PENDENTES NA MESA</h4>
                  <span style={{ fontSize: '36px', fontWeight: '900', color: '#F57F17' }}>{totalTarefasPendentes}</span>
                </div>
                {usuarioLogado === 'Charles' && (
                  <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' }}>
                    <h4 style={{ margin: '0 0 10px', color: '#999', fontSize: '14px' }}>STATUS DO SISTEMA</h4>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#22C55E' }}>Operando Normalmente</span>
                  </div>
                )}
              </div>

              {/* LISTA DE TAREFAS */}
              <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 20px', color: '#333' }}>Cronograma de Ações</h3>
                
                {tarefasDoDashboard.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#999', background: '#F9F9F9', borderRadius: '10px' }}>
                    Nenhuma tarefa pendente no momento. Excelente trabalho!
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #EEE' }}>
                        <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>PROJETO</th>
                        <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>STATUS ATUAL</th>
                        <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>TAREFA</th>
                        {usuarioLogado === 'Charles' && (
                          <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>RESPONSÁVEL</th>
                        )}
                        <th style={{ padding: '15px', textAlign: 'right', color: '#999', fontSize: '12px' }}>AÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tarefasDoDashboard.map(t => {
                        const dono = t.currentStep?.requiredRole?.name;
                        const cor = CORES[dono] || CORES['Charles'];
                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid #F0F0F0', transition: 'background 0.2s' }}>
                            <td style={{ padding: '15px', fontWeight: '600', color: '#555' }}>{t.workflow?.name || 'Desconhecido'}</td>
                            <td style={{ padding: '15px' }}>
                              <span style={{ background: t.currentStep?.step_name === 'Iniciar' ? '#FFF9C4' : '#C8E6C9', color: '#333', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                {t.currentStep?.step_name}
                              </span>
                            </td>
                            <td style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>{t.title}</td>
                            {usuarioLogado === 'Charles' && (
                              <td style={{ padding: '15px' }}>
                                <span style={{ background: cor.bg, color: cor.borda, padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                  {cor.icone} {dono}
                                </span>
                              </td>
                            )}
                            <td style={{ padding: '15px', textAlign: 'right' }}>
                              <button onClick={() => {
                                setWorkflowAtivo(t.workflowId);
                                setTelaAtiva('kanban');
                              }} style={{ background: 'transparent', border: '1px solid #DDD', padding: '6px 15px', borderRadius: '6px', color: '#777', fontWeight: 'bold', cursor: 'pointer' }}>
                                Ver no Quadro →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------- */}
        {/* TELA 2: QUADRO KANBAN                               */}
        {/* --------------------------------------------------- */}
        {telaAtiva === 'kanban' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px', overflow: 'hidden' }}>
            <div style={{ width: '100%', maxWidth: '1182px', margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <select 
                  value={workflowAtivo || ""} 
                  onChange={e => setWorkflowAtivo(e.target.value)} 
                  style={{ height: '45px', background: '#FFF', borderRadius: '10px', padding: '0 20px', color: '#333', fontWeight: '900', border: '2px solid #EAEAEA', fontSize: '16px', outline: 'none', cursor: 'pointer', maxWidth: '400px' }}
                >
                  {workflows.length === 0 && <option value="">Nenhum trabalho criado</option>}
                  {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EAEAEA', padding: '8px 20px', borderRadius: '20px' }}>
                <span style={{ fontWeight: 'bold', color: '#787373' }}>Filtro de Setor:</span>
                <select value={filtroResponsavel} onChange={e => setFiltroResponsavel(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
                  <option value="Todos">TODOS</option>
                  {USUARIOS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: '1182px', margin: '0 auto', display: 'flex', gap: '30px', flex: 1, minHeight: 0 }}>
              {workflows.length === 0 && <h3 style={{ color: '#999', margin: 'auto' }}>Crie um Novo Trabalho pelo botão superior.</h3>}
              
              {colunasDaTela.map((coluna) => (
                <div key={coluna.step_name} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, coluna.step_name)} style={{ width: '374px', background: '#CCCBCB', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h2 style={{ color: '#787373', fontSize: '24px', margin: 0 }}>{coluna.step_name}</h2>
                  </div>
                  
                  <div className="scroll" style={{ padding: '15px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tickets
                      .filter(t => t.currentStep?.step_name === coluna.step_name && t.workflowId === workflowAtivo)
                      .filter(t => filtroResponsavel === 'Todos' || t.currentStep?.requiredRole?.name === filtroResponsavel)
                      .map(t => {
                        const dono = t.currentStep?.requiredRole?.name || 'Desconhecido';
                        const temPermissao = dono === usuarioLogado || usuarioLogado === 'Charles'; // Charles arrasta tudo!
                        const cor = CORES[dono] || CORES['Charles'];
                        const isDragging = ticketArrastado?.id === t.id;

                        return (
                          <motion.div 
                            key={t.id} layoutId={t.id} layout
                            draggable={temPermissao} onDragStart={() => setTicketArrastado(t)} onDragEnd={() => setTicketArrastado(null)}
                            style={{ background: cor.bg, borderLeft: `6px solid ${cor.borda}`, padding: '16px', borderRadius: '8px', opacity: temPermissao ? 1 : 0.6, cursor: temPermissao ? 'grab' : 'not-allowed', boxShadow: isDragging ? 'none' : '0px 2px 4px rgba(0,0,0,0.1)' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#333', lineHeight: '1.2' }}>{t.title}</span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: cor.borda }}>{cor.icone} {dono}</span>
                              </div>
                              {temPermissao && !isDragging && (
                                <button onClick={() => excluirTicket(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontWeight: '900', fontSize: '14px' }}>✕</button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL CRIAR TRABALHO/PROJETO */}
        {modalAberto && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ background: '#FFF', padding: '40px', borderRadius: '20px', width: '450px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: '0 0 10px', color: '#333' }}>Novo Projeto</h2>
              <p style={{ color: '#777', fontSize: '14px', marginBottom: '25px', lineHeight: '1.4' }}>
                Será gerado um quadro com a matriz de 41 tarefas divididas por setor.
              </p>
              <input 
                autoFocus value={nomeNovoProjeto} onChange={e => setNomeNovoProjeto(e.target.value)} 
                placeholder="Ex: Regularização Fazenda Sul..." 
                style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '2px solid #EEE', marginBottom: '25px', boxSizing: 'border-box', fontSize: '16px', outline: 'none' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button onClick={() => setModalAberto(false)} disabled={carregandoCriacao} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button onClick={criarProjetoCompleto} disabled={!nomeNovoProjeto.trim() || carregandoCriacao} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: nomeNovoProjeto.trim() ? '#333' : '#CCC', color: 'white', cursor: nomeNovoProjeto.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                  {carregandoCriacao ? 'Construindo...' : 'Gerar Fábrica'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------- */}
      {/* ÁREA DE IMPRESSÃO (A4 LIMPO)                        */}
      {/* --------------------------------------------------- */}
      <div className="print-only">
        <h1 style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', margin: '0 0 20px 0' }}>
          Dashboard - Cronograma de Ações
        </h1>
        <div style={{ marginBottom: '30px', fontSize: '16px' }}>
          <p><strong>Operador:</strong> {usuarioLogado === 'Charles' ? 'Charles (Visão Geral)' : usuarioLogado}</p>
          <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Projeto</th>
              <th style={{ width: '15%' }}>Status</th>
              <th style={{ width: '50%' }}>Tarefa</th>
              <th style={{ width: '10%' }}>Check (✓)</th>
            </tr>
          </thead>
          <tbody>
            {tarefasDoDashboard.map(t => (
              <tr key={t.id}>
                <td>{t.workflow?.name}</td>
                <td>{t.currentStep?.step_name}</td>
                <td style={{ fontWeight: 'bold' }}>
                  {t.title} {usuarioLogado === 'Charles' ? `(${t.currentStep?.requiredRole?.name})` : ''}
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;