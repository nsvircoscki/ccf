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
  },

  async buscarCartorioPorCns(cns) {
    return api.buscarCartorioPorCns(cns);
  },

  async extrairDescricaoDaMatricula(arquivo) {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(arquivo);
    });
    return api.extrairDescricaoImovel({ base64, mimeType: arquivo.type });
  },
};
