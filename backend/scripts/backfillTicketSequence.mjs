// Preenche o campo Ticket.sequence (recém-adicionado) para os projetos que já
// existiam antes dele — sem isso, os cartões desses projetos continuariam
// aparecendo fora de ordem no Kanban mesmo com o front-end corrigido, já que
// todos nasceram com sequence = 0 (valor padrão da migração).
//
// A ordem correta vem do catálogo de etapas (TipoProcessoEtapa) combinado com
// o(s) tipo(s) de processo do workflow (workflow.description) e o terreno —
// a mesma lógica usada em fabricarProjeto() pra montar a lista de tarefas na
// hora de criar o projeto. Ticket com título que não bate com o catálogo
// atual (nome antigo/customizado via "+ Adicionar Cartão") não é perdido —
// só fica no final, na ordem em que foi criado.
//
// Uso: node scripts/backfillTicketSequence.mjs
import { prisma } from '../src/prisma.js';

async function buscarCatalogo() {
  const linhas = await prisma.tipoProcessoEtapa.findMany({ orderBy: { ordem: 'asc' } });
  const catalogo = {};
  for (const linha of linhas) {
    (catalogo[linha.tipoProcesso] ??= []).push(linha.nome);
  }
  return catalogo;
}

function montarListaOrdenada(catalogo, types, terreno) {
  const tarefasUnicas = new Set();
  types.forEach((type) => {
    const lista = catalogo[type];
    if (lista) lista.forEach((tarefa) => tarefasUnicas.add(tarefa));
  });
  const lista = Array.from(tarefasUnicas);

  if (terreno === 'Rural') {
    lista.push('Pré-aprovação no Sigef');
  }
  if (terreno === 'Urbano') {
    const indexRI = lista.indexOf('Processo RI');
    if (indexRI !== -1) {
      lista.splice(indexRI + 1, 0, 'Atualização IPTU');
    } else {
      lista.push('Atualização IPTU');
    }
  }
  return lista;
}

async function main() {
  const catalogo = await buscarCatalogo();
  const workflows = await prisma.workflow.findMany({
    include: { tickets: { orderBy: { created_at: 'asc' } } },
  });

  let atualizados = 0;
  for (const workflow of workflows) {
    const types = (workflow.description || '').split(', ').map((t) => t.trim()).filter(Boolean);
    const listaOrdenada = montarListaOrdenada(catalogo, types, workflow.terreno);
    const sequenceMap = new Map(listaOrdenada.map((nome, index) => [nome, index]));

    let proximoIndiceExtra = listaOrdenada.length;
    for (const ticket of workflow.tickets) {
      const sequence = sequenceMap.has(ticket.title) ? sequenceMap.get(ticket.title) : proximoIndiceExtra++;
      if (ticket.sequence !== sequence) {
        await prisma.ticket.update({ where: { id: ticket.id }, data: { sequence } });
        atualizados++;
      }
    }
  }

  console.log(`Sequência corrigida em ${atualizados} ticket(s), em ${workflows.length} projeto(s).`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
