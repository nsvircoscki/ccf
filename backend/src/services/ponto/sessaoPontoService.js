// src/services/ponto/sessaoPontoService.js
// Sessão "só ponto" por aparelho. Depois de um login normal, o app pede uma
// (POST /auth/sessao-ponto) e guarda o token: com ele as batidas feitas
// offline sobem quando o servidor voltar, mesmo que a sessão normal (12h)
// já tenha vencido. Vale 60 dias e renova a cada envio aceito; revogar por
// aparelho ou todas da pessoa corta na hora (o token é conferido no banco).
import { prisma } from '../../prisma.js';
import { gerarTokenPonto, verificarToken, VALIDADE_SESSAO_PONTO_MS } from '../../config/jwt.js';

const novaValidade = () => new Date(Date.now() + VALIDADE_SESSAO_PONTO_MS);

// Uma sessão ativa por pessoa e aparelho: pedir de novo substitui a anterior.
export async function criarSessaoPonto(usuario, deviceId, userAgent) {
  const aparelho = String(deviceId || '').trim().slice(0, 100);
  if (aparelho.length < 8) throw new Error('Aparelho não identificado.');
  const agora = new Date();
  const sessao = await prisma.$transaction(async (tx) => {
    await tx.pontoSessao.updateMany({
      where: { userId: usuario.id, deviceId: aparelho, revogadoEm: null },
      data: { revogadoEm: agora, revogadoPorId: usuario.id },
    });
    return tx.pontoSessao.create({
      data: { userId: usuario.id, deviceId: aparelho, expiraEm: novaValidade(), userAgent: userAgent ? String(userAgent).slice(0, 300) : null },
    });
  });
  return { tokenPonto: gerarTokenPonto(sessao.id, usuario.id), expiraEm: sessao.expiraEm.toISOString() };
}

// Confere um token qualquer do POST /sis-ponto/sync.
// Devolve { quem, sessao? } se vale, ou { motivo } explicando por que não.
export async function identificarParaSync(token) {
  if (!token) return { motivo: 'Envio sem sessão.' };
  let payload;
  try {
    payload = verificarToken(token);
  } catch (erro) {
    return { motivo: erro?.name === 'TokenExpiredError' ? 'Sessão expirada.' : 'Sessão inválida.' };
  }

  let sessao = null;
  if (payload.escopo === 'ponto') {
    sessao = await prisma.pontoSessao.findUnique({ where: { id: String(payload.sid || '') } });
    if (!sessao || sessao.userId !== payload.sub) return { motivo: 'Sessão do aparelho inválida.' };
    if (sessao.revogadoEm) return { motivo: 'Sessão do aparelho revogada.' };
    if (sessao.expiraEm < new Date()) return { motivo: 'Sessão do aparelho expirada.' };
  } else if (payload.escopo) {
    return { motivo: 'Sessão inválida.' };
  }

  const usuario = await prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
  if (!usuario || !usuario.ativo) return { motivo: 'Usuário inativo ou inexistente.' };
  return { quem: { id: usuario.id, nome: usuario.name, setor: usuario.role.name }, sessao };
}

// Envio aceito: estende a validade e devolve um token novo (o app troca o guardado).
export async function renovarSessao(sessao) {
  const atualizada = await prisma.pontoSessao.update({
    where: { id: sessao.id },
    data: { expiraEm: novaValidade(), ultimoUso: new Date() },
  });
  return { tokenPonto: gerarTokenPonto(atualizada.id, atualizada.userId), expiraEm: atualizada.expiraEm.toISOString() };
}

export async function listarSessoes(userId) {
  const sessoes = await prisma.pontoSessao.findMany({
    where: { userId, revogadoEm: null, expiraEm: { gt: new Date() } },
    orderBy: { criadoEm: 'desc' },
  });
  return sessoes.map((s) => ({
    id: s.id, deviceId: s.deviceId, criadoEm: s.criadoEm, expiraEm: s.expiraEm, ultimoUso: s.ultimoUso, userAgent: s.userAgent,
  }));
}

// filtro: { sessaoId } (um aparelho) | { deviceId } | {} (todas da pessoa).
export async function revogarSessoes(userId, filtro, quem) {
  const where = { userId, revogadoEm: null };
  if (filtro?.sessaoId) where.id = String(filtro.sessaoId);
  if (filtro?.deviceId) where.deviceId = String(filtro.deviceId);
  const { count } = await prisma.pontoSessao.updateMany({ where, data: { revogadoEm: new Date(), revogadoPorId: quem.id } });
  return { revogadas: count };
}
