import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataLocalParaUtc, horariosPrevistos, horariosSemBatida, montarPares, nomeDiaSemana } from '../src/services/ponto/sequencia.js';
import { COLUNAS_EXPORT, formatarCsv, montarLinhasExport, interpretarPeriodo } from '../src/services/ponto/exportCsv.js';

const TZ = 'America/Sao_Paulo';
const integral = { dias: Object.fromEntries(['segunda', 'terca', 'quarta', 'quinta', 'sexta'].map((d) => [d, [{ entrada: '08:00', saida: '12:00' }, { entrada: '13:00', saida: '18:00' }]])) };
let seq = 0;
const b = (tipo, local, extra = {}) => ({ clientId: `c${++seq}`, tipo, batidoEm: new Date(`${local}-03:00`).toISOString(), ...extra });

test('hora local -> UTC no fuso de São Paulo', () => {
  assert.equal(dataLocalParaUtc('2026-10-01', '08:00', TZ).toISOString(), '2026-10-01T11:00:00.000Z');
  assert.equal(dataLocalParaUtc('2026-10-01', '23:30', TZ).toISOString(), '2026-10-02T02:30:00.000Z');
});

test('jornada só em dia útil', () => {
  assert.equal(nomeDiaSemana('2026-10-03'), 'sabado');
  assert.deepEqual(horariosPrevistos(integral, '2026-10-03'), []);
  assert.equal(horariosPrevistos(integral, '2026-10-01').length, 4);
});

test('esqueceu a saída da tarde: só ela fica sem batida', () => {
  const previstos = horariosPrevistos(integral, '2026-10-01');
  const reais = [b('ENTRADA', '2026-10-01T08:07:00'), b('SAIDA', '2026-10-01T12:01:00'), b('ENTRADA', '2026-10-01T12:58:00')];
  const faltando = horariosSemBatida(previstos, reais, '2026-10-01', TZ);
  assert.deepEqual(faltando.map((p) => `${p.tipo} ${p.hora}`), ['SAIDA 18:00']);
});

test('saída tarde (hora extra) ainda cobre a saída prevista', () => {
  const previstos = horariosPrevistos(integral, '2026-10-01');
  const reais = [b('ENTRADA', '2026-10-01T08:00:00'), b('SAIDA', '2026-10-01T12:00:00'), b('ENTRADA', '2026-10-01T13:00:00'), b('SAIDA', '2026-10-01T19:40:00')];
  assert.equal(horariosSemBatida(previstos, reais, '2026-10-01', TZ).length, 0);
});

test('dia sem nenhuma batida: os 4 horários ficam sem batida', () => {
  assert.equal(horariosSemBatida(horariosPrevistos(integral, '2026-10-01'), [], '2026-10-01', TZ).length, 4);
});

test('par com prevista leva a decisão do ENG na observação', () => {
  const entrada = b('ENTRADA', '2026-10-01T13:00:00');
  const pendente = b('SAIDA', '2026-10-01T18:00:00', { origem: 'PREVISTA', situacao: 'PENDENTE' });
  assert.deepEqual(montarPares([entrada, pendente])[0].observacoes, ['PREVISTA_PENDENTE']);
  const falta = { ...pendente, situacao: 'FALTA' };
  assert.deepEqual(montarPares([entrada, falta])[0].observacoes, ['FALTA']);
  const abonada = { ...pendente, situacao: 'ABONADA' };
  assert.deepEqual(montarPares([entrada, abonada])[0].observacoes, ['PREVISTA_ABONADA']);
});

function linhaDe(batidas) {
  const periodo = interpretarPeriodo({ mes: '2026-10' });
  return montarLinhasExport([{ id: 'u1', email: 'a@b.com' }], new Map([['u1', batidas]]), periodo.periodos, TZ)[0];
}

test('export: falta desconta as horas e sai com código 6', () => {
  const linha = linhaDe([b('ENTRADA', '2026-10-01T13:00:00', { origem: 'PREVISTA', situacao: 'FALTA' }), b('SAIDA', '2026-10-01T18:00:00', { origem: 'PREVISTA', situacao: 'FALTA' })]);
  assert.equal(linha['Total Hours'], '0.00');
  assert.equal(linha['Total Wages'], 6);
  assert.equal(linha.Observacao, 'FALTA');
  assert.match(formatarCsv(COLUNAS_EXPORT, [linha]), /,6,u1,FALTA/);
});

test('export: pendente não conta horas; abonada conta', () => {
  const entrada = b('ENTRADA', '2026-10-01T13:00:00');
  const pendente = linhaDe([entrada, b('SAIDA', '2026-10-01T18:00:00', { origem: 'PREVISTA', situacao: 'PENDENTE' })]);
  assert.equal(pendente['Total Hours'], '0.00');
  assert.equal(pendente['Total Wages'], 0);
  const abonada = linhaDe([entrada, b('SAIDA', '2026-10-01T18:00:00', { origem: 'PREVISTA', situacao: 'ABONADA' })]);
  assert.equal(abonada['Total Hours'], '5.00');
});
