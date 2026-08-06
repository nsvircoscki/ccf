// src/controllers/imovelController.js
import { imovelService } from '../services/imovelService.js';

export const imovelController = {
  async listar(req, res) {
    try {
      const imoveis = await imovelService.listar();
      res.json(imoveis);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar imóveis.' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const imovel = await imovelService.buscarPorId(req.params.id);
      if (!imovel) return res.status(404).json({ error: 'Imóvel não encontrado.' });
      res.json(imovel);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar imóvel.' });
    }
  },

  async criar(req, res) {
    try {
      const imovel = await imovelService.criar(req.body);
      res.status(201).json(imovel);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async atualizar(req, res) {
    try {
      const imovel = await imovelService.atualizar(req.params.id, req.body);
      res.status(200).json(imovel);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async remover(req, res) {
    try {
      await imovelService.remover(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
