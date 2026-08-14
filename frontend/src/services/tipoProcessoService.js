// frontend/src/services/tipoProcessoService.js
import { api } from './api';

export const tipoProcessoService = {
  async listar() {
    return api.getTiposProcesso();
  },

  async atualizar(tipoProcesso, etapas, usuarioLogado) {
    return api.atualizarTipoProcesso(tipoProcesso, etapas, usuarioLogado);
  },
};
