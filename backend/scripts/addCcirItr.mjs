// Insere as etapas padrão do tipo CCIR/ITR na tabela TipoProcessoEtapa.
// Uso: node scripts/addCcirItr.mjs
import { prisma } from '../src/prisma.js';

const TIPO = 'CCIR/ITR';

const ETAPAS = [
  { nome: 'Aprovação do Orçamento', setor: 'ENG' },
  { nome: 'Solicitação de Documentos',  setor: 'CRD' },
  { nome: 'Recebimento Taxas',          setor: 'CRD' },
  { nome: 'Execução do Projeto',        setor: 'DES' },
  { nome: 'Entrega do Serviço',         setor: 'CRD' },
];

async function main() {
  const existentes = await prisma.tipoProcessoEtapa.count({ where: { tipoProcesso: TIPO } });

  if (existentes > 0) {
    console.log(`"${TIPO}" já tem ${existentes} etapa(s) — nada a fazer.`);
    await prisma.$disconnect();
    return;
  }

  await prisma.tipoProcessoEtapa.createMany({
    data: ETAPAS.map((e, i) => ({ tipoProcesso: TIPO, nome: e.nome, setor: e.setor, ordem: i + 1 })),
  });

  console.log(`✅ Inseridas ${ETAPAS.length} etapas para "${TIPO}".`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

