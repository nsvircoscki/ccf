// frontend/src/services/usuarioService.js
import { api } from './api';

export const usuarioService = {
  async listar() {
    return api.getUsuarios();
  },
  async listarSetores() {
    return api.getSetores();
  },
  async criar(dados) {
    return api.criarUsuario(dados);
  },
  async atualizar(id, dados) {
    return api.atualizarUsuario(id, dados);
  },
  async definirSenha(id, novaSenha) {
    return api.definirSenhaUsuario(id, novaSenha);
  },
};
