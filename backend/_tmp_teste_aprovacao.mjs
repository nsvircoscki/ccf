import { prisma } from './src/prisma.js';
import { servicoService } from './src/services/servicoService.js';

const servico = await prisma.servico.create({
  data: {
    numeroServico: `TESTE-APROV-${Date.now()}`,
    nomeCliente: 'TESTE Aprovacao Kanban',
    tipoCliente: 'Padrão',
    municipio: 'São Bento do Sul',
    terreno: 'Urbano',
  },
});

await servicoService.salvarOrcamento(servico.id, {
  itens: [
    { nome: 'Ret', indice: 1, valor: 1000, selecionado: true },
    { nome: 'Desm', indice: 1, valor: 1000, selecionado: false },
  ],
  valorTotal: 1000,
});

try {
  const resultado = await servicoService.decidirOrcamento(servico.id, 'APROVADO');
  console.log('RESULTADO:', JSON.stringify({ message: resultado.message, projetos: resultado.projetos.map(p => p.name) }, null, 2));
} catch (erro) {
  console.error('ERRO AO APROVAR:', erro.message);
}

// limpeza
const workflows = await prisma.workflow.findMany({ where: { servicoId: servico.id } });
for (const w of workflows) {
  await prisma.ticket.deleteMany({ where: { workflowId: w.id } });
  await prisma.workflowStep.deleteMany({ where: { workflowId: w.id } });
  await prisma.workflow.delete({ where: { id: w.id } });
}
await prisma.orcamentoItem.deleteMany({ where: { servicoId: servico.id } });
await prisma.servico.delete({ where: { id: servico.id } });
console.log('Limpeza concluída.');

await prisma.$disconnect();
