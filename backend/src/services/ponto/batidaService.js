// src/services/ponto/batidaService.js
// Batidas de ponto no Postgres. O aparelho grava cada batida primeiro no
// IndexedDB (pode estar offline) e depois envia em lote pelo /sis-ponto/sync;
// o clientId gerado lá é a chave de idempotência.
import { randomUUID } from 'node:crypto';
import { prisma } from '../../prisma.js';
import { classificarSequencia, chaveDiaLocal, chaveMesLocal, montarPares, JANELA_PAR_MS, horariosPrevistos, horariosSemBatida, dataLocalParaUtc, partesLocais } from './sequencia.js';
import { COLUNAS_EXPORT, formatarCsv, montarLinhasExport, interpretarPeriodo } from './exportCsv.js';
import { listarPadroesHorario, obterConfigFeriados, listarJustificativas, obterRegrasPonto, prazoJustificativaEncerrado } from '../sisPontoService.js';
import { mapaFeriados } from './feriados.js';
import { podeGerirPonto } from '../../config/permissoes.js';

export const PADRAO_HORARIO_IDS = ['integral', 'manha', 'tarde'];
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
    // O banco de horas só conta a jornada a partir daqui.
    pontoDesde: user.pontoDesde,
  };
}

export async function listarFuncionarios() {
  const users = await prisma.user.findMany({
    where: { ativo: true, registraPonto: true },
    include: { role: true },
  });
  // Ordem alfabética pelo nome, com acento no lugar certo (Á junto do A).
  return users.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })).map(paraFuncionario);
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

