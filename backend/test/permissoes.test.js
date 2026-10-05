import { test } from 'node:test';
import assert from 'node:assert/strict';
import { temAcessoAoModulo, exigirModulo } from '../src/config/permissoes.js';

test('mesma tabela da tela: ENG/DEV tudo, TOPO sem financeiro nem cadastros', () => {
  assert.equal(temAcessoAoModulo('ENG', 'faturamento'), true);
  assert.equal(temAcessoAoModulo('CRD', 'faturamento'), true);
  assert.equal(temAcessoAoModulo('TOPO', 'faturamento'), false);
  assert.equal(temAcessoAoModulo('TOPO', 'clientes'), false);
  assert.equal(temAcessoAoModulo('DES', 'orcamento'), false);
  assert.equal(temAcessoAoModulo('SETOR_INEXISTENTE', 'kanban'), false);
});

test('exigirModulo: 403 sem acesso, segue com acesso a qualquer um dos módulos', () => {
  const res = { status(c) { this.codigo = c; return this; }, json() { return this; } };
  let seguiu = false;
  exigirModulo('faturamento')({ usuario: { setor: 'TOPO' } }, res, () => { seguiu = true; });
  assert.equal(seguiu, false);
  assert.equal(res.codigo, 403);
  exigirModulo('clientes', 'vinculacao')({ usuario: { setor: 'DES' } }, res, () => { seguiu = true; });
  assert.equal(seguiu, true);
});
