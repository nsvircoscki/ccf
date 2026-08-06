// src/controllers/confrontanteController.js
import { confrontanteService } from '../services/confrontanteService.js';

export const confrontanteController = {
  async listar(req, res) {
    try {
      const confrontantes = await confrontanteService.listar();
      res.json(confrontantes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar confrontantes.' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const confrontante = await confrontanteService.buscarPorId(req.params.id);
      if (!confrontante) return res.status(404).json({ error: 'Confrontante não encontrado.' });
      res.json(confrontante);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar confrontante.' });
    }
  },

  async criar(req, res) {
    try {
      const confrontante = await confrontanteService.criar(req.body);
      res.status(201).json(confrontante);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async atualizar(req, res) {
    try {
      const confrontante = await confrontanteService.atualizar(req.params.id, req.body);
      res.status(200).json(confrontante);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async remover(req, res) {
    try {
      await confrontanteService.remover(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
