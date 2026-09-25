import fs from 'node:fs/promises';
import path from 'node:path';
import { notificationService } from './notificationService.js';

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
  integral: { dias: diasIguais([{ entrada: '08:00', saida: '12:00' }, { entrada: '13:00', saida: '18:00' }]) },
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

export async function listarFuncionarios() {
  const store = await comFila(readStore);
  return store.funcionarios || [];
}

export async function listarRegistros() {
  const store = await comFila(readStore);
  return store.registros || {};
}

export async function criarFuncionario(funcionario) {
  return comFila(() => criarFuncionarioImpl(funcionario));
}

async function criarFuncionarioImpl(funcionario) {
  const store = await readStore();
  const id = funcionario.id || `${funcionario.setor || 'ENG'}-${Date.now()}`;
  const novo = {
    id,
    nome: String(funcionario.nome || '').trim(),
    setor: String(funcionario.setor || 'ENG').trim().toUpperCase(),
    horista: Boolean(funcionario.horista),
    padraoHorarioId: PADRAO_HORARIO_IDS.includes(funcionario.padraoHorarioId) ? funcionario.padraoHorarioId : null,
  };

  if (!novo.nome || !novo.setor) {
    throw new Error('Nome e setor são obrigatórios.');
  }

  const atual = store.funcionarios || [];
  const existente = atual.find((item) => item.id === id || (item.nome === novo.nome && item.setor === novo.setor));
  if (existente) return existente;

  store.funcionarios = [...atual, novo];
  await writeStore(store);
  return novo;
}

export async function atualizarFuncionario(id, dados) {
  if (dados.padraoHorarioId !== undefined && dados.padraoHorarioId !== null && !PADRAO_HORARIO_IDS.includes(dados.padraoHorarioId)) {
    throw new Error('Padrão de horário inválido.');
  }

  return comFila(() => atualizarFuncionarioImpl(id, dados));
}

async function atualizarFuncionarioImpl(id, dados) {
  const store = await readStore();
  const atual = store.funcionarios || [];
  const index = atual.findIndex((item) => item.id === id);
  if (index === -1) return null;

  atual[index] = {
    ...atual[index],
    ...dados,
    nome: String(dados.nome || atual[index].nome).trim(),
    setor: String(dados.setor || atual[index].setor).trim().toUpperCase(),
  };

  store.funcionarios = atual;
  await writeStore(store);
  return atual[index];
}

export async function excluirFuncionario(id) {
  return comFila(() => excluirFuncionarioImpl(id));
}

async function excluirFuncionarioImpl(id) {
  const store = await readStore();
  const funcionarios = (store.funcionarios || []).filter((item) => item.id !== id);
  store.funcionarios = funcionarios;

  // Sem isso, os registros de ponto e as justificativas do funcionário excluído
  // continuam órfãos no store e voltam a aparecer nas planilhas individuais.
  const registros = store.registros || {};
  Object.keys(registros).forEach((chave) => {
    if (registros[chave] && Object.prototype.hasOwnProperty.call(registros[chave], id)) {
      delete registros[chave][id];
      if (Object.keys(registros[chave]).length === 0) delete registros[chave];
    }
  });
  store.registros = registros;

  store.justificativas = (store.justificativas || []).filter((item) => item.funcionarioId !== id);

  await writeStore(store);
  return funcionarios;
}

export async function registrarPonto(data) {
  return comFila(() => registrarPontoImpl(data));
}

async function registrarPontoImpl(data) {
  const store = await readStore();
  const registros = store.registros || {};
  const chave = data.data; // yyyy-mm-dd
  const id = data.funcionarioId;
  const registrosDia = registros[chave] || {};
  const lista = registrosDia[id] || [];
  registrosDia[id] = [...lista, data.tempo];
  registros[chave] = registrosDia;
  store.registros = registros;
  await writeStore(store);

  // Quem decide se o registro ficou fora do horário é o front (que já resolveu
  // o horário-base/override antes de chamar essa rota); aqui só disparamos o aviso.
  if (data.atrasado) {
    const funcionario = (store.funcionarios || []).find((item) => item.id === id);
    if (funcionario) {
      const direcao = data.tipo === 'Saída' ? 'antes do' : 'após o';
      const mensagem = `"${funcionario.nome}" bateu o ponto ${data.minutosAtraso ?? ''} min ${direcao} horário em ${chave}. Envie uma justificativa.`;
      notificationService.notificarSetor(funcionario.setor, mensagem, 'sis-ponto').catch((erro) => {
        console.error('Erro ao notificar atraso de ponto:', erro);
      });
    }
  }

  return { ok: true };
}

export async function excluirRegistro(funcionarioId, chave, tempo) {
  return comFila(() => excluirRegistroImpl(funcionarioId, chave, tempo));
}

async function excluirRegistroImpl(funcionarioId, chave, tempo) {
  const store = await readStore();
  const registros = store.registros || {};
  const registrosDia = registros[chave] || {};
  const lista = registrosDia[funcionarioId] || [];
  const indice = lista.indexOf(tempo);
  if (indice === -1) return null;

  const novaLista = lista.filter((_, item) => item !== indice);
  if (novaLista.length) {
    registrosDia[funcionarioId] = novaLista;
  } else {
    delete registrosDia[funcionarioId];
  }
  registros[chave] = registrosDia;
  store.registros = registros;
  await writeStore(store);
  return novaLista;
}

export async function listarJustificativas() {
  const store = await comFila(readStore);
  return store.justificativas || [];
}

export async function criarJustificativa(dados) {
  return comFila(() => criarJustificativaImpl(dados));
}

async function criarJustificativaImpl(dados) {
  const store = await readStore();
  const funcionarioId = String(dados.funcionarioId || '').trim();
  const dia = String(dados.dia || '').trim();
  const horaInicio = String(dados.horaInicio || '').trim();
  const horaFim = String(dados.horaFim || '').trim();
  const motivo = String(dados.motivo || '').trim();

  if (!funcionarioId || !dia || !horaInicio || !horaFim || !motivo) {
    throw new Error('Preencha o dia, o período e a explicação da justificativa.');
  }

  const nova = {
    id: `just-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    funcionarioId,
    nome: String(dados.nome || '').trim(),
    setor: String(dados.setor || 'ENG').trim().toUpperCase(),
    dia,
    horaInicio,
    horaFim,
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

export async function atualizarJustificativa(id, dados) {
  return comFila(() => atualizarJustificativaImpl(id, dados));
}

async function atualizarJustificativaImpl(id, dados) {
  const store = await readStore();
  const atual = store.justificativas || [];
  const index = atual.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const existente = atual[index];
  const proximoStatus = dados.status ? String(dados.status).trim() : existente.status;
  if (dados.status && !STATUS_VALIDOS.includes(proximoStatus)) {
    throw new Error('Status de justificativa inválido.');
  }

  atual[index] = {
    ...existente,
    ...(dados.dia !== undefined ? { dia: dados.dia } : {}),
    ...(dados.horaInicio !== undefined ? { horaInicio: dados.horaInicio } : {}),
    ...(dados.horaFim !== undefined ? { horaFim: dados.horaFim } : {}),
    ...(dados.motivo !== undefined ? { motivo: dados.motivo } : {}),
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

export async function excluirJustificativa(id) {
  return comFila(() => excluirJustificativaImpl(id));
}

async function excluirJustificativaImpl(id) {
  const store = await readStore();
  const atual = store.justificativas || [];
  const existe = atual.some((item) => item.id === id);
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
