import fs from 'node:fs/promises';
import path from 'node:path';
import { notificationService } from './notificationService.js';
import { CONFIG_FERIADOS_PADRAO, validarConfigFeriados } from './ponto/feriados.js';
import { dataLocalParaUtc } from './ponto/sequencia.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'sis-ponto.json');

// Os 3 padrões de horário fixos da "Alocação de Horários Padrão": cada um tem
// uma lista de turnos (1 ou 2) por dia da semana (segunda a sexta), então dá
// pra ter uma sexta mais curta, por exemplo. Um funcionário aponta pra um
// desses pelo id (`padraoHorarioId`) — ou fica sem nenhum (não designado) — e
// quem é horista (`horista: true`) não usa nenhum padrão, é hora trabalhada livre.
const PADRAO_HORARIO_IDS = ['integral', 'manha', 'tarde'];
const DIAS_SEMANA_PADRAO = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];

function diasIguais(turnos) {
  return Object.fromEntries(DIAS_SEMANA_PADRAO.map((dia) => [dia, turnos.map((turno) => ({ ...turno }))]));
}

const PADROES_HORARIO_PADRAO = {
  // Horário da CCF: 07:40–12:00 e 13:00–17:30 (sexta até 17:20) = 44 h/semana.
  integral: { dias: { ...diasIguais([{ entrada: '07:40', saida: '12:00' }, { entrada: '13:00', saida: '17:30' }]), sexta: [{ entrada: '07:40', saida: '12:00' }, { entrada: '13:00', saida: '17:20' }] } },
  manha: { dias: diasIguais([{ entrada: '07:00', saida: '13:00' }]) },
  tarde: { dias: diasIguais([{ entrada: '13:00', saida: '19:00' }]) },
};

// Migra o formato antigo (turnos únicos, iguais pra semana toda) pro novo
// (um `dias` por padrão) — sem isso, quem já tinha salvo horários antes dessa
// mudança perderia a configuração ao carregar.
function normalizarPadrao(padraoId, valorSalvo) {
  if (valorSalvo?.dias) return valorSalvo;
  if (Array.isArray(valorSalvo?.turnos)) return { dias: diasIguais(valorSalvo.turnos) };
  return PADROES_HORARIO_PADRAO[padraoId];
}

const defaultStore = {
  funcionarios: [],
  registros: {},
  justificativas: [],
  padroesHorario: PADROES_HORARIO_PADRAO,
};

const STATUS_VALIDOS = ['Em análise', 'Aceita', 'Recusada', 'Inválida'];

// Motivos padrão de ajuste de ponto (a lista da tela fica em
// frontend/src/page/sisPonto/sisPontoData.js — manter as duas iguais).
// Em "outro", a descrição por escrito é obrigatória.
export const TIPOS_JUSTIFICATIVA = [
  'esquecimento', 'falha_registro', 'atestado', 'consulta',
  'falta_justificada', 'saida_autorizada', 'compensacao', 'outro',
];
// Motivos que saíram da lista: justificativas antigas continuam válidas
// (e podem ser editadas sem trocar o motivo), mas não dá pra escolhê-los de novo.
const TIPOS_JUSTIFICATIVA_ANTIGOS = ['trabalho_externo', 'atraso_transporte', 'hora_extra'];

// Prazo para a pessoa justificar, contado a partir do fim do período
// justificado (dia + horaFim). O ENG muda pela tela; sem nada salvo, 48 h.
export const PRAZO_JUSTIFICATIVA_PADRAO_HORAS = 48;

export function prazoJustificativaEncerrado(dia, horaFim, prazoHoras, agora = new Date()) {
  const fim = dataLocalParaUtc(dia, horaFim);
  return agora.getTime() > fim.getTime() + prazoHoras * 3600 * 1000;
}

const SETORES_ADMIN = ['ENG', 'DEV'];
const ehAdmin = (quem) => SETORES_ADMIN.includes(quem?.setor);

function validarTipoEMotivo(tipo, motivo, tipoAnterior = null) {
  const antigoMantido = tipo === tipoAnterior && TIPOS_JUSTIFICATIVA_ANTIGOS.includes(tipo);
  if (!TIPOS_JUSTIFICATIVA.includes(tipo) && !antigoMantido) throw new Error('Escolha o motivo da justificativa.');
  if (tipo === 'outro' && !motivo) throw new Error('Escreva a descrição quando escolher "Outro".');
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultStore, null, 2), 'utf8');
  }
}

// Todo acesso ao arquivo segue o padrão ler-tudo -> alterar em memória ->
// gravar-tudo, sem transação nenhuma no sistema de arquivos. Duas requisições
// concorrentes (ex.: salvar um padrão de horário e, ao mesmo tempo, mover
// funcionários entre as colunas de jornada) podiam entrelaçar suas
// leitura/escrita e uma sobrescrevia a outra com dados desatualizados,
// apagando silenciosamente a alteração mais recente. `comFila` serializa
// essas operações: cada uma só começa depois que a anterior (sucesso ou erro)
// terminou de gravar.
let filaOperacoes = Promise.resolve();
function comFila(tarefa) {
  const proxima = filaOperacoes.then(tarefa, tarefa);
  filaOperacoes = proxima.then(() => {}, () => {});
  return proxima;
}

