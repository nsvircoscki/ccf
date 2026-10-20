import { prisma } from '../src/prisma.js';

const ETAPAS_DANC = [
  { nome: "Aprovação do Orçamento", setor: "ENG", ordem: 1 },
  { nome: "Recebimento Taxas", setor: "CRD", ordem: 2 },
  { nome: "Faturamento", setor: "DES", ordem: 3 },
  { nome: "Croqui", setor: "TOPO", ordem: 4 },
  { nome: "Pré-projeto", setor: "DES", ordem: 5 },
  { nome: "Conferência Pré-Projeto", setor: "CRD", ordem: 6 },
  { nome: "Execução do Projeto", setor: "DES", ordem: 7 },
  { nome: "Conferência Projeto", setor: "CRD", ordem: 8 },
  { nome: "Revisão Processo", setor: "ENG", ordem: 9 },
  { nome: "ART / Assinatura Digital", setor: "CRD", ordem: 10 },
  { nome: "Orgãos Governamentais", setor: "DES", ordem: 11 },
  { nome: "Entrega do Serviço", setor: "CRD", ordem: 12 },
];

async function main() {
  console.log('Atualizando etapas de Danc e Relatório de Usucapião...');

  // 1. DANC
  await prisma.tipoProcessoEtapa.deleteMany({ where: { tipoProcesso: 'Danc' } });
  for (const item of ETAPAS_DANC) {
    await prisma.tipoProcessoEtapa.upsert({
      where: { tipoProcesso_nome: { tipoProcesso: 'DANC', nome: item.nome } },
      update: { setor: item.setor, ordem: item.ordem },
      create: { tipoProcesso: 'DANC', nome: item.nome, setor: item.setor, ordem: item.ordem },
    });
  }

  // 2. Relatório de Usucapião (copia de Outros ou Cadastral)
  const etapasOutros = await prisma.tipoProcessoEtapa.findMany({
    where: { tipoProcesso: 'Outros' },
    orderBy: { ordem: 'asc' },
  });

  const fonte = etapasOutros.length > 0 ? etapasOutros : await prisma.tipoProcessoEtapa.findMany({
    where: { tipoProcesso: 'Cadastral' },
    orderBy: { ordem: 'asc' },
  });

  for (const item of fonte) {
    await prisma.tipoProcessoEtapa.upsert({
      where: { tipoProcesso_nome: { tipoProcesso: 'Relatório de Usucapião', nome: item.nome } },
      update: { setor: item.setor, ordem: item.ordem },
      create: { tipoProcesso: 'Relatório de Usucapião', nome: item.nome, setor: item.setor, ordem: item.ordem },
    });
  }

  console.log('Etapas atualizadas com sucesso no banco de dados!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Erro ao atualizar etapas:', err);
  process.exit(1);
});

