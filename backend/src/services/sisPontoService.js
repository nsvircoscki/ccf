import fs from 'node:fs/promises';
import path from 'node:path';
import { notificationService } from './notificationService.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'sis-ponto.json');

const defaultStore = {
  funcionarios: [],
  registros: {},
  justificativas: [],
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

async function readStore() {
  await ensureStore();
  const text = await fs.readFile(DATA_FILE, 'utf8');
  try {
    return JSON.parse(text);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultStore, null, 2), 'utf8');
    return defaultStore;
  }
}

async function writeStore(store) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export async function listarFuncionarios() {
  const store = await readStore();
  return store.funcionarios || [];
}

export async function listarRegistros() {
  const store = await readStore();
  return store.registros || {};
}

export async function criarFuncionario(funcionario) {
  const store = await readStore();
  const id = funcionario.id || `${funcionario.setor || 'ENG'}-${Date.now()}`;
  const novo = {
    id,
    nome: String(funcionario.nome || '').trim(),
    setor: String(funcionario.setor || 'ENG').trim().toUpperCase(),
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

  // O horário padrão só existe no front (localStorage), então quem decide se
  // o registro ficou fora do horário é ele; aqui só disparamos o aviso.
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
  const store = await readStore();
  return store.justificativas || [];
}

export async function criarJustificativa(dados) {
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
  const store = await readStore();
  const atual = store.justificativas || [];
  const existe = atual.some((item) => item.id === id);
  store.justificativas = atual.filter((item) => item.id !== id);
  await writeStore(store);
  return existe;
}