async function readStore() {
  await ensureStore();
  const text = await fs.readFile(DATA_FILE, 'utf8');
  try {
    return JSON.parse(text);
  } catch (erro) {
    // Antes, um JSON inválido aqui fazia o arquivo inteiro ser sobrescrito
    // pelos valores de fábrica — apagando funcionários, registros e padrões
    // de horário já salvos sem avisar ninguém. Agora as leituras passam pela
    // mesma fila das escritas (`comFila`), então isso não deveria mais
    // acontecer por uma leitura no meio de uma gravação; se ainda assim o
    // arquivo estiver corrompido, é melhor falhar visivelmente (500) do que
    // destruir dados em silêncio.
    throw new Error(`Arquivo de dados do SisPonto corrompido (${DATA_FILE}): ${erro.message}`);
  }
}

async function writeStore(store) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

// Funcionários e batidas de ponto ficam no Postgres (User + PontoBatida, ver
// services/ponto/batidaService.js). Neste arquivo restam justificativas e
// padrões de horário; as chaves "funcionarios" e "registros" antigas só são
// lidas pelo script de migração (scripts/migrarSisPontoJson.js).

export async function listarJustificativas() {
  const store = await comFila(readStore);
  return store.justificativas || [];
}

// Cada pessoa justifica o próprio ponto: quem, nome e setor vêm da sessão.
export async function criarJustificativa(dados, quem) {
  return comFila(() => criarJustificativaImpl(dados, quem));
}

