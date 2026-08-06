// frontend/src/services/confrontanteService.js
import { api } from './api';

export const confrontanteService = {
  async listarTodos() {
    return api.getConfrontantes();
  },

  async buscarPorId(id) {
    return api.getConfrontanteById(id);
  },

  async cadastrar(dadosConfrontante) {
    return api.createConfrontante(dadosConfrontante);
  },

  async atualizar(id, dadosConfrontante) {
    return api.updateConfrontante(id, dadosConfrontante);
  },

  async remover(id) {
    return api.deleteConfrontante(id);
  }
};
