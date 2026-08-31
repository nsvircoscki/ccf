import { prisma } from '../prisma.js';

async function listar({ setor, servicoId, status } = {}) {
  return prisma.tarefa.findMany({
    where: {
      ...(setor ? { setor } : {}),
      ...(servicoId ? { servicoId } : {}),
      ...(status ? { status } : {}),
    },
    include: { servico: { select: { numeroServico: true, nomeCliente: true } } },
    orderBy: { created_at: 'desc' },
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
      linkPasta: dados.linkPasta || null,
      criadoPor: dados.criadoPor || null,
    },
    include: { servico: { select: { numeroServico: true, nomeCliente: true } } },
  });
}

async function concluir(id, setorQuemConcluiu) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id } });
  if (!tarefa) throw new Error('Tarefa não encontrada.');
  if (tarefa.status === 'CONCLUIDA') throw new Error('Essa tarefa já está concluída.');

  return prisma.tarefa.update({
    where: { id },
    data: { status: 'CONCLUIDA', concluidoPor: setorQuemConcluiu || null, concluido_em: new Date() },
    include: { servico: { select: { numeroServico: true, nomeCliente: true } } },
  });
}

// Cobre o caso de ter marcado como concluída por engano.
async function reabrir(id) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id } });
  if (!tarefa) throw new Error('Tarefa não encontrada.');

  return prisma.tarefa.update({
    where: { id },
    data: { status: 'PENDENTE', concluidoPor: null, concluido_em: null },
    include: { servico: { select: { numeroServico: true, nomeCliente: true } } },
  });
}

async function excluir(id) {
  const tarefa = await prisma.tarefa.findUnique({ where: { id } });
  if (!tarefa) throw new Error('Tarefa não encontrada.');
  await prisma.tarefa.delete({ where: { id } });
}

export const tarefaService = { listar, criar, concluir, reabrir, excluir };