async function criarJustificativaImpl(dados, quem) {
  const store = await readStore();
  const dia = String(dados.dia || '').trim();
  const horaInicio = String(dados.horaInicio || '').trim();
  const horaFim = String(dados.horaFim || '').trim();
  const tipo = String(dados.tipo || '').trim();
  const motivo = String(dados.motivo || '').trim();

  if (!dia || !horaInicio || !horaFim) {
    throw new Error('Preencha o dia e o período da justificativa.');
  }
  validarTipoEMotivo(tipo, motivo);
  const prazoHoras = lerPrazoJustificativa(store);
  if (!ehAdmin(quem) && HORA_REGEX.test(horaFim) && /^d{4}-d{2}-d{2}$/.test(dia) && prazoJustificativaEncerrado(dia, horaFim, prazoHoras)) {
    throw new Error(`O prazo para justificar ${dia.split('-').reverse().join('/')} (${prazoHoras} h) já terminou. Fale com o ENG.`);
  }

  const nova = {
    id: `just-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    funcionarioId: quem.id,
    nome: quem.nome,
    setor: quem.setor,
    dia,
    horaInicio,
    horaFim,
    tipo,
    motivo,
    anexoNome: dados.anexoNome || null,
    anexoTipo: dados.anexoTipo || null,
    anexoDataUrl: dados.anexoDataUrl || null,
    status: 'Em análise',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };

  store.justificativas = [...(store.justificativas || []), nova];
  await writeStore(store);

  const mensagem = `"${nova.nome}" (${nova.setor}) enviou uma justificativa de ponto para ${nova.dia}.`;
  notificationService.notificarSetor('ENG', mensagem, 'sis-ponto-justificativa').catch((erro) => {
    console.error('Erro ao notificar justificativa de ponto:', erro);
  });

  return nova;
}

// A pessoa só mexe na própria justificativa (e só pode devolvê-la para
// "Em análise"); aceitar/recusar é da administração (ENG/DEV).
export async function atualizarJustificativa(id, dados, quem) {
  return comFila(() => atualizarJustificativaImpl(id, dados, quem));
}

async function atualizarJustificativaImpl(id, dados, quem) {
  const store = await readStore();
  const atual = store.justificativas || [];
  const index = atual.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const existente = atual[index];
  if (!ehAdmin(quem) && existente.funcionarioId !== quem?.id) {
    throw new Error('Você só pode alterar as suas justificativas.');
  }
  const proximoStatus = dados.status ? String(dados.status).trim() : existente.status;
  if (dados.status && !STATUS_VALIDOS.includes(proximoStatus)) {
    throw new Error('Status de justificativa inválido.');
  }
  if (!ehAdmin(quem) && dados.status && proximoStatus !== 'Em análise') {
    throw new Error('Só a administração aceita ou recusa justificativas.');
  }
  if (dados.tipo !== undefined || dados.motivo !== undefined) {
    validarTipoEMotivo(
      String(dados.tipo ?? existente.tipo ?? '').trim(),
      String(dados.motivo ?? existente.motivo ?? '').trim(),
      existente.tipo,
    );
  }

  atual[index] = {
    ...existente,
    ...(dados.dia !== undefined ? { dia: dados.dia } : {}),
    ...(dados.horaInicio !== undefined ? { horaInicio: dados.horaInicio } : {}),
    ...(dados.horaFim !== undefined ? { horaFim: dados.horaFim } : {}),
    ...(dados.tipo !== undefined ? { tipo: String(dados.tipo).trim() } : {}),
    ...(dados.motivo !== undefined ? { motivo: String(dados.motivo).trim() } : {}),
    ...(dados.anexoNome !== undefined ? { anexoNome: dados.anexoNome } : {}),
    ...(dados.anexoTipo !== undefined ? { anexoTipo: dados.anexoTipo } : {}),
    ...(dados.anexoDataUrl !== undefined ? { anexoDataUrl: dados.anexoDataUrl } : {}),
    status: proximoStatus,
    atualizadoEm: new Date().toISOString(),
  };

  store.justificativas = atual;
  await writeStore(store);
  return atual[index];
}

export async function excluirJustificativa(id, quem) {
  return comFila(() => excluirJustificativaImpl(id, quem));
}

async function excluirJustificativaImpl(id, quem) {
  const store = await readStore();
  const atual = store.justificativas || [];
  const alvo = atual.find((item) => item.id === id);
  if (alvo && !ehAdmin(quem) && alvo.funcionarioId !== quem?.id) {
    throw new Error('Você só pode excluir as suas justificativas.');
  }
  const existe = Boolean(alvo);
  store.justificativas = atual.filter((item) => item.id !== id);
  await writeStore(store);
  return existe;
}

const HORA_REGEX = /^\d{2}:\d{2}$/;

function validarTurnos(turnos) {
  if (!Array.isArray(turnos) || turnos.length < 1 || turnos.length > 2) {
    throw new Error('O padrão precisa ter 1 ou 2 turnos.');
  }
  turnos.forEach((turno) => {
    if (!HORA_REGEX.test(turno?.entrada || '') || !HORA_REGEX.test(turno?.saida || '')) {
      throw new Error('Horário de turno inválido.');
    }
  });
}

function validarDias(dias) {
  if (!dias || typeof dias !== 'object') throw new Error('Horários inválidos.');
  DIAS_SEMANA_PADRAO.forEach((dia) => validarTurnos(dias[dia]));
}

export async function listarPadroesHorario() {
  const store = await comFila(readStore);
  const salvos = store.padroesHorario || {};
  return Object.fromEntries(PADRAO_HORARIO_IDS.map((padraoId) => [padraoId, normalizarPadrao(padraoId, salvos[padraoId])]));
}

export async function atualizarPadraoHorario(padraoId, dias) {
  if (!PADRAO_HORARIO_IDS.includes(padraoId)) throw new Error('Padrão de horário inválido.');
  validarDias(dias);

  return comFila(() => atualizarPadraoHorarioImpl(padraoId, dias));
}

async function atualizarPadraoHorarioImpl(padraoId, dias) {
  const store = await readStore();
  const salvos = store.padroesHorario || {};
  const atuais = Object.fromEntries(PADRAO_HORARIO_IDS.map((id) => [id, normalizarPadrao(id, salvos[id])]));
  atuais[padraoId] = { dias };
  store.padroesHorario = atuais;
  await writeStore(store);
  return atuais[padraoId];
}

// Feriados: os nacionais são calculados (services/ponto/feriados.js); aqui
// fica só o que a empresa decide — Carnaval/Corpus Christi e os feriados
// municipais/estaduais ou folgas avulsas. Sem nada salvo, vale o padrão da CCF.
export async function obterConfigFeriados() {
  const store = await comFila(readStore);
  return validarConfigFeriados(store.feriados ?? CONFIG_FERIADOS_PADRAO);
}

export async function atualizarConfigFeriados(config) {
  const validado = validarConfigFeriados(config);
  return comFila(async () => {
    const store = await readStore();
    store.feriados = validado;
    await writeStore(store);
    return validado;
  });
}

// Regras do ponto que o ENG ajusta pela tela (por enquanto, só o prazo).
function lerPrazoJustificativa(store) {
  const valor = Number(store.regrasPonto?.prazoJustificativaHoras);
  return Number.isFinite(valor) && valor > 0 ? valor : PRAZO_JUSTIFICATIVA_PADRAO_HORAS;
}

export async function obterRegrasPonto() {
  const store = await comFila(readStore);
  return { prazoJustificativaHoras: lerPrazoJustificativa(store) };
}

export async function atualizarRegrasPonto(dados = {}) {
  const prazo = Number(dados.prazoJustificativaHoras);
  if (!Number.isInteger(prazo) || prazo < 1 || prazo > 24 * 60) {
    throw new Error('O prazo precisa ser um número inteiro de horas (de 1 a 1440).');
  }
  return comFila(async () => {
    const store = await readStore();
    store.regrasPonto = { ...(store.regrasPonto || {}), prazoJustificativaHoras: prazo };
    await writeStore(store);
    return { prazoJustificativaHoras: prazo };
  });
}
