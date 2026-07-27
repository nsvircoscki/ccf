import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL)
});

const app = express();
app.use(cors());
app.use(express.json());

const MAPEAMENTO_SETORES = {
    "Aprovação do Orçamento": "Charles", 
    "Emissão Contrato": "Coordenação", "Assinatura Contrato": "Coordenação", "Conferência Dossiê": "Coordenação", 
    "Envio Faturamento": "Coordenação", "Agendamento Levantamento": "Coordenação", "Conferência Pré-Projeto": "Coordenação", 
    "Aprovação do Proprietário": "Coordenação", "Conferência Projeto": "Coordenação", "ART / Assinatura Digital": "Coordenação", 
    "Assinatura do Proprietário": "Coordenação", "Processo Prefeitura": "Coordenação", "Assinaturas dos Confrontantes": "Coordenação", 
    "Reconhecimento de Assinaturas": "Coordenação", "Processo Cartório": "Coordenação", "SIGEF": "Coordenação", 
    "Montagem do Processo para Cartório": "Coordenação", "Processo RI": "Coordenação","Recebimento Taxas": "Coordenação", "Escritura": "Coordenação", 
    "Nota de Exigências": "Coordenação", "Entrega do Serviço": "Coordenação", "Solicitação de Taxas": "Coordenação",
    "Solicitação de Documentos": "Coordenação", "Dossiê": "Desenho", "Pré-aprovação no Sigef": "Desenho",
    "Faturamento": "Desenho", "Preparação do Material de Campo": "Desenho", "Pré-projeto": "Desenho", "Monografia": "Desenho", "Confecção de Escritura": "Desenho",
    "Execução do Projeto": "Desenho", "Impressão": "Desenho", "Orgãos Governamentais": "Desenho", "Montagem do Processo para Prefeitura": "Desenho", "Atualização IPTU" : "Desenho",
    "Montagem do processo para SIGEF": "Desenho", "CAR": "Desenho",
    "Levantamento": "Topografia", "Processamento da Base": "Topografia", "Croqui": "Topografia", "Locação": "Topografia",
    "Revisão Processo": "Charles" 
};

