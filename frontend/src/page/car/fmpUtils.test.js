import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buscarModuloFiscal,
  buscarMunicipioPorNome,
  listarMunicipiosPorUf,
  normalizarUf,
  UFS_BRASIL,
} from './fmpUtils.js';

test('lista as 27 UFs brasileiras e normaliza nome ou sigla', () => {
  assert.equal(UFS_BRASIL.length, 27);
  assert.equal(normalizarUf('Santa Catarina'), 'SC');
  assert.equal(normalizarUf('df'), 'DF');
  assert.equal(normalizarUf('Estado desconhecido'), '');
});

test('filtra municípios pela UF e carrega o módulo fiscal da coluna G', () => {
  const municipiosSc = listarMunicipiosPorUf('SC');
  const saoBento = municipiosSc.find((municipio) => municipio.value === 'São Bento do Sul');

  assert.ok(municipiosSc.length > 0);
  assert.equal(saoBento.moduloFiscalHa, 16);
  assert.equal(buscarModuloFiscal('SC', 'Sao Bento do Sul'), 16);
  assert.equal(buscarMunicipioPorNome('PR', 'São Bento do Sul'), null);
});

test('não inventa municípios ou módulos fiscais ausentes na planilha', () => {
  assert.deepEqual(listarMunicipiosPorUf('AC'), []);
  assert.deepEqual(listarMunicipiosPorUf('DF'), []);
  assert.equal(buscarModuloFiscal('AC', 'Rio Branco'), null);
});
