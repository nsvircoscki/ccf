import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pascoa, feriadosDoAno, validarConfigFeriados, CONFIG_FERIADOS_PADRAO } from '../src/services/ponto/feriados.js';

test('Páscoa de anos conhecidos', () => {
  assert.equal(pascoa(2024).toISOString().slice(0, 10), '2024-03-31');
  assert.equal(pascoa(2025).toISOString().slice(0, 10), '2025-04-20');
  assert.equal(pascoa(2026).toISOString().slice(0, 10), '2026-04-05');
  assert.equal(pascoa(2027).toISOString().slice(0, 10), '2027-03-28');
});

test('2026 na configuração da CCF (São Bento do Sul)', () => {
  const dias = Object.fromEntries(feriadosDoAno(2026).map((f) => [f.dia, f.nome]));
  assert.equal(dias['2026-04-03'], 'Sexta-feira Santa');
  assert.equal(dias['2026-09-23'], 'Aniversário de São Bento do Sul');
  assert.equal(dias['2026-11-20'], 'Dia da Consciência Negra');
  // Carnaval, Quarta de Cinzas e Corpus Christi: trabalha.
  assert.equal(dias['2026-06-04'], undefined);
  assert.equal(dias['2026-02-16'], undefined);
  assert.equal(dias['2026-02-17'], undefined);
  assert.equal(dias['2026-02-18'], undefined);
  // Data Magna de SC vai para o domingo: não tira dia útil.
  assert.equal(dias['2026-08-11'], undefined);
  assert.equal(feriadosDoAno(2026).length, 11);
});

test('carnaval ligado e feriado de um ano só', () => {
  const dias = feriadosDoAno(2026, { carnaval: true, corpusChristi: false, extras: [{ data: '2026-12-24', nome: 'Recesso' }] }).map((f) => f.dia);
  assert.ok(dias.includes('2026-02-16') && dias.includes('2026-02-17'));
  assert.ok(!dias.includes('2026-06-04'));
  assert.ok(dias.includes('2026-12-24'));
  assert.ok(!feriadosDoAno(2027, { extras: [{ data: '2026-12-24', nome: 'Recesso' }] }).some((f) => f.dia === '2027-12-24'));
});

test('validação da configuração', () => {
  assert.deepEqual(validarConfigFeriados(CONFIG_FERIADOS_PADRAO), CONFIG_FERIADOS_PADRAO);
  assert.throws(() => validarConfigFeriados({ extras: [{ data: '31/12', nome: 'x' }] }), /inválida/);
  assert.throws(() => validarConfigFeriados({ extras: [{ data: '12-31', nome: '' }] }), /nome/);
});
