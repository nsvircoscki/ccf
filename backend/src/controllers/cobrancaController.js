import { cobrancaService } from '../services/cobrancaService.js';

export const cobrancaController = {
  async listar(req, res) {
    try {
      const cobrancas = await cobrancaService.listar({ servicoId: req.query.servicoId });
      res.json(cobrancas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar cobranças.' });
    }
  },

  async criar(req, res) {
    try {
      const cobranca = await cobrancaService.criar(req.body);
      res.status(201).json(cobranca);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async emitirParcela(req, res) {
    try {
      const parcela = await cobrancaService.emitirParcela(req.params.id, req.params.numero);
      res.status(200).json(parcela);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Boleto já emitido no banco, só o PDF que ainda não veio — tenta buscar
  // de novo sem re-emitir.
  async tentarBaixarPdf(req, res) {
    try {
      const parcela = await cobrancaService.tentarBaixarPdf(req.params.id, req.params.numero);
      res.status(200).json(parcela);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async pdfParcela(req, res) {
    try {
      const { caminho, nome } = await cobrancaService.caminhoArquivoPdf(req.params.id, req.params.numero);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${nome}"`);
      res.sendFile(caminho);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};
