// Cria um Serviço "ponte" para cada Workflow antigo (de quando o sistema só
// controlava etapas, sem Cadastro de Serviço) que ainda não tem servicoId —
// sem isso, o SIS DOC não lista esses projetos, porque ele busca em cima da
// tabela Servico, não de Workflow. Idempotente: só mexe em quem tem
// servicoId nulo, então rodar de novo depois não duplica nada.
import { prisma } from '../src/prisma.js';

const MUNICIPIO_PADRAO = 'São Bento do Sul';

// Nomes antigos seguem "AAAA-NNN-Nome do Cliente" (às vezes com um número de
// processo extra, ex.: "2024-032-1-Vitor Michalowicz", quando o mesmo serviço
// tinha mais de um tipo solicitado — cada tipo virou um Workflow separado).
// Agrupa por "AAAA-NNN" pra reunir esses num Serviço só, do jeito que o
// sistema novo já faz (um Serviço -> vários Workflows, um por tipo aprovado).
function extrairChave(nome, idFallback) {
  const m = nome?.match(/^(\d{4})-(\d+)/);
  return m ? `${m[1]}-${m[2]}` : `SEMPADRAO-${idFallback.slice(0, 8)}`;
}

function extrairNomeCliente(nome) {
  return (nome || '')
    .replace(/^\d{4}-\d+-?/, '') // tira o prefixo "AAAA-NNN-"
    .replace(/^\d+-/, '')        // tira um número de processo extra, ex.: "1-"
    .trim() || 'Cliente não identificado';
}

async function main() {
  const workflows = await prisma.workflow.findMany({
    where: { servicoId: null },
    select: { id: true, name: true, description: true, matricula: true, terreno: true },
    orderBy: { created_at: 'asc' },
  });

  if (workflows.length === 0) {
    console.log('Nenhum projeto antigo sem Serviço vinculado. Nada a fazer.');
    return;
  }

  const grupos = new Map();
  for (const w of workflows) {
    const chave = extrairChave(w.name, w.id);
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(w);
  }

  console.log(`${workflows.length} projeto(s) antigo(s) em ${grupos.size} serviço(s) a criar.`);

  let criados = 0;
  for (const [chave, membros] of grupos) {
    // O nome mais longo tende a ser o mais completo/menos abreviado.
    const nomeCliente = membros
      .map((w) => extrairNomeCliente(w.name))
      .sort((a, b) => b.length - a.length)[0];

    const tiposSolicitados = [...new Set(
      membros.flatMap((w) => (w.description || '').split(',').map((t) => t.trim()).filter(Boolean))
    )];

    const matricula = membros.find((w) => w.matricula)?.matricula || null;
    const terreno = membros.find((w) => w.terreno)?.terreno || 'Urbano';
    const numeroServico = `LEG-${chave}`;

    await prisma.$transaction(async (tx) => {
      const servico = await tx.servico.create({
        data: {
          numeroServico,
          nomeCliente,
          tipoCliente: 'Padrão',
          matricula,
          terreno,
          municipio: MUNICIPIO_PADRAO,
          tiposSolicitados,
          statusOrcamento: 'APROVADO',
          notas: 'Serviço criado automaticamente para vincular projeto(s) antigo(s) ao SIS DOC.',
        },
      });

      await tx.workflow.updateMany({
        where: { id: { in: membros.map((w) => w.id) } },
        data: { servicoId: servico.id },
      });
    });

    criados += 1;
  }

  console.log(`${criados} serviço(s) criado(s) e vinculado(s) com sucesso.`);
}

main()
  .catch((erro) => {
    console.error('Falha no backfill:', erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
