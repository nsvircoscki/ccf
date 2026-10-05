// src/services/ticketService.js
import { prisma } from '../prisma.js';
import { notificationService } from './notificationService.js';

// Erro com status: a mensagem pode ir para a tela (as do Prisma não vão).
function erroComStatus(status, mensagem) {
  return Object.assign(new Error(mensagem), { status });
}

// Mesma regra do quadro (KanbanView, temPermissao): só o setor dono da etapa
// atual do cartão — ou ENG/DEV — move ou exclui. Cartão sem etapa com setor
// definido conta como do CRD, igual à tela.
async function cartaoComPermissao(ticketId, quem) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: String(ticketId) },
    include: { currentStep: { include: { requiredRole: true } } },
  });
  if (!ticket) throw erroComStatus(404, 'Tarefa não encontrada.');
  const dono = ticket.currentStep?.requiredRole?.name || 'CRD';
  if (!['ENG', 'DEV'].includes(quem?.setor) && dono !== quem?.setor) throw erroComStatus(403, 'Sem permissão para mexer nesta tarefa.');
  return ticket;
}

export const ticketService = {
  async listarTodos() {
    return prisma.ticket.findMany({
      include: {
        workflow: { include: { servico: { select: { nomeCliente: true } } } },
        currentStep: { include: { requiredRole: true } },
        history: { include: { user: true, fromStep: true, toStep: true }, orderBy: { action_timestamp: 'desc' } },
        comments: { include: { user: true }, orderBy: { created_at: 'desc' } }
      },
      orderBy: { created_at: 'desc' }
    });
  },

  async criarTicket({ title, description, workflowId, currentStepId }) {
    if (!title || !title.trim()) throw new Error("Informe o título da tarefa.");
    if (!workflowId || !currentStepId) throw new Error("Projeto e etapa são obrigatórios.");

    return prisma.ticket.create({
      data: { title: title.trim(), description: description || null, workflowId, currentStepId },
      include: {
        workflow: true,
        currentStep: { include: { requiredRole: true } },
        history: { include: { user: true, fromStep: true, toStep: true } },
        comments: { include: { user: true } }
      }
    });
  },

  async atualizarTicket(ticketId, { description }) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: { description }
    });
  },

  // userId é o id do User logado (pessoa), vindo da sessão — antes era o nome
  // do setor, resolvido pro usuário genérico dele ("Equipe Desenho").
  async adicionarComentario(ticketId, userId, text) {
    return prisma.comment.create({
      data: { text, ticketId, userId },
      include: { user: true }
    });
  },

  async moverTicket(ticketId, toStepId, quem) {
    const ticket = await cartaoComPermissao(ticketId, quem);
    const toStep = await prisma.workflowStep.findUnique({ where: { id: String(toStepId) } });
    // A etapa de destino precisa ser do mesmo projeto do cartão.
    if (!toStep || toStep.workflowId !== ticket.workflowId) throw erroComStatus(400, 'Etapa de destino inválida.');
    const userId = quem.id;

    return prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({ where: { id: ticketId }, data: { currentStepId: toStepId } });
      await tx.ticketHistory.create({
        data: { ticketId, fromStepId: ticket.currentStepId, toStepId, userId }
      });

      if (toStep.step_name === 'Concluído') {
        await notificationService.notificarProximaEtapa(ticket, tx);
      }

      return updatedTicket;
    });
  },

  async excluirTicket(ticketId, quem) {
    await cartaoComPermissao(ticketId, quem);
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { ticketId } }),
      prisma.ticketHistory.deleteMany({ where: { ticketId } }),
      prisma.ticket.delete({ where: { id: ticketId } })
    ]);
  }
};