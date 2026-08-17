// Renomeia os setores/roles existentes de nome por extenso pra sigla —
// Charles -> ENG, Desenho -> DES, Coordenação -> CRD, Topografia -> TOPO.
// Atualiza tanto a tabela Role (identidade de login) quanto o campo "setor"
// de TipoProcessoEtapa — os dois PRECISAM ficar em sincronia, já que
// workflowService casa o "setor" salvo ali com o Role.name na hora de
// fabricar/editar um projeto (ver buscarCatalogo/fabricarProjeto).
// Idempotente: rodar de novo não faz nada, porque na segunda vez os nomes
// antigos já não existem mais pra dar match no "where".
//
// Uso: node scripts/renomearSetores.mjs
import { prisma } from '../src/prisma.js';

const RENOMEACOES = {
  Charles: 'ENG',
  Desenho: 'DES',
  Coordenação: 'CRD',
  Topografia: 'TOPO',
};

async function main() {
  for (const [de, para] of Object.entries(RENOMEACOES)) {
    const role = await prisma.role.updateMany({ where: { name: de }, data: { name: para } });
    const etapas = await prisma.tipoProcessoEtapa.updateMany({ where: { setor: de }, data: { setor: para } });
    console.log(`${de} -> ${para}: ${role.count} role(s), ${etapas.count} etapa(s) de catálogo.`);
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
