import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { COLUNAS_EXPORT, formatarCsv, montarLinhasExport, interpretarPeriodo } from '../src/services/ponto/exportCsv.js';

const TZ = 'America/Sao_Paulo';
const exemplo = fs.readFileSync(new URL('./fixtures/planilha-exemplo.csv', import.meta.url), 'utf8').trim().split(/\r?\n/);
const cabecalhoPlanilha = exemplo[0].split(',');

// Mesmo formato aceito pelo calculo.js do Sistema Ponto (dayjs strict).
const FORMATO_DATA = /^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2}$/;

let seq = 0;
const b = (tipo, local) => ({ clientId: `c${++seq}`, tipo, batidoEm: new Date(`${local}-03:00`).toISOString() });

function gerar(batidas, mes = '2026-10') {
  const usuarios = [{ id: 'user-1', email: ' Pessoa@Empresa.com ' }];
  const periodo = interpretarPeriodo({ mes });
  const linhas = montarLinhasExport(usuarios, new Map([['user-1', batidas]]), periodo.periodos, TZ);
  return { linhas, csv: formatarCsv(COLUNAS_EXPORT, linhas) };
}

test('cabeçalho começa com as colunas da planilha atual, na mesma ordem', () => {
  assert.deepEqual(COLUNAS_EXPORT.slice(0, cabecalhoPlanilha.length), cabecalhoPlanilha);
});

test('datas no mesmo formato do exemplo da planilha', () => {
  for (const linha of exemplo.slice(1)) {
    const [, , timeIn, timeOut] = linha.split(',');
    assert.match(timeIn, FORMATO_DATA);
    assert.match(timeOut, FORMATO_DATA);
  }
  const { linhas } = gerar([b('ENTRADA', '2026-10-01T08:00:00'), b('SAIDA', '2026-10-01T12:30:00')]);
  assert.match(linhas[0]['Time In'], FORMATO_DATA);
  assert.equal(linhas[0]['Time In'], '10/1/2026 8:00:00');
  assert.equal(linhas[0]['Time Out'], '10/1/2026 12:30:00');
  assert.equal(linhas[0]['Total Hours'], '4.50');
});

test('sem dado monetário: Hourly Wage vazio e Total Wages = 0 (código normal)', () => {
  const { linhas, csv } = gerar([b('ENTRADA', '2026-10-01T08:00:00'), b('SAIDA', '2026-10-01T12:00:00')]);
  assert.equal(linhas[0]['Hourly Wage'], '');
  assert.equal(linhas[0]['Total Wages'], 0);
  assert.equal(csv.split('\r\n')[1], ',pessoa@empresa.com,10/1/2026 8:00:00,10/1/2026 12:00:00,4.00,,0,user-1,');
});

test('ponto sem saída não some: sai com Time Out vazio e observação', () => {
  const { linhas } = gerar([b('ENTRADA', '2026-10-01T08:00:00')]);
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0]['Time Out'], '');
  assert.equal(linhas[0]['Total Hours'], '');
  assert.equal(linhas[0].Observacao, 'SEM_SAIDA');
});

test('filtra pelo mês da entrada', () => {
  const { linhas } = gerar([
    b('ENTRADA', '2026-09-30T22:00:00'), b('SAIDA', '2026-10-01T02:00:00'),
    b('ENTRADA', '2026-10-01T08:00:00'), b('SAIDA', '2026-10-01T12:00:00'),
  ]);
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0]['Time In'], '10/1/2026 8:00:00');
});

test('escape RFC 4180', () => {
  assert.equal(formatarCsv(['a'], [{ a: 'x,"y"' }]), 'a\r\n"x,""y"""\r\n');
});

test('interpretarPeriodo valida mes/ano', () => {
  assert.equal(interpretarPeriodo({ mes: '2026-13' }), null);
  assert.equal(interpretarPeriodo({}), null);
  assert.equal(interpretarPeriodo({ ano: '2026' }).periodos.size, 12);
});
