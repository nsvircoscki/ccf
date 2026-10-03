import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classificarSequencia, montarPares, chaveDiaLocal, formatarDataPlanilha } from '../src/services/ponto/sequencia.js';

const TZ = 'America/Sao_Paulo';
let seq = 0;
// Horário local de São Paulo (UTC-3, sem horário de verão desde 2019).
const b = (tipo, local, extra = {}) => ({ clientId: `c${++seq}`, tipo, batidoEm: new Date(`${local}-03:00`).toISOString(), ...extra });

test('sequência normal não tem inconsistência', () => {
  const r = classificarSequencia([
    b('ENTRADA', '2026-10-01T08:00:00'), b('SAIDA', '2026-10-01T12:00:00'),
    b('ENTRADA', '2026-10-01T13:00:00'), b('SAIDA', '2026-10-01T17:00:00'),
  ]);
  assert.ok(r.every((x) => !x.inconsistente));
});

test('duas entradas seguidas: a segunda é marcada, nenhuma descartada', () => {
  const lista = [b('ENTRADA', '2026-10-01T08:00:00'), b('ENTRADA', '2026-10-01T08:05:00'), b('SAIDA', '2026-10-01T12:00:00')];
  const r = classificarSequencia(lista);
  assert.equal(r.length, 3);
  assert.deepEqual(r.map((x) => x.inconsistente), [false, true, false]);
  assert.equal(r[1].motivoInconsistencia, 'ENTRADA_SEGUIDA');
});

test('saída sem entrada é marcada', () => {
  const r = classificarSequencia([b('SAIDA', '2026-10-01T12:00:00')]);
  assert.equal(r[0].motivoInconsistencia, 'SAIDA_SEM_ENTRADA');
});

test('ordem de chegada não importa (batida offline chega depois)', () => {
  const entrada = b('ENTRADA', '2026-10-01T08:00:00');
  const saida = b('SAIDA', '2026-10-01T12:00:00');
  assert.ok(classificarSequencia([saida, entrada]).every((x) => !x.inconsistente));
});

test('intervalo longo reinicia a sequência esperada', () => {
  const r = classificarSequencia([b('ENTRADA', '2026-10-01T08:00:00'), b('ENTRADA', '2026-10-02T08:00:00')]);
  assert.ok(r.every((x) => !x.inconsistente));
});

test('pares: normal, sem saída e sem entrada', () => {
  const pares = montarPares([
    b('ENTRADA', '2026-10-01T08:00:00'), b('SAIDA', '2026-10-01T12:00:00'),
    b('ENTRADA', '2026-10-01T13:00:00'),
    b('SAIDA', '2026-10-02T12:00:00'),
  ]);
  assert.equal(pares.length, 3);
  assert.deepEqual(pares[0].observacoes, []);
  assert.equal(pares[1].saida, null);
  assert.deepEqual(pares[1].observacoes, ['SEM_SAIDA']);
  assert.equal(pares[2].entrada, null);
  assert.deepEqual(pares[2].observacoes, ['SEM_ENTRADA']);
});

test('pares: turno que vira a meia-noite forma par', () => {
  const pares = montarPares([b('ENTRADA', '2026-10-01T22:00:00'), b('SAIDA', '2026-10-02T06:00:00')]);
  assert.equal(pares.length, 1);
  assert.ok(pares[0].entrada && pares[0].saida);
});

test('pares: entrada repetida vira SEM_SAIDA + par com observação de inconsistência', () => {
  const e1 = b('ENTRADA', '2026-10-01T08:00:00');
  const e2 = b('ENTRADA', '2026-10-01T08:05:00', { inconsistente: true, motivoInconsistencia: 'ENTRADA_SEGUIDA' });
  const s = b('SAIDA', '2026-10-01T12:00:00');
  const pares = montarPares([e1, e2, s]);
  assert.equal(pares.length, 2);
  assert.deepEqual(pares[0].observacoes, ['SEM_SAIDA']);
  assert.deepEqual(pares[1].observacoes, ['INCONSISTENTE:ENTRADA_SEGUIDA']);
});

test('fuso: 01:30 UTC ainda é o dia anterior em São Paulo', () => {
  assert.equal(chaveDiaLocal('2026-10-02T01:30:00Z', TZ), '2026-10-01');
  assert.equal(formatarDataPlanilha('2026-10-02T01:30:05Z', TZ), '10/1/2026 22:30:05');
  assert.equal(formatarDataPlanilha('2026-10-01T11:05:00Z', TZ), '10/1/2026 8:05:00');
  assert.equal(formatarDataPlanilha('2026-10-01T03:00:00Z', TZ), '10/1/2026 0:00:00');
});
