// src/middlewares/autenticar.js
import { prisma } from '../prisma.js';
import { verificarToken } from '../config/jwt.js';

function extrairToken(req) {
  const cabecalho = req.headers.authorization || '';
  if (cabecalho.startsWith('Bearer ')) return cabecalho.slice(7);

  // <img src>, <a href> e window.open não conseguem mandar header — pros
  // recursos abertos assim (PDFs de ficha, boleto e nota, imagem do mapa) o
  // token vem na URL. Só em GET: nenhuma escrita aceita token por query string.
  if (req.method === 'GET' && typeof req.query.token === 'string') return req.query.token;

  return null;
}

// Identifica quem está chamando e preenche req.usuario = { id, nome, setor }.
// O setor sai do banco, não do token nem do corpo da requisição — é o que
// impede alguém de se passar por outro setor ou por outra pessoa.
export async function autenticar(req, res, next) {
  const token = extrairToken(req);
  if (!token) return res.status(401).json({ error: 'Sessão ausente. Faça login.' });

  let payload;
  try {
    payload = verificarToken(token);
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }

  const usuario = await prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ error: 'Usuário inativo ou inexistente.' });
  }

  req.usuario = { id: usuario.id, nome: usuario.name, setor: usuario.role.name };
  next();
}

// Uso: router.put('/:tipo', exigirSetor('ENG', 'DEV'), controller.atualizar)
// Precisa vir depois de autenticar.
export function exigirSetor(...setores) {
  return (req, res, next) => {
    if (!req.usuario || !setores.includes(req.usuario.setor)) {
      return res.status(403).json({ error: 'Sem permissão para esta ação.' });
    }
    next();
  };
}
