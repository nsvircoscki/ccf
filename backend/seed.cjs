require('dotenv/config');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const login = String(process.env.BOOTSTRAP_ADMIN_LOGIN || '').trim().toLowerCase();
const senha = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
const nome = String(process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador').trim();
const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();

if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no .env do backend.');
if (!/^[a-z0-9._-]{3,30}$/.test(login)) {
  throw new Error('Configure BOOTSTRAP_ADMIN_LOGIN com 3 a 30 caracteres: letras sem acento, números, ponto, hífen ou _.');
}
if (senha.length < 4) throw new Error('Configure BOOTSTRAP_ADMIN_PASSWORD com pelo menos 4 caracteres.');
if (!nome) throw new Error('Configure BOOTSTRAP_ADMIN_NAME com o nome do administrador.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Configure BOOTSTRAP_ADMIN_EMAIL com um e-mail válido.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const criado = await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { name: 'ENG' },
      update: {},
      create: { name: 'ENG' },
    });

    const existente = await tx.user.findUnique({ where: { login } });
    if (existente) {
      return false;
    }

    await tx.user.create({
      data: {
        name: nome,
        email,
        login,
        password_hash: await bcrypt.hash(senha, 10),
        roleId: role.id,
      },
    });
    return true;
  });

  if (criado) {
    console.log(`Usuário administrador "${login}" criado. Use o login e a senha configurados no .env.`);
  } else {
    console.log(`O usuário "${login}" já existe; nenhuma senha ou dado foi alterado.`);
  }
}

main()
  .catch((error) => {
    console.error('Não foi possível criar o usuário inicial:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