const CATALOGO_PROCESSOS = {
    "Retificação": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Assinaturas dos Confrontantes", "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
    "Desmembramento": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Locação", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura",  "Processo Prefeitura", "Reconhecimento de Assinaturas", "Confecção de Escritura", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
    "Unificação": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
    "Usucapião": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura",  "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
    "Alteração de Divisas": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Locação", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura",  "Processo Prefeitura", "Reconhecimento de Assinaturas", "Confecção de Escritura", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
    "CAR": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Aprovação do Proprietário", "Execução do Projeto", "CAR", "Entrega do Serviço"],
    "Certificação INCRA": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Execução do Projeto", "ART / Assinatura Digital", "Montagem do processo para SIGEF", "SIGEF", "Entrega do Serviço"],
    "Escritura": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Escritura", "Montagem do Processo para Cartório", "Processo RI", "Processo Cartório", "Nota de Exigências", "Entrega do Serviço"],
    "Conferência": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Entrega do Serviço"],
    "Cadastral": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Entrega do Serviço"],
    "Locação": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Locação", "Execução do Projeto", "Conferência Projeto", "Entrega do Serviço"],
    "Movimentação de Terra": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Entrega do Serviço"],
    "Danc": ["Aprovação do Orçamento", "Recebimento Taxas", "Faturamento", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Orgãos Governamentais", "Entrega do Serviço"]
};

app.get('/workflows', async (req, res) => {
    try {
        const workflows = await prisma.workflow.findMany({
            include: { steps: { include: { requiredRole: true }, orderBy: { sequence_order: 'asc' } } },
            orderBy: { created_at: 'desc' }
        });
        res.json(workflows);
    } catch (error) { res.status(500).json({ error: "Erro" }); }
});

app.post('/workflows', async (req, res) => {
    const { name, types, terreno } = req.body; 
    try {
        if (!types || types.length === 0) return res.status(400).json({ error: "Selecione pelo menos um tipo de processo" });

        // 1. TRAVA: Bloqueia nomes iguais
        const projetoExistente = await prisma.workflow.findFirst({ where: { name } });
        if (projetoExistente) {
            return res.status(400).json({ error: "Já existe um projeto com este nome." });
        }

        const tarefasUnicas = new Set();
        types.forEach(type => {
            const lista = CATALOGO_PROCESSOS[type];
            if (lista) {
                lista.forEach(tarefa => tarefasUnicas.add(tarefa));
            }
        });

        // 1. Converte o Set em Array ANTES de manipular a ordem
        let listaTarefasMesclada = Array.from(tarefasUnicas);

        // 2. Injeta o Sigef se for Rural
        if (terreno === 'Rural'){
            listaTarefasMesclada.push("Pré-aprovação no Sigef");
        }

        // 3. Injeta a Atualização IPTU se for Urbano
        if (terreno === 'Urbano') {
            const indexRI = listaTarefasMesclada.indexOf("Processo RI");
            if (indexRI !== -1) {
                // Insere logo na sequência do Processo RI
                listaTarefasMesclada.splice(indexRI + 1, 0, "Atualização IPTU");
            } else {
                listaTarefasMesclada.push("Atualização IPTU");
            }
        }

        const roles = await prisma.role.findMany();
        const roleMap = {};
        roles.forEach(r => roleMap[r.name] = r.id);

        const tiposJuntos = types.join(', ');
        const workflow = await prisma.workflow.create({ 
            data: { 
                name: name,
                description: tiposJuntos 
            } 
        });

        const colunasVisuais = ['Iniciar', 'Em Andamento', 'Concluído'];
        const etapasCriadas = [];
        let seq = 1;

        for (const role of roles) {
            for (const coluna of colunasVisuais) {
                const etapa = await prisma.workflowStep.create({
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
            const etapaInicialDoSetor = etapasCriadas.find(step => step.step_name === 'Iniciar' && step.roleName === setorDaTarefa);
            return { title: nomeTarefa, workflowId: workflow.id, currentStepId: etapaInicialDoSetor.id };
        });

        await prisma.ticket.createMany({ data: ticketsData });
        res.status(201).json({ message: "Projeto Combo fabricado com sucesso!" });
    } catch (error) { res.status(500).json({ error: "Erro na fabricação" }); }
});

// 2. NOVA ROTA: Editar Projeto (Adicionar/Remover Tipos)
app.put('/workflows/:id', async (req, res) => {
    const { id } = req.params;
    const { types, terreno } = req.body;
    try {
        if (!types || types.length === 0) return res.status(400).json({ error: "Selecione pelo menos um tipo." });

        const tarefasUnicas = new Set();
        types.forEach(type => {
            if (CATALOGO_PROCESSOS[type]) CATALOGO_PROCESSOS[type].forEach(t => tarefasUnicas.add(t));
        });

        if (terreno === 'Rural'){
            tarefasUnicas.add("Pré-aprovação no Sigef");
        }

        const novaListaNomes = Array.from(tarefasUnicas);

        const ticketsAtuais = await prisma.ticket.findMany({ where: { workflowId: id } });
        const nomesAtuais = ticketsAtuais.map(t => t.title);

        const tarefasParaDeletar = ticketsAtuais.filter(t => !novaListaNomes.includes(t.title));
        const nomesParaAdicionar = novaListaNomes.filter(nome => !nomesAtuais.includes(nome));

        if (tarefasParaDeletar.length > 0) {
            const idsParaDeletar = tarefasParaDeletar.map(t => t.id);
            await prisma.comment.deleteMany({ where: { ticketId: { in: idsParaDeletar } } });
            await prisma.ticketHistory.deleteMany({ where: { ticketId: { in: idsParaDeletar } } });
            await prisma.ticket.deleteMany({ where: { id: { in: idsParaDeletar } } });
        }

        if (nomesParaAdicionar.length > 0) {
            const workflow = await prisma.workflow.findUnique({ 
                where: { id }, include: { steps: { include: { requiredRole: true } } } 
            });
            const novosTicketsData = nomesParaAdicionar.map(nomeTarefa => {
                const setorDaTarefa = MAPEAMENTO_SETORES[nomeTarefa] || "Coordenação";
                const etapaInicial = workflow.steps.find(step => step.step_name === 'Iniciar' && step.requiredRole.name === setorDaTarefa);
                return { title: nomeTarefa, workflowId: id, currentStepId: etapaInicial.id };
            });
            await prisma.ticket.createMany({ data: novosTicketsData });
        }

        await prisma.workflow.update({ where: { id }, data: { description: types.join(', ') } });
        res.status(200).json({ message: "Projeto atualizado!" });
    } catch (error) { res.status(500).json({ error: "Erro ao editar projeto." }); }
});

//Editar detalhes gerais do projeto
app.put('/workflows/:id/details', async (req, res) => {
    const { id } = req.params;
    const { matricula, endereco, details } = req.body;
    try {
        const workflowAtualizado = await prisma.workflow.update({
            where: { id },
            data: { matricula, endereco, details }
        });
        res.status(200).json(workflowAtualizado);
    } catch (error) { 
        console.error('Erro ao atualizar dados do projeto:', error);
        res.status(500).json({ error: 'Erro ao atualizar projeto.' }); 
    }
});


app.put('/tickets/:id', async(req, res) =>{
    const { id } = req.params;
    const { description } = req.body;
    try{
        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: { description }
        });
        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error('Erro ao atualizar descrição:', error);
        res.status(500).json({ error: 'Errro ao atualizar detalhes da tarefa.' });
    }
    
});


app.delete('/workflows/:id', async (req, res) => {
    try {
        const workflowId = req.params.id;
        const tickets = await prisma.ticket.findMany({ where: { workflowId } });
        const ticketIds = tickets.map(t => t.id);

        await prisma.$transaction([
            prisma.comment.deleteMany({ where: { ticketId: { in: ticketIds } } }),
            prisma.ticketHistory.deleteMany({ where: { ticketId: { in: ticketIds } } }),
            prisma.ticket.deleteMany({ where: { workflowId } }),
            prisma.workflowStep.deleteMany({ where: { workflowId } }),
            prisma.workflow.delete({ where: { id: workflowId } })
        ]);
        res.status(200).json({ message: 'Projeto inteiro excluído com sucesso!' });
    } catch (error) { res.status(500).json({ error: 'Erro ao excluir projeto.' }); }
});

app.get('/tickets', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: { 
                workflow: true,
                currentStep: { include: { requiredRole: true } },
                history: { include: { user: true, fromStep: true, toStep: true }, orderBy: { action_timestamp: 'desc' } },
                comments: { include: { user: true }, orderBy: { created_at: 'desc' } }
            },
            orderBy: { created_at: 'desc' } 
        });
        res.json(tickets);
    } catch (error) { res.status(500).json({ error: "Erro" }); }
});

