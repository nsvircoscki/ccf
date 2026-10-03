// src/middlewares/tokenExportPonto.js
// Acesso do PC da folha ao export de pontos. Não é sessão de pessoa: é um
// token de máquina, fixo, guardado em PONTO_EXPORT_TOKENS (fora do repositório).
//
// Aceita vários tokens separados por vírgula pra permitir troca sem
// interrupção: adiciona o novo, troca no PC da folha, remove o antigo e
// reinicia o backend. Sem a variável, o export fica desligado (503).
import { createHash, timingSafeEqual } from 'node:crypto';

const TAMANHO_MINIMO = 32;
const hash = (texto) => createHash('sha256').update(texto).digest();

function tokensConfigurados() {
  return String(process.env.PONTO_EXPORT_TOKENS || '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length >= TAMANHO_MINIMO)
    .map(hash);
}

export function tokenExportPonto(req, res, next) {
  const configurados = tokensConfigurados();
  if (!configurados.length) {
    return res.status(503).json({ error: 'Export de pontos desligado (PONTO_EXPORT_TOKENS não configurado).' });
  }

  // Só header: token na URL acaba em log de proxy e histórico.
  const cabecalho = req.headers.authorization || '';
  const recebido = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7).trim() : '';
  // Compara os hashes (tamanho fixo) e percorre todos, pra não vazar por tempo
  // de resposta qual token ou quantos caracteres bateram.
  const hRecebido = hash(recebido);
  const valido = configurados.reduce((ok, h) => timingSafeEqual(h, hRecebido) || ok, false);
  if (!recebido || !valido) return res.status(401).json({ error: 'Token de export inválido.' });

  next();
}
