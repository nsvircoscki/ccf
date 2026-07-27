import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown, FiPlus, FiGrid, FiTrello, FiFolderPlus, FiLogOut, FiClock,
FiEdit, FiTrash2, FiPrinter, FiList, FiSearch } from 'react-icons/fi';


function App() {
  const [tickets, setTickets] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  
  const USUARIOS = ['Desenho', 'Topografia', 'Charles', 'Coordenação'];
  const TIPOS_PROCESSO = ["Retificação", "Desmembramento", "Unificação", "Usucapião", "Alteração de Divisas", "CAR", "Certificação INCRA", "Escritura", "Conferência", "Cadastral", "Locação", "Movimentação de Terra", "Danc"];
  const COLUNAS_VISUAIS = ['Iniciar', 'Em Andamento', 'Concluído']; 

  const [usuarioLogado, setUsuarioLogado] = useState(null); 
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioSelecionadoLogin, setUsuarioSelecionadoLogin] = useState('Charles');
  
  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [workflowAtivo, setWorkflowAtivo] = useState(null);
  
  const [filtroResponsavel, setFiltroResponsavel] = useState('Todos'); 
  const [filtroDashboardEtapa, setFiltroDashboardEtapa] = useState('Todas'); 
  const [filtroDashboardProjeto, setFiltroDashboardProjeto] = useState('Todos');
  const [filtroDashboardTarefa, setFiltroDashboardTarefa] = useState('Todas'); 
  const [filtroDashboardTipo, setFiltroDashboardTipo] = useState('Todos'); 
  const [buscaTexto, setBuscaTexto] = useState('');
  const [buscaClienteKanban, setBuscaClienteKanban] = useState('');
  const [buscaEtapaKanban, setBuscaEtapaKanban] = useState('');
  const [tiposEditando, setTiposEditando] = useState([]);
  
  const [ticketSelecionado, setTicketSelecionado] = useState(null);
  const [projetoSelecionadoHistorico, setProjetoSelecionadoHistorico] = useState(null); 
  const [novoComentario, setNovoComentario] = useState("");
  const [editandoDescricao, setEditandoDescricao] = useState(false);
  const [descricaoEditada, setDescricaoEditada] = useState("");
  const [ticketArrastado, setTicketArrastado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeNovoProjeto, setNomeNovoProjeto] = useState("");
  const [tiposNovoProjeto, setTiposNovoProjeto] = useState([]);
  const [carregandoCriacao, setCarregandoCriacao] = useState(false);
  const [erroCriacao, setErroCriacao] = useState("");
  const [terrenoNovoProjeto, setTerrenoNovoProjeto] = useState('Urbano');
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [projetoEditando, setProjetoEditando] = useState(null);
  const [terrenoEditando, setTerrenoEditando] = useState('Urbano');
  const [modalImpressaoAberto, setModalImpressaoAberto] = useState(false);
  const [workflowImpressao, setWorkflowImpressao] = useState(null);
  const [workflowParaImpressao, setWorkflowParaImpressao] = useState(null);

  const [matriculaTexto, setMatriculaTexto] = useState("");
  const [enderecoTexto, setEnderecoTexto] = useState("");
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [detalhesTexto, setDetalhesTexto] = useState("");
  const [modalExcluirProjetoAberto, setModalExcluirProjetoAberto] = useState(false);
  const [textoConfirmacaoProjeto, setTextoConfirmacaoProjeto] = useState("");
  const [modalExcluirCartao, setModalExcluirCartao] = useState(null);
  const [avisoPuloEtapa, setAvisoPuloEtapa] = useState(null);
  const [mostrarEtapasProjeto, setMostrarEtapasProjeto] = useState(true);
  const [mostrarMovimentacoesProjeto, setMostrarMovimentacoesProjeto] = useState(false);
  const [visualizarApenasComentarios, setVisualizarApenasComentarios] = useState(false);

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


const salvarDetalhesProjeto = async () => {
    if (!workflowAtivo) return;
    try {
      await fetch(`http://192.168.1.2:3000/workflows/${workflowAtivo}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matricula: matriculaTexto, 
          endereco: enderecoTexto, 
          details: detalhesTexto 
        })
      });
      
      setWorkflows(prev => prev.map(w => w.id === workflowAtivo ? { 
        ...w, 
        matricula: matriculaTexto, 
        endereco: enderecoTexto, 
        details: detalhesTexto 
      } : w));
      setModalDetalhesAberto(false);
    } catch (err) { console.error(err); }
  };

  const carregarDados = async () => {
    try {
      const resWf = await fetch('http://192.168.1.2:3000/workflows');
      const dadosWf = await resWf.json();
      if (Array.isArray(dadosWf)) {
        setWorkflows(dadosWf);
        if (dadosWf.length > 0 && !workflowAtivo) setWorkflowAtivo(dadosWf[0].id);
      }
      const resTk = await fetch('http://192.168.1.2:3000/tickets');
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

  const normalize = (text) => String(text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const clienteTerm = normalize(buscaClienteKanban.trim());
  const etapaTerm = normalize(buscaEtapaKanban.trim());
  const ticketsFiltrados = tickets
    .filter(t => t.workflowId === workflowAtivo)
    .filter(t => {
      const dono = t.currentStep?.requiredRole?.name || 'Coordenação';
      return filtroResponsavel === 'Todos' || dono === filtroResponsavel;
    })
    .filter(t => {
      const clienteTexto = normalize(t.workflow?.name);
      const etapaTexto = normalize(t.currentStep?.step_name || 'Iniciar');
      const tituloTexto = normalize(t.title);
      const clienteMatch = clienteTerm === '' || clienteTexto.includes(clienteTerm);
      const etapaMatch = etapaTerm === '' || etapaTexto.includes(etapaTerm) || tituloTexto.includes(etapaTerm);
      return clienteMatch && etapaMatch;
    });

  const projetoOptions = [{ value: 'Todos', label: 'Todos os Projetos' }, ...workflows.map(w => ({ value: w.id, label: w.name }))];
  const tipoOptions = [{ value: 'Todos', label: 'Todos os Tipos' }, ...TIPOS_PROCESSO.map(tipo => ({ value: tipo, label: tipo }))];
  const statusOptions = [
    { value: 'Pendentes', label: 'Pendentes (Iniciar / Em Andamento)' },
    { value: 'Todas', label: 'Todas (Incluindo Concluído)' },
    { value: 'Iniciar', label: 'Apenas Iniciar' },
    { value: 'Em Andamento', label: 'Apenas Em Andamento' },
    { value: 'Concluído', label: 'Apenas Concluído' }
  ];
  const tarefaOptions = [{ value: 'Todas', label: 'Mostrar todas as tarefas' }, ...tarefasUnicasCatalogo.map(t => ({ value: t, label: t }))];
  const responsavelOptions = [{ value: 'Todos', label: 'TODOS' }, ...USUARIOS.map(u => ({ value: u, label: u }))];

  const handleLogin = (e) => {
    e.preventDefault();
    if (senhaInput === '123' || senhaInput === '') setUsuarioLogado(usuarioSelecionadoLogin);
  };

  const criarProjetoCompleto = async () => {
    if (!nomeNovoProjeto.trim() || tiposNovoProjeto.length === 0) return;
    setCarregandoCriacao(true);
    setErroCriacao("");
    try {
      const res = await fetch('http://192.168.1.2:3000/workflows', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nomeNovoProjeto, types: tiposNovoProjeto, terreno: terrenoNovoProjeto })
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
      
      const resWf = await fetch('http://192.168.1.2:3000/workflows');
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

    const temSigef = tickets.some(t => t.workflowId === workflowAtivo && t.title === "Pré-aprovação no Sigef");
    setTerrenoEditando(temSigef ? 'Rural' : 'Urbano');
    setModalEditarAberto(true);
  };

  const salvarEdicaoProjeto = async () => {
    if(tiposEditando.length === 0) return;
    try {
      await fetch(`http://192.168.1.2:3000/workflows/${projetoEditando.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: tiposEditando, terreno: terrenoEditando })
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
      await fetch(`http://192.168.1.2:3000/workflows/${workflowAtivo}`, { method: 'DELETE' });
      setWorkflowAtivo(null);
      setTelaAtiva('dashboard');
      setModalExcluirProjetoAberto(false);
      carregarDados();
    } catch (err) { console.error(err); }
  };

  const confirmarExclusaoCartao = async () => {
    if(!modalExcluirCartao) return;
    try {
      await fetch(`http://192.168.1.2:3000/tickets/${modalExcluirCartao}`, { method: 'DELETE' });
      setTicketSelecionado(null); 
      setModalExcluirCartao(null);
      carregarDados();
    } catch (err) { console.error(err); }
  };

  const salvarDescricao = async () => {
  if(!ticketSelecionado) return;
  try {
    await fetch(`http://192.168.1.2:3000/tickets/${ticketSelecionado.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: descricaoEditada })
    });
    
    setTickets(prev => prev.map(t => t.id === ticketSelecionado.id ? { ...t, description: descricaoEditada } : t));
    setTicketSelecionado(prev => ({ ...prev, description: descricaoEditada }));
    setEditandoDescricao(false);
  } catch (err) { console.error(err); }
};

  const enviarComentario = async () => {
    if(!novoComentario.trim() || !ticketSelecionado) return;
    try {
      const res = await fetch(`http://192.168.1.2:3000/tickets/${ticketSelecionado.id}/comments`, {
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
      await fetch('http://192.168.1.2:3000/tickets/move', {
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
      body { font-family: 'Roboto', sans-serif; }
      .animated-dropdown-container { position: relative; }
      .animated-dropdown-button { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-radius: 12px; border: 1px solid #D7E1F0; background: #FBFDFF; cursor: pointer; color: #111827; font-weight: 500; transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease; }
      .animated-dropdown-button:hover { background: #EEF4FF; border-color: #A8C4FF; }
      .dropdown-list { position: absolute; top: calc(100% + 8px); left: 0; width: 100%; max-height: 280px; border-radius: 16px; background: #FFFFFF; border: 1px solid rgba(148, 163, 184, 0.24); box-shadow: 0 20px 40px rgba(15,23,42,0.12); overflow: hidden; z-index: 20; transform-origin: top center; }
      .dropdown-list::-webkit-scrollbar { width: 6px; }
      .dropdown-list::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; }
      .dropdown-list::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      .dropdown-option { width: 100%; text-align: left; padding: 13px 16px; background: transparent; border: none; cursor: pointer; color: #111827; font-size: 14px; border-bottom: 1px solid #E2E8F0; transition: background 0.15s ease, color 0.15s ease; }
      .dropdown-option:hover, .dropdown-option:focus { background: #EEF2FF; color: #1D4ED8; outline: none; }
      .dropdown-option:last-child { border-bottom: none; }
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

  const projetosDoDashboard = tarefasDoDashboard.reduce((acc, ticket) => {
    if (!ticket.workflow) return acc;
    let projeto = acc.find(p => p.id === ticket.workflowId);
    if (!projeto) {
      projeto = {
        id: ticket.workflowId,
        name: ticket.workflow.name,
        description: ticket.workflow.description,
        tasks: []
      };
      acc.push(projeto);
    }
    projeto.tasks.push(ticket);
    return acc;
  }, []);

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

  const tarefasPorEtapaProjeto = projetoSelecionadoHistorico ? COLUNAS_VISUAIS.reduce((acc, etapa) => {
    acc[etapa] = tickets.filter(t => t.workflowId === projetoSelecionadoHistorico.id && (t.currentStep?.step_name || 'Iniciar') === etapa);
    return acc;
  }, {}) : {};

  const etapasAtuaisDoProjeto = projetoSelecionadoHistorico ? COLUNAS_VISUAIS.map(etapa => ({
    name: etapa,
    tasks: tickets.filter(t => t.workflowId === projetoSelecionadoHistorico.id && (t.currentStep?.step_name || 'Iniciar') === etapa)
  })) : [];

  const comentariosDoProjeto = projetoSelecionadoHistorico ? tickets
    .filter(t => t.workflowId === projetoSelecionadoHistorico.id) // <- O FILTRO FALTANTE AQUI
    .flatMap(t => (
      (t.comments || []).map(c => ({ ...c, ticketTitle: t.title, ticketWorkflowName: t.workflow?.name || '' }))
    )).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []; // <- ORDENAÇÃO POR DATA

  const workflowParaImpressaoData = workflows.find(w => w.id === workflowParaImpressao);
  const tarefasParaImpressao = workflowParaImpressao ? tickets.filter(t => t.workflowId === workflowParaImpressao) : [];
  const etapasParaImpressao = COLUNAS_VISUAIS.map(etapa => ({
    name: etapa,
    tasks: tarefasParaImpressao.filter(t => (t.currentStep?.step_name || 'Iniciar') === etapa)
  }));

  const totalTarefas = tarefasDoDashboard.length;
  const concluidas = tarefasDoDashboard.filter(t => (t.currentStep?.step_name || 'Iniciar') === 'Concluído').length;
  const progressoGlobal = totalTarefas === 0 ? 0 : Math.round((concluidas / totalTarefas) * 100);

  const raio = 36;  
  const circunferencia = 2 * Math.PI * raio;
  const offsetProgresso = circunferencia - (progressoGlobal / 100) * circunferencia;
  
  return (
    <>
      {globalCss}
      <div className="no-print" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F5F5' }}>
        
       {/* TOPBAR */}
        <div style={{ background: '#FFFFFF', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0px 2px 10px rgba(0,0,0,0.05)', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '10px', background: '#F0F0F0', padding: '5px', borderRadius: '10px' }}>
              <button title="Dashboard Geral" onClick={() => setTelaAtiva('dashboard')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: telaAtiva === 'dashboard' ? '#FFFFFF' : 'transparent', color: telaAtiva === 'dashboard' ? '#22C55E' : '#777', cursor: 'pointer', boxShadow: telaAtiva === 'dashboard' ? '0px 2px 5px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <FiGrid size={20} />
              </button>
              <button title="Quadro Kanban" onClick={() => setTelaAtiva('kanban')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: telaAtiva === 'kanban' ? '#FFFFFF' : 'transparent', color: telaAtiva === 'kanban' ? '#22C55E' : '#777', cursor: 'pointer', boxShadow: telaAtiva === 'kanban' ? '0px 2px 5px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <FiTrello size={20} />
              </button>
            </div>

            {telaAtiva === 'dashboard' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                <input 
                  id="dashboard-search"
                  type="text" 
                  placeholder="Pesquisar cliente ou atividade..." 
                  value={buscaTexto} 
                  onChange={e => setBuscaTexto(e.target.value)} 
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #DDD', outline: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }} 
                />
                <button title="Buscar" onClick={() => document.getElementById('dashboard-search')?.focus()} style={{ padding: '12px 15px', background: '#4A90E2', color: '#FFF', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                  <FiSearch size={20} />
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button title="Novo Projeto" onClick={() => { setModalAberto(true); setErroCriacao(""); }} style={{ padding: '10px 15px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <FiFolderPlus size={20} />
            </button>
            <div style={{ width: '1px', height: '30px', background: '#DDD' }}></div>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Logado: <span style={{ color: CORES[usuarioLogado]?.borda || '#333' }}>{usuarioLogado}</span></span>
            <button title="Sair" onClick={() => setUsuarioLogado(null)} style={{ padding: '10px 15px', background: '#FF5252', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <FiLogOut size={20} />
            </button>
          </div>
        </div>

        {/* TELA 1: DASHBOARD */}
        {telaAtiva === 'dashboard' && (
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
            <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '32px' }}>Dashboard de Ações</h1>
                  <p style={{ margin: 0, color: '#777' }}>Acompanhe o fluxo e o histórico global.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button title="Imprimir Relatório A4" onClick={() => {
                      setWorkflowImpressao(filtroDashboardProjeto !== 'Todos' ? filtroDashboardProjeto : (workflows.length > 0 ? workflows[0].id : null));
                      setModalImpressaoAberto(true);
                    }} style={{ padding: '10px 15px', background: '#4A90E2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    <FiPrinter size={22} />
                  </button>
                  <AnimatedDropdown
                    label="Projeto"
                    value={filtroDashboardProjeto}
                    onChange={setFiltroDashboardProjeto}
                    options={projetoOptions}
                    width="260px"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '20px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR TIPO</label>
                  <AnimatedDropdown
                    label="Tipo"
                    value={filtroDashboardTipo}
                    onChange={setFiltroDashboardTipo}
                    options={tipoOptions}
                    width="100%"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>FILTRAR STATUS</label>
                  <AnimatedDropdown
                    label="Status"
                    value={filtroDashboardEtapa}
                    onChange={setFiltroDashboardEtapa}
                    options={statusOptions}
                    width="100%"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>BUSCAR POR TAREFA</label>
                  <AnimatedDropdown
                    label="Tarefa"
                    value={filtroDashboardTarefa}
                    onChange={setFiltroDashboardTarefa}
                    options={tarefaOptions}
                    width="100%"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button title="Imprimir tarefas filtradas" onClick={() => {
                      setWorkflowImpressao(filtroDashboardProjeto !== 'Todos' ? filtroDashboardProjeto : (workflows.length > 0 ? workflows[0].id : null));
                      setModalImpressaoAberto(true);
                    }} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#4A90E2', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(74, 144, 226, 0.18)', transition: 'all 0.2s' }}>
                    <FiPrinter size={24} />
                  </button>
                </div>
              </div>

              {/* GRÁFICO CIRCULAR DE PROGRESSÃO GLOBAL */}
              <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                  {/* O gráfico em SVG */}
                  <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
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
                  {/* A porcentagem centralizada */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: progressoGlobal === 100 ? '#22C55E' : '#4A90E2' }}>
                    {progressoGlobal}%
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Progressão Geral</h3>
                  <div style={{ fontSize: '14px', color: '#777', fontWeight: 'bold' }}>
                    {concluidas} de {totalTarefas} tarefas finalizadas no total
                  </div>
                </div>
              </div>

              {/* LISTA DE PROJETOS DO DASHBOARD COMEÇA AQUI... */}
              <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' }}>
                {projetosDoDashboard.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '16px', textAlign: 'center', margin: '40px 0' }}>Nenhuma tarefa encontrada para os filtros aplicados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {projetosDoDashboard.map(projetoDashboard => {
                      const etapas = ['Iniciar', 'Em Andamento', 'Concluído'];
                      const tarefasPorEtapa = etapas.reduce((acc, etapa) => {
                        acc[etapa] = projetoDashboard.tasks.filter(t => (t.currentStep?.step_name || 'Iniciar') === etapa);
                        return acc;
                      }, {});
                      return (
                        <div key={projetoDashboard.id} onDoubleClick={() => { setWorkflowAtivo(projetoDashboard.id); setTelaAtiva('kanban');}} style={{ border: '1px solid #EEE', borderRadius: '15px', overflow: 'hidden' }}>
                          <div style={{ padding: '20px', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>{projetoDashboard.name}</h3>
                              {projetoDashboard.description && (
                                <p style={{ margin: '8px 0 12px 0', color: '#777', fontSize: '14px' }}>{projetoDashboard.description}</p>
                              )}
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {etapas.map(etapa => (
                                  <span key={etapa} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F0F0F0', color: '#555', padding: '8px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getCorStatus(etapa), display: 'inline-block' }}></span>
                                    {etapa}: {tarefasPorEtapa[etapa].length}
                                  </span>
                                ))}
                              </div>
                            </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                              <button title="Ver Etapas do Projeto" onClick={() => { setProjetoSelecionadoHistorico(projetoDashboard); setMostrarEtapasProjeto(true); setVisualizarApenasComentarios(false); }} style={{ padding: '10px 15px', borderRadius: '10px', border: 'none', background: '#333', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                                <FiList size={20} />
                              </button>
                              <button title="Abrir Quadro Kanban" onClick={() => { setWorkflowAtivo(projetoDashboard.id); setTelaAtiva('kanban'); }} style={{ padding: '10px 15px', borderRadius: '10px', border: 'none', background: '#777', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                                <FiTrello size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  <AnimatedDropdown
                    label="Projeto Kanban"
                    value={workflowAtivo || ''}
                    onChange={setWorkflowAtivo}
                    options={[{ value: '', label: 'Nenhum trabalho criado' }, ...workflows.map(w => ({ value: w.id, label: w.name }))]}
                    width="400px"
                    searchable
                    searchPlaceholder="Pesquisar projeto"
                  />
                  
                  {/* PROCESSO E BOTÃO DE DETALHES NA MESMA LINHA */}
                  {/* PROCESSO, DADOS VISÍVEIS E BOTÃO DE DETALHES */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {projeto?.description && (
                      <span style={{ fontSize: '13px', color: '#555', fontWeight: 'bold' }}>
                        {projeto.description}
                      </span>
                    )}

                    {/* Exibição visível da Matrícula e Endereço */}
                    {projeto && (projeto.matricula || projeto.endereco) && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {projeto.matricula && (
                          <span style={{ fontSize: '12px', color: '#444', background: '#FFF3E0', border: '1px solid #FFCC80', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                            Mat: {projeto.matricula}
                          </span>
                        )}
                        {projeto.endereco && (
                          <span style={{ fontSize: '12px', color: '#444', background: '#E0F2F1', border: '1px solid #80CBC4', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                            End: {projeto.endereco}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Botão que abre o modal para tudo */}
                    {projeto && (
                      <button 
                        onClick={() => { 
                          setDetalhesTexto(projeto.details || ''); 
                          setMatriculaTexto(projeto.matricula || ''); 
                          setEnderecoTexto(projeto.endereco || ''); 
                          setModalDetalhesAberto(true); 
                        }}
                        style={{ 
                          padding: '6px 14px', 
                          background: projeto.details ? '#333' : '#EAEAEA', 
                          color: projeto.details ? '#FFF' : '#333', 
                          border: 'none', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          cursor: 'pointer' 
                        }}
                      >
                        {projeto.matricula || projeto.endereco || projeto.details ? 'Editar Informações' : '+ Informações'}
                      </button>
                    )}
                  </div>


                 {/* NOVO: BARRA DE PROGRESSÃO LINEAR DO PROJETO SELECIONADO NO KANBAN */}
                  {projeto && (() => {
                    const totalProj = tickets.filter(t => t.workflowId === workflowAtivo).length;
                    const concluidasProj = tickets.filter(t => t.workflowId === workflowAtivo && (t.currentStep?.step_name || 'Iniciar') === 'Concluído').length;
                    const progProj = totalProj === 0 ? 0 : Math.round((concluidasProj / totalProj) * 100);
                    return (
                      <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                          <span>Progresso do Projeto</span>
                          <span style={{ color: progProj === 100 ? '#22C55E' : '#4A90E2' }}>{progProj}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#EAEAEA', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${progProj}%`, height: '100%', background: progProj === 100 ? '#22C55E' : '#4A90E2', transition: 'width 0.5s' }}></div>
                        </div>
                      </div>
                    );
                  })()} 

                 <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <input
                      type="text"
                      placeholder="Buscar etapa"
                      value={buscaEtapaKanban}
                      onChange={e => setBuscaEtapaKanban(e.target.value)}
                      style={{ minWidth: '180px', flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1px solid #DDD', outline: 'none', background: '#FFF' }}
                    />
                  </div>
                </div>
                
                {/* BOTÕES DE AÇÃO DO PROJETO COM ÍCONES */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button title="Histórico do Projeto" onClick={() => setProjetoSelecionadoHistorico(projeto)} style={{ padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                    <FiClock size={20} />
                  </button>
                  
                  {usuarioLogado === 'Charles' && (
                    <>
                      <button title="Editar Processos" onClick={abrirModalEdicao} style={{ padding: '12px', background: '#EAEAEA', color: '#333', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                        <FiEdit size={20} />
                      </button>
                      <button title="Excluir Projeto" onClick={abrirModalExcluirProjeto} style={{ padding: '12px', background: '#FF5252', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
                        <FiTrash2 size={20} />
                      </button>
                    </>
                  )}
                </div>

              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EAEAEA', padding: '8px 20px', borderRadius: '20px' }}>
                <span style={{ fontWeight: 'bold', color: '#787373' }}>Filtro de Setor:</span>
                <AnimatedDropdown
                  label="Setor"
                  value={filtroResponsavel}
                  onChange={setFiltroResponsavel}
                  options={responsavelOptions}
                  width="180px"
                />
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
                      {ticketsFiltrados
                        .filter(t => {
                          const statusNome = t.currentStep?.step_name || 'Iniciar';
                          return statusNome === colunaNome;
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
                              onClick={() => { setTicketSelecionado(t); setEditandoDescricao(false); }}
                              style={{ background: cor.bg, borderLeft: `6px solid ${cor.borda}`, padding: '16px', borderRadius: '8px', opacity: temPermissao ? 1 : 0.6, cursor: temPermissao ? 'grab' : 'not-allowed', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#333', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    {estaBloqueado && <span title="Aguardando etapa anterior" style={{ color: '#F57F17', fontWeight: 'bold' }}>[Bloqueado] </span>}
                                    {t.title}
                                    {t.description && (
                                      <div style={{ fontSize: '12px', color: '#555', background: 'rgba(0,0,0,0.03)', padding: '6px 8px', borderRadius: '6px', marginBottom: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                        {t.description}
                                      </div>
                                    )}
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
                      <AddCard column={colunaNome} workflowAtivo={workflowAtivo} projeto={projeto} setTickets={setTickets} usuarioLogado={usuarioLogado} usuarios={USUARIOS} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODAL IMPRESSÃO DE PROCESSO */}
        {modalImpressaoAberto && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
            <div style={{ background: '#FFF', padding: '35px', borderRadius: '20px', width: '520px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: '0 0 20px', color: '#333' }}>Imprimir Etapas</h2>
              <p style={{ margin: '0 0 20px', color: '#555', fontSize: '14px' }}>Selecione o processo que deseja imprimir. Todas as etapas serão incluídas.</p>
              <AnimatedDropdown
                label="Processo"
                value={workflowImpressao || ''}
                onChange={setWorkflowImpressao}
                options={[{ value: '', label: 'Selecione o processo' }, ...workflows.map(w => ({ value: w.id, label: w.name }))]}
                width="100%"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button onClick={() => setModalImpressaoAberto(false)} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button disabled={!workflowImpressao} onClick={() => {
                    setWorkflowParaImpressao(workflowImpressao);
                    setModalImpressaoAberto(false);
                    setTimeout(() => window.print(), 100);
                  }} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: workflowImpressao ? '#4A90E2' : '#CCC', color: 'white', cursor: workflowImpressao ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Imprimir</button>
              </div>
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
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '8px' }}>TIPO DE TERRENO</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                  onClick={() => setTerrenoNovoProjeto('Urbano')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: terrenoNovoProjeto === 'Urbano' ? '2px solid #4A90E2' : '1px solid #DDD', background: terrenoNovoProjeto === 'Urbano' ? '#EFF6FF' : '#FFF', color: terrenoNovoProjeto === 'Urbano' ? '#4A90E2' : '#555', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Urbano
                </button>
                <button 
                  onClick={() => setTerrenoNovoProjeto('Rural')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: terrenoNovoProjeto === 'Rural' ? '2px solid #22C55E' : '1px solid #DDD', background: terrenoNovoProjeto === 'Rural' ? '#F0FDF4' : '#FFF', color: terrenoNovoProjeto === 'Rural' ? '#22C55E' : '#555', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Rural
                </button>
              </div>
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


             <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '8px' }}>TIPO DE TERRENO</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                  onClick={() => setTerrenoEditando('Urbano')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: terrenoEditando === 'Urbano' ? '2px solid #4A90E2' : '1px solid #DDD', background: terrenoEditando === 'Urbano' ? '#EFF6FF' : '#FFF', color: terrenoEditando === 'Urbano' ? '#4A90E2' : '#555', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Urbano
                </button>
                <button 
                  onClick={() => setTerrenoEditando('Rural')} 
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: terrenoEditando === 'Rural' ? '2px solid #22C55E' : '1px solid #DDD', background: terrenoEditando === 'Rural' ? '#F0FDF4' : '#FFF', color: terrenoEditando === 'Rural' ? '#22C55E' : '#555', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Rural
                </button>
              </div>

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
                <div style={{ marginTop: '20px' }}>
                   <label style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalhes (Matrícula, Endereço...)</label>
                   {editandoDescricao ? (
                <div style={{ marginTop: '6px' }}>
                   <textarea
                      autoFocus
                      value={descricaoEditada}
                      onChange={(e) => setDescricaoEditada(e.target.value)}
                      style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #4A90E2', outline: 'none', resize: 'vertical', fontSize: '13px', fontFamily: 'inherit' }}
                    />
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={salvarDescricao} style={{ padding: '6px 12px', background: '#4A90E2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Salvar</button>
                  <button onClick={() => setEditandoDescricao(false)} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.1)', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Cancelar</button>
                </div>
              </div>
                ) : (
            <div 
              onClick={() => { setDescricaoEditada(ticketSelecionado.description || ''); setEditandoDescricao(true); }}
              style={{ marginTop: '6px', padding: '10px 12px', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', border: '1px dashed rgba(0,0,0,0.2)', minHeight: '40px', cursor: 'pointer', fontSize: '13px', color: ticketSelecionado.description ? '#333' : 'rgba(0,0,0,0.4)', whiteSpace: 'pre-wrap', lineHeight: '1.5', transition: 'all 0.2s ease' }}
            >
            {ticketSelecionado.description || 'Clique aqui para adicionar a matrícula, endereço...'}
          </div>
        )}
    </div>

  </div>
  <div className="scroll" style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
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
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{item.data.user?.name || 'Sistema'}</span>
                          <span style={{ color: '#999', fontSize: '12px' }}>{new Date(item.date).toLocaleString('pt-BR')}</span>
                        </div>
                        {item.type === 'comment' ? (
                          <p style={{ margin: 0, color: '#333', fontSize: '14px', lineHeight: '1.5' }}>"{item.data.text}"</p>
                        ) : (
                          <p style={{ margin: 0, color: '#777', fontSize: '13px' }}>
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

        {/* MODAL HISTÓRICO GERAL DO PROJETO COMBO (AUDITORIA) */}
        {projetoSelecionadoHistorico && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }} onClick={() => setProjetoSelecionadoHistorico(null)}>
            <div style={{ background: '#FFF', width: '860px', height: '85vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', background: '#F9F9F9', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => { setMostrarEtapasProjeto(true); setMostrarMovimentacoesProjeto(false); setVisualizarApenasComentarios(false); }} style={{ padding: '12px 18px', borderRadius: '10px', border: '1px solid #333', background: mostrarEtapasProjeto ? '#333' : '#FFF', color: mostrarEtapasProjeto ? '#FFF' : '#333', fontWeight: 'bold', cursor: 'pointer' }}>Exibir etapas</button>
                  <button onClick={() => { setMostrarEtapasProjeto(false); setMostrarMovimentacoesProjeto(true); setVisualizarApenasComentarios(false); }} style={{ padding: '12px 18px', borderRadius: '10px', border: '1px solid #777', background: mostrarMovimentacoesProjeto ? '#777' : '#FFF', color: mostrarMovimentacoesProjeto ? '#FFF' : '#333', fontWeight: 'bold', cursor: 'pointer' }}>Movimentações</button>
                  <button onClick={() => { setMostrarEtapasProjeto(false); setMostrarMovimentacoesProjeto(false); setVisualizarApenasComentarios(true); }} style={{ padding: '12px 18px', borderRadius: '10px', border: '1px solid #777', background: visualizarApenasComentarios ? '#777' : '#FFF', color: visualizarApenasComentarios ? '#FFF' : '#333', fontWeight: 'bold', cursor: 'pointer' }}>Comentários</button>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#555' }}>{comentariosDoProjeto.length} comentário(s) no projeto</span>
              </div>
              <div className="scroll" style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#F9F9F9' }}>
                {mostrarEtapasProjeto ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px' }}>
                    {etapasAtuaisDoProjeto.map(etapa => (
                      <div key={etapa.name} style={{ background: '#FFF', borderRadius: '18px', border: '1px solid #E8E8E8', boxShadow: '0px 6px 18px rgba(0,0,0,0.04)', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#333' }}>{etapa.name}</div>
                            <div style={{ fontSize: '12px', color: '#777', marginTop: '6px' }}>{etapa.tasks.length} tarefa(s)</div>
                          </div>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: getCorStatus(etapa.name), display: 'inline-block' }}></span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {etapa.tasks.length === 0 ? (
                            <div style={{ color: '#999', fontSize: '13px' }}>Nenhuma tarefa nesta etapa.</div>
                          ) : etapa.tasks.map(task => (
                            <div key={task.id} style={{ background: '#F7F9FF', borderRadius: '14px', padding: '14px 16px', border: '1px solid #E4E9F5' }}>
                              <div style={{ fontWeight: '800', color: '#222', marginBottom: '6px' }}>{task.title}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                <span style={{ color: '#555', fontSize: '13px' }}>{task.workflow?.name || ''}</span>
                                <span style={{ color: '#555', fontSize: '13px', fontWeight: '700' }}>{task.currentStep?.requiredRole?.name || 'Coordenação'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : mostrarMovimentacoesProjeto ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {timelineProjeto.filter(item => item.type === 'move').length === 0 ? (
                      <p style={{ color: '#999', fontStyle: 'italic' }}>Nenhuma movimentação registrada neste projeto.</p>
                    ) : timelineProjeto.filter(item => item.type === 'move').map((item, index) => (
                      <div key={`${item.cartaoNome || 'movimento'}-${index}`} style={{ background: '#FFF', borderRadius: '16px', padding: '20px', border: '1px solid #E8E8E8', boxShadow: '0px 6px 18px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '900', color: '#333' }}>{item.data.toStep?.step_name || item.data.fromStep?.step_name || 'Movimentação de etapa'}</div>
                          <span style={{ color: '#999', fontSize: '13px', fontWeight: '700' }}>{new Date(item.data.action_timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                        <div style={{ marginBottom: '10px', color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                          Cartão <strong>{item.cartaoNome}</strong> foi movido de <strong>{item.data.fromStep?.step_name || 'Criação'}</strong> para <strong>{item.data.toStep?.step_name || 'Desconhecido'}</strong>.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', color: '#777', fontSize: '13px' }}>
                          <span>Responsável: {item.data.user?.name || item.dono || 'Desconhecido'}</span>
                          <span>Projeto: {projetoSelecionadoHistorico.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {comentariosDoProjeto.length === 0 ? (
                      <p style={{ color: '#999', fontStyle: 'italic' }}>Nenhum comentário encontrado neste projeto.</p>
                    ) : comentariosDoProjeto.map(comment => (
                      <div key={comment.id} style={{ background: '#FFF', borderRadius: '16px', padding: '20px', border: '1px solid #E8E8E8', boxShadow: '0px 6px 18px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '900', color: '#333' }}>{comment.user?.name || 'Usuário'}</div>
                          <span style={{ color: '#999', fontSize: '13px', fontWeight: '700' }}>{new Date(comment.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        <div style={{ marginBottom: '10px', color: '#555', fontSize: '14px', lineHeight: '1.6' }}>{comment.text}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', color: '#777', fontSize: '13px' }}>
                          <span>Cartão: {comment.ticketTitle}</span>
                          <span>Projeto: {comment.ticketWorkflowName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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



{/* MODAL INFORMAÇÕES DO PROJETO */}
        {modalDetalhesAberto && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 300 }}>
            <div style={{ background: '#FFF', padding: '30px', borderRadius: '20px', width: '500px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
              <h2 style={{ margin: '0 0 10px', color: '#333' }}>Informações do Projeto</h2>
              <p style={{ color: '#777', fontSize: '13px', marginBottom: '20px', fontWeight: 'bold' }}>{projeto?.name}</p>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '6px' }}>MATRÍCULA (Visível)</label>
                  <input
                    type="text"
                    value={matriculaTexto}
                    onChange={(e) => setMatriculaTexto(e.target.value)}
                    placeholder="Nº da Matrícula"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #EEE', outline: 'none', fontSize: '14px' }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '6px' }}>ENDEREÇO (Visível)</label>
                  <input
                    type="text"
                    value={enderecoTexto}
                    onChange={(e) => setEnderecoTexto(e.target.value)}
                    placeholder="Rua, Cidade..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #EEE', outline: 'none', fontSize: '14px' }}
                  />
                </div>
              </div>

              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '6px' }}>NOTAS / DETALHES</label>
              <textarea
                value={detalhesTexto}
                onChange={(e) => setDetalhesTexto(e.target.value)}
                placeholder="Anotações internas, contatos, ou detalhes extras..."
                style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '2px solid #EEE', outline: 'none', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
                <button onClick={() => setModalDetalhesAberto(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Fechar</button>
                <button onClick={salvarDetalhesProjeto} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4A90E2', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
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

      {workflowParaImpressaoData && (
        <div className="print-only" style={{ padding: '20px', color: '#000', fontSize: '14px' }}>
          <div style={{ marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '28px' }}>Relatório de Impressão</h1>
            <p style={{ margin: '8px 0 0', fontSize: '16px' }}><strong>Processo:</strong> {workflowParaImpressaoData.name}</p>
            {workflowParaImpressaoData.description && (
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#333' }}>{workflowParaImpressaoData.description}</p>
            )}
          </div>

          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Atividades</th>
                <th>Responsável</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {etapasParaImpressao.map((etapa) => (
                <tr key={etapa.name}>
                  <td style={{ verticalAlign: 'top', width: '170px', fontWeight: 'bold' }}>{etapa.name}</td>
                  <td style={{ verticalAlign: 'top' }}>
                    {etapa.tasks.length === 0 ? (
                      <span style={{ color: '#777' }}>Sem atividades</span>
                    ) : etapa.tasks.map((t) => (
                      <div key={t.id} style={{ marginBottom: '10px' }}>
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>{t.title}</div>
                        <div style={{ color: '#555', fontSize: '13px', lineHeight: '1.4' }}>{t.description || 'Nenhum detalhe adicional disponível.'}</div>
                      </div>
                    ))}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    {etapa.tasks.length === 0 ? '-' : [...new Set(etapa.tasks.map(t => t.currentStep?.requiredRole?.name || 'Coordenação'))].join(', ')}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>{etapa.tasks.length} tarefa(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      </>
  );
}

const AnimatedDropdown = ({ label, value, onChange, options, width, searchable = false, searchPlaceholder = 'Buscar...' }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const selectedLabel = options.find(option => option.value === value)?.label || 'Selecionar...';

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className="animated-dropdown-container" style={{ width }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="animated-dropdown-button"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>{label}</span>
          <span style={{ color: '#777', fontSize: '14px' }}>{selectedLabel}</span>
        </div>
        <motion.span animate={open ? 'open' : 'closed'} variants={iconVariants} style={{ display: 'flex' }}>
          <FiChevronDown />
        </motion.span>
      </button>

      <motion.div
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={wrapperVariants}
        className="dropdown-list"
        style={{ pointerEvents: open ? 'auto' : 'none', transformOrigin: 'top center' }}
      >
        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {searchable && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #D1D5DB', outline: 'none', background: '#F9FAFB' }}
              />
            </div>
          )}
          {(searchable ? options.filter(option => option.label.toLowerCase().includes(searchQuery.trim().toLowerCase())) : options).map(option => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              variants={itemVariants}
              className="dropdown-option"
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const wrapperVariants = {
  open: {
    opacity: 1,
    scaleY: 1,
    transition: {
      duration: 0.18,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.03,
    },
    transitionEnd: {
      display: 'block'
    }
  },
  closed: {
    opacity: 0,
    scaleY: 0,
    transition: {
      duration: 0.16,
      ease: 'easeIn',
      when: 'afterChildren',
      staggerChildren: 0.02,
    },
    transitionEnd: {
      display: 'none'
    }
  }
};

const iconVariants = {
  open: { rotate: 180, transition: { duration: 0.18, ease: 'easeOut' } },
  closed: { rotate: 0, transition: { duration: 0.18, ease: 'easeOut' } }
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.16, ease: 'easeOut' }
  },
  closed: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.14, ease: 'easeIn' }
  }
};

const AddCard = ({ column, workflowAtivo, projeto, setTickets, usuarioLogado, usuarios }) => {
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);
  const [responsavel, setResponsavel] = useState(usuarioLogado || usuarios?.[0] || 'Coordenação');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !workflowAtivo) return;

    const stepMatch = projeto?.steps?.find(step =>
      step.step_name === column &&
      step.requiredRole?.name === responsavel
    );

    if (!stepMatch) {
      alert('Não foi possível encontrar a etapa correspondente para o responsável escolhido.');
      return;
    }

    try {
      const res = await fetch('http://192.168.1.2:3000/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed, workflowId: workflowAtivo, currentStepId: stepMatch.id })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao criar tarefa.');
      }

      const createdTicket = await res.json();
      setTickets(prev => [...prev, createdTicket]);
      setText('');
      setResponsavel(usuarioLogado || usuarios?.[0] || 'Coordenação');
      setAdding(false);
    } catch (error) {
      console.error('Falha ao criar tarefa:', error);
      alert('Erro ao criar a tarefa. Verifique o servidor e tente novamente.');
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nova tarefa..."
            autoFocus
            rows={3}
            style={{ width: '100%', borderRadius: '14px', border: '1px solid #D1D5DB', padding: '12px', resize: 'vertical', fontSize: '14px', color: '#111827', background: '#F8FAFC' }}
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#4B5563' }}>
            Responsável
            <select
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              style={{ width: '100%', borderRadius: '12px', border: '1px solid #D1D5DB', padding: '10px 12px', background: '#FFF', color: '#111827' }}
            >
              {usuarios.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <button type="button" onClick={() => setAdding(false)} style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid #D1D5DB', background: '#FFFFFF', color: '#374151', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', border: 'none', background: '#2563EB', color: '#FFFFFF', cursor: 'pointer' }}>
              <FiPlus />
              Adicionar
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          type="button"
          onClick={() => setAdding(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 14px', borderRadius: '12px', border: '1px dashed #9CA3AF', background: '#F8FAFC', color: '#4B5563', cursor: 'pointer', fontWeight: '700' }}
        >
          <FiPlus />
          Adicionar tarefa
        </motion.button>
      )}
    </div>
  );
};

export default App;