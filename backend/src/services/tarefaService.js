import { prisma } from '../prisma.js';

async function listar({ setor, servicoId, status } = {}) {
  return prisma.tarefa.findMany({
    where: {
      ...(setor ? { setor } : {}),
      ...(servicoId ? { servicoId } : {}),
      ...(status ? { status } : {}),
    },
    include: { servico: { select: { numeroServico: true, nomeCliente: true, caminhoPasta: true } } },
    orderBy: { ordem: 'asc' },
  });
}

async function criar(dados) {
  if (!dados.titulo) throw new Error('Título é obrigatório.');
  if (!dados.setor) throw new Error('Setor responsável é obrigatório.');

  return prisma.tarefa.create({
    data: {
      titulo: dados.titulo,
      descricao: dados.descricao || null,
      setor: dados.setor,
      prioridade: dados.prioridade || 'MEDIA',
      servicoId: dados.servicoId || null,
      prazo: dados.prazo ? new Date(dados.prazo) : null,
      observacoes: dados.observacoes || null,
      linkPasta: dados.linkPasta || null,
      criadoPor: dados.criadoPor || null,
    },
    include: { servico: { select: { numeroServico: true, nomeCliente: true, caminhoPasta: true } } },
  });
}

async function atualizarObservacao(id, observacoes) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id } });
  if (!tarefa) throw new Error('Tarefa não encontrada.');

  return prisma.tarefa.update({
    where: { id },
    data: { observacoes: observacoes ?? null },
    include: { servico: { select: { numeroServico: true, nomeCliente: true, caminhoPasta: true } } },
  });
}

async function concluir(id, setorQuemConcluiu) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id } });
  if (!tarefa) throw new Error('Tarefa não encontrada.');
  if (tarefa.status === 'CONCLUIDA') throw new Error('Essa tarefa já está concluída.');

  return prisma.tarefa.update({
    where: { id },
    // Concluir a partir de AGUARDO é permitido (o que faltava chegou) — o
    // motivo perde sentido depois de concluída, então some junto.
    data: {
      status: 'CONCLUIDA', concluidoPor: setorQuemConcluiu || null, concluido_em: new Date(),
      motivoAguardo: null,
    },
    include: { servico: { select: { numeroServico: true, nomeCliente: true, caminhoPasta: true } } },
  });
}

// Cobre o caso de ter marcado como concluída por engano.
async function reabrir(id) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id } });
  if (!tarefa) throw new Error('Tarefa não encontrada.');

  return prisma.tarefa.update({
    where: { id },
    data: { status: 'PENDENTE', concluidoPor: null, concluido_em: null },
    include: { servico: { select: { numeroServico: true, nomeCliente: true, caminhoPasta: true } } },
  });
}

// Pausa a tarefa quando falta algo (documento, resposta do cliente etc.) pra
// concluir — motivo é opcional, mas é o que dá sentido ao "aguardo" na tabela.
async function colocarEmAguardo(id, motivo) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id } });
  if (!tarefa) throw new Error('Tarefa não encontrada.');
  if (tarefa.status === 'CONCLUIDA') throw new Error('Essa tarefa já está concluída.');

  return prisma.tarefa.update({
    where: { id },
    data: { status: 'AGUARDO', motivoAguardo: motivo || null },
    include: { servico: { select: { numeroServico: true, nomeCliente: true, caminhoPasta: true } } },
  });
}

// Volta a tarefa de AGUARDO pra PENDENTE (o que faltava foi resolvido).
async function retomar(id) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id } });
  if (!tarefa) throw new Error('Tarefa não encontrada.');

  return prisma.tarefa.update({
    where: { id },
    data: { status: 'PENDENTE', motivoAguardo: null },
    include: { servico: { select: { numeroServico: true, nomeCliente: true, caminhoPasta: true } } },
  });
}

async function reordenar(ids) {
  if (!Array.isArray(ids)) throw new Error('Lista de ids inválida.');

  for (let i = 0; i < ids.length; i++) {
    await prisma.tarefa.update({ where: { id: ids[i] }, data: { ordem: i } });
  }
}

async function excluir(id) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id } });
  if (!tarefa) throw new Error('Tarefa não encontrada.');
  await prisma.tarefa.delete({ where: { id } });
}

export const tarefaService = { listar, criar, atualizarObservacao, concluir, reabrir, colocarEmAguardo, retomar, excluir, reordenar };
