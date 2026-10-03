// src/services/pontoOffline.js
// Fila offline do ponto. Toda batida é gravada PRIMEIRO no IndexedDB do
// aparelho e só depois enviada ao backend (POST /sis-ponto/sync). Sem rede, a
// batida fica guardada e sobe sozinha quando a conexão voltar.
//
// Só dados de ponto passam por aqui — nada de salário no aparelho.
import Dexie from 'dexie';
import { api, temToken } from './api';

const db = new Dexie('ccf-ponto');
// sincronizado fica fora do índice: IndexedDB não indexa boolean, e a fila é pequena.
db.version(1).stores({ batidas: 'clientId, funcionarioId, batidoEm' });

const LOTE = 200;
const INTERVALO_RESERVA_MS = 60 * 1000;
// Batidas já enviadas ficam um tempo no aparelho (conferência local) e depois saem.
const RETER_ENVIADAS_MS = 30 * 24 * 3600 * 1000;

// crypto.randomUUID só existe em contexto seguro (HTTPS/localhost). Em HTTP
// na rede interna cai no gerador manual — mesmo formato UUID v4.
function novoUuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const CHAVE_DEVICE = 'ccf:deviceId';
export function deviceId() {
  let id = localStorage.getItem(CHAVE_DEVICE);
  if (!id) {
    id = novoUuid();
    localStorage.setItem(CHAVE_DEVICE, id);
  }
  return id;
}

// ---- estado observável (contador de pendentes, erro da última tentativa) ----
let estado = { pendentes: 0, sincronizando: false, ultimoErro: null, ultimaSincronizacao: null, online: navigator.onLine };
const ouvintes = new Set();

function atualizarEstado(parcial) {
  estado = { ...estado, ...parcial };
  ouvintes.forEach((cb) => cb(estado));
}

export const obterEstado = () => estado;

// cb(estado) a cada mudança; devolve a função pra cancelar a inscrição.
export function inscrever(cb) {
  ouvintes.add(cb);
  return () => ouvintes.delete(cb);
}

const pendentesTodos = () => db.batidas.filter((b) => !b.sincronizado).sortBy('batidoEm');

async function recontar() {
  atualizarEstado({ pendentes: await db.batidas.filter((b) => !b.sincronizado).count() });
}

// Pendentes de um funcionário, pra tela mostrar a batida antes de o servidor confirmar.
export function pendentesDoFuncionario(funcionarioId) {
  return db.batidas.where('funcionarioId').equals(funcionarioId).filter((b) => !b.sincronizado).sortBy('batidoEm');
}

// tipo: 'ENTRADA' | 'SAIDA'. batidoEm: hora do aparelho (ISO).
export async function registrarBatida({ funcionarioId, tipo, batidoEm, atrasado = false, minutosAtraso = 0 }) {
  const batida = {
    clientId: novoUuid(),
    funcionarioId,
    tipo,
    batidoEm,
    deviceId: deviceId(),
    atrasado,
    minutosAtraso,
    sincronizado: false,
    tentativas: 0,
    ultimoErro: null,
  };
  await db.batidas.add(batida);
  await recontar();
  sincronizarPendentes();
  return batida;
}

// Tira da fila uma batida que ainda não subiu (excluída na tela antes do envio).
export async function descartarPendente(funcionarioId, batidoEm) {
  const alvo = await db.batidas.where('funcionarioId').equals(funcionarioId)
    .filter((b) => !b.sincronizado && b.batidoEm === batidoEm).first();
  if (!alvo) return false;
  await db.batidas.delete(alvo.clientId);
  await recontar();
  return true;
}

let emAndamento = null;

// Envia tudo que está pendente. Só marca como sincronizado o que o servidor
// confirmou (criado ou duplicado); rejeitado continua na fila com o erro.
export function sincronizarPendentes() {
  if (emAndamento) return emAndamento;
  emAndamento = sincronizarImpl().finally(() => { emAndamento = null; });
  return emAndamento;
}

async function sincronizarImpl() {
  if (!navigator.onLine || !temToken()) {
    await recontar();
    return { enviados: 0 };
  }
  atualizarEstado({ sincronizando: true });
  let enviados = 0;
  try {
    await db.batidas.filter((b) => b.sincronizado && Date.now() - new Date(b.sincronizadoEm).getTime() > RETER_ENVIADAS_MS).delete();

    const pendentes = await pendentesTodos();
    for (let i = 0; i < pendentes.length; i += LOTE) {
      const lote = pendentes.slice(i, i + LOTE);
      let resposta;
      try {
        resposta = await api.syncSispontoBatidas({
          batidas: lote.map(({ clientId, funcionarioId, tipo, batidoEm, deviceId: dev, atrasado, minutosAtraso }) => ({ clientId, funcionarioId, tipo, batidoEm, deviceId: dev, atrasado, minutosAtraso })),
          dispositivo: { deviceId: deviceId(), pendentes: pendentes.length - i },
        });
      } catch {
        atualizarEstado({ ultimoErro: 'Sem conexão com o servidor. Os pontos ficam guardados neste aparelho.' });
        return { enviados };
      }
      if (resposta.status === 401) {
        atualizarEstado({ ultimoErro: 'Sessão expirada: entre de novo para enviar os pontos guardados.' });
        return { enviados };
      }
      if (!resposta.ok) {
        atualizarEstado({ ultimoErro: resposta.data?.error || 'O servidor recusou o envio. Tentaremos de novo.' });
        return { enviados };
      }

      const agora = new Date().toISOString();
      const rejeicoes = [];
      await db.transaction('rw', db.batidas, async () => {
        for (const r of resposta.data?.resultados || []) {
          if (r.status === 'criado' || r.status === 'duplicado') {
            await db.batidas.update(r.clientId, { sincronizado: true, sincronizadoEm: agora, ultimoErro: null });
            enviados += 1;
          } else {
            const atual = await db.batidas.get(r.clientId);
            if (atual) await db.batidas.update(r.clientId, { tentativas: (atual.tentativas || 0) + 1, ultimoErro: r.erro || 'Rejeitado pelo servidor.' });
            rejeicoes.push(r.erro);
          }
        }
      });
      atualizarEstado({ ultimoErro: rejeicoes.length ? `${rejeicoes.length} ponto(s) recusado(s): ${rejeicoes[0]}` : null });
    }
    atualizarEstado({ ultimaSincronizacao: new Date().toISOString() });
    return { enviados };
  } finally {
    await recontar();
    atualizarEstado({ sincronizando: false, ...(enviados ? { ultimoEnvio: Date.now() } : {}) });
  }
}

let iniciado = false;

// Gatilhos de envio: ao abrir o app, quando a rede volta, quando a aba volta
// a ficar visível e num timer de reserva (o evento "online" nem sempre dispara).
export function iniciarSincronizacao() {
  if (iniciado) return;
  iniciado = true;
  window.addEventListener('online', () => { atualizarEstado({ online: true }); sincronizarPendentes(); });
  window.addEventListener('offline', () => atualizarEstado({ online: false }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sincronizarPendentes(); });
  setInterval(() => sincronizarPendentes(), INTERVALO_RESERVA_MS);
  sincronizarPendentes();
}
