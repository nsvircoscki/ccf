// Insere as etapas do tipo "Altimetria" na tabela TipoProcessoEtapa, copiando
// as de "Locação" — é o tipo topográfico mais próximo (levantamento →
// processamento → croqui → pré-projeto → projeto → entrega). Depois de rodar,
// dá pra ajustar as etapas pela tela de Configuração de Etapas (usuário ENG).
//
// O seedTiposProcesso.mjs só roda em banco vazio, então bancos que já têm dados
// (local e produção) precisam deste script.
//
// Uso, dentro de backend/: node scripts/addAltimetria.mjs
import { prisma } from '../src/prisma.js';

const TIPO = 'Altimetria';
const TIPO_MODELO = 'Locação';

async function main() {
  const existentes = await prisma.tipoProcessoEtapa.count({ where: { tipoProcesso: TIPO } });
  if (existentes > 0) {
    console.log(`"${TIPO}" já tem ${existentes} etapa(s) — nada a fazer.`);
    return;
  }

  const modelo = await prisma.tipoProcessoEtapa.findMany({
    where: { tipoProcesso: TIPO_MODELO },
    orderBy: { ordem: 'asc' },
  });

  if (modelo.length === 0) {
    console.error(`"${TIPO_MODELO}" não tem etapas cadastradas — rode scripts/seedTiposProcesso.mjs antes.`);
    process.exit(1);
  }

  await prisma.tipoProcessoEtapa.createMany({
    data: modelo.map((e) => ({ tipoProcesso: TIPO, nome: e.nome, setor: e.setor, ordem: e.ordem })),
  });

  console.log(`✅ Inseridas ${modelo.length} etapas para "${TIPO}" (copiadas de "${TIPO_MODELO}").`);
}

main()
  .catch((erro) => { console.error(erro); process.exit(1); })
  .finally(() => prisma.$disconnect());
