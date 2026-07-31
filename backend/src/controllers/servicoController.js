// src/controllers/servicoController.js
import { servicoService } from '../services/servicoService.js';

export const servicoController = {
  async listar(req, res) {
    try {
      const servicos = await servicoService.listar();
      res.json(servicos);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar serviços." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const servico = await servicoService.buscarPorId(req.params.id);
      if (!servico) return res.status(404).json({ error: "Serviço não encontrado." });
      res.json(servico);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar serviço." });
    }
  },

  async criar(req, res) {
    try {
      const servico = await servicoService.criar(req.body);
      res.status(201).json(servico);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async aprovarOrcamento(req, res) {
    try {
      const resultado = await servicoService.aprovarOrcamentoEGerarProjetos(req.params.id);
      res.status(200).json(resultado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};
