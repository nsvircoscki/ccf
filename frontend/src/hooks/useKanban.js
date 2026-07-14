// src/hooks/useKanban.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useKanban() {
  const [tickets, setTickets] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [workflowAtivo, setWorkflowAtivo] = useState(null);

  const carregarDados = useCallback(async () => {
    try {
      const dadosWf = await api.getWorkflows();
      if (Array.isArray(dadosWf)) {
        setWorkflows(dadosWf);
        if (dadosWf.length > 0 && !workflowAtivo) setWorkflowAtivo(dadosWf[0].id);
      }
      const dadosTk = await api.getTickets();
      if (Array.isArray(dadosTk)) setTickets(dadosTk);
      else setTickets([]);
    } catch (err) { 
      console.error("Erro na API:", err); 
      setTickets([]); 
    }
  }, [workflowAtivo]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const moverTicketOtimista = async (ticket, etapaDestino, usuarioLogado) => {
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, currentStepId: etapaDestino.id, currentStep: etapaDestino } : t));
    try {
      await api.moveTicket(ticket.id, etapaDestino.id, usuarioLogado);
      carregarDados();
    } catch (err) { 
      console.error("Erro no movimento, revertendo...", err); 
      carregarDados();
    }
  };

  const adicionarComentarioLocal = async (ticketId, usuarioLogado, texto) => {
    try {
      const commentCriado = await api.addComment(ticketId, usuarioLogado, texto);
      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          const comentariosAtuais = t.comments || [];
          return { ...t, comments: [commentCriado, ...comentariosAtuais] };
        }
        return t;
      }));
      return commentCriado;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const excluirCartaoLocal = async (id) => {
    await api.deleteTicket(id);
    setTickets(prev => prev.filter(t => t.id !== id));
    carregarDados();
  };

  return {
    tickets,
    workflows,
    workflowAtivo,
    setWorkflowAtivo,
    carregarDados,
    moverTicketOtimista,
    adicionarComentarioLocal,
    excluirCartaoLocal
  };
}