// src/controllers/documentoController.js
import { documentoService } from '../services/documentoService.js';

export const documentoController = {
  async listarTemplates(req, res) {
    res.json(documentoService.listarTemplates());
  },

  async gerar(req, res) {
    try {
      const { buffer, nomeArquivo } = await documentoService.gerar(req.params.servicoId, req.params.templateKey);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(nomeArquivo)}"`);
      res.send(buffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
