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