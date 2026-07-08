import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function App() {
  const [tickets, setTickets] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  
  const USUARIOS = ['Desenho', 'Topografia', 'Charles', 'Coordenação'];
  const TIPOS_PROCESSO = ["Retificação", "Desmembramento", "Unificação", "Usucapião", "Alteração de Divisas", "CAR", "Certificação INCRA", "Escritura", "Conferência", "Cadastral", "Locação", "Movimentação de Terra"];
  const COLUNAS_VISUAIS = ['Iniciar', 'Em Andamento', 'Concluído']; 

  const [usuarioLogado, setUsuarioLogado] = useState(null); 
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioSelecionadoLogin, setUsuarioSelecionadoLogin] = useState('Charles');
  
  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [workflowAtivo, setWorkflowAtivo] = useState(null);
  
  const [filtroResponsavel, setFiltroResponsavel] = useState('Todos'); 
  const [filtroDashboardEtapa, setFiltroDashboardEtapa] = useState('Pendentes'); 
  const [filtroDashboardProjeto, setFiltroDashboardProjeto] = useState('Todos');
  const [filtroDashboardTarefa, setFiltroDashboardTarefa] = useState('Todas'); 
  const [filtroDashboardTipo, setFiltroDashboardTipo] = useState('Todos'); 
  const [buscaTexto, setBuscaTexto] = useState('');
  const [buscaProjetoKanban, setBuscaProjetoKanban] = useState(''); // Estado da lupa do Kanban

  const [modalAberto, setModalAberto] = useState(false);
  const [nomeNovoProjeto, setNomeNovoProjeto] = useState("");
  const [tiposNovoProjeto, setTiposNovoProjeto] = useState([]); 
  const [carregandoCriacao, setCarregandoCriacao] = useState(false);
  const [erroCriacao, setErroCriacao] = useState("");

  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [projetoEditando, setProjetoEditando] = useState(null);
  const [tiposEditando, setTiposEditando] = useState([]);
  
  const [ticketSelecionado, setTicketSelecionado] = useState(null);
  const [projetoSelecionadoHistorico, setProjetoSelecionadoHistorico] = useState(null); 
  const [novoComentario, setNovoComentario] = useState("");
  const [ticketArrastado, setTicketArrastado] = useState(null);

  const [modalExcluirProjetoAberto, setModalExcluirProjetoAberto] = useState(false);
  const [textoConfirmacaoProjeto, setTextoConfirmacaoProjeto] = useState("");
  const [modalExcluirCartao, setModalExcluirCartao] = useState(null);
  const [avisoPuloEtapa, setAvisoPuloEtapa] = useState(null);

  const CORES = {
    'Charles': { bg: '#FFF9C4', borda: '#FBC02D' },      
    'Topografia': { bg: '#BBDEFB', borda: '#1E88E5' },   
    'Desenho': { bg: '#C8E6C9', borda: '#43A047' },      
    'Coordenação': { bg: '#D7CCC8', borda: '#795548' }   
  };

  const getCorStatus = (status) => {
    if (status === 'Iniciar') return '#FBC02D'; 
    if (status === 'Em Andamento') return '#1E88E5'; 
    if (status === 'Concluído') return '#43A047'; 
    return '#999';
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
    } catch (err) { console.error("Erro na API:", err); setTickets([]); }
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    carregarDados();
  }, []);

  const projeto = workflows.find(w => w.id === workflowAtivo);
  const tarefasUnicasCatalogo = [...new Set(tickets.map(t => t.title))].sort();

  const handleLogin = (e) => {
    e.preventDefault();
    if (senhaInput === '123' || senhaInput === '') setUsuarioLogado(usuarioSelecionadoLogin);
  };

  const criarProjetoCompleto = async () => {
    if (!nomeNovoProjeto.trim() || tiposNovoProjeto.length === 0) return;
    setCarregandoCriacao(true);
    setErroCriacao("");
    try {
      const res = await fetch('http://localhost:3000/workflows', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nomeNovoProjeto, types: tiposNovoProjeto })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setErroCriacao(data.error);
        setCarregandoCriacao(false);
        return;
      }

      await carregarDados(); 
      setModalAberto(false); 
      setNomeNovoProjeto("");
      setTiposNovoProjeto([]); 
      
      const resWf = await fetch('http://localhost:3000/workflows');
      const wfAtualizados = await resWf.json();
      if (Array.isArray(wfAtualizados) && wfAtualizados.length > 0) {
        setWorkflowAtivo(wfAtualizados[0].id); 
        setTelaAtiva('kanban'); 
      }
    } catch (erro) { console.error(erro); }
    finally { setCarregandoCriacao(false); }
  };

  const abrirModalEdicao = () => {
    if(!workflowAtivo) return;
    const proj = workflows.find(w => w.id === workflowAtivo);
    setProjetoEditando(proj);
    setTiposEditando(proj.description ? proj.description.split(', ') : []);
    setModalEditarAberto(true);
  };

  const salvarEdicaoProjeto = async () => {
    if(tiposEditando.length === 0) return;
    try {
      await fetch(`http://localhost:3000/workflows/${projetoEditando.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: tiposEditando })
      });
      setModalEditarAberto(false);
      carregarDados();
    } catch(err) { console.error(err); }
  };

  const toggleTipoProjeto = (tipo) => {
    if (tiposNovoProjeto.includes(tipo)) {
      setTiposNovoProjeto(tiposNovoProjeto.filter(t => t !== tipo));
    } else {
      setTiposNovoProjeto([...tiposNovoProjeto, tipo]);
    }
  };

  const toggleTipoEdicao = (tipo) => {
    if (tiposEditando.includes(tipo)) setTiposEditando(tiposEditando.filter(t => t !== tipo));
    else setTiposEditando([...tiposEditando, tipo]);
  };

  const abrirModalExcluirProjeto = () => {
    setTextoConfirmacaoProjeto("");
    setModalExcluirProjetoAberto(true);
  };

  const confirmarExclusaoProjeto = async () => {
    if (textoConfirmacaoProjeto !== 'DELETAR' || !workflowAtivo) return;
    try {
      await fetch(`http://localhost:3000/workflows/${workflowAtivo}`, { method: 'DELETE' });
      setWorkflowAtivo(null);
      setTelaAtiva('dashboard');
      setModalExcluirProjetoAberto(false);
      carregarDados();
    } catch (err) { console.error(err); }
  };

  const confirmarExclusaoCartao = async () => {
    if(!modalExcluirCartao) return;
    try {
      await fetch(`http://localhost:3000/tickets/${modalExcluirCartao}`, { method: 'DELETE' });
      setTicketSelecionado(null); 
      setModalExcluirCartao(null);
      carregarDados();
    } catch (err) { console.error(err); }
  };

  const enviarComentario = async () => {
    if(!novoComentario.trim() || !ticketSelecionado) return;
    try {
      const res = await fetch(`http://localhost:3000/tickets/${ticketSelecionado.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: usuarioLogado, text: novoComentario })
      });
      const commentCriado = await res.json();
      setTicketSelecionado(prev => ({...prev, comments: [commentCriado, ...prev.comments]}));
      setNovoComentario("");
      carregarDados();
    } catch (e) { console.error(e); }
  };

  const handleDrop = (e, nomeColunaDestino) => {
    e.preventDefault();
    if (!ticketArrastado || !projeto) {
        setTicketArrastado(null);
        return;
    }
    
    // Fallback para projetos legados
    const setorDoCard = ticketArrastado.currentStep?.requiredRole?.name || 'Coordenação';
    const proximaEtapa = projeto.steps?.find(s => s.step_name === nomeColunaDestino && s.requiredRole?.name === setorDoCard);
    
    if (!proximaEtapa || ticketArrastado.currentStepId === proximaEtapa.id) { 
        setTicketArrastado(null); 
        return; 
    }
    
    // Validação segura para dados antigos: ignora a trava se não tiverem Sequence gravado.
    const pendentesAnteriores = tickets.filter(t => 
        t.workflowId === ticketArrastado.workflowId && 
        t.sequence > 0 && ticketArrastado.sequence > 0 && 
        t.sequence < ticketArrastado.sequence && 
        (t.currentStep?.step_name || 'Iniciar') !== 'Concluído'
    );

    if (pendentesAnteriores.length > 0 && proximaEtapa.step_name !== 'Iniciar') {
        setAvisoPuloEtapa({ ticketArrastado, proximaEtapa, pendentes: pendentesAnteriores });
        setTicketArrastado(null);
        return;
    }

    executarMovimentacao(ticketArrastado, proximaEtapa);
  };

  const executingDropFromWarning = () => {
    if (!avisoPuloEtapa) return;
    executarMovimentacao(avisoPuloEtapa.ticketArrastado, avisoPuloEtapa.proximaEtapa);
  };

  const executarMovimentacao = async (ticket, etapaDestino) => {
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, currentStepId: etapaDestino.id, currentStep: etapaDestino } : t));
    try {
      await fetch('http://localhost:3000/tickets/move', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, toStepId: etapaDestino.id, userId: usuarioLogado }) 
      });
      carregarDados(); 
    } catch (err) { console.error(err); }
    setAvisoPuloEtapa(null);
    setTicketArrastado(null);
  };

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
            <button type="submit" style={{ padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  // --- COMPILAÇÃO DE FILTROS GERAIS (COM TRATAMENTO LEGADO) ---
  let tarefasDoDashboard = tickets;

  if (usuarioLogado !== 'Charles') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => (t.currentStep?.requiredRole?.name || 'Coordenação') === usuarioLogado);
  }
  if (filtroDashboardEtapa === 'Pendentes') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => (t.currentStep?.step_name || 'Iniciar') !== 'Concluído');
  } else if (filtroDashboardEtapa !== 'Todas') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => (t.currentStep?.step_name || 'Iniciar') === filtroDashboardEtapa);
  }
  if (filtroDashboardProjeto !== 'Todos') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => t.workflowId === filtroDashboardProjeto);
  }
  if (filtroDashboardTarefa !== 'Todas') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => t.title === filtroDashboardTarefa);
  }
  if (filtroDashboardTipo !== 'Todos') {
    tarefasDoDashboard = tarefasDoDashboard.filter(t => t.workflow?.description?.includes(filtroDashboardTipo));
  }
  
  // PESQUISA GLOBAL
  if (buscaTexto.trim() !== '') {
    const termo = buscaTexto.toLowerCase();
    tarefasDoDashboard = tarefasDoDashboard.filter(t => {
      const nomeProj = t.workflow?.name || '';
      const titulo = t.title || '';
      return nomeProj.toLowerCase().includes(termo) || titulo.toLowerCase().includes(termo);
    });
  }

  let timelineCartao = [];
  if (ticketSelecionado) {
    const hist = ticketSelecionado.history ? ticketSelecionado.history.map(h => ({ type: 'move', date: h.action_timestamp, data: h })) : [];
    const com = ticketSelecionado.comments ? ticketSelecionado.comments.map(c => ({ type: 'comment', date: c.created_at, data: c })) : [];
    timelineCartao = [...hist, ...com].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  let timelineProjeto = [];
  if (projetoSelecionadoHistorico) {
    const cartoesDoProjeto = tickets.filter(t => t.workflowId === projetoSelecionadoHistorico.id);
    cartoesDoProjeto.forEach(cartao => {
      if (cartao.history) {
        cartao.history.forEach(h => timelineProjeto.push({ type: 'move', date: h.action_timestamp, data: h, cartaoNome: cartao.title, dono: cartao.currentStep?.requiredRole?.name || 'Coordenação' }));
      }
      if (cartao.comments) {
        cartao.comments.forEach(c => timelineProjeto.push({ type: 'comment', date: c.created_at, data: c, cartaoNome: cartao.title, dono: cartao.currentStep?.requiredRole?.name || 'Coordenação' }));
      }
    });
    timelineProjeto.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return (
    <>
      {globalCss}
      <div className="no-print" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F5F5' }}>
        
        {/* TOPBAR */}
        <div style={{ background: '#FFFFFF', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0px 2px 10px rgba(0,0,0,0.05)', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flex: 1 }}>
            <h2 style={{ margin: 0, color: '#333', fontSize: '20px', fontWeight: '900' }}>WORKSPACE</h2>
            <div style={{ display: 'flex', gap: '10px', background: '#F0F0F0', padding: '5px', borderRadius: '10px' }}>
              <button onClick={() => setTelaAtiva('dashboard')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: telaAtiva === 'dashboard' ? '#FFFFFF' : 'transparent', color: telaAtiva === 'dashboard' ? '#22C55E' : '#777', fontWeight: 'bold', cursor: 'pointer', boxShadow: telaAtiva === 'dashboard' ? '0px 2px 5px rgba(0,0,0,0.1)' : 'none' }}>Dashboard Geral</button>
              <button onClick={() => setTelaAtiva('kanban')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: telaAtiva === 'kanban' ? '#FFFFFF' : 'transparent', color: telaAtiva === 'kanban' ? '#22C55E' : '#777', fontWeight: 'bold', cursor: 'pointer', boxShadow: telaAtiva === 'kanban' ? '0px 2px 5px rgba(0,0,0,0.1)' : 'none' }}>Quadro Kanban</button>
            </div>
            
            <input 
              type="text" 
              placeholder="Pesquisar cliente ou atividade..." 
              value={buscaTexto} 
              onChange={e => setBuscaTexto(e.target.value)} 
              style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none', width: '300px', marginLeft: '20px' }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => { setModalAberto(true); setErroCriacao(""); }} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Novo Projeto</button>
            <div style={{ width: '1px', height: '30px', background: '#DDD' }}></div>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Logado: <span style={{ color: CORES[usuarioLogado]?.borda || '#333' }}>{usuarioLogado}</span></span>
            <button onClick={() => setUsuarioLogado(null)} style={{ padding: '8px 15px', background: '#FF5252', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
          </div>
        </div>

        {/* TELA 1: DASHBOARD */}
        {telaAtiva === 'dashboard' && (
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
            <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
                <div>
                  <h1 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '32px' }}>Dashboard de Ações</h1>
                  <p style={{ margin: 0, color: '#777' }}>Acompanhe o fluxo e o histórico global.</p>
                </div>
                <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#4A90E2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Imprimir A4</button>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR PROJETO</label>
                  <select value={filtroDashboardProjeto} onChange={e => setFiltroDashboardProjeto(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }}>
                    <option value="Todos">Todos os Projetos</option>
                    {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR TIPO</label>
                  <select value={filtroDashboardTipo} onChange={e => setFiltroDashboardTipo(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }}>
                    <option value="Todos">Todos os Tipos</option>
                    {TIPOS_PROCESSO.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR STATUS</label>
                  <select value={filtroDashboardEtapa} onChange={e => setFiltroDashboardEtapa(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }}>
                    <option value="Pendentes">Pendentes (Iniciar / Em Andamento)</option>
                    <option value="Todas">Todas (Incluindo Concluído)</option>
                    <option value="Iniciar">Apenas Iniciar</option>
                    <option value="Em Andamento">Apenas Em Andamento</option>
                    <option value="Concluído">Apenas Concluído</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>BUSCAR POR TAREFA</label>
                  <select value={filtroDashboardTarefa} onChange={e => setFiltroDashboardTarefa(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }}>
                    <option value="Todas">Mostrar todas as tarefas</option>
                    {tarefasUnicasCatalogo.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #EEE' }}>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>PROJETO</th>
                      <th style={{ padding: '15px', textAlign: 'center', color: '#999', fontSize: '12px' }}>HISTÓRICO</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>STATUS</th>
                      <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>TAREFA</th>
                      {usuarioLogado === 'Charles' && <th style={{ padding: '15px', textAlign: 'left', color: '#999', fontSize: '12px' }}>RESPONSÁVEL</th>}
                      <th style={{ padding: '15px', textAlign: 'right', color: '#999', fontSize: '12px' }}>AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarefasDoDashboard.map(t => {
                      const dono = t.currentStep?.requiredRole?.name || 'Coordenação';
                      const statusNome = t.currentStep?.step_name || 'Iniciar';
                      
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer' }} onClick={() => setTicketSelecionado(t)}>
                          <td style={{ padding: '15px' }}>
                            <span style={{ fontWeight: '900', color: '#333', display: 'block' }}>{t.workflow?.name}</span>
                            {t.workflow?.description && (
                              <span style={{ display: 'inline-block', marginTop: '6px', background: '#EAEAEA', color: '#555', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                {t.workflow.description}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '15px', textAlign: 'center' }}>
                            <button onClick={(e) => { e.stopPropagation(); setProjetoSelecionadoHistorico(t.workflow); }} style={{ background: '#F0F0F0', border: 'none', padding: '6px 12px', borderRadius: '6px', color: '#555', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Ver Detalhes</button>
                          </td>
                          <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: getCorStatus(statusNome), display: 'inline-block' }}></span>
                            <span style={{ color: '#555', fontSize: '13px', fontWeight: 'bold' }}>{statusNome}</span>
                          </td>
                          <td style={{ padding: '15px', fontWeight: 'bold', color: '#555' }}>{t.title}</td>
                          {usuarioLogado === 'Charles' && <td style={{ padding: '15px' }}><span style={{ background: CORES[dono]?.bg, color: CORES[dono]?.borda, padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{dono}</span></td>}
                          <td style={{ padding: '15px', textAlign: 'right' }}>
                            <button onClick={(e) => { e.stopPropagation(); setWorkflowAtivo(t.workflowId); setTelaAtiva('kanban'); }} style={{ background: 'transparent', border: '1px solid #DDD', padding: '6px 15px', borderRadius: '6px', color: '#777', fontWeight: 'bold', cursor: 'pointer' }}>Quadro</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TELA 2: KANBAN */}
        {telaAtiva === 'kanban' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px', overflow: 'hidden' }}>
            <div style={{ width: '100%', maxWidth: '1182px', margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <select value={workflowAtivo || ""} onChange={e => setWorkflowAtivo(e.target.value)} style={{ height: '45px', background: '#FFF', borderRadius: '10px', padding: '0 20px', color: '#333', fontWeight: '900', border: '2px solid #EAEAEA', fontSize: '16px', outline: 'none', cursor: 'pointer', maxWidth: '400px' }}>
                    {workflows.length === 0 && <option value="">Nenhum trabalho criado</option>}
                    {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  {projeto?.description && (
                    <span style={{ fontSize: '12px', color: '#777', marginTop: '8px', fontWeight: 'bold' }}>
                      <span style={{ color: '#555' }}>{projeto.description}</span>
                    </span>
                  )}
                </div>
                <button onClick={() => setProjetoSelecionadoHistorico(projeto)} style={{ padding: '12px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Histórico do Projeto</button>
                
                {usuarioLogado === 'Charles' && (
                  <>
                    <button onClick={abrirModalEdicao} style={{ padding: '12px 20px', background: '#EAEAEA', color: '#333', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Editar Processos</button>
                    <button onClick={abrirModalExcluirProjeto} style={{ padding: '12px 20px', background: '#FF5252', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Excluir Projeto</button>
                  </>
                )}
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
              {workflows.length === 0 ? (
                <div style={{ margin: 'auto', color: '#999', fontSize: '18px', fontWeight: 'bold' }}>Nenhum projeto selecionado ou criado.</div>
              ) : (
                COLUNAS_VISUAIS.map((colunaNome) => (
                  <div key={colunaNome} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, colunaNome)} style={{ width: '374px', background: '#EAEAEA', borderRadius: '15px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: getCorStatus(colunaNome), display: 'inline-block' }}></span>
                      <h2 style={{ color: '#555', fontSize: '20px', margin: 0 }}>{colunaNome}</h2>
                    </div>
                    
                    <div className="scroll" style={{ padding: '15px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {tickets
                        .filter(t => t.workflowId === workflowAtivo)
                        .filter(t => {
                          const statusNome = t.currentStep?.step_name || 'Iniciar';
                          return statusNome === colunaNome;
                        })
                        .filter(t => {
                          const dono = t.currentStep?.requiredRole?.name || 'Coordenação';
                          return filtroResponsavel === 'Todos' || dono === filtroResponsavel;
                        })
                        .filter(t => {
                          if (buscaTexto.trim() === '') return true;
                          const termo = buscaTexto.toLowerCase();
                          return t.title.toLowerCase().includes(termo) || t.workflow?.name.toLowerCase().includes(termo);
                        })
                        .map(t => {
                          const dono = t.currentStep?.requiredRole?.name || 'Coordenação';
                          const temPermissao = dono === usuarioLogado || usuarioLogado === 'Charles';
                          const cor = CORES[dono] || CORES['Charles'];

                          const pendentesAnteriores = tickets.filter(prevT => prevT.workflowId === t.workflowId && prevT.sequence > 0 && t.sequence > 0 && prevT.sequence < t.sequence && (prevT.currentStep?.step_name || 'Iniciar') !== 'Concluído').length > 0;
                          const estaBloqueado = pendentesAnteriores && (t.currentStep?.step_name || 'Iniciar') === 'Iniciar';

                          return (
                            <motion.div key={t.id} layoutId={t.id} layout
                              draggable={temPermissao} onDragStart={() => setTicketArrastado(t)} onDragEnd={() => setTicketArrastado(null)}
                              onClick={() => setTicketSelecionado(t)}
                              style={{ background: cor.bg, borderLeft: `6px solid ${cor.borda}`, padding: '16px', borderRadius: '8px', opacity: temPermissao ? 1 : 0.6, cursor: temPermissao ? 'grab' : 'not-allowed', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#333', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    {estaBloqueado && <span title="Aguardando etapa anterior" style={{ color: '#F57F17', fontWeight: 'bold' }}>[Bloqueado] </span>}
                                    {t.title}
                                  </span>
                                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: cor.borda, background: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>{dono}</span>
                                </div>
                                {temPermissao && (
                                  <button onClick={(e) => { e.stopPropagation(); setModalExcluirCartao(t.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontWeight: '900', fontSize: '16px', padding: '0 5px' }} title="Excluir Cartão">✕</button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODAL CRIAÇÃO DE PROJETO */}
        {modalAberto && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ background: '#FFF', padding: '40px', borderRadius: '20px', width: '550px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: '0 0 20px', color: '#333' }}>Novo Projeto</h2>
              
              {erroCriacao && (
                <div style={{ background: '#FFCDD2', color: '#B71C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                  {erroCriacao}
                </div>
              )}

              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>NOME DO CLIENTE / PROJETO</label>
              <input autoFocus value={nomeNovoProjeto} onChange={e => setNomeNovoProjeto(e.target.value)} placeholder="Ex: Fazenda Sul..." style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '2px solid #EEE', marginBottom: '20px', boxSizing: 'border-box', fontSize: '16px', outline: 'none' }} />

              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '10px' }}>TIPOS DE PROCESSO (Selecione 1 ou mais)</label>
              <div className="scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px', maxHeight: '180px', overflowY: 'auto', background: '#F9F9F9', padding: '15px', borderRadius: '10px', border: '1px solid #EEE' }}>
                {TIPOS_PROCESSO.map(tipo => (
                  <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} checked={tiposNovoProjeto.includes(tipo)} onChange={() => toggleTipoProjeto(tipo)} />
                    {tipo}
                  </label>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button onClick={() => setModalAberto(false)} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button onClick={criarProjetoCompleto} disabled={!nomeNovoProjeto.trim() || tiposNovoProjeto.length === 0 || carregandoCriacao} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: (!nomeNovoProjeto.trim() || tiposNovoProjeto.length === 0) ? '#CCC' : '#22C55E', color: 'white', cursor: (!nomeNovoProjeto.trim() || tiposNovoProjeto.length === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>{carregandoCriacao ? 'Gerando...' : 'Iniciar Serviços'}</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR TIPOS DO PROJETO COMBO */}
        {modalEditarAberto && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ background: '#FFF', padding: '40px', borderRadius: '20px', width: '550px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: '0 0 10px', color: '#333' }}>Editar Serviços</h2>
              <p style={{ margin: '0 0 20px', color: '#777', fontWeight: 'bold' }}>Projeto: {projetoEditando?.name}</p>

              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '10px' }}>TIPOS DE PROCESSO (Adicione ou Remova)</label>
              <div className="scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px', maxHeight: '180px', overflowY: 'auto', background: '#F9F9F9', padding: '15px', borderRadius: '10px', border: '1px solid #EEE' }}>
                {TIPOS_PROCESSO.map(tipo => (
                  <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} checked={tiposEditando.includes(tipo)} onChange={() => toggleTipoEdicao(tipo)} />
                    {tipo}
                  </label>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button onClick={() => setModalEditarAberto(false)} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button onClick={salvarEdicaoProjeto} disabled={tiposEditando.length === 0} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: tiposEditando.length === 0 ? '#CCC' : '#333', color: 'white', cursor: tiposEditando.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Salvar Alterações</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL INTERCEPTADOR: AVISO DE DEPENDÊNCIA DO WORKFLOW */}
        {avisoPuloEtapa && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110 }}>
            <div style={{ background: '#FFF', padding: '35px', borderRadius: '20px', width: '500px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: '0 0 10px', color: '#F57F17' }}>Aviso de Dependência</h2>
              <p style={{ color: '#555', fontSize: '15px', marginBottom: '20px', lineHeight: '1.5' }}>
                A tarefa <b>{avisoPuloEtapa.ticketArrastado.title}</b> possui etapas anteriores pendentes que ainda não foram enviadas para Concluído.
              </p>
              <div style={{ background: '#FFF9C4', padding: '15px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #FBC02D' }}>
                <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#F57F17', display: 'block', marginBottom: '5px' }}>ATIVIDADES EM ATRASO:</span>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', fontSize: '13px' }}>
                  {avisoPuloEtapa.pendentes.slice(0, 3).map(p => <li key={p.id}>{p.title} ({p.currentStep?.requiredRole?.name || 'Coordenação'})</li>)}
                  {avisoPuloEtapa.pendentes.length > 3 && <li>... e outras {avisoPuloEtapa.pendentes.length - 3} tarefas pendentes.</li>}
                </ul>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button onClick={() => setAvisoPuloEtapa(null)} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: '#F0F0F0', color: '#333', cursor: 'pointer', fontWeight: 'bold' }}>Mantenha Preso</button>
                <button onClick={executingDropFromWarning} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: '#F57F17', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Forçar Movimento</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DO VERSO DO CARTÃO (DETALHES ESTILO TRELLO) */}
        {ticketSelecionado && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }} onClick={() => setTicketSelecionado(null)}>
            <div style={{ background: '#FFF', width: '600px', height: '80vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '25px 30px', borderBottom: '1px solid #EEE', background: CORES[ticketSelecionado.currentStep?.requiredRole?.name || 'Coordenação']?.bg || '#FFF9C4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>{ticketSelecionado.title}</h2>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setTicketSelecionado(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
                  </div>
                </div>
                <p style={{ margin: '10px 0 0', color: '#555', fontWeight: 'bold' }}>Projeto: {ticketSelecionado.workflow?.name}</p>
                {ticketSelecionado.workflow?.description && (
                  <span style={{ display: 'inline-block', marginTop: '8px', background: 'rgba(0,0,0,0.05)', color: '#555', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {ticketSelecionado.workflow.description}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: getCorStatus(ticketSelecionado.currentStep?.step_name || 'Iniciar'), display: 'inline-block' }}></span>
                  <span style={{ fontWeight: 'bold', color: '#555' }}>Status: {ticketSelecionado.currentStep?.step_name || 'Iniciar'}</span>
                </div>
              </div>
              <div className="scroll" style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 15px', color: '#333' }}>Comentários e Histórico</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                  <input value={novoComentario} onChange={e => setNovoComentario(e.target.value)} placeholder="Escreva uma observação..." style={{ flex: 1, padding: '12px 15px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }} />
                  <button onClick={enviarComentario} style={{ padding: '12px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Enviar</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {timelineCartao.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>Nenhuma atividade registrada.</p>}
                  {timelineCartao.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#777' }}>
                        {item.type === 'comment' ? 'C' : 'M'}
                      </div>
                      <div style={{ flex: 1, background: item.type === 'comment' ? '#F9F9F9' : 'transparent', padding: item.type === 'comment' ? '15px' : '0', borderRadius: '10px', border: item.type === 'comment' ? '1px solid #EEE' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{item.data.user?.name || 'Sistema'}</span>
                          <span style={{ color: '#999', fontSize: '12px' }}>{new Date(item.date).toLocaleString('pt-BR')}</span>
                        </div>
                        {item.type === 'comment' ? <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.5' }}>{item.data.text}</p> : <p style={{ margin: 0, color: '#777', fontSize: '13px' }}>Moveu para <b>{item.data.toStep?.step_name}</b>.</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL HISTÓRICO GERAL DO PROJETO COMBO (AUDITORIA) */}
        {projetoSelecionadoHistorico && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }} onClick={() => setProjetoSelecionadoHistorico(null)}>
            <div style={{ background: '#FFF', width: '800px', height: '85vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '30px', borderBottom: '1px solid #EEE', background: '#333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: '#22C55E', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>RELATÓRIO DE AUDITORIA</span>
                    <h2 style={{ margin: '5px 0 0', color: '#FFF', fontSize: '28px' }}>{projetoSelecionadoHistorico.name}</h2>
                    {projetoSelecionadoHistorico.description && (
                      <span style={{ display: 'inline-block', marginTop: '8px', background: 'rgba(255,255,255,0.2)', color: '#FFF', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                      {projetoSelecionadoHistorico.description}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setProjetoSelecionadoHistorico(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>✕</button>
                </div>
              </div>
              <div className="scroll" style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#F9F9F9' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {timelineProjeto.length === 0 && <p style={{ color: '#999', textAlign: 'center', marginTop: '50px' }}>Nenhuma atividade foi registrada neste projeto ainda.</p>}
                  {timelineProjeto.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '20px', background: '#FFF', padding: '20px', borderRadius: '15px', boxShadow: '0px 2px 10px rgba(0,0,0,0.02)' }}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: CORES[item.dono]?.bg || '#EEE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', color: CORES[item.dono]?.borda || '#333' }}>
                        {item.type === 'comment' ? 'C' : 'M'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '900', color: CORES[item.dono]?.borda || '#333', fontSize: '15px' }}>{item.data.user?.name || item.dono}</span>
                          <span style={{ color: '#999', fontSize: '13px', fontWeight: 'bold' }}>{new Date(item.date).toLocaleString('pt-BR')}</span>
                        </div>
                        <span style={{ display: 'inline-block', background: '#F0F0F0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>
                          Referente a: {item.cartaoNome}
                        </span>
                        {item.type === 'comment' ? (
                          <p style={{ margin: 0, color: '#333', fontSize: '15px', lineHeight: '1.6' }}>"{item.data.text}"</p>
                        ) : (
                          <p style={{ margin: 0, color: '#777', fontSize: '14px' }}>
                            Moveu o cartão de <b>{item.data.fromStep?.step_name || 'Criação'}</b> para <b>{item.data.toStep?.step_name}</b>.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EXCLUIR PROJETO INTEIRO */}
        {modalExcluirProjetoAberto && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ background: '#FFF', padding: '40px', borderRadius: '20px', width: '450px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: '0 0 10px', color: '#D32F2F' }}>Atenção: Exclusão Permanente</h2>
              <p style={{ color: '#555', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                CUIDADO: Isso apagará o projeto inteiro, incluindo TODOS os cartões, comentários e histórico de movimentações.
              </p>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>Digite "DELETAR" para confirmar:</label>
              <input
                autoFocus value={textoConfirmacaoProjeto} onChange={e => setTextoConfirmacaoProjeto(e.target.value)} placeholder="DELETAR"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #D32F2F', marginTop: '10px', marginBottom: '25px', fontSize: '16px', outline: 'none', textAlign: 'center', fontWeight: 'bold', color: '#D32F2F' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button onClick={() => setModalExcluirProjetoAberto(false)} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button onClick={confirmarExclusaoProjeto} disabled={textoConfirmacaoProjeto !== 'DELETAR'} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: textoConfirmacaoProjeto === 'DELETAR' ? '#D32F2F' : '#FFCDD2', color: 'white', cursor: textoConfirmacaoProjeto === 'DELETAR' ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Excluir Projeto</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EXCLUIR CARTÃO INDIVIDUAL */}
        {modalExcluirCartao && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ background: '#FFF', padding: '30px', borderRadius: '20px', width: '400px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: '0 0 10px', color: '#333' }}>Excluir Tarefa</h2>
              <p style={{ color: '#777', fontSize: '14px', marginBottom: '25px', lineHeight: '1.4' }}>
                Tem certeza que deseja excluir esta tarefa definitivamente? Todo o histórico dela será perdido.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button onClick={() => setModalExcluirCartao(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button onClick={confirmarExclusaoCartao} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#FF5252', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Sim, Excluir</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default App;