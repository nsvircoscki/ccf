const BASE_URL = 'http://localhost:3000';

export const api = {
    getWorkflows: async() => {
        const res = await fetch(`${BASE_URL}/workflows`);
        return res.json();
    },

    getTickets: async () => {
        const res = await fetch(`${BASE_URL}/tickets`);
        return res.json();
    },

    createWorkflow: async(name, types) => {
        const res = await fetch(`${BASE_URL}/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, types })
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateWorkflow: async (id, types) => {
        await fetch(`${BASE_URL}/workflows/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ types })
        });
    },

    deleteWorkflow: async(id) => {
        await fetch(`${BASE_URL}/workflows/${id}`, { method: 'DELETE' });
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
        return res.json();
    },

    aprovarOrcamento: async (servicoId) => {
        const res = await fetch(`${BASE_URL}/servicos/${servicoId}/aprovar-orcamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    }
};