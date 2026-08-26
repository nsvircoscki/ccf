import {prisma} from '../src/prisma.js';

async function main() {
    const role = await prisma.role.upsert({
        where: { name: 'DEV' },
        update: {},
        create: { name: 'DEV' },
    });

    await prisma.user.upsert({
        where: { email: 'dev@ccf.local' },
        update: {},
        create: { name: 'Dev', email: 'dev@ccf.local', roleId: role.id }, 
    });

    console.log('Usuário DEV criado - na primeira vez, use "criar senha" na tela de login.');
    
}

main().catch(console.error).finally(() => prisma.$disconnect());