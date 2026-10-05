// src/middlewares/seguranca.js
// Proteções gerais da API, aplicadas em server.js antes das rotas.

// Cabeçalhos básicos (o que o helmet faria, sem dependência nova): o
// navegador não "adivinha" tipo de arquivo, a API não abre dentro de iframe
// de outro site e não vaza a URL (que pode ter ?token=) em links externos.
export function cabecalhosSeguranca(_req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-site',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
}

// Nomes de operador do Prisma e chaves de "prototype pollution". Nenhuma tela
// manda essas chaves; se aparecerem no corpo é tentativa de trocar um valor
// simples por um filtro (ex.: { "id": { "not": "" } } num deleteMany, que
// apagaria tudo) ou de envenenar objetos do JavaScript. Bloqueia antes de
// chegar em qualquer service.
const CHAVES_PROIBIDAS = new Set([
  '__proto__', 'constructor', 'prototype',
  'equals', 'not', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte', 'contains', 'startsWith', 'endsWith', 'mode', 'search',
  'some', 'every', 'none', 'is', 'isNot', 'has', 'hasSome', 'hasEvery', 'isEmpty',
  'AND', 'OR', 'NOT',
  'connect', 'connectOrCreate', 'disconnect', 'upsert', 'createMany', 'updateMany', 'deleteMany',
  'increment', 'decrement', 'multiply', 'divide', 'push', 'unset',
]);
const PROFUNDIDADE_MAXIMA = 20;

export function chaveProibida(valor, profundidade = 0) {
  if (valor === null || typeof valor !== 'object') return null;
  if (profundidade > PROFUNDIDADE_MAXIMA) return '(profundidade)';
  for (const chave of Object.keys(valor)) {
    if (CHAVES_PROIBIDAS.has(chave)) return chave;
    const interna = chaveProibida(valor[chave], profundidade + 1);
    if (interna) return interna;
  }
  return null;
}

export function bloquearOperadores(req, res, next) {
  const chave = chaveProibida(req.body) || chaveProibida(req.query);
  if (chave) return res.status(400).json({ error: 'Requisição inválida.' });
  next();
}

// Login: depois de muitas tentativas erradas, bloqueia por um tempo — por
// pessoa (usuário digitado + IP) e por IP. Fica em memória: reiniciar o
// servidor zera os contadores (aceitável para um servidor só).
const JANELA_MS = 15 * 60 * 1000;
const MAX_POR_LOGIN = 8;
const MAX_POR_IP = 50;
const falhas = new Map(); // chave -> { quantidade, desde }

function contar(chave, agora) {
  const atual = falhas.get(chave);
  if (!atual || agora - atual.desde > JANELA_MS) return 0;
  return atual.quantidade;
}

function registrarFalha(chave, agora) {
  const atual = falhas.get(chave);
  if (!atual || agora - atual.desde > JANELA_MS) falhas.set(chave, { quantidade: 1, desde: agora });
  else atual.quantidade += 1;
}

export function limitarTentativasLogin(req, res, next) {
  const agora = Date.now();
  const ip = req.ip || req.socket?.remoteAddress || 'desconhecido';
  const login = String(req.body?.login || '').trim().toLowerCase().slice(0, 100);
  const chaveLogin = `login:${login}|${ip}`;
  const chaveIp = `ip:${ip}`;
  if (contar(chaveLogin, agora) >= MAX_POR_LOGIN || contar(chaveIp, agora) >= MAX_POR_IP) {
    res.set('Retry-After', String(JANELA_MS / 1000));
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.' });
  }
  res.on('finish', () => {
    if (res.statusCode === 400 || res.statusCode === 401) {
      registrarFalha(chaveLogin, Date.now());
      registrarFalha(chaveIp, Date.now());
    } else if (res.statusCode < 300) {
      falhas.delete(chaveLogin);
    }
  });
  next();
}

// Limpeza periódica pra o mapa não crescer sem limite.
setInterval(() => {
  const agora = Date.now();
  for (const [chave, valor] of falhas) if (agora - valor.desde > JANELA_MS) falhas.delete(chave);
}, JANELA_MS).unref();

// CORS: em produção o site e a API ficam no mesmo endereço (/api), então
// nenhum outro site precisa chamar a API. CORS_ORIGENS (separado por vírgula)
// restringe; sem ela continua aberto (desenvolvimento) e avisa ao subir.
export function opcoesCors() {
  const origens = String(process.env.CORS_ORIGENS || '').split(',').map((o) => o.trim()).filter(Boolean);
  if (!origens.length) {
    console.warn('Aviso: CORS_ORIGENS não configurado — a API aceita chamadas de qualquer site (ok só em desenvolvimento).');
    return {};
  }
  return { origin: origens };
}

// Último middleware: erro não tratado vira resposta genérica (o detalhe fica
// só no log do servidor, sem expor estrutura do banco ou caminhos de arquivo).
export function tratarErros(erro, _req, res, _next) {
  if (erro?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  if (erro?.type === 'entity.too.large') return res.status(413).json({ error: 'Arquivo ou dados grandes demais.' });
  console.error('Erro não tratado:', erro);
  if (res.headersSent) return undefined;
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}
