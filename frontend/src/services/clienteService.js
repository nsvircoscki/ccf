// frontend/src/services/clienteService.js
import { api } from './api';

export const clienteService = {
  async listarTodos() {
    return api.getClientes();
  },

  async buscarPorId(id) {
    return api.getClienteById(id);
  },

  async cadastrar(dadosCliente) {
    return api.createCliente(dadosCliente);
  },

  async atualizar(id, dadosCliente) {
    return api.updateCliente(id, dadosCliente);
  },

  async remover(id) {
    return api.deleteCliente(id);
  }
};
