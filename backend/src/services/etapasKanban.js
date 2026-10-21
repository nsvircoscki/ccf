// src/services/etapasKanban.js
// Andamento automático das etapas de um projeto no Kanban:
//  - A iniciar: aguardando a conclusão da etapa anterior;
//  - Em andamento: a anterior foi concluída — a etapa entra sozinha aqui e o
//    setor responsável é notificado;
//  - Concluído: concluída.
// Cada etapa (Ticket) anda entre os três passos (WorkflowStep) do SEU setor;
// a ordem do processo é Ticket.sequence.

// Passo do mesmo projeto e do mesmo setor do cartão, na coluna pedida.
function passoDaColuna(tx, ticket, coluna) {
  return tx.workflowStep.findFirst({
    where: { workflowId: ticket.workflowId, requiredRoleId: ticket.currentStep.requiredRoleId, step_name: coluna },
  });
}

// userId: quem disparou (fica no histórico do cartão). Sem userId (criação do
// projeto sem pessoa), move sem registrar histórico.
async function moverParaColuna(tx, ticket, coluna, userId) {
  const destino = await passoDaColuna(tx, ticket, coluna);
  if (!destino || destino.id === ticket.currentStepId) return null;
  await tx.ticket.update({ where: { id: ticket.id }, data: { currentStepId: destino.id } });
  if (userId) {
    await tx.ticketHistory.create({ data: { ticketId: ticket.id, fromStepId: ticket.currentStepId, toStepId: destino.id, userId } });
  }
  return destino;
}

function notificarEmAndamento(tx, ticket, mensagem) {
  return tx.notification.create({
    data: { mensagem, roleId: ticket.currentStep.requiredRoleId, ticketId: ticket.id, workflowId: ticket.workflowId },
  });
}

const comPasso = { currentStep: true, workflow: { select: { name: true } } };

// Uma etapa acabou de ser concluída: a próxima da sequência que ainda está
// "A iniciar" entra em andamento e o setor dela é avisado.
export async function iniciarProximaEtapa(tx, ticketConcluido, userId) {
  const proximo = await tx.ticket.findFirst({
    where: { workflowId: ticketConcluido.workflowId, sequence: { gt: ticketConcluido.sequence }, currentStep: { step_name: 'Iniciar' } },
    orderBy: { sequence: 'asc' },
    include: comPasso,
  });
  if (!proximo) return null;
  await moverParaColuna(tx, proximo, 'Em Andamento', userId);
  await notificarEmAndamento(tx, proximo, `"${proximo.title}" entrou em andamento em "${proximo.workflow.name}" (etapa anterior concluída).`);
  return proximo;
}

// Projeto recém-criado: as etapas já resolvidas (ex.: "Aprovação do
// Orçamento", quando o projeto nasce da aprovação) entram concluídas, e a
// primeira etapa que sobra já começa em andamento, com aviso ao setor.
export async function prepararProjetoNovo(tx, workflowId, { etapasConcluidas = [], quemId = null } = {}) {
  const tickets = await tx.ticket.findMany({ where: { workflowId }, orderBy: { sequence: 'asc' }, include: comPasso });
  for (const ticket of tickets.filter((t) => etapasConcluidas.includes(t.title))) {
    await moverParaColuna(tx, ticket, 'Concluído', quemId);
  }
  const primeira = tickets.find((t) => !etapasConcluidas.includes(t.title));
  if (!primeira) return;
  await moverParaColuna(tx, primeira, 'Em Andamento', quemId);
  await notificarEmAndamento(tx, primeira, `"${primeira.title}" já está em andamento em "${primeira.workflow.name}".`);
}
