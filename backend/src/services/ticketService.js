// src/services/ticketService.js
import { prisma } from '../prisma.js';

export const ticketService = {
  async listarTodos() {
    return prisma.ticket.findMany({
      include: { 
        workflow: true,
        currentStep: { include: { requiredRole: true } },
        history: { include: { user: true, fromStep: true, toStep: true }, orderBy: { action_timestamp: 'desc' } },
        comments: { include: { user: true }, orderBy: { created_at: 'desc' } }
      },
      orderBy: { created_at: 'desc' } 
    });
  },

  async adicionarComentario(ticketId, userId, text) {
    const role = await prisma.role.findUnique({ where: { name: userId } });
    const user = await prisma.user.findFirst({ where: { roleId: role.id } });

    return prisma.comment.create({
      data: { text, ticketId, userId: user.id },
      include: { user: true }
    });
  },

  async moverTicket(ticketId, toStepId, userId) {
    const role = await prisma.role.findUnique({ where: { name: userId } });
    const user = await prisma.user.findFirst({ where: { roleId: role.id } });
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

    const [updatedTicket] = await prisma.$transaction([
      prisma.ticket.update({ where: { id: ticketId }, data: { currentStepId: toStepId } }),
      prisma.ticketHistory.create({
        data: { ticketId, fromStepId: ticket.currentStepId, toStepId, userId: user.id }
      })
    ]);
    return updatedTicket;
  },

  async excluirTicket(ticketId) {
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { ticketId } }),
      prisma.ticketHistory.deleteMany({ where: { ticketId } }),
      prisma.ticket.delete({ where: { id: ticketId } })
    ]);
  }
};