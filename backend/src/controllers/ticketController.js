// src/controllers/ticketController.js
import { ticketService } from '../services/ticketService.js';

export const ticketController = {
  async listar(req, res) {
    try {
      const tickets = await ticketService.listarTodos();
      res.json(tickets);
    } catch (error) { 
      res.status(500).json({ error: "Erro ao buscar tarefas." }); 
    }
  },

  async criar(req, res) {
    try {
      const ticket = await ticketService.criarTicket(req.body);
      res.status(201).json(ticket);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async atualizar(req, res) {
    try {
      const ticket = await ticketService.atualizarTicket(req.params.id, req.body);
      res.status(200).json(ticket);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar tarefa." });
    }
  },

  async comentar(req, res) {
    try {
      // Autor = quem está logado (req.usuario), não o userId do corpo.
      const comentario = await ticketService.adicionarComentario(req.params.id, req.usuario.id, req.body.text);
      res.status(201).json(comentario);
    } catch (error) { 
      res.status(500).json({ error: "Erro ao adicionar comentário." }); 
    }
  },

  async mover(req, res) {
    try {
      // Quem moveu = quem está logado (req.usuario), não o userId do corpo.
      const updatedTicket = await ticketService.moverTicket(req.body.ticketId, req.body.toStepId, req.usuario);
      res.status(200).json({ message: "Movido", updatedTicket });
    } catch (error) { 
      res.status(error.status || 500).json({ error: error.status ? error.message : "Erro ao mover tarefa." }); 
    }
  },

  async excluir(req, res) {
    try {
      await ticketService.excluirTicket(req.params.id, req.usuario);
      res.status(200).json({ message: 'Excluído!' });
    } catch (error) { 
      res.status(error.status || 500).json({ error: error.status ? error.message : 'Erro ao excluir tarefa.' }); 
    }
  }
};