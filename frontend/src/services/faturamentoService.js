// frontend/src/services/faturamentoService.js
import { api } from './api';

export const faturamentoService = {
  // ---- Cobranças (boletos) ----
  async listarCobrancas() {
    return api.getCobrancas();
  },
  async criarCobranca(dados) {
    return api.criarCobranca(dados);
  },
  async excluirCobranca(id) {
    return api.excluirCobranca(id);
  },
  async excluirNotaFiscal(id) {
    return api.excluirNotaFiscal(id);
  },
  async emitirParcelaCobranca(cobrancaId, numeroParcela) {
    return api.emitirParcelaCobranca(cobrancaId, numeroParcela);
  },
  async tentarBaixarPdfParcela(cobrancaId, numeroParcela) {
    return api.tentarBaixarPdfParcela(cobrancaId, numeroParcela);
  },
  urlPdfParcelaCobranca(cobrancaId, numeroParcela) {
    return api.urlPdfParcelaCobranca(cobrancaId, numeroParcela);
  },

  // ---- Notas fiscais ----
  async listarNotasFiscais() {
    return api.getNotasFiscais();
  },
  async criarNotaFiscal(dados) {
    return api.criarNotaFiscal(dados);
  },
  async emitirNotaFiscal(id) {
    return api.emitirNotaFiscal(id);
  },
  async tentarBaixarPdfNotaFiscal(id) {
    return api.tentarBaixarPdfNotaFiscal(id);
  },
  urlPdfNotaFiscal(id) {
    return api.urlPdfNotaFiscal(id);
  },
};
