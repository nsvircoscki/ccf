// scripts/ativarEtapasEmAndamento.js
// O Kanban passou a andar sozinho: ao concluir uma etapa, a próxima entra em
// "Em andamento" (ver src/services/etapasKanban.js). Os projetos criados antes
// disso podem estar sem nenhuma etapa em andamento. Este script, para cada
// projeto ATIVO nessa situação, coloca em andamento a primeira etapa (pela
// sequência) que ainda está "A iniciar". Não envia notificações.
//
// Uso (na pasta backend):
//   node scripts/ativarEtapasEmAndamento.js            -> só mostra o que mudaria
//   node scripts/ativarEtapasEmAndamento.js --aplicar  -> grava
import { prisma } from '../src/prisma.js';

const aplicar = process.argv.includes('--aplicar');

async function main() {
  const projetos = await prisma.workflow.findMany({
    where: { status: 'ATIVO' },
    include: { tickets: { include: { currentStep: true }, orderBy: { sequence: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  let mudancas = 0;
  for (const projeto of projetos) {
    if (projeto.tickets.some((t) => t.currentStep.step_name === 'Em Andamento')) continue;
    const proxima = projeto.tickets.find((t) => t.currentStep.step_name === 'Iniciar');
    if (!proxima) continue;
    const destino = await prisma.workflowStep.findFirst({
      where: { workflowId: projeto.id, requiredRoleId: proxima.currentStep.requiredRoleId, step_name: 'Em Andamento' },
    });
    if (!destino) continue;
    mudancas += 1;
    console.log(`${projeto.name}: "${proxima.title}" -> Em andamento`);
    if (aplicar) await prisma.ticket.update({ where: { id: proxima.id }, data: { currentStepId: destino.id } });
  }
  console.log(aplicar ? `\n${mudancas} projeto(s) ajustado(s).` : `\n${mudancas} projeto(s) seriam ajustados. Rode com --aplicar para gravar.`);
}

main().catch((erro) => { console.error(erro); process.exitCode = 1; }).finally(() => prisma.$disconnect());
