import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';


const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});


const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();


app.use(cors());
app.use(express.json());


app.get('/ping', (req, res) => {
    res.json({ message: 'API do Workflow rodando perfeitamente!' });
});

app.post('/roles', async (req, res) => {
    const { name } = req.body;

    try {
        const newRole = await prisma.role.create({
            data: {
                name: name
            }
        });
        
        res.status(201).json(newRole);
    } catch (error) {
        res.status(400).json({ error: 'Erro ao criar cargo. Talvez o nome já exista.' });
    }
});

app.get('/roles', async (req, res) => {
    try {
    
        const roles = await prisma.role.findMany();
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar cargos.' });
    }
});


app.post('/workflows', async (req, res) => {
    const { name, description } = req.body;

    try {
        const workflow = await prisma.workflow.create({
            data: { name, description }
        });
        res.status(201).json(workflow);
    } catch (error) {
        res.status(400).json({ error: 'Erro ao criar fluxo.' });
    }
});

app.get('/workflows', async (req, res) => {
    try {
        const workflows = await prisma.workflow.findMany();
        res.status(200).json(workflows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar fluxos.' });
    }
});


app.post('/steps', async (req, res) => {
    const { step_name, sequence_order, workflowId, requiredRoleId } = req.body;

    try {
        const step = await prisma.workflowStep.create({
            data: { step_name, sequence_order, workflowId, requiredRoleId }
        });
        res.status(201).json(step);
    } catch (error) {
        res.status(400).json({ error: 'Erro ao criar etapa. Verifique se os IDs informados existem.' });
    }
});


app.get('/steps', async (req, res) => {
    try{
        const steps = await prisma.workflowStep.findMany({
            include: {
                workflow: true,
                requiredRole: true
            }
        });
        res.status(200).json(steps);
    } catch (error ) {
        res.status(500).json({ error: 'Erro ao buscar etapas.' });
    }
});

app.post('/tickets', async (req, res) => {
    const { title, workflowId, currentStepId } = req.body;

    try {
        const ticket = await prisma.ticket.create({
            data: {
                title: title,
                workflowId: workflowId,
                currentStepId: currentStepId
            }
        });
        res.status(201).json(ticket);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Erro ao criar o projeto. Veririfique se os Id existem.'});
    }
});

app.get('/tickets', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: {
                workflow: true,
                currentStep: true
            }
        });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar projetos.'});
    }
});

app.post('/users', async( req, res) => {
    const { name, email, password_hash, roleId} = req.body;

    try {
        const user = await prisma.user.create({
            data: { name, email, password_hash, roleId }
        });
        res.status(201). json(user);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Erro ao criar usuário. Email pode já estar cadastrado.'})
    }
});

app.post('/tickets/move', async (req, res) => {
    const { ticketId, userId, toStepId } = req.body;

    try {
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado.' });
        }

        const [updatedTicket, history] = await prisma.$transaction([
            prisma.ticket.update({
                where: { id: ticketId },
                data: { currentStepId: toStepId }
            }),
            prisma.ticketHistory.create({
                data: {
                    ticketId: ticketId,
                    userId: userId,
                    fromStepId: ticket.currentStepId, 
                    toStepId: toStepId                
                }
            })
        ]);

        res.status(200).json({ message: 'Ticket avançado com sucesso!', updatedTicket, history });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Erro ao movimentar o ticket.' });
    }
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
