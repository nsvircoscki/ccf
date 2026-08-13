import { api } from './api';

export const authService = {
  async login(usuario, senha) {
    return api.login(usuario, senha);
  },

  async criarSenha(usuario, novaSenha) {
    return api.criarSenha(usuario, novaSenha);
  },

  async alterarSenha(usuario, senhaAtual, novaSenha) {
    return api.alterarSenha(usuario, senhaAtual, novaSenha);
  },
};
