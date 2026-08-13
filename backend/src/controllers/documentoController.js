// src/controllers/documentoController.js
import { documentoService } from '../services/documentoService.js';

export const documentoController = {
  async listarTemplates(req, res) {
    res.json(await documentoService.listarTemplates());
  },

  async salvarMapeamentoTipos(req, res) {
    try {
      res.json(await documentoService.salvarMapeamentoTipos(req.body.mapa));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
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

  async registrarNoProtocolo(req, res) {
    try {
      const servico = await documentoService.registrarDocumentosNoProtocolo(req.params.servicoId, req.body.chaves);
      res.json(servico);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
