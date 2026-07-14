// src/controllers/workflowController.js
import { workflowService } from '../services/workflowService.js';

export const workflowController = {
  async listar(req, res) {
    try {
      const workflows = await workflowService.listarTodos();
      res.json(workflows);
    } catch (error) { res.status(500).json({ error: "Erro ao buscar projetos." }); }
  },

  async criar(req, res) {
    const { name, types } = req.body;
    try {
      const projeto = await workflowService.fabricarProjeto(name, types);
      res.status(201).json({ message: "Projeto Combo fabricado com sucesso!", data: projeto });
    } catch (error) { res.status(400).json({ error: error.message }); }
  },

  async editar(req, res) {
    try {
      const resultado = await workflowService.editarProjeto(req.params.id, req.body.types);
      res.status(200).json(resultado);
    } catch (error) { res.status(400).json({ error: error.message }); }
  },

  async excluir(req, res) {
    try {
      await workflowService.excluirProjeto(req.params.id);
      res.status(200).json({ message: 'Projeto inteiro excluído com sucesso!' });
    } catch (error) { res.status(500).json({ error: 'Erro ao excluir projeto.' }); }
  }
};