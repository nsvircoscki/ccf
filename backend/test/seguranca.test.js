import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chaveProibida, limitarTentativasLogin } from '../src/middlewares/seguranca.js';

test('bloqueia operadores do Prisma e prototype pollution em qualquer profundidade', () => {
  assert.equal(chaveProibida({ id: { not: '' } }), 'not');
  assert.equal(chaveProibida({ itens: [{ servicoId: { in: ['a'] } }] }), 'in');
  assert.equal(chaveProibida(JSON.parse('{"a":{"__proto__":{"admin":true}}}')), '__proto__');
  assert.equal(chaveProibida({ OR: [] }), 'OR');
});

test('deixa passar os corpos normais das telas', () => {
  assert.equal(chaveProibida({ nome: 'Ana', dias: { segunda: [{ entrada: '07:40', saida: '12:00' }] } }), null);
  assert.equal(chaveProibida({ batidas: [{ clientId: 'x', tipo: 'ENTRADA', batidoEm: '2026-10-01T10:00:00Z' }] }), null);
  assert.equal(chaveProibida('texto'), null);
  assert.equal(chaveProibida(undefined), null);
});

// Simula req/res do Express o suficiente para o middleware.
function chamarLogin(ip, login, status) {
  const ouvintes = [];
  const res = {
    statusCode: status,
    set() {},
    status(codigo) { this.statusCode = codigo; return this; },
    json(corpo) { this.corpo = corpo; return this; },
    on(evento, fn) { if (evento === 'finish') ouvintes.push(fn); },
  };
  let passou = false;
  limitarTentativasLogin({ ip, body: { login } }, res, () => { passou = true; });
  if (passou) { res.statusCode = status; ouvintes.forEach((fn) => fn()); }
  return { passou, statusCode: res.statusCode };
}

test('login: bloqueia depois de 8 senhas erradas para o mesmo usuário e IP', () => {
  for (let i = 0; i < 8; i += 1) assert.equal(chamarLogin('10.0.0.1', 'ana', 400).passou, true);
  const bloqueado = chamarLogin('10.0.0.1', 'ana', 200);
  assert.equal(bloqueado.passou, false);
  assert.equal(bloqueado.statusCode, 429);
  // Outro usuário no mesmo IP ainda entra.
  assert.equal(chamarLogin('10.0.0.1', 'bruno', 200).passou, true);
});
