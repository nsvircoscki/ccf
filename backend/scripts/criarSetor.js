// scripts/criarSetor.js
// Cria um setor (Role) no banco, se ainda não existir. Depois disso ele já
// aparece na tela Configurações → Usuários para cadastrar pessoas.
// O que o setor pode acessar fica em src/config/permissoes.js (backend) e
// frontend/src/utils/permissoes.js (tela) — um setor sem entrada lá não
// acessa nenhum módulo.
//
// Uso (na pasta backend):  node scripts/criarSetor.js ADM
import { prisma } from '../src/prisma.js';

const nome = String(process.argv[2] || '').trim().toUpperCase();

async function main() {
  if (!/^[A-Z]{2,10}$/.test(nome)) {
    console.error('Informe o nome do setor (2 a 10 letras), ex.: node scripts/criarSetor.js ADM');
    process.exitCode = 1;
    return;
  }
  const existente = await prisma.role.findUnique({ where: { name: nome } });
  if (existente) {
    console.log(`O setor ${nome} já existe.`);
    return;
  }
  await prisma.role.create({ data: { name: nome } });
  console.log(`Setor ${nome} criado. Já dá para cadastrar pessoas nele em Configurações → Usuários.`);
}

main()
  .catch((erro) => { console.error(erro); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
