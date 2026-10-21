import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CAR_ETAPAS,
  calcularQuantidadeMf,
  converterHaParaM2,
  converterM2ParaHa,
  diagnosticarCar,
} from './carLogic.js';

test('combina histórico, APP e PRA em uma única etapa', () => {
  assert.deepEqual(CAR_ETAPAS, [
    'Dados gerais',
    'Porte e vegetação',
    'Histórico, APP e PRA',
    'Relatório final',
  ]);
});

test('converte a área entre hectares e metros quadrados', () => {
  assert.equal(converterHaParaM2('35'), '350000');
  assert.equal(converterHaParaM2('1,5'), '15000');
  assert.equal(converterM2ParaHa('350000'), '35');
  assert.equal(converterM2ParaHa('12345,67'), '1.234567');
});

test('não converte área vazia ou inválida', () => {
  assert.equal(converterHaParaM2(''), '');
  assert.equal(converterHaParaM2('abc'), '');
  assert.equal(converterM2ParaHa('-1'), '');
});

test('calcula a quantidade de módulos fiscais corretamente', () => {
  assert.equal(calcularQuantidadeMf(35, 14), 2.5);
  assert.equal(calcularQuantidadeMf('35,5', '14'), 35.5 / 14);
  assert.equal(calcularQuantidadeMf(100, 20), 5);
  assert.equal(calcularQuantidadeMf(0, 14), 0);
});

test('diagnostica uma propriedade pequena com passivo e PRA recomendado', () => {
  const relatorio = diagnosticarCar({
    municipio: 'São Bento do Sul',
    uf: 'SC',
    areaTotalHa: 35,
    moduloFiscalHa: 14,
    areaVegetacaoNativaHa: 6,
    areaAppHa: 2,
    areaConsolidadaAntes2008: 'Sim',
    passivoReservaLegal: 'Sim',
    passivoApp: 'Não',
    passivoUsoRestrito: 'Não',
    aderirPRA: 'Sim',
  });

  assert.equal(relatorio.resumoImovel.quantidadeMF, 2.5);
  assert.equal(relatorio.resumoImovel.enquadramento, 'Pequena Propriedade / Agricultura Familiar (<= 4 MF)');
  assert.equal(relatorio.passivoDetectado, true);
  assert.equal(relatorio.diagnosticoEInstrucoes.regularizacaoPRA.status, 'Adesão Recomendada');
});

test('diagnostica uma propriedade maior que 4 MF sem passivo', () => {
  const relatorio = diagnosticarCar({
    municipio: 'Rio do Sul',
    uf: 'SC',
    areaTotalHa: 120,
    moduloFiscalHa: 14,
    areaVegetacaoNativaHa: 28,
    areaAppHa: 1.5,
    areaConsolidadaAntes2008: 'Não',
    passivoReservaLegal: 'Não',
    passivoApp: 'Não',
    passivoUsoRestrito: 'Não',
    aderirPRA: 'Não',
  });

  assert.equal(relatorio.resumoImovel.enquadramento, 'Propriedade acima de 4 Módulos Fiscais');
  assert.equal(relatorio.passivoDetectado, false);
  assert.equal(relatorio.recomendacao, 'Sem passivo detectado no diagnóstico. O preenchimento pode seguir em conformidade direta.');
});

test('interpreta área em hectares com vírgula decimal no diagnóstico', () => {
  const relatorio = diagnosticarCar({ areaTotalHa: '35,5', moduloFiscalHa: '14' });

  assert.equal(relatorio.resumoImovel.areaTotalHa, 35.5);
  assert.equal(relatorio.resumoImovel.quantidadeMF, Number((35.5 / 14).toFixed(2)));
});
