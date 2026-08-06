// frontend/src/services/imovelService.js
import { api } from './api';

export const imovelService = {
  async listarTodos() {
    return api.getImoveis();
  },

  async buscarPorId(id) {
    return api.getImovelById(id);
  },

  async cadastrar(dadosImovel) {
    return api.createImovel(dadosImovel);
  },

  async atualizar(id, dadosImovel) {
    return api.updateImovel(id, dadosImovel);
  },

  async remover(id) {
    return api.deleteImovel(id);
  }
};
