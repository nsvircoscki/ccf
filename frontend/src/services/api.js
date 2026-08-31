const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
    getWorkflows: async() => {
        const res = await fetch(`${BASE_URL}/workflows`);
        return res.json();
    },

    getTickets: async () => {
        const res = await fetch(`${BASE_URL}/tickets`);
        return res.json();
    },

    createWorkflow: async(name, types, terreno = 'Urbano') => {
        const res = await fetch(`${BASE_URL}/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, types, terreno })
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateWorkflow: async (id, types, terreno) => {
        await fetch(`${BASE_URL}/workflows/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ types, terreno })
        });
    },

    updateWorkflowDetails: async (id, { matricula, endereco, details }) => {
        const res = await fetch(`${BASE_URL}/workflows/${id}/details`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matricula, endereco, details })
        });
        return res.json();
    },

    deleteWorkflow: async(id) => {
        await fetch(`${BASE_URL}/workflows/${id}`, { method: 'DELETE' });
    },

    createTicket: async ({ title, description, workflowId, currentStepId }) => {
        const res = await fetch(`${BASE_URL}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, workflowId, currentStepId })
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao criar tarefa.');
        }
        return res.json();
    },

    updateTicket: async (id, { description }) => {
        const res = await fetch(`${BASE_URL}/tickets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
        });
        return res.json();
    },

    deleteTicket: async (id) => {
        await fetch(`${BASE_URL}/tickets/${id}`, { method: 'DELETE' });
    },

    moveTicket: async (ticketId, toStepId, userId) => {
        await fetch(`${BASE_URL}/tickets/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId, toStepId, userId })
        });
    },

    addComment: async (ticketId, userId, text) => {
        const res = await fetch(`${BASE_URL}/tickets/${ticketId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ticketId, userId, text })
        });
        return res.json();
    },

    // ---- NOVOS MÉTODOS PARA O FLUXO DE SERVIÇOS ----
    getServicos: async () => {
        const res = await fetch(`${BASE_URL}/servicos`);
        return res.json();
    },

    // URL direta: a ficha é aberta numa aba pelo navegador, não consumida aqui.
    urlPdfServico: (servicoId) => `${BASE_URL}/servicos/${servicoId}/pdf`,

    // A "versao" quebra o cache do navegador: sem ela, trocar a imagem de um
    // serviço continuaria exibindo a antiga, já que a URL não muda.
    urlImagemServico: (servicoId, versao) =>
        `${BASE_URL}/servicos/${servicoId}/imagem${versao ? `?v=${encodeURIComponent(versao)}` : ''}`,

    // Prévia da ficha: devolve o PDF como blob para exibir num iframe.
    gerarPreviaPdf: async (servicoId, dados, signal) => {
        const res = await fetch(`${BASE_URL}/servicos/${servicoId}/pdf-previa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
            signal
        });
        if (!res.ok) return null;
        return res.blob();
    },

    getServicoById: async (id) => {
        const res = await fetch(`${BASE_URL}/servicos/${id}`);
        return res.json();
    },

    createServico: async (dadosServico) => {
        const res = await fetch(`${BASE_URL}/servicos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosServico)
        });
        return { data: await res.json(), ok: res.ok };
    },

    salvarOrcamento: async (servicoId, dadosOrcamento) => {
        const res = await fetch(`${BASE_URL}/servicos/${servicoId}/orcamento`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosOrcamento)
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateServico: async (servicoId, dadosServico) => {
        const res = await fetch(`${BASE_URL}/servicos/${servicoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosServico)
        });
        return { data: await res.json(), ok: res.ok };
    },

    aprovarOrcamento: async (servicoId, decisao) => {
        const res = await fetch(`${BASE_URL}/servicos/${servicoId}/aprovar-orcamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decisao })
        });
        return res.json();
    },

    // ---- CLIENTES ----
    getClientes: async () => {
        const res = await fetch(`${BASE_URL}/clientes`);
        return res.json();
    },

    getClienteById: async (id) => {
        const res = await fetch(`${BASE_URL}/clientes/${id}`);
        return res.json();
    },

    createCliente: async (dadosCliente) => {
        const res = await fetch(`${BASE_URL}/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCliente)
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateCliente: async (id, dadosCliente) => {
        const res = await fetch(`${BASE_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCliente)
        });
        return { data: await res.json(), ok: res.ok };
    },

    deleteCliente: async (id) => {
        await fetch(`${BASE_URL}/clientes/${id}`, { method: 'DELETE' });
    },

    // ---- IMÓVEIS ----
    getImoveis: async () => {
        const res = await fetch(`${BASE_URL}/imoveis`);
        return res.json();
    },

    getImovelById: async (id) => {
        const res = await fetch(`${BASE_URL}/imoveis/${id}`);
        return res.json();
    },

    createImovel: async (dadosImovel) => {
        const res = await fetch(`${BASE_URL}/imoveis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosImovel)
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateImovel: async (id, dadosImovel) => {
        const res = await fetch(`${BASE_URL}/imoveis/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosImovel)
        });
        return { data: await res.json(), ok: res.ok };
    },

    deleteImovel: async (id) => {
        await fetch(`${BASE_URL}/imoveis/${id}`, { method: 'DELETE' });
    },

    extrairDescricaoImovel: async ({ base64, mimeType }) => {
        const res = await fetch(`${BASE_URL}/imoveis/extrair-descricao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64, mimeType })
        });
        return { data: await res.json(), ok: res.ok };
    },

    buscarCartorioPorCns: async (cns) => {
        const res = await fetch(`${BASE_URL}/cartorios/${encodeURIComponent(cns)}`);
        if (!res.ok) return null;
        return res.json();
    },

    // ---- VINCULAÇÃO ----
    salvarVinculacao: async (servicoId, dadosVinculacao) => {
        const res = await fetch(`${BASE_URL}/servicos/${servicoId}/vinculacao`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosVinculacao)
        });
        return { data: await res.json(), ok: res.ok };
    },

    // ---- DOCUMENTOS ----
    getTemplatesDocumento: async () => {
        const res = await fetch(`${BASE_URL}/documentos/templates`);
        return res.json();
    },

    salvarMapeamentoTiposDocumento: async (mapa) => {
        const res = await fetch(`${BASE_URL}/documentos/mapeamento-tipos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mapa }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // URL direta: o navegador dispara o download, não é consumida via fetch.
    urlGerarDocumento: (servicoId, templateKey) => `${BASE_URL}/documentos/${servicoId}/${templateKey}`,

    registrarDocumentosNoProtocolo: async (servicoId, chaves) => {
        const res = await fetch(`${BASE_URL}/documentos/${servicoId}/protocolo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chaves }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // ---- AUTENTICAÇÃO ----
    login: async (usuario, senha) => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    criarSenha: async (usuario, novaSenha) => {
        const res = await fetch(`${BASE_URL}/auth/criar-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, novaSenha }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    alterarSenha: async (usuario, senhaAtual, novaSenha) => {
        const res = await fetch(`${BASE_URL}/auth/alterar-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senhaAtual, novaSenha }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // ---- TIPOS DE PROCESSO (etapas padrão do Kanban) ----
    getTiposProcesso: async () => {
        const res = await fetch(`${BASE_URL}/tipos-processo`);
        return res.json();
    },

    // x-usuario: o backend só aceita a escrita vinda de "ENG" (ver
    // tipoProcessoRoutes.js) — mesmo nível de checagem informal do resto do
    // sistema, que ainda não tem sessão/token.
    atualizarTipoProcesso: async (tipoProcesso, etapas, usuarioLogado) => {
        const res = await fetch(`${BASE_URL}/tipos-processo/${encodeURIComponent(tipoProcesso)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-usuario': usuarioLogado || '' },
            body: JSON.stringify({ etapas }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // ---- NOTIFICAÇÕES (setor responsável pela próxima etapa) ----
    getNotificacoes: async (usuarioLogado) => {
        const res = await fetch(`${BASE_URL}/notificacoes`, {
            headers: { 'x-usuario': usuarioLogado || '' },
        });
        return res.json();
    },

    marcarNotificacaoComoLida: async (id) => {
        const res = await fetch(`${BASE_URL}/notificacoes/${id}/lida`, { method: 'PUT' });
        return res.json();
    },

    marcarTodasNotificacoesComoLidas: async (usuarioLogado) => {
        const res = await fetch(`${BASE_URL}/notificacoes/marcar-todas-lidas`, {
            method: 'PUT',
            headers: { 'x-usuario': usuarioLogado || '' },
        });
        return res.json();
    },

    // ---- FATURAMENTO: COBRANÇAS (boletos) ----
    getCobrancas: async () => {
        const res = await fetch(`${BASE_URL}/cobrancas`);
        return res.json();
    },

    criarCobranca: async (dados) => {
        const res = await fetch(`${BASE_URL}/cobrancas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // Cada parcela é um boleto emitido individualmente.
    emitirParcelaCobranca: async (cobrancaId, numeroParcela) => {
        const res = await fetch(`${BASE_URL}/cobrancas/${cobrancaId}/parcelas/${numeroParcela}/emitir`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    // Boleto já emitido no banco, só o PDF que não veio — tenta de novo sem
    // re-emitir (evita duplicar o boleto no Inter).
    tentarBaixarPdfParcela: async (cobrancaId, numeroParcela) => {
        const res = await fetch(`${BASE_URL}/cobrancas/${cobrancaId}/parcelas/${numeroParcela}/baixar-pdf`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    // URL direta: o PDF é aberto numa aba pelo navegador, não consumida aqui.
    urlPdfParcelaCobranca: (cobrancaId, numeroParcela) => `${BASE_URL}/cobrancas/${cobrancaId}/parcelas/${numeroParcela}/pdf`,

    // ---- FATURAMENTO: NOTAS FISCAIS ----
    getNotasFiscais: async () => {
        const res = await fetch(`${BASE_URL}/notas-fiscais`);
        return res.json();
    },

    criarNotaFiscal: async (dados) => {
        const res = await fetch(`${BASE_URL}/notas-fiscais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        return { data: await res.json(), ok: res.ok };
    },

    emitirNotaFiscal: async (id) => {
        const res = await fetch(`${BASE_URL}/notas-fiscais/${id}/emitir`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    // Nota já emitida na prefeitura, só o PDF que não veio — tenta de novo
    // sem re-emitir (evita duplicar a NFS-e).
    tentarBaixarPdfNotaFiscal: async (id) => {
        const res = await fetch(`${BASE_URL}/notas-fiscais/${id}/baixar-pdf`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    urlPdfNotaFiscal: (id) => `${BASE_URL}/notas-fiscais/${id}/pdf`,

    // ---- TAREFAS ----
    getTarefas: async ({ setor, servicoId, status } = {}) => {
        const params = new URLSearchParams();
        if (setor) params.set('setor', setor);
        if (servicoId) params.set('servicoId', servicoId);
        if (status) params.set('status', status);
        const query = params.toString();
        const res = await fetch(`${BASE_URL}/tarefas${query ? `?${query}` : ''}`);
        return res.json();
    },

    criarTarefa: async (dados) => {
        const res = await fetch(`${BASE_URL}/tarefas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        return { data: await res.json(), ok: res.ok };
    },

    concluirTarefa: async (id, setor) => {
        const res = await fetch(`${BASE_URL}/tarefas/${id}/concluir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ setor }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    reabrirTarefa: async (id) => {
        const res = await fetch(`${BASE_URL}/tarefas/${id}/reabrir`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    excluirTarefa: async (id) => {
        const res = await fetch(`${BASE_URL}/tarefas/${id}`, { method: 'DELETE' });
        return { ok: res.ok };
    },
};