// scripts/verificarSyncPonto.js
// Verifica no banco de DEV que o sync é idempotente: o mesmo lote enviado duas
// vezes grava uma linha por clientId e a segunda resposta vem "duplicado".
// Também confere a marcação de sequência inconsistente. Apaga o que criou.
//
// Uso (na pasta backend, com a migration aplicada):
//   node scripts/verificarSyncPonto.js <id de um User com "registra ponto">
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/prisma.js';
import { sincronizar } from '../src/services/ponto/batidaService.js';

async function main() {
  const userId = process.argv[2];
  const alvo = userId && await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!alvo) throw new Error('Passe o id de um User existente: node scripts/verificarSyncPonto.js <userId>');
  if (!alvo.ativo || !alvo.registraPonto) throw new Error('O User precisa estar ativo e com "registra ponto".');

  const quem = { id: alvo.id, nome: alvo.name, setor: alvo.role.name };
  // Data bem antiga, longe de batidas reais, pra não interferir na sequência
  // delas (janela de 16h).
  const base = new Date('2000-01-03T11:00:00Z').getTime();
  const lote = [
    { tipo: 'ENTRADA', minutos: 0 },
    { tipo: 'ENTRADA', minutos: 5 }, // duas entradas seguidas -> inconsistente
    { tipo: 'SAIDA', minutos: 240 },
  ].map(({ tipo, minutos }) => ({
    clientId: `verif-${randomUUID()}`, funcionarioId: alvo.id, tipo,
    batidoEm: new Date(base + minutos * 60000).toISOString(), deviceId: 'verificacao',
  }));
  const ids = lote.map((b) => b.clientId);

  try {
    const primeira = await sincronizar(lote, quem, { deviceId: 'verificacao', pendentes: 3 });
    assert.deepEqual(primeira.resultados.map((r) => r.status), ['criado', 'criado', 'criado']);

    const segunda = await sincronizar(lote, quem, { deviceId: 'verificacao', pendentes: 3 });
    assert.deepEqual(segunda.resultados.map((r) => r.status), ['duplicado', 'duplicado', 'duplicado']);

    const gravadas = await prisma.pontoBatida.findMany({ where: { clientId: { in: ids } }, orderBy: { batidoEm: 'asc' } });
    assert.equal(gravadas.length, 3, 'uma linha por clientId');
    assert.deepEqual(gravadas.map((b) => b.inconsistente), [false, true, false]);
    assert.ok(gravadas.every((b) => b.recebidoEm instanceof Date), 'recebidoEm gravado');

    const rejeitado = await sincronizar([{ ...lote[0], clientId: `verif-${randomUUID()}`, tipo: 'XYZ' }], quem);
    assert.equal(rejeitado.resultados[0].status, 'rejeitado');

    console.log('OK: sync idempotente, recebidoEm gravado, sequência inconsistente marcada, item inválido rejeitado.');
  } finally {
    await prisma.pontoBatida.deleteMany({ where: { clientId: { startsWith: 'verif-' } } });
    await prisma.pontoDispositivo.deleteMany({ where: { deviceId: 'verificacao' } });
  }
}

main()
  .catch((erro) => { console.error('FALHOU:', erro.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