// Bater ponto: só o próprio. Corrigir (excluir uma batida): só o ENG — a
// pessoa não altera as próprias marcações; se errou, envia justificativa.
function podeCorrigirPonto(quem) {
  return podeGerirPonto(quem.setor);
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
  if (itens.length > MAX_ITENS_SYNC) throw new Error(`Máximo de ${MAX_ITENS_SYNC} registros por envio.`);

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
    if (alvo.id !== quem.id) {
      resultados.set(v.clientId, { clientId: v.clientId, status: 'rejeitado', erro: 'Cada pessoa só pode registrar o próprio ponto.' });
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
    where: { removidoEm: null, OR: [{ origem: { not: 'PREVISTA' } }, { situacao: 'ABONADA' }] },
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

// Para a revisão do admin: pares com problema (sem saída, sem entrada,
// inconsistentes) e os horários previstos em que a pessoa não bateu.
const OBS_DE_PREVISTA = ['PREVISTA_PENDENTE', 'PREVISTA_ABONADA', 'FALTA'];

// Esquecimento (horário previsto sem registro), em três etapas:
//  AGUARDANDO_FUNCIONARIO: ainda dentro do prazo — é o funcionário quem justifica;
//  JUSTIFICATIVA_ENVIADA: ele justificou — o ENG decide na aba Justificativas
//    (aceitar abona o horário);
//  PARA_DECIDIR: o prazo passou sem justificativa — vira uma "justificativa
//    automática" de esquecimento, que o ENG aceita (ABONADA) ou não (FALTA).
// O prazo conta do fim do turno do horário, igual à tela do funcionário.
async function contextoEtapas() {
  const [padroes, justificativas, regras] = await Promise.all([listarPadroesHorario(), listarJustificativas(), obterRegrasPonto()]);
  return { padroes, justificativas, prazoHoras: regras.prazoJustificativaHoras };
}

function etapaDaPrevista(prevista, padraoHorarioId, { padroes, justificativas, prazoHoras }, agora = new Date()) {
  if (prevista.situacao && prevista.situacao !== 'PENDENTE') return { etapa: 'DECIDIDA', prazoAte: null };
  const dia = chaveDiaLocal(prevista.batidoEm);
  const hora = horaLocal(prevista.batidoEm);
  const previstos = horariosPrevistos(padroes[padraoHorarioId], dia);
  const indice = Number(String(prevista.clientId || '').split(':').pop());
  const proprio = previstos.find((p) => p.indice === indice);
  const fimTurno = proprio?.tipo === 'ENTRADA' ? (previstos.find((p) => p.indice === indice + 1)?.hora ?? hora) : hora;
  const prazoAte = new Date(dataLocalParaUtc(dia, fimTurno).getTime() + prazoHoras * 3600 * 1000);
  const enviada = justificativas.some((j) => j.funcionarioId === prevista.userId && j.dia === dia
    && ['Em análise', 'Inválida'].includes(j.status) && j.horaInicio <= hora && hora <= j.horaFim);
  if (enviada) return { etapa: 'JUSTIFICATIVA_ENVIADA', prazoAte };
  if (!prazoJustificativaEncerrado(dia, fimTurno, prazoHoras, agora)) return { etapa: 'AGUARDANDO_FUNCIONARIO', prazoAte };
  return { etapa: 'PARA_DECIDIR', prazoAte };
}

export async function listarParaRevisao(periodo, agora = new Date()) {
  await gerarPrevistas();
  const { batidas, porUsuario, usuarios } = await carregarPeriodo(periodo);
  const contexto = await contextoEtapas();
  const hoje = chaveDiaLocal(agora);
  const pares = [];
  for (const usuario of usuarios) {
    for (const par of montarPares(porUsuario.get(usuario.id) || [])) {
      const ref = par.entrada || par.saida;
      const observacoes = par.observacoes.filter((o) => !OBS_DE_PREVISTA.includes(o));
      // Hoje ainda está em andamento: entrada sem saída é normal.
      if (!observacoes.length || !periodo.periodos.has(chaveMesLocal(ref.batidoEm)) || chaveDiaLocal(ref.batidoEm) >= hoje) continue;
      pares.push({
        funcionarioId: usuario.id, nome: usuario.name, setor: usuario.role.name,
        entrada: par.entrada?.batidoEm ?? null, saida: par.saida?.batidoEm ?? null,
        observacoes,
      });
    }
  }
  const previstas = batidas
    .filter((b) => b.origem === 'PREVISTA' && periodo.periodos.has(chaveMesLocal(b.batidoEm)))
    .map((b) => ({
      id: b.id, funcionarioId: b.userId, nome: b.user.name, setor: b.user.role.name,
      dia: chaveDiaLocal(b.batidoEm), tipo: b.tipo, batidoEm: b.batidoEm,
      situacao: b.situacao || 'PENDENTE', decididoEm: b.decididoEm,
      ...etapaDaPrevista(b, b.user.padraoHorarioId, contexto, agora),
    }));
  return { pares, previstas };
}

// Contador da aba "Pontos a revisar" (o aviso do ponto não vai pro sininho):
// esquecimentos com prazo vencido e sem justificativa (PARA_DECIDIR) +
// registros com problema (sem saída, sem entrada, inconsistentes) de dias já
// encerrados do mês atual e do anterior.
export async function contarParaRevisao(agora = new Date()) {
  const contexto = await contextoEtapas();
  const pendentes = await prisma.pontoBatida.findMany({
    where: { origem: 'PREVISTA', removidoEm: null, OR: [{ situacao: 'PENDENTE' }, { situacao: null }] },
    include: { user: { select: { padraoHorarioId: true } } },
  });
  const previstas = pendentes.filter((b) => etapaDaPrevista(b, b.user.padraoHorarioId, contexto, agora).etapa === 'PARA_DECIDIR').length;
  const hoje = chaveDiaLocal(agora);
  const mesAtual = chaveMesLocal(agora);
  const [ano, mes] = mesAtual.split('-').map(Number);
  const mesAnterior = mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, '0')}`;
  let registros = 0;
  for (const m of [mesAnterior, mesAtual]) {
    const periodo = interpretarPeriodo({ mes: m });
    const { porUsuario, usuarios } = await carregarPeriodo(periodo);
    for (const usuario of usuarios) {
      for (const par of montarPares(porUsuario.get(usuario.id) || [])) {
        const ref = par.entrada || par.saida;
        if (!periodo.periodos.has(chaveMesLocal(ref.batidoEm)) || chaveDiaLocal(ref.batidoEm) >= hoje) continue;
        if (par.observacoes.some((o) => !OBS_DE_PREVISTA.includes(o))) registros += 1;
      }
    }
  }
  return { previstas, registros, total: previstas + registros };
}

// ENG decide: ABONADA (conta as horas), FALTA (desconta) ou PENDENTE (desfaz).
export async function decidirPrevistas(ids, situacao, quem) {
  if (!['ABONADA', 'FALTA', 'PENDENTE'].includes(situacao)) throw new Error('Decisão inválida.');
  if (!Array.isArray(ids) || !ids.length) throw new Error('Informe os horários.');
  const alvos = await prisma.pontoBatida.findMany({ where: { id: { in: ids }, origem: 'PREVISTA', removidoEm: null } });
  if (alvos.length !== new Set(ids).size) throw new Error('Algum horário não existe mais ou não é previsto.');
  const pendente = situacao === 'PENDENTE';
  await prisma.pontoBatida.updateMany({
    where: { id: { in: ids } },
    data: { situacao, decididoPorId: pendente ? null : quem.id, decididoEm: pendente ? null : new Date() },
  });
  return { ok: true, atualizados: alvos.length };
}

const horaLocal = (data) => {
  const p = partesLocais(data);
  return `${String(p.hora).padStart(2, '0')}:${String(p.minuto).padStart(2, '0')}`;
};

// Esquecimentos da própria pessoa, para a lista "Pendentes" das justificativas:
// os ainda sem decisão e os que o ENG marcou como falta (dá para contestar).
export async function listarMeusEsquecimentos(quem) {
  const previstas = await prisma.pontoBatida.findMany({
    where: { userId: quem.id, origem: 'PREVISTA', removidoEm: null, situacao: { in: ['PENDENTE', 'FALTA'] } },
    orderBy: { batidoEm: 'asc' },
  });
  return previstas.map((b) => ({
    id: b.id, dia: chaveDiaLocal(b.batidoEm), hora: horaLocal(b.batidoEm), tipo: b.tipo, situacao: b.situacao,
  }));
}

// ENG aceitou a justificativa: os horários previstos ainda pendentes dentro do
// período dela ficam abonados (contam as horas) — sem precisar decidir de novo
// na revisão. Recusada não mexe: o previsto continua para o ENG marcar falta.
export async function abonarPrevistasDaJustificativa({ funcionarioId, dia, horaInicio, horaFim }, quem) {
  if (!funcionarioId || !dia || !horaInicio || !horaFim) return 0;
  const previstas = await prisma.pontoBatida.findMany({
    where: {
      userId: funcionarioId, origem: 'PREVISTA', situacao: 'PENDENTE', removidoEm: null,
      batidoEm: { gte: dataLocalParaUtc(dia, '00:00'), lte: dataLocalParaUtc(dia, '23:59') },
    },
  });
  const cobertas = previstas.filter((b) => { const h = horaLocal(b.batidoEm); return h >= horaInicio && h <= horaFim; });
  if (!cobertas.length) return 0;
  await prisma.pontoBatida.updateMany({
    where: { id: { in: cobertas.map((b) => b.id) } },
    data: { situacao: 'ABONADA', decididoPorId: quem.id, decididoEm: new Date() },
  });
  return cobertas.length;
}

// Toda correção do ENG (incluir ou excluir batida) precisa de motivo escrito.
const MOTIVO_MINIMO = 5;
function validarMotivo(motivo) {
  const texto = String(motivo || '').trim();
  if (texto.length < MOTIVO_MINIMO) throw new Error('Informe o motivo da correção.');
  return texto.slice(0, 500);
}

export async function remover({ funcionarioId, tempo, motivo }, quem) {
  const batidoEm = new Date(tempo);
  if (!funcionarioId || Number.isNaN(batidoEm.getTime())) throw new Error('Informe funcionário e horário.');
  if (!podeCorrigirPonto(quem)) throw new Error('Só o ENG ou a Coordenação podem corrigir registros de ponto. Envie uma justificativa.');
  const motivoRemocao = validarMotivo(motivo);
  // Se houver um previsto abonado no mesmo instante, a batida real/ajuste vem primeiro.
  const batida = await prisma.pontoBatida.findFirst({
    where: { userId: funcionarioId, batidoEm, removidoEm: null, origem: { not: 'PREVISTA' } },
  });
  if (!batida) {
    const prevista = await prisma.pontoBatida.findFirst({ where: { userId: funcionarioId, batidoEm, removidoEm: null } });
    if (prevista) throw new Error('Horário previsto não se exclui: o ENG decide se abona ou se é falta (aba Pontos a revisar).');
    return null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.pontoBatida.update({ where: { id: batida.id }, data: { removidoEm: new Date(), removidoPorId: quem.id, motivoRemocao } });
    await reclassificar(funcionarioId, [batidoEm], tx);
  });
  // Sem a batida, o horário da jornada pode voltar a ficar "sem batida".
  await gerarPrevistas();
  return { ok: true };
}

// Inclusão de batida pelo ENG (correção). Fica marcada como origem "AJUSTE",
// com quem incluiu (registradoPorId) e quando (recebidoEm), para nunca se
// confundir com uma marcação feita pela própria pessoa no aparelho.
export async function inserirAjuste({ funcionarioId, tipo, batidoEm, motivo }, quem) {
  if (!podeCorrigirPonto(quem)) throw new Error('Só o ENG ou a Coordenação podem corrigir registros de ponto.');
  const motivoAjuste = validarMotivo(motivo);
  const tipoNormalizado = normalizarTipo(tipo);
  if (!tipoNormalizado) throw new Error('Tipo deve ser ENTRADA ou SAIDA.');
  const quando = new Date(batidoEm);
  if (Number.isNaN(quando.getTime())) throw new Error('Horário inválido.');
  if (quando.getTime() > Date.now() + 5 * 60 * 1000) throw new Error('Não dá para incluir registro no futuro.');

  const alvo = await prisma.user.findUnique({ where: { id: String(funcionarioId || '') } });
  if (!alvo || !alvo.ativo || !alvo.registraPonto) throw new Error('Funcionário inexistente, inativo ou sem registro de ponto.');

  const criada = await prisma.$transaction(async (tx) => {
    const nova = await tx.pontoBatida.create({
      data: {
        clientId: `ajuste:${randomUUID()}`,
        userId: alvo.id,
        tipo: tipoNormalizado,
        batidoEm: quando,
        origem: 'AJUSTE',
        registradoPorId: quem.id,
        motivoAjuste,
      },
    });
    await reclassificar(alvo.id, [quando], tx);
    return nova;
  });
  // Se cobriu um horário previsto ainda pendente, ele sai sozinho.
  await gerarPrevistas();
  return { id: criada.id, batidoEm: criada.batidoEm.toISOString(), tipo: criada.tipo };
}

// Batidas incluídas pelo ENG, para as telas marcarem como "ajuste" e
// mostrarem o motivo. A pessoa vê os ajustes do próprio ponto; o ENG vê todos.
export async function listarAjustes(quem) {
  const ajustes = await prisma.pontoBatida.findMany({
    where: { origem: 'AJUSTE', removidoEm: null, ...(podeCorrigirPonto(quem) ? {} : { userId: quem.id }) },
    select: { userId: true, batidoEm: true, motivoAjuste: true, registradoPorId: true, recebidoEm: true },
    orderBy: { batidoEm: 'asc' },
  });
  const autores = new Map((await prisma.user.findMany({
    where: { id: { in: [...new Set(ajustes.map((a) => a.registradoPorId).filter(Boolean))] } },
    select: { id: true, name: true },
  })).map((u) => [u.id, u.name]));
  return ajustes.map((a) => ({
    funcionarioId: a.userId,
    batidoEm: a.batidoEm.toISOString(),
    motivo: a.motivoAjuste,
    por: autores.get(a.registradoPorId) || null,
    em: a.recebidoEm.toISOString(),
  }));
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
  await gerarPrevistas();
  const { porUsuario, usuarios } = await carregarPeriodo(periodo);
  return formatarCsv(COLUNAS_EXPORT, montarLinhasExport(usuarios, porUsuario, periodo.periodos));
}

// Relatório à parte pra conferência antes de fechar a folha.
export async function exportarPendencias(periodo) {
  await gerarPrevistas();
  const { batidas, porUsuario, usuarios } = await carregarPeriodo(periodo);
  const linhas = montarLinhasExport(usuarios, porUsuario, periodo.periodos);
  const UMA_HORA = 3600 * 1000;
  const dispositivos = await prisma.pontoDispositivo.findMany({ orderBy: { ultimoContato: 'desc' } });

  return {
    geradoEm: new Date().toISOString(),
    periodos: [...periodo.periodos],
    // Abonado e falta já foram decididos pelo ENG: não são pendência.
    paresComObservacao: linhas.filter((l) => l.Observacao && !['PREVISTA_ABONADA', 'FALTA'].includes(l.Observacao)),
    sincronizadasComAtraso: batidas
      .filter((b) => b.origem === 'APP' && periodo.periodos.has(chaveMesLocal(b.batidoEm)) && b.recebidoEm - b.batidoEm > UMA_HORA)
      .map((b) => ({ ccfId: b.userId, email: b.user.email, tipo: b.tipo, batidoEm: b.batidoEm, recebidoEm: b.recebidoEm, deviceId: b.deviceId })),
    // O servidor não enxerga um celular offline; o que dá pra saber é quando
    // cada aparelho falou pela última vez e quantas batidas ele ainda tinha na fila.
    dispositivos: dispositivos.map((d) => ({ deviceId: d.deviceId, ultimoContato: d.ultimoContato, pendentes: d.pendentes, userAgent: d.userAgent })),
  };
}

// --- Esquecimento de batida -------------------------------------------------
// Para quem tem jornada definida (não horista), cada horário previsto de um
// dia já encerrado que ficou sem batida vira uma PontoBatida "PREVISTA" no
// horário em que deveria ter sido registrada, aguardando o ENG (abonar ou
// falta). Se a batida real chegar depois (aparelho estava offline), a
// prevista ainda pendente sai sozinha. Idempotente: clientId determinístico.

const JANELA_PREVISTAS_DIAS = 62;
let geracaoEmAndamento = null;

export function gerarPrevistas() {
  if (!geracaoEmAndamento) {
    geracaoEmAndamento = gerarPrevistasImpl().finally(() => { geracaoEmAndamento = null; });
  }
  return geracaoEmAndamento;
}

function diasEntre(inicio, fimExclusivo) {
  const dias = [];
  const [a, m, d] = inicio.split('-').map(Number);
  for (let t = Date.UTC(a, m - 1, d); ; t += UM_DIA) {
    const dia = new Date(t).toISOString().slice(0, 10);
    if (dia >= fimExclusivo) break;
    dias.push(dia);
  }
  return dias;
}

async function gerarPrevistasImpl(agora = new Date()) {
  const padroes = await listarPadroesHorario();
  const hoje = chaveDiaLocal(agora);
  const limite = chaveDiaLocal(new Date(agora.getTime() - JANELA_PREVISTAS_DIAS * UM_DIA));
  // Feriado não cobra jornada: nada vira "esquecimento" (e o que já tinha
  // virado, ainda pendente, sai — ex.: feriado cadastrado depois).
  const feriados = mapaFeriados([limite.slice(0, 4), hoje.slice(0, 4)], await obterConfigFeriados());
  const usuarios = await prisma.user.findMany({
    where: { ativo: true, registraPonto: true, horista: false, padraoHorarioId: { not: null } },
  });

  for (const usuario of usuarios) {
    const padrao = padroes[usuario.padraoHorarioId];
    const desde = chaveDiaLocal(usuario.pontoDesde);
    const inicio = desde > limite ? desde : limite;
    const dias = diasEntre(inicio, hoje); // só dias já encerrados
    if (!dias.length || !padrao) continue;

    const batidas = await prisma.pontoBatida.findMany({
      where: { userId: usuario.id, batidoEm: { gte: dataLocalParaUtc(dias[0], '00:00'), lt: dataLocalParaUtc(hoje, '00:00') } },
    });
    const porDia = new Map();
    for (const b of batidas) {
      const dia = chaveDiaLocal(b.batidoEm);
      (porDia.get(dia) || porDia.set(dia, []).get(dia)).push(b);
    }

    const criar = [];
    const remover = [];
    const restaurar = [];
    for (const dia of dias) {
      const previstos = horariosPrevistos(padrao, dia);
      if (!previstos.length) continue;
      const doDia = porDia.get(dia) || [];
      const reais = doDia.filter((b) => b.origem !== 'PREVISTA' && !b.removidoEm);
      const faltantes = feriados.has(dia) ? new Set() : new Set(horariosSemBatida(previstos, reais, dia).map((p) => p.indice));

      for (const p of previstos) {
        const clientId = `prevista:${usuario.id}:${dia}:${p.indice}`;
        const existente = doDia.find((b) => b.clientId === clientId);
        if (faltantes.has(p.indice)) {
          if (!existente) {
            criar.push({ clientId, userId: usuario.id, tipo: p.tipo, batidoEm: dataLocalParaUtc(dia, p.hora), origem: 'PREVISTA', situacao: 'PENDENTE' });
          } else if (existente.removidoEm && existente.situacao === 'PENDENTE') {
            restaurar.push(existente);
          }
        } else if (existente && !existente.removidoEm && existente.situacao === 'PENDENTE') {
          // A batida real chegou depois: o previsto pendente não vale mais.
          remover.push(existente);
        }
      }
    }

    if (!criar.length && !remover.length && !restaurar.length) continue;
    await prisma.$transaction(async (tx) => {
      if (criar.length) await tx.pontoBatida.createMany({ data: criar, skipDuplicates: true });
      if (remover.length) await tx.pontoBatida.updateMany({ where: { id: { in: remover.map((b) => b.id) } }, data: { removidoEm: new Date() } });
      if (restaurar.length) await tx.pontoBatida.updateMany({ where: { id: { in: restaurar.map((b) => b.id) } }, data: { removidoEm: null } });
      await reclassificar(usuario.id, [...criar, ...remover, ...restaurar].map((b) => b.batidoEm), tx);
    });
  }
}
