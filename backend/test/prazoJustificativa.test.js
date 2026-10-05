import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prazoJustificativaEncerrado } from '../src/services/sisPontoService.js';

// 01/10/2026 13:05 em São Paulo = 16:05 UTC; 48 h depois = 03/10 16:05 UTC.
test('prazo de justificativa conta a partir do fim do período, no fuso local', () => {
  assert.equal(prazoJustificativaEncerrado('2026-10-01', '13:05', 48, new Date('2026-10-03T16:04:00Z')), false);
  assert.equal(prazoJustificativaEncerrado('2026-10-01', '13:05', 48, new Date('2026-10-03T16:06:00Z')), true);
});

test('prazo configurável', () => {
  const agora = new Date('2026-10-02T16:06:00Z');
  assert.equal(prazoJustificativaEncerrado('2026-10-01', '13:05', 24, agora), true);
  assert.equal(prazoJustificativaEncerrado('2026-10-01', '13:05', 72, agora), false);
});
