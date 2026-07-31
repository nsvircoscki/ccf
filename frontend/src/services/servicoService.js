// frontend/src/services/servicoService.js
import { api } from './api'; // <-- Agora com chaves, respeitando o seu export!

export const servicoService = {
  async listarTodos() {
    return api.getServicos();
  },

  async cadastrar(dadosServico) {
    return api.createServico(dadosServico);
  },

  async aprovarOrcamento(servicoId) {
    return api.aprovarOrcamento(servicoId);
  },

  async buscarPorId(servicoId) {
    return api.getServicoById(servicoId);
  }
};