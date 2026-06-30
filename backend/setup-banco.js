import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function criarDadosIniciais() {
  console.log("⏳ Conectando ao PostgreSQL via Prisma...");
  
  try {
    // 1. Workflow
    let workflow = await prisma.workflow.findFirst();
    if (!workflow) {
      workflow = await prisma.workflow.create({
        data: { name: "Fluxo Principal" }
      });
      console.log("✅ Workflow criado!");
    }

    // 2. Etapas
    const etapas = ['Iniciar', 'Em Andamento', 'Concluído'];
    const ids = {};

    for (let i = 0; i < etapas.length; i++) {
      let etapa = await prisma.workflowStep.findFirst({
        where: { step_name: etapas[i], workflowId: workflow.id }
      });
      
      if (!etapa) {
        etapa = await prisma.workflowStep.create({
          data: { 
            step_name: etapas[i], 
            sequence_order: i + 1, 
            workflowId: workflow.id 
          }
        });
      }
      ids[etapas[i]] = etapa.id;
    }

    // 3. Resultado
    console.log("\n=======================================================");
    console.log("🚀 TUDO PRONTO! COPIE OS SEUS UUIDS PARA O APP.JSX:");
    console.log(`WORKFLOW_ID: "${workflow.id}"`);
    console.log(`ETAPA INICIAR: "${ids['Iniciar']}"`);
    console.log(`ETAPA EM ANDAMENTO: "${ids['Em Andamento']}"`);
    console.log(`ETAPA CONCLUÍDO: "${ids['Concluído']}"`);
    console.log("=======================================================\n");

  } catch (error) {
    console.error("❌ Erro fatal ao tentar gravar no banco:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0); // Garante que o terminal não fique travado
  }
}

criarDadosIniciais();