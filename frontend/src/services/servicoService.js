// frontend/src/services/servicoService.js
import { api } from './api'; // <-- Agora com chaves, respeitando o seu export!

export const servicoService = {
  async listarTodos() {
    return api.getServicos();
  },

  async cadastrar(dadosServico) {
    return api.createServico(dadosServico);
  },

  async atualizar(servicoId, dadosServico) {
    return api.updateServico(servicoId, dadosServico);
  },

  urlPdf(servicoId) {
    return api.urlPdfServico(servicoId);
  },

  urlImagem(servicoId, versao) {
    return api.urlImagemServico(servicoId, versao);
  },

  async gerarPreviaPdf(servicoId, dados, signal) {
    return api.gerarPreviaPdf(servicoId, dados, signal);
  },

  async salvarOrcamento(servicoId, dadosOrcamento) {
    return api.salvarOrcamento(servicoId, dadosOrcamento);
  },

  async aprovarOrcamento(servicoId, decisao) {
    return api.aprovarOrcamento(servicoId, decisao);
  },

  async buscarPorId(servicoId) {
    return api.getServicoById(servicoId);
  },

  async salvarVinculacao(servicoId, dadosVinculacao) {
    return api.salvarVinculacao(servicoId, dadosVinculacao);
  },

  async listarTemplatesDocumento() {
    return api.getTemplatesDocumento();
  },

  urlGerarDocumento(servicoId, templateKey) {
    return api.urlGerarDocumento(servicoId, templateKey);
  }
};