// src/services/notificationService.js
import { prisma } from '../prisma.js';

// O ponto não usa o sininho: os avisos dele ficam nos contadores das próprias
// abas do SIS Ponto. Notificações antigas do ponto continuam no banco, mas
// ficam de fora da lista e da contagem.
const SEM_PONTO = { NOT: { tipo: { startsWith: 'sis-ponto' } } };

export const notificationService = {
  async listarPorSetor(nomeSetor) {
    const role = await prisma.role.findUnique({ where: { name: nomeSetor } });
    if (!role) return [];
    return prisma.notification.findMany({
      where: { roleId: role.id, ...SEM_PONTO },
      orderBy: { created_at: 'desc' },
      take: 30,
    });
  },

  async contarNaoLidas(nomeSetor) {
    const role = await prisma.role.findUnique({ where: { name: nomeSetor } });
    if (!role) return 0;
    return prisma.notification.count({ where: { roleId: role.id, lida: false, ...SEM_PONTO } });
  },

  async marcarComoLida(id) {
    return prisma.notification.update({ where: { id }, data: { lida: true } });
  },

  async excluir(id) {
    return prisma.notification.delete({ where: { id } });
  },

  async marcarTodasComoLidas(nomeSetor) {
    const role = await prisma.role.findUnique({ where: { name: nomeSetor } });
    if (!role) return;
    await prisma.notification.updateMany({ where: { roleId: role.id, lida: false, ...SEM_PONTO }, data: { lida: true } });
  },

  // Notificação avulsa (fora do fluxo de ticket/workflow).
  async notificarSetor(nomeSetor, mensagem, tipo = 'kanban') {
    const role = await prisma.role.findUnique({ where: { name: nomeSetor } });
    if (!role) return;
    await prisma.notification.create({ data: { mensagem, roleId: role.id, tipo } });
  },

  // Chamado quando um ticket entra em "Concluído": acha a próxima etapa na
  // sequência do mesmo projeto que já está pronta pra começar (ainda em
  // "Iniciar") e avisa o setor responsável por ela.
  async notificarProximaEtapa(ticketConcluido, tx = prisma) {
    const proximoTicket = await tx.ticket.findFirst({
      where: { workflowId: ticketConcluido.workflowId, sequence: { gt: ticketConcluido.sequence } },
      orderBy: { sequence: 'asc' },
      include: { currentStep: { include: { requiredRole: true } }, workflow: true },
    });
    if (!proximoTicket || proximoTicket.currentStep.step_name !== 'Iniciar') return;

    await tx.notification.create({
      data: {
        mensagem: `"${proximoTicket.title}" já pode começar em "${proximoTicket.workflow.name}".`,
        roleId: proximoTicket.currentStep.requiredRoleId,
        ticketId: proximoTicket.id,
        workflowId: proximoTicket.workflowId,
      },
    });
  },

  // Chamado na criação do projeto: avisa o setor responsável pela primeira
  // etapa do processo (sequence mais baixa) que já pode começar.
  async notificarPrimeiraEtapa(workflowId, tx = prisma) {
    const primeiroTicket = await tx.ticket.findFirst({
      where: { workflowId },
      orderBy: { sequence: 'asc' },
      include: { currentStep: { include: { requiredRole: true } }, workflow: true },
    });
    if (!primeiroTicket) return;

    await tx.notification.create({
      data: {
        mensagem: `"${primeiroTicket.title}" já pode começar em "${primeiroTicket.workflow.name}".`,
        roleId: primeiroTicket.currentStep.requiredRoleId,
        ticketId: primeiroTicket.id,
        workflowId: primeiroTicket.workflowId,
      },
    });
  },
};
