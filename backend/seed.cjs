const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Inicialização segura do Prisma 7+
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando a limpeza para a Fábrica de Projetos...");
  
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  console.log("Criando os Setores Oficiais (Roles)...");
  const rCoord = await prisma.role.create({ data: { name: 'Coordenação' } });
  const rDesenho = await prisma.role.create({ data: { name: 'Desenho' } });
  const rCharles = await prisma.role.create({ data: { name: 'Charles' } });
  const rTopo = await prisma.role.create({ data: { name: 'Topografia' } });

  console.log("Criando Usuários...");
  await prisma.user.createMany({
    data: [
      { name: 'Equipe Coordenação', email: 'coord@teste.com', password_hash: '123', roleId: rCoord.id },
      { name: 'Equipe Desenho', email: 'desenho@teste.com', password_hash: '123', roleId: rDesenho.id },
      { name: 'Charles', email: 'charles@teste.com', password_hash: '123', roleId: rCharles.id },
      { name: 'Equipe Topografia', email: 'topo@teste.com', password_hash: '123', roleId: rTopo.id },
    ]
  });

  console.log("✅ Banco pronto! Sem projetos iniciais. O Frontend vai gerar tudo agora.");
}

main().catch(console.error).finally(() => prisma.$disconnect());