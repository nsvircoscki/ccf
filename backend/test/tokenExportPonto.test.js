import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenExportPonto } from '../src/middlewares/tokenExportPonto.js';

const TOKEN_A = 'a'.repeat(40);
const TOKEN_B = 'b'.repeat(40);

function chamar(authorization) {
  let status = 200;
  let passou = false;
  const res = { status(s) { status = s; return this; }, json() { return this; } };
  tokenExportPonto({ headers: authorization ? { authorization } : {} }, res, () => { passou = true; });
  return { status, passou };
}

test('sem variável configurada: export desligado (503)', () => {
  delete process.env.PONTO_EXPORT_TOKENS;
  assert.equal(chamar(`Bearer ${TOKEN_A}`).status, 503);
});

test('token certo passa, errado ou ausente não', () => {
  process.env.PONTO_EXPORT_TOKENS = TOKEN_A;
  assert.ok(chamar(`Bearer ${TOKEN_A}`).passou);
  assert.equal(chamar(`Bearer ${TOKEN_B}`).status, 401);
  assert.equal(chamar().status, 401);
  assert.equal(chamar(TOKEN_A).status, 401);
});

test('rotação: dois tokens aceitos ao mesmo tempo; token curto é ignorado', () => {
  process.env.PONTO_EXPORT_TOKENS = `${TOKEN_A}, ${TOKEN_B}, curto`;
  assert.ok(chamar(`Bearer ${TOKEN_A}`).passou);
  assert.ok(chamar(`Bearer ${TOKEN_B}`).passou);
  assert.equal(chamar('Bearer curto').status, 401);
  delete process.env.PONTO_EXPORT_TOKENS;
});
