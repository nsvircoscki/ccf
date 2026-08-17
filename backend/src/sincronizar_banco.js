import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL)
});

const MAPEAMENTO_SETORES = {
    "Aprovação do Orçamento": "ENG",
    "Emissão Contrato": "CRD", "Assinatura Contrato": "CRD", "Conferência Dossiê": "CRD",
    "Envio Faturamento": "CRD", "Agendamento Levantamento": "CRD", "Conferência Pré-Projeto": "CRD",
    "Aprovação do Proprietário": "CRD", "Conferência Projeto": "CRD", "ART / Assinatura Digital": "CRD",
    "Assinatura do Proprietário": "CRD", "Processo Prefeitura": "CRD", "Assinaturas dos Confrontantes": "CRD",
    "Reconhecimento de Assinaturas": "CRD", "Processo Cartório": "CRD", "SIGEF": "CRD",
    "Montagem do Processo para Cartório": "CRD", "Processo RI": "CRD","Recebimento Taxas": "CRD", "Escritura": "CRD",
    "Nota de Exigências": "CRD", "Entrega do Serviço": "CRD", "Solicitação de Taxas": "CRD",
    "Solicitação de Documentos": "CRD", "Dossiê": "DES", "Pré-aprovação no Sigef": "DES",
    "Faturamento": "DES", "Preparação do Material de Campo": "DES", "Pré-projeto": "DES", "Monografia": "DES", "Confecção de Escritura": "DES",
    "Execução do Projeto": "DES", "Impressão": "DES", "Orgãos Governamentais": "DES", "Montagem do Processo para Prefeitura": "DES", "Atualização IPTU" : "DES",
    "Montagem do processo para SIGEF": "DES", "CAR": "DES",
    "Levantamento": "TOPO", "Processamento da Base": "TOPO", "Croqui": "TOPO", "Locação": "TOPO",
    "Revisão Processo": "ENG"
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

            const stepIniciarDesenho = wf.steps.find(s => s.step_name === 'Iniciar' && s.requiredRole.name === 'DES');

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