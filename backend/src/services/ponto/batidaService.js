// src/services/ponto/batidaService.js
// Batidas de ponto no Postgres. O aparelho grava cada batida primeiro no
// IndexedDB (pode estar offline) e depois envia em lote pelo /sis-ponto/sync;
// o clientId gerado lá é a chave de idempotência.
import { randomUUID } from 'node:crypto';
import { prisma } from '../../prisma.js';
import { notificationService } from '../notificationService.js';
import { classificarSequencia, chaveDiaLocal, chaveMesLocal, montarPares, JANELA_PAR_MS } from './sequencia.js';
import { COLUNAS_EXPORT, formatarCsv, montarLinhasExport } from './exportCsv.js';

export const PADRAO_HORARIO_IDS = ['integral', 'manha', 'tarde'];
const SETORES_ADMIN = ['ENG', 'DEV'];
export const MAX_ITENS_SYNC = 500;
const UM_DIA = 24 * 3600 * 1000;

// --- Funcionários (= User com registraPonto) -------------------------------

function paraFuncionario(user) {
  return {
    id: user.id,
    nome: user.name,
    setor: user.role.name,
    horista: user.horista,
    padraoHorarioId: user.padraoHorarioId,
  };
}

export async function listarFuncionarios() {
  const users = await prisma.user.findMany({
    where: { ativo: true, registraPonto: true },
    include: { role: true },
    orderBy: [{ role: { name: 'asc' } }, { name: 'asc' }],
  });
  return users.map(paraFuncionario);
}

// Pela tela de jornada só muda a jornada e horista/mensalista; nome, setor e
// "registra ponto" são editados no cadastro de Usuários.
export async function atualizarFuncionario(id, dados) {
  const data = {};
  if (dados.padraoHorarioId !== undefined) {
    if (dados.padraoHorarioId !== null && !PADRAO_HORARIO_IDS.includes(dados.padraoHorarioId)) {
      throw new Error('Padrão de horário inválido.');
    }
    data.padraoHorarioId = dados.padraoHorarioId;
  }
  if (dados.horista !== undefined) data.horista = Boolean(dados.horista);

  const existe = await prisma.user.findUnique({ where: { id } });
  if (!existe) return null;
  const user = await prisma.user.update({ where: { id }, data, include: { role: true } });
  return paraFuncionario(user);
}

// --- Sync ----------------------------------------------------------------

function normalizarTipo(tipo) {
  const t = String(tipo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  return t === 'ENTRADA' || t === 'SAIDA' ? t : null;
}

function validarItem(item) {
  const clientId = typeof item?.clientId === 'string' ? item.clientId.trim() : '';
  if (clientId.length < 8 || clientId.length > 100) return { erro: 'clientId inválido.' };
  const tipo = normalizarTipo(item.tipo);
  if (!tipo) return { clientId, erro: 'Tipo deve ser ENTRADA ou SAIDA.' };
  const batidoEm = new Date(item.batidoEm);
  if (Number.isNaN(batidoEm.getTime())) return { clientId, erro: 'batidoEm inválido.' };
  // Relógio do aparelho muito adiantado: aceitar bagunçaria a sequência dos
  // próximos dias. Fica pendente no aparelho, com o erro visível.
  if (batidoEm.getTime() - Date.now() > UM_DIA) return { clientId, erro: 'Hora do aparelho no futuro. Confira o relógio.' };
  const funcionarioId = String(item.funcionarioId || '').trim();
  if (!funcionarioId) return { clientId, erro: 'funcionarioId ausente.' };
  return {
    clientId, tipo, batidoEm, funcionarioId,
    deviceId: item.deviceId ? String(item.deviceId).slice(0, 100) : null,
    atrasado: Boolean(item.atrasado),
    minutosAtraso: Number.isFinite(Number(item.minutosAtraso)) ? Number(item.minutosAtraso) : null,
  };
}

// Mesma regra do quiosque de hoje: cada setor bate o ponto do próprio
// pessoal; a administração (ENG/DEV) pode bater por qualquer um.
function podeBaterPor(quem, alvo) {
  return SETORES_ADMIN.includes(quem.setor) || alvo.role.name === quem.setor;
}

// Reaplica a regra de sequência em volta das batidas que mudaram. A batida
// offline pode chegar depois das seguintes, então quem era "inconsistente"
// pode deixar de ser (e vice-versa). Janela de 3 dias pra cada lado: a
// sequência reinicia a cada 16h sem batida, então isso cobre o efeito.
export async function reclassificar(userId, datas, tx = prisma) {
  if (!datas.length) return;
  const tempos = datas.map((d) => new Date(d).getTime());
  const inicio = new Date(Math.min(...tempos) - 3 * UM_DIA);
  const fim = new Date(Math.max(...tempos) + 3 * UM_DIA);
  const batidas = await tx.pontoBatida.findMany({
    where: { userId, removidoEm: null, batidoEm: { gte: inicio, lte: fim } },
    select: { id: true, clientId: true, tipo: true, batidoEm: true, inconsistente: true, motivoInconsistencia: true },
  });
  const porClientId = new Map(batidas.map((b) => [b.clientId, b]));
  // O começo da janela não conhece o que veio antes dele: só grava a partir
  // do ponto em que o contexto já é confiável.
  const limiteConfiavel = inicio.getTime() + JANELA_PAR_MS + UM_DIA;

  const mudancas = classificarSequencia(batidas).filter((r) => {
    const atual = porClientId.get(r.clientId);
    return new Date(atual.batidoEm).getTime() >= limiteConfiavel
      && (atual.inconsistente !== r.inconsistente || atual.motivoInconsistencia !== r.motivoInconsistencia);
  });
  for (const r of mudancas) {
    await tx.pontoBatida.update({
      where: { id: porClientId.get(r.clientId).id },
      data: { inconsistente: r.inconsistente, motivoInconsistencia: r.motivoInconsistencia },
    });
  }
}

// itens: [{ clientId, funcionarioId, tipo, batidoEm, deviceId, atrasado?, minutosAtraso? }]
// quem: req.usuario. dispositivo: { deviceId, pendentes, userAgent }.
// Resposta por item: criado | duplicado (os dois = pode marcar como enviado) | rejeitado.
export async function sincronizar(itens, quem, dispositivo = {}) {
  if (!Array.isArray(itens)) throw new Error('Envie { batidas: [...] }.');
  if (itens.length > MAX_ITENS_SYNC) throw new Error(`Máximo de ${MAX_ITENS_SYNC} batidas por envio.`);

  const resultados = new Map();
  const validos = [];
  for (const item of itens) {
    const v = validarItem(item);
    if (v.erro) {
      if (v.clientId) resultados.set(v.clientId, { clientId: v.clientId, status: 'rejeitado', erro: v.erro });
      continue;
    }
    validos.push(v);
  }

  const ids = validos.map((v) => v.clientId);
  const existentes = new Map(
    (await prisma.pontoBatida.findMany({ where: { clientId: { in: ids } }, select: { clientId: true, userId: true, tipo: true, batidoEm: true } }))
      .map((b) => [b.clientId, b]),
  );

  const alvos = new Map(
    (await prisma.user.findMany({ where: { id: { in: [...new Set(validos.map((v) => v.funcionarioId))] } }, include: { role: true } }))
      .map((u) => [u.id, u]),
  );

  const novos = [];
  for (const v of validos) {
    const existente = existentes.get(v.clientId);
    if (existente) {
      const igual = existente.userId === v.funcionarioId && existente.tipo === v.tipo && existente.batidoEm.getTime() === v.batidoEm.getTime();
      if (!igual) console.warn(`[ponto] clientId ${v.clientId} reenviado com conteúdo diferente; mantida a primeira versão.`);
      resultados.set(v.clientId, { clientId: v.clientId, status: 'duplicado', ...(igual ? {} : { conflito: true }) });
      continue;
    }
    const alvo = alvos.get(v.funcionarioId);
    if (!alvo || !alvo.ativo || !alvo.registraPonto) {
      resultados.set(v.clientId, { clientId: v.clientId, status: 'rejeitado', erro: 'Funcionário inexistente, inativo ou sem registro de ponto.' });
      continue;
    }
    if (!podeBaterPor(quem, alvo)) {
      resultados.set(v.clientId, { clientId: v.clientId, status: 'rejeitado', erro: 'Sem permissão para registrar ponto desta pessoa.' });
      continue;
    }
    novos.push(v);
    resultados.set(v.clientId, { clientId: v.clientId, status: 'criado' });
  }

  if (novos.length) {
    await prisma.$transaction(async (tx) => {
      await tx.pontoBatida.createMany({
        data: novos.map((v) => ({
          clientId: v.clientId, userId: v.funcionarioId, tipo: v.tipo, batidoEm: v.batidoEm,
          deviceId: v.deviceId || dispositivo.deviceId || null, registradoPorId: quem.id,
        })),
        skipDuplicates: true,
      });
      const porUsuario = new Map();
      for (const v of novos) porUsuario.set(v.funcionarioId, [...(porUsuario.get(v.funcionarioId) || []), v.batidoEm]);
      for (const [userId, datas] of porUsuario) await reclassificar(userId, datas, tx);
    });
    notificarAtrasos(novos, alvos);
  }

  const aceitos = [...resultados.values()].filter((r) => r.status !== 'rejeitado').length;
  if (dispositivo.deviceId) {
    const pendentes = Math.max(0, (Number(dispositivo.pendentes) || 0) - aceitos);
    const dados = { ultimoContato: new Date(), pendentes, userAgent: dispositivo.userAgent ? String(dispositivo.userAgent).slice(0, 300) : null };
    await prisma.pontoDispositivo.upsert({
      where: { deviceId: String(dispositivo.deviceId).slice(0, 100) },
      create: { deviceId: String(dispositivo.deviceId).slice(0, 100), ...dados },
      update: dados,
    });
  }

  return { resultados: [...resultados.values()] };
}

// O front decide se a batida ficou fora do horário (ele já resolveu a jornada
// do dia); aqui só avisa o setor — mesmo comportamento do POST /registros antigo.
function notificarAtrasos(novos, alvos) {
  for (const v of novos) {
    if (!v.atrasado) continue;
    const alvo = alvos.get(v.funcionarioId);
    const direcao = v.tipo === 'SAIDA' ? 'antes do' : 'após o';
    const mensagem = `"${alvo.name}" bateu o ponto ${v.minutosAtraso ?? ''} min ${direcao} horário em ${chaveDiaLocal(v.batidoEm)}. Envie uma justificativa.`;
    notificationService.notificarSetor(alvo.role.name, mensagem, 'sis-ponto').catch((erro) => {
      console.error('Erro ao notificar atraso de ponto:', erro);
    });
  }
}

// Compatibilidade com o front antigo (POST /registros sem fila offline).
export async function registrarAvulso(dados, quem) {
  const { resultados } = await sincronizar([{
    clientId: randomUUID(),
    funcionarioId: dados.funcionarioId,
    tipo: dados.tipo || 'ENTRADA',
    batidoEm: dados.tempo,
    atrasado: dados.atrasado,
    minutosAtraso: dados.minutosAtraso,
  }], quem);
  const [resultado] = resultados;
  if (resultado?.status === 'rejeitado') throw new Error(resultado.erro);
  return { ok: true };
}

// --- Leitura -------------------------------------------------------------

// Mesmo formato do antigo sis-ponto.json ({ 'YYYY-MM-DD': { funcionarioId: [iso...] } }),
// pra que as telas de admin/funcionário continuem funcionando sem mudança.
export async function listarMapaRegistros() {
  const batidas = await prisma.pontoBatida.findMany({
    where: { removidoEm: null },
    select: { userId: true, batidoEm: true },
    orderBy: { batidoEm: 'asc' },
  });
  const mapa = {};
  for (const b of batidas) {
    const dia = chaveDiaLocal(b.batidoEm);
    mapa[dia] ??= {};
    (mapa[dia][b.userId] ??= []).push(b.batidoEm.toISOString());
  }
  return mapa;
}

// Para a revisão do admin: pares do mês com observação (sem saída, sem
// entrada, inconsistentes).
export async function listarParaRevisao(periodo) {
  const { porUsuario, usuarios } = await carregarPeriodo(periodo);
  const itens = [];
  for (const usuario of usuarios) {
    for (const par of montarPares(porUsuario.get(usuario.id) || [])) {
      const ref = par.entrada || par.saida;
      if (!par.observacoes.length || !periodo.periodos.has(chaveMesLocal(ref.batidoEm))) continue;
      itens.push({
        funcionarioId: usuario.id, nome: usuario.name, setor: usuario.role.name,
        entrada: par.entrada?.batidoEm ?? null, saida: par.saida?.batidoEm ?? null,
        observacoes: par.observacoes,
      });
    }
  }
  return itens;
}

export async function remover({ funcionarioId, tempo }, quem) {
  const batidoEm = new Date(tempo);
  if (!funcionarioId || Number.isNaN(batidoEm.getTime())) throw new Error('Informe funcionário e horário.');
  const batida = await prisma.pontoBatida.findFirst({
    where: { userId: funcionarioId, batidoEm, removidoEm: null },
    include: { user: { include: { role: true } } },
  });
  if (!batida) return null;
  if (!podeBaterPor(quem, batida.user)) throw new Error('Sem permissão para alterar o ponto desta pessoa.');

  await prisma.$transaction(async (tx) => {
    await tx.pontoBatida.update({ where: { id: batida.id }, data: { removidoEm: new Date(), removidoPorId: quem.id } });
    await reclassificar(funcionarioId, [batidoEm], tx);
  });
  return { ok: true };
}

// --- Export pro PC da folha ----------------------------------------------

async function carregarPeriodo({ inicio, fim }) {
  const batidas = await prisma.pontoBatida.findMany({
    where: { removidoEm: null, batidoEm: { gte: inicio, lt: fim } },
    include: { user: { include: { role: true } } },
    orderBy: { batidoEm: 'asc' },
  });
  const porUsuario = new Map();
  const usuarios = new Map();
  for (const b of batidas) {
    usuarios.set(b.userId, b.user);
    (porUsuario.get(b.userId) || porUsuario.set(b.userId, []).get(b.userId)).push(b);
  }
  return { batidas, porUsuario, usuarios: [...usuarios.values()] };
}

export async function exportarCsv(periodo) {
  const { porUsuario, usuarios } = await carregarPeriodo(periodo);
  return formatarCsv(COLUNAS_EXPORT, montarLinhasExport(usuarios, porUsuario, periodo.periodos));
}

// Relatório à parte pra conferência antes de fechar a folha.
export async function exportarPendencias(periodo) {
  const { batidas, porUsuario, usuarios } = await carregarPeriodo(periodo);
  const linhas = montarLinhasExport(usuarios, porUsuario, periodo.periodos);
  const UMA_HORA = 3600 * 1000;
  const dispositivos = await prisma.pontoDispositivo.findMany({ orderBy: { ultimoContato: 'desc' } });

  return {
    geradoEm: new Date().toISOString(),
    periodos: [...periodo.periodos],
    paresComObservacao: linhas.filter((l) => l.Observacao),
    sincronizadasComAtraso: batidas
      .filter((b) => periodo.periodos.has(chaveMesLocal(b.batidoEm)) && b.recebidoEm - b.batidoEm > UMA_HORA)
      .map((b) => ({ ccfId: b.userId, email: b.user.email, tipo: b.tipo, batidoEm: b.batidoEm, recebidoEm: b.recebidoEm, deviceId: b.deviceId })),
    // O servidor não enxerga um celular offline; o que dá pra saber é quando
    // cada aparelho falou pela última vez e quantas batidas ele ainda tinha na fila.
    dispositivos: dispositivos.map((d) => ({ deviceId: d.deviceId, ultimoContato: d.ultimoContato, pendentes: d.pendentes, userAgent: d.userAgent })),
  };
}
