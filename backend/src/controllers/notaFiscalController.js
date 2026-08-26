import { notaFiscalService } from '../services/notaFiscalService.js';

export const notaFiscalController = {
  async listar(req, res) {
    try {
      const notasFiscais = await notaFiscalService.listar({
        status: req.query.status,
        servicoId: req.query.servicoId,
      });
      res.json(notasFiscais);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar notas fiscais.' });
    }
  },

  async criar(req, res) {
    try {
      const notaFiscal = await notaFiscalService.criar(req.body);
      res.status(201).json(notaFiscal);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async emitir(req, res) {
    try {
      const notaFiscal = await notaFiscalService.emitir(req.params.id);
      res.status(200).json(notaFiscal);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async pdf(req, res) {
    try {
      const { caminho, nome } = await notaFiscalService.caminhoArquivoPdf(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${nome}"`);
      res.sendFile(caminho);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};
