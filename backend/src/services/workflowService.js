// src/services/workflowService.js
import { prisma } from '../prisma.js';

const MAPEAMENTO_SETORES = {
    "Aprovação do Orçamento": "Charles", 
    "Emissão Contrato": "Coordenação", 
    "Assinatura Contrato": "Coordenação", 
    "Conferência Dossiê": "Coordenação", 
    "Envio Faturamento": "Coordenação", 
    "Agendamento Levantamento": "Coordenação", 
    "Conferência Pré-Projeto": "Coordenação", 
    "Aprovação do Proprietário": "Coordenação", 
    "Conferência Projeto": "Coordenação", 
    "ART / Assinatura Digital": "Coordenação", 
    "Assinatura do Proprietário": "Coordenação", 
    "Processo Prefeitura": "Coordenação", 
    "Assinaturas dos Confrontantes": "Coordenação", 
    "Reconhecimento de Assinaturas": "Coordenação", 
    "Processo Cartório": "Coordenação", 
    "SIGEF": "Coordenação", 
    "Nota de Exigências": "Coordenação", 
    "Entrega do Serviço": "Coordenação", 
    "Solicitação de Taxas": "Coordenação",
    "Solicitação de Documentos": "Desenho", 
    "Recebimento Taxas": "Desenho", 
    "Dossiê": "Desenho", 
    "Faturamento": "Desenho", 
    "Preparação do Material de Campo": "Desenho", 
    "Pré-projeto": "Desenho", 
    "Monografia": "Desenho", 
    "Execução do Projeto": "Desenho", 
    "Impressão": "Desenho", 
    "Orgãos Governamentais": "Desenho", 
    "Montagem do Processo para Prefeitura": "Desenho", 
    "Escritura": "Desenho", 
    "Montagem do Processo para Cartório": "Desenho", 
    "Montagem do processo para SIGEF": "Desenho", 
    "CAR": "Desenho",
    "Levantamento": "Topografia", 
    "Processamento da Base": "Topografia", 
    "Croqui": "Topografia", 
    "Locação": "Topografia", 
    "Revisão Processo": "Charles" 
};

const CATALOGO_PROCESSOS = {
    "Retificação": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Assinaturas dos Confrontantes", "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Nota de Exigências", "Entrega do Serviço"],
    "Desmembramento": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Locação", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Nota de Exigências", "Entrega do Serviço"],
    "Unificação": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Nota de Exigências", "Entrega do Serviço"],
    "Usucapião": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Nota de Exigências", "Entrega do Serviço"],
    "Alteração de Divisas": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Locação", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Reconhecimento de Assinaturas", "Escritura", "Montagem do Processo para Cartório", "Nota de Exigências", "Entrega do Serviço"],
    "CAR": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Aprovação do Proprietário", "Execução do Projeto", "CAR", "Entrega do Serviço"],
    "Certificação INCRA": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Execução do Projeto", "ART / Assinatura Digital", "Montagem do processo para SIGEF", "SIGEF", "Entrega do Serviço"],
    "Escritura": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Escritura", "Montagem do Processo para Cartório", "Processo Cartório", "Nota de Exigências", "Entrega do Serviço"],
    "Conferência": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Entrega do Serviço"],
    "Cadastral": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Entrega do Serviço"],
    "Locação": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Locação", "Execução do Projeto", "Conferência Projeto", "Entrega do Serviço"],
    "Movimentação de Terra": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Entrega do Serviço"]
};

export const workflowService = {
  async listarTodos() {
    return prisma.workflow.findMany({
      include: { steps: { include: { requiredRole: true }, orderBy: { sequence_order: 'asc' } } },
      orderBy: { created_at: 'desc' }
    });
  },

  async fabricarProjeto(name, types, terreno = 'Urbano', servicoId = null, tx = prisma) {
    if (!types || types.length === 0) throw new Error("Selecione pelo menos um tipo de processo");
    const projetoExistente = await tx.workflow.findFirst({ where: { name } });
    if (projetoExistente) throw new Error("Já existe um projeto com este nome.");

    const tarefasUnicas = new Set();
    types.forEach(type => {
      const lista = CATALOGO_PROCESSOS[type];
      if (lista) lista.forEach(tarefa => tarefasUnicas.add(tarefa));
    });
    const listaTarefasMesclada = Array.from(tarefasUnicas);

    const roles = await tx.role.findMany();
    const workflow = await tx.workflow.create({
      data: { name, description: types.join(', '), terreno, servicoId }
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

    const ticketsData = listaTarefasMesclada.map(nomeTarefa => {
      const setorDaTarefa = MAPEAMENTO_SETORES[nomeTarefa] || "Coordenação"; 
      const etapa = etapasCriadas.find(s => s.step_name === 'Iniciar' && s.roleName === setorDaTarefa);
      return { title: nomeTarefa, workflowId: workflow.id, currentStepId: etapa.id };
    });

    await tx.ticket.createMany({ data: ticketsData });
    return workflow;
  },

  async editarProjeto(id, types, terreno) {
    if (!types || types.length === 0) throw new Error("Selecione pelo menos um tipo.");
    const tarefasUnicas = new Set();
    types.forEach(type => {
      if (CATALOGO_PROCESSOS[type]) CATALOGO_PROCESSOS[type].forEach(t => tarefasUnicas.add(t));
    });
    const novaListaNomes = Array.from(tarefasUnicas);

    const workflow = await prisma.workflow.findUnique({ 
      where: { id }, include: { steps: { include: { requiredRole: true } } } 
    });
    const ticketsAtuais = await prisma.ticket.findMany({ where: { workflowId: id } });
    const nomesAtuais = ticketsAtuais.map(t => t.title);

    const tarefasParaDeletar = ticketsAtuais.filter(t => !novaListaNomes.includes(t.title));
    const nomesParaAdicionar = novaListaNomes.filter(nome => !nomesAtuais.includes(nome));

    await prisma.$transaction(async (tx) => {
      if (tarefasParaDeletar.length > 0) {
        const idsParaDeletar = tarefasParaDeletar.map(t => t.id);
        await tx.comment.deleteMany({ where: { ticketId: { in: idsParaDeletar } } });
        await tx.ticketHistory.deleteMany({ where: { ticketId: { in: idsParaDeletar } } });
        await tx.ticket.deleteMany({ where: { id: { in: idsParaDeletar } } });
      }

      if (nomesParaAdicionar.length > 0) {
        const novosTicketsData = nomesParaAdicionar.map(nomeTarefa => {
          const setorDaTarefa = MAPEAMENTO_SETORES[nomeTarefa] || "Coordenação";
          const etapaInicial = workflow.steps.find(step => step.step_name === 'Iniciar' && step.requiredRole.name === setorDaTarefa);
          return { title: nomeTarefa, workflowId: id, currentStepId: etapaInicial.id };
        });
        await tx.ticket.createMany({ data: novosTicketsData });
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
  }
};