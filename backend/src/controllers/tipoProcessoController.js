// src/controllers/tipoProcessoController.js
import { workflowService } from '../services/workflowService.js';

export const tipoProcessoController = {
  async listar(req, res) {
    try {
      const tipos = await workflowService.listarTiposProcesso();
      res.status(200).json(tipos);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async atualizar(req, res) {
    try {
      const resultado = await workflowService.atualizarTipoProcesso(req.params.tipo, req.body.etapas);
      res.status(200).json(resultado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
