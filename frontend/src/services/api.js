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

    // ---- CONFRONTANTES ----
    getConfrontantes: async () => {
        const res = await fetch(`${BASE_URL}/confrontantes`);
        return res.json();
    },

    getConfrontanteById: async (id) => {
        const res = await fetch(`${BASE_URL}/confrontantes/${id}`);
        return res.json();
    },

    createConfrontante: async (dadosConfrontante) => {
        const res = await fetch(`${BASE_URL}/confrontantes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosConfrontante)
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateConfrontante: async (id, dadosConfrontante) => {
        const res = await fetch(`${BASE_URL}/confrontantes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosConfrontante)
        });
        return { data: await res.json(), ok: res.ok };
    },

    deleteConfrontante: async (id) => {
        await fetch(`${BASE_URL}/confrontantes/${id}`, { method: 'DELETE' });
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

    // URL direta: o navegador dispara o download, não é consumida via fetch.
    urlGerarDocumento: (servicoId, templateKey) => `${BASE_URL}/documentos/${servicoId}/${templateKey}`,
};