// src/config/jwt.js
import jwt from 'jsonwebtoken';

// 12h cobre um dia de trabalho; expirou, a pessoa faz login de novo.
const VALIDADE = '12h';

// Sem fallback de propósito: um segredo padrão escrito aqui estaria no git, ou
// seja, público — e com ele qualquer um fabricaria token de qualquer usuário,
// inclusive ENG. Melhor o servidor nem subir. Chamado em server.js na partida.
export function garantirSegredoJwt() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado no .env do backend — o servidor não sobe sem ele.');
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('Aviso: JWT_SECRET curto (menos de 32 caracteres). Gere um forte: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
  }
}

// O token carrega só o id: nome, setor e se a pessoa está ativa são lidos do
// banco a cada requisição (ver middlewares/autenticar.js), então desativar ou
// trocar alguém de setor vale na hora, sem esperar o token expirar.
export function gerarToken(usuarioId) {
  return jwt.sign({ sub: usuarioId }, process.env.JWT_SECRET, { expiresIn: VALIDADE, algorithm: 'HS256' });
}

// Lança se a assinatura não conferir (conteúdo alterado) ou se expirou.
export function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
}