app.post('/tickets', async (req, res) => {
    const { title, workflowId, currentStepId } = req.body;
    try {
        if (!title || !workflowId || !currentStepId) {
            return res.status(400).json({ error: 'Título, workflowId e currentStepId são obrigatórios.' });
        }

        const ticket = await prisma.ticket.create({
            data: { title, workflowId, currentStepId },
            include: {
                workflow: true,
                currentStep: { include: { requiredRole: true } },
                history: { include: { user: true, fromStep: true, toStep: true }, orderBy: { action_timestamp: 'desc' } },
                comments: { include: { user: true }, orderBy: { created_at: 'desc' } }
            }
        });
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Erro ao criar ticket:', error);
        res.status(500).json({ error: "Erro ao criar ticket." });
    }
});

app.post('/tickets/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { userId, text } = req.body; 
    try {
        const role = await prisma.role.findUnique({ where: { name: userId } });
        const user = await prisma.user.findFirst({ where: { roleId: role.id } });

        const novoComentario = await prisma.comment.create({
            data: { text, ticketId: id, userId: user.id },
            include: { user: true }
        });
        res.status(201).json(novoComentario);
    } catch (error) { res.status(500).json({ error: "Erro" }); }
});

app.post('/tickets/move', async (req, res) => {
    const { ticketId, toStepId, userId } = req.body; 
    try {
        const role = await prisma.role.findUnique({ where: { name: userId } });
        const user = await prisma.user.findFirst({ where: { roleId: role.id } });
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

        const [updatedTicket] = await prisma.$transaction([
            prisma.ticket.update({ where: { id: ticketId }, data: { currentStepId: toStepId } }),
            prisma.ticketHistory.create({
                data: { ticketId, fromStepId: ticket.currentStepId, toStepId, userId: user.id }
            })
        ]);
        res.status(200).json({ message: "Movido", updatedTicket });
    } catch (error) { res.status(500).json({ error: "Erro" }); }
});

app.delete('/tickets/:id', async (req, res) => {
    try {
        await prisma.$transaction([
            prisma.comment.deleteMany({ where: { ticketId: req.params.id } }),
            prisma.ticketHistory.deleteMany({ where: { ticketId: req.params.id } }),
            prisma.ticket.delete({ where: { id: req.params.id } })
        ]);
        res.status(200).json({ message: 'Excluído!' });
    } catch (error) { res.status(500).json({ error: 'Erro' }); }
});

app.listen(3000, () => console.log(`Rodando API Fábrica de Projetos na porta 3000`));