import { api, definirToken, aoExpirarSessao, temToken } from './api';

export const authService = {
  async login(login, senha) {
    return api.login(login, senha);
  },

  async criarSenha(login, novaSenha) {
    return api.criarSenha(login, novaSenha);
  },

  // A senha trocada é sempre a de quem está logado (o backend lê do token).
  async alterarSenha(senhaAtual, novaSenha) {
    return api.alterarSenha(senhaAtual, novaSenha);
  },

  async sessaoAtual() {
    return api.getSessao();
  },

  definirToken,
  aoExpirarSessao,
  temToken,
};
