import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL)
});

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


async function sincronizarProjetosAntigos() {
    console.log("Iniciando a varredura e sincronização dos projetos no banco de dados.");


    const workflows = await prisma.workflow.findMany({
        include: {
            tickets: true,
            steps: { include: { requiredRole: true } }
        }
    });

    let totalAdicionados = 0;

    for (const wf of workflows) {
        const isRural = wf.tickets.some(t => t.title === "CAR" || t.title === "SIGEF" || t.title === "Pré-aprovação no Sigef");


        let tarefasEsperadas = wf.tickets.map(t => t.title);

        if(!isRural && !tarefasEsperadas.includes("Atualização IPTU")) {
            tarefasEsperadas.push("Atualização IPTU");

            const stepIniciarDesenho = wf.steps.find(s => s.step_name === 'Iniciar' && s.requiredRole.name === 'Desenho');

            if (stepIniciarDesenho) {
                await prisma.ticket.create({
                    data: {
                        title: "Atualização IPTU",
                        workflowId: wf.id,
                        currentStepId: stepIniciarDesenho.id
                    }
                });
                console.log(`Adicionada etapa 'Atualização IPTU no projeto urbano: ${wf.name}`);
                totalAdicionados++;
            }
        }
    }
    console.log(`Sincronização concluída com sucesso! ${totalAdicionados} novas etapas faltantes foram inseridas.`);
}

sincronizarProjetosAntigos()
  .catch(e => console.error("Erro durante a sincronização:", e))
  .finally(async () => await prisma.$disconnect());