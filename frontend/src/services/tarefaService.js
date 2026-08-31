// frontend/src/services/tarefaService.js
import { api } from './api';

export const tarefaService = {
  async listar(filtros) {
    return api.getTarefas(filtros);
  },
  async criar(dados) {
    return api.criarTarefa(dados);
  },
  async concluir(id, setor) {
    return api.concluirTarefa(id, setor);
  },
  async reabrir(id) {
    return api.reabrirTarefa(id);
  },
  async excluir(id) {
    return api.excluirTarefa(id);
  },
  async atualizarObservacao(id, observacoes) {
    return api.atualizarObservacaoTarefa(id, observacoes);
  },
};
