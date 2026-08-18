// src/services/workflowService.js
import { prisma } from '../prisma.js';
import { notificationService } from './notificationService.js';

// Etapas padrão por tipo de processo — vêm da tabela TipoProcessoEtapa
// (editável pela tela de Configurações > Etapas), não mais fixas no código.
// catalogo: { [tipoProcesso]: [nomeEtapa, ...] } na ordem cadastrada.
// setores: { [nomeEtapa]: setorResponsavel } — mesclado entre tipos; quando a
// mesma etapa aparece em mais de um tipo, a primeira ocorrência decide.
async function buscarCatalogo(tx = prisma) {
  const linhas = await tx.tipoProcessoEtapa.findMany({ orderBy: { ordem: 'asc' } });
  const catalogo = {};
  const setores = {};
  for (const linha of linhas) {
    (catalogo[linha.tipoProcesso] ??= []).push(linha.nome);
    if (!(linha.nome in setores)) setores[linha.nome] = linha.setor;
  }
  return { catalogo, setores };
}

export const workflowService = {
  async listarTodos() {
    return prisma.workflow.findMany({
      include: {
        steps: { include: { requiredRole: true }, orderBy: { sequence_order: 'asc' } },
        // Nome do cliente não faz parte do nome do projeto — só entra aqui pra
        // dar suporte à busca por pessoa nos dropdowns do Kanban/Dashboard.
        servico: { select: { nomeCliente: true } },
      },
      orderBy: { created_at: 'desc' }
    });
  },

  // matricula: vem do Servico e já nasce preenchida no projeto, sem precisar
  // de edição manual — é o que aparece no card do Kanban e entra na busca.
  async fabricarProjeto(name, types, terreno = 'Urbano', servicoId = null, matricula = null, tx = prisma) {
    if (!types || types.length === 0) throw new Error("Selecione pelo menos um tipo de processo");
    const projetoExistente = await tx.workflow.findFirst({ where: { name } });
    if (projetoExistente) throw new Error("Já existe um projeto com este nome.");

    const { catalogo, setores } = await buscarCatalogo(tx);

    const tarefasUnicas = new Set();
    types.forEach(type => {
      const lista = catalogo[type];
      if (lista) lista.forEach(tarefa => tarefasUnicas.add(tarefa));
    });
    const listaTarefasMesclada = Array.from(tarefasUnicas);

    // Injeta o Sigef se for Rural
    if (terreno === 'Rural') {
      listaTarefasMesclada.push("Pré-aprovação no Sigef");
    }

    // Injeta a Atualização IPTU se for Urbano, logo após "Processo RI"
    if (terreno === 'Urbano') {
      const indexRI = listaTarefasMesclada.indexOf("Processo RI");
      if (indexRI !== -1) {
        listaTarefasMesclada.splice(indexRI + 1, 0, "Atualização IPTU");
      } else {
        listaTarefasMesclada.push("Atualização IPTU");
      }
    }

    const roles = await tx.role.findMany();
    const workflow = await tx.workflow.create({
      data: { name, description: types.join(', '), terreno, servicoId, matricula }
    });

    const colunasVisuais = ['Iniciar', 'Em Andamento', 'Concluído'];
    const etapasCriadas = [];
    let seq = 1;

    for (const role of roles) {
      for (const coluna of colunasVisuais) {
        const etapa = await tx.workflowStep.create({
          data: {
            step_name: coluna, sequence_order: seq++,
            workflow: { connect: { id: workflow.id } }, requiredRole: { connect: { id: role.id } }  
          }
        });
        etapasCriadas.push({ ...etapa, roleName: role.name }); 
      }
    }

    const ticketsData = listaTarefasMesclada.map((nomeTarefa, index) => {
      const setorDaTarefa = setores[nomeTarefa] || "CRD";
      const etapa = etapasCriadas.find(s => s.step_name === 'Iniciar' && s.roleName === setorDaTarefa);
      return { title: nomeTarefa, workflowId: workflow.id, currentStepId: etapa.id, sequence: index };
    });

    await tx.ticket.createMany({ data: ticketsData });
    await notificationService.notificarPrimeiraEtapa(workflow.id, tx);
    return workflow;
  },

  async editarProjeto(id, types, terreno) {
    if (!types || types.length === 0) throw new Error("Selecione pelo menos um tipo.");
    const { catalogo, setores } = await buscarCatalogo();
    const tarefasUnicas = new Set();
    types.forEach(type => {
      if (catalogo[type]) catalogo[type].forEach(t => tarefasUnicas.add(t));
    });

    if (terreno === 'Rural') {
      tarefasUnicas.add("Pré-aprovação no Sigef");
    }

    const novaListaNomes = Array.from(tarefasUnicas);
    const sequenceMap = new Map(novaListaNomes.map((nome, index) => [nome, index]));

    const workflow = await prisma.workflow.findUnique({
      where: { id }, include: { steps: { include: { requiredRole: true } } }
    });
    const ticketsAtuais = await prisma.ticket.findMany({ where: { workflowId: id } });
    const nomesAtuais = ticketsAtuais.map(t => t.title);

    const tarefasParaDeletar = ticketsAtuais.filter(t => !novaListaNomes.includes(t.title));
    const nomesParaAdicionar = novaListaNomes.filter(nome => !nomesAtuais.includes(nome));
    // Tickets que continuam existindo também precisam da sequência recalculada —
    // a edição pode trocar o(s) tipo(s) de processo e mudar a ordem das etapas.
    const ticketsParaResequenciar = ticketsAtuais.filter(t => novaListaNomes.includes(t.title));

    await prisma.$transaction(async (tx) => {
      if (tarefasParaDeletar.length > 0) {
        const idsParaDeletar = tarefasParaDeletar.map(t => t.id);
        await tx.comment.deleteMany({ where: { ticketId: { in: idsParaDeletar } } });
        await tx.ticketHistory.deleteMany({ where: { ticketId: { in: idsParaDeletar } } });
        await tx.ticket.deleteMany({ where: { id: { in: idsParaDeletar } } });
      }

      if (nomesParaAdicionar.length > 0) {
        const novosTicketsData = nomesParaAdicionar.map(nomeTarefa => {
          const setorDaTarefa = setores[nomeTarefa] || "CRD";
          const etapaInicial = workflow.steps.find(step => step.step_name === 'Iniciar' && step.requiredRole.name === setorDaTarefa);
          return { title: nomeTarefa, workflowId: id, currentStepId: etapaInicial.id, sequence: sequenceMap.get(nomeTarefa) };
        });
        await tx.ticket.createMany({ data: novosTicketsData });
      }

      for (const ticket of ticketsParaResequenciar) {
        const novaSequence = sequenceMap.get(ticket.title);
        if (ticket.sequence !== novaSequence) {
          await tx.ticket.update({ where: { id: ticket.id }, data: { sequence: novaSequence } });
        }
      }

      await tx.workflow.update({
        where: { id },
        data: { description: types.join(', '), ...(terreno ? { terreno } : {}) }
      });
    });
    return { message: "Projeto atualizado!" };
  },

  async atualizarDetalhes(id, { matricula, endereco, details }) {
    return prisma.workflow.update({
      where: { id },
      data: { matricula, endereco, details }
    });
  },

  async excluirProjeto(workflowId) {
    const tickets = await prisma.ticket.findMany({ where: { workflowId } });
    const ticketIds = tickets.map(t => t.id);

    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { ticketId: { in: ticketIds } } }),
      prisma.ticketHistory.deleteMany({ where: { ticketId: { in: ticketIds } } }),
      prisma.ticket.deleteMany({ where: { workflowId } }),
      prisma.workflowStep.deleteMany({ where: { workflowId } }),
      prisma.workflow.delete({ where: { id: workflowId } })
    ]);
  },

  // Tela de Configurações > Etapas: lista cada tipo de processo com sua lista
  // ordenada de etapas padrão (nome + setor responsável).
  async listarTiposProcesso() {
    const linhas = await prisma.tipoProcessoEtapa.findMany({ orderBy: [{ tipoProcesso: 'asc' }, { ordem: 'asc' }] });
    const porTipo = {};
    for (const linha of linhas) {
      (porTipo[linha.tipoProcesso] ??= []).push({ nome: linha.nome, setor: linha.setor });
    }
    return Object.entries(porTipo)
      .map(([tipoProcesso, etapas]) => ({ tipoProcesso, etapas }))
      .sort((a, b) => a.tipoProcesso.localeCompare(b.tipoProcesso, 'pt-BR'));
  },

  // Usado por servicoService.decidirOrcamento para saber quais tipos
  // solicitados têm de fato um processo cadastrado, antes de fabricar um
  // projeto no Kanban (substituiu o antigo CATALOGO_PROCESSOS[tipo] fixo).
  async listarTiposDisponiveis() {
    const linhas = await prisma.tipoProcessoEtapa.findMany({ distinct: ['tipoProcesso'], select: { tipoProcesso: true } });
    return linhas.map((l) => l.tipoProcesso);
  },

  // Substitui a lista de etapas padrão de um tipo de processo e resincroniza
  // os projetos já em andamento no Kanban que usam esse tipo — mesma lógica
  // de diff do editarProjeto (remove tarefas que saíram, adiciona as novas,
  // preserva o progresso das que continuam).
  async atualizarTipoProcesso(tipoProcesso, etapas) {
    if (!Array.isArray(etapas) || etapas.length === 0) {
      throw new Error('Informe ao menos uma etapa.');
    }
    const todasValidas = etapas.every((e) => e?.nome?.trim() && e?.setor?.trim());
    if (!todasValidas) throw new Error('Toda etapa precisa de nome e setor.');

    const roles = await prisma.role.findMany({ select: { name: true } });
    const nomesDeSetores = roles.map((r) => r.name);
    const setorInvalido = etapas.find((e) => !nomesDeSetores.includes(e.setor));
    if (setorInvalido) throw new Error(`Setor "${setorInvalido.setor}" não existe.`);

    await prisma.$transaction(async (tx) => {
      await tx.tipoProcessoEtapa.deleteMany({ where: { tipoProcesso } });
      await tx.tipoProcessoEtapa.createMany({
        data: etapas.map((etapa, indice) => ({
          tipoProcesso, nome: etapa.nome.trim(), setor: etapa.setor, ordem: indice + 1,
        })),
      });
    });

    // Cada projeto guarda os tipos que o formaram em description (ver
    // fabricarProjeto) — é a única referência disponível hoje pra achar quem
    // usa esse tipo.
    const workflows = await prisma.workflow.findMany({ select: { id: true, description: true, terreno: true } });
    const afetados = workflows.filter((w) => (w.description || '').split(', ').includes(tipoProcesso));
    for (const workflow of afetados) {
      await workflowService.editarProjeto(workflow.id, workflow.description.split(', '), workflow.terreno);
    }

    return { message: 'Etapas atualizadas.', projetosAtualizados: afetados.length };
  },
};