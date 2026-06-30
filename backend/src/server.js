import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

const TAREFAS_PADRAO = [
    { nome: "Aprovação do orcamento", setor: "Coordenação" }, { nome: "emissao contrato", setor: "Coordenação" },
    { nome: "Assinatura Contrato", setor: "Coordenação" }, { nome: "Conferência Dossiê", setor: "Coordenação" },
    { nome: "Agendamento Levantamento", setor: "Coordenação" }, { nome: "Conferência Pré-Projeto", setor: "Coordenação" },
    { nome: "Aprovação do Proprietário", setor: "Coordenação" }, { nome: "Conferência Projeto", setor: "Coordenação" },
    { nome: "Assinatura do Proprietário", setor: "Coordenação" }, { nome: "Processo Prefeitura", setor: "Coordenação" },
    { nome: "Assinaturas dos Confrontantes", setor: "Coordenação" }, { nome: "Reconhecimento de Assinaturas", setor: "Coordenação" },
    { nome: "Processo Cartório", setor: "Coordenação" }, { nome: "SIGEF", setor: "Coordenação" },
    { nome: "Nota de Exigências", setor: "Coordenação" }, { nome: "Entrega do Serviço", setor: "Coordenação" },
    { nome: "ART / Assinatura Digital", setor: "Coordenação" }, { nome: "Envio Faturamento", setor: "Coordenação" },
    
    { nome: "Solicitação de Documentos", setor: "Desenho" }, { nome: "Solicitação de Taxas", setor: "Desenho" },
    { nome: "Recebimento Taxas", setor: "Desenho" }, { nome: "Dossiê", setor: "Desenho" },
    { nome: "Execução do Projeto", setor: "Desenho" }, { nome: "CAR", setor: "Desenho" },
    { nome: "Orgãos Governamentais", setor: "Desenho" }, { nome: "Montagem do Processo para Prefeitura", setor: "Desenho" },
    { nome: "Escritura", setor: "Desenho" }, { nome: "Montagem do Processo para Cartório", setor: "Desenho" },
    { nome: "Preparação do Material de Campo", setor: "Desenho" }, { nome: "Pré-projeto", setor: "Desenho" },
    { nome: "Monografia", setor: "Desenho" }, { nome: "Impressão", setor: "Desenho" },
    { nome: "Montagem do processo para SIGEF", setor: "Desenho" }, { nome: "Faturamento", setor: "Desenho" },
    
    { nome: "Orçamento", setor: "Charles" }, { nome: "Contrato", setor: "Charles" }, { nome: "Revisão do Processo", setor: "Charles" },
    
    { nome: "Levantamento", setor: "Topografia" }, { nome: "Processamento da Base", setor: "Topografia" },
    { nome: "Croqui", setor: "Topografia" }, { nome: "Locação", setor: "Topografia" }
];

// BUSCAR PROJETOS (Corrigido o include)
app.get('/workflows', async (req, res) => {
    try {
        const workflows = await prisma.workflow.findMany({
            include: { 
                steps: { 
                    include: { requiredRole: true }, // Traz o cargo associado a essa etapa matriz
                    orderBy: { sequence_order: 'asc' } 
                } 
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(workflows);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar projetos" }); 
    }
});

// A FÁBRICA DE PROJETOS
app.post('/workflows', async (req, res) => {
    const { name } = req.body;
    try {
        const roles = await prisma.role.findMany();
        const roleMap = {};
        roles.forEach(r => roleMap[r.name] = r.id);

        const workflow = await prisma.workflow.create({ data: { name } });

        const colunasVisuais = ['Iniciar', 'Em Andamento', 'Concluído'];
        const etapasCriadas = [];
        let seq = 1;

        for (const role of roles) {
            for (const coluna of colunasVisuais) {
                const etapa = await prisma.workflowStep.create({
                    data: {
                        step_name: coluna,
                        sequence_order: seq++,
                        workflow: { connect: { id: workflow.id } }, 
                        requiredRole: { connect: { id: role.id } }  
                    }
                });
                etapasCriadas.push({ ...etapa, roleName: role.name }); 
            }
        }

        const ticketsData = TAREFAS_PADRAO.map(t => {
            const etapaInicialDoSetor = etapasCriadas.find(
                step => step.step_name === 'Iniciar' && step.roleName === t.setor
            );
            return {
                title: t.nome,
                workflowId: workflow.id,
                currentStepId: etapaInicialDoSetor.id
            };
        });

        await prisma.ticket.createMany({ data: ticketsData });
        res.status(201).json({ message: "Projeto gerado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao fabricar o projeto" });
    }
});

// BUSCAR CARTÕES (Corrigido o include)
app.get('/tickets', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: { 
                workflow: true,
                currentStep: { 
                    include: { requiredRole: true } // A trava do setor está AQUI, na etapa
                } 
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(tickets);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: "Erro" }); 
    }
});

// MOVER CARTÃO
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
    } catch (error) { res.status(500).json({ error: "Erro ao mover" }); }
});

// DELETAR CARTÃO
app.delete('/tickets/:id', async (req, res) => {
    try {
        await prisma.$transaction([
            prisma.ticketHistory.deleteMany({ where: { ticketId: req.params.id } }),
            prisma.ticket.delete({ where: { id: req.params.id } })
        ]);
        res.status(200).json({ message: 'Excluído!' });
    } catch (error) { res.status(500).json({ error: 'Erro ao excluir.' }); }
});

app.listen(3000, () => console.log(`🚀 API Fábrica de Projetos rodando na porta 3000`));