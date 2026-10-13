// src/services/pontoOffline.js
// Fila offline do ponto. Toda batida é gravada PRIMEIRO no IndexedDB do
// aparelho e só depois enviada ao backend (POST /sis-ponto/sync). Sem rede, a
// batida fica guardada e sobe sozinha quando a conexão voltar.
//
// Só dados de ponto passam por aqui — nada de salário no aparelho.
import Dexie from 'dexie';
import { api, temToken, temTokenPonto, definirTokenPonto } from './api';

const db = new Dexie('ccf-ponto');
// sincronizado fica fora do índice: IndexedDB não indexa boolean, e a fila é pequena.
db.version(1).stores({ batidas: 'clientId, funcionarioId, batidoEm' });

const LOTE = 200;
// O timer olha a fila a cada 30 s; depois de uma falha (servidor desligado,
// sem rede) a próxima tentativa automática espera cada vez mais, até 10 min.
const INTERVALO_TIMER_MS = 30 * 1000;
const ESPERAS_MS = [30, 60, 120, 300, 600].map((seg) => seg * 1000);
let falhasSeguidas = 0;
let proximaTentativaEm = 0;
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
  sincronizarPendentes({ forcar: true });
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

// Envia tudo que está pendente. Só marca como enviado o que o servidor
// confirmou (criado, duplicado, ou entregue ao RH na quarentena); o resto
// continua na fila. { forcar: true } ignora a espera entre tentativas
// (bater ponto, botão "Enviar agora", login).
export function sincronizarPendentes({ forcar = false } = {}) {
  if (emAndamento) return emAndamento;
  if (!forcar && Date.now() < proximaTentativaEm) return Promise.resolve({ enviados: 0, aguardando: true });
  emAndamento = sincronizarImpl().finally(() => { emAndamento = null; });
  return emAndamento;
}

function registrarFalha(mensagem) {
  proximaTentativaEm = Date.now() + ESPERAS_MS[Math.min(falhasSeguidas, ESPERAS_MS.length - 1)];
  falhasSeguidas += 1;
  atualizarEstado({ ultimoErro: mensagem, proximaTentativaEm });
}

// Depois de um login normal: pega o token "só ponto" deste aparelho (troca o
// anterior). Sem rede, fica para o próximo login/abertura.
export async function garantirSessaoPonto({ renovar = false } = {}) {
  if (!temToken() || (temTokenPonto() && !renovar)) return;
  try {
    const { tokenPonto } = await api.criarSessaoPonto(deviceId());
    if (tokenPonto) definirTokenPonto(tokenPonto);
  } catch {
    // tenta de novo na próxima vez
  }
}

// "Sair": encerra a sessão do ponto deste aparelho no servidor (se der) e
// esquece o token. Pontos que ainda estão na fila sobem no próximo login.
export async function encerrarSessaoPonto() {
  if (temToken()) await api.sairSessaoPonto(deviceId()).catch(() => {});
  definirTokenPonto(null);
}

async function sincronizarImpl() {
  const pendentesAntes = await db.batidas.filter((b) => !b.sincronizado).count();
  if (!pendentesAntes) {
    falhasSeguidas = 0;
    proximaTentativaEm = 0;
    await recontar();
    return { enviados: 0 };
  }
  if (!navigator.onLine) {
    await recontar();
    registrarFalha('Sem internet. Os pontos ficam guardados neste aparelho.');
    return { enviados: 0 };
  }
  if (!temToken() && !temTokenPonto()) {
    await recontar();
    atualizarEstado({ ultimoErro: 'Entre de novo para enviar os pontos guardados.' });
    return { enviados: 0 };
  }
  atualizarEstado({ sincronizando: true });
  let enviados = 0;
  try {
    // A internet do celular pode estar ok com o servidor desligado (noite, fim de semana).
    if (!(await api.servidorDisponivel())) {
      registrarFalha('Servidor indisponível no momento. Os pontos ficam guardados neste aparelho e serão enviados quando ele voltar.');
      return { enviados };
    }

    await db.batidas.filter((b) => b.sincronizado && Date.now() - new Date(b.sincronizadoEm).getTime() > RETER_ENVIADAS_MS).delete();

    const pendentes = await pendentesTodos();
    let sessaoInvalida = false;
    const rejeicoes = [];
    let emRevisao = 0;
    for (let i = 0; i < pendentes.length; i += LOTE) {
      const lote = pendentes.slice(i, i + LOTE);
      const payload = {
        batidas: lote.map(({ clientId, funcionarioId, tipo, batidoEm, deviceId: dev, atrasado, minutosAtraso }) => ({ clientId, funcionarioId, tipo, batidoEm, deviceId: dev, atrasado, minutosAtraso })),
        dispositivo: { deviceId: deviceId(), pendentes: pendentes.length - i },
      };
      // Sessão normal primeiro; se ela já venceu, o token do aparelho.
      const credenciais = [temToken() && 'sessao', temTokenPonto() && 'ponto'].filter(Boolean);
      let resposta;
      try {
        for (const credencial of credenciais) {
          resposta = await api.syncSispontoBatidas(payload, credencial);
          if (!resposta.data?.sessaoInvalida) break;
        }
      } catch {
        registrarFalha('Sem conexão com o servidor. Os pontos ficam guardados neste aparelho.');
        return { enviados };
      }
      if (!resposta.ok) {
        registrarFalha(resposta.data?.error || 'O servidor recusou o envio. Tentaremos de novo.');
        return { enviados };
      }
      if (resposta.data?.tokenPonto) definirTokenPonto(resposta.data.tokenPonto);
      if (resposta.data?.sessaoInvalida) sessaoInvalida = true;

      const agora = new Date().toISOString();
      await db.transaction('rw', db.batidas, async () => {
        for (const r of resposta.data?.resultados || []) {
          const atual = await db.batidas.get(r.clientId);
          if (!atual) continue;
          if (r.status === 'criado' || r.status === 'duplicado') {
            await db.batidas.update(r.clientId, { sincronizado: true, sincronizadoEm: agora, ultimoErro: null });
            enviados += 1;
          } else if ((r.status === 'quarentena' && r.definitivo) || r.status === 'descartado') {
            // Está com o RH (ou ele já descartou): não adianta reenviar.
            await db.batidas.update(r.clientId, { sincronizado: true, sincronizadoEm: agora, emRevisao: true, ultimoErro: r.erro || null });
            emRevisao += 1;
          } else {
            // Rejeitado, ou na quarentena por sessão vencida: continua na fila.
            await db.batidas.update(r.clientId, { tentativas: (atual.tentativas || 0) + 1, ultimoErro: r.erro || 'Rejeitado pelo servidor.' });
            if (r.status !== 'quarentena') rejeicoes.push(r.erro);
          }
        }
      });
    }

    if (sessaoInvalida) {
      // O RH já foi avisado (quarentena); depois de um login os pontos sobem.
      registrarFalha('Sessão expirada: entre de novo para enviar os pontos guardados.');
    } else {
      falhasSeguidas = 0;
      proximaTentativaEm = 0;
      const avisos = [
        rejeicoes.length ? `${rejeicoes.length} ponto(s) recusado(s): ${rejeicoes[0]}` : null,
        emRevisao ? `${emRevisao} ponto(s) enviado(s) para revisão do RH.` : null,
      ].filter(Boolean);
      atualizarEstado({ ultimoErro: avisos.join(' ') || null, proximaTentativaEm: 0, ultimaSincronizacao: new Date().toISOString() });
    }
    return { enviados };
  } finally {
    await recontar();
    atualizarEstado({ sincronizando: false, ...(enviados ? { ultimoEnvio: Date.now() } : {}) });
  }
}

let iniciado = false;

// Gatilhos de envio: ao abrir o app, quando a rede volta, quando o app volta
// ao primeiro plano e num timer (o "online" sozinho não basta: a rede pode
// estar ok com o servidor desligado). Voltar à tela ou a rede voltar ignoram
// a espera entre tentativas; o timer respeita.
export function iniciarSincronizacao() {
  if (iniciado) return;
  iniciado = true;
  // Pede ao navegador para não apagar a fila sozinho (Safari/iPhone apaga
  // dados de sites pouco usados; instalado na tela inicial o risco já é menor).
  navigator.storage?.persist?.().catch(() => {});
  window.addEventListener('online', () => { atualizarEstado({ online: true }); sincronizarPendentes({ forcar: true }); });
  window.addEventListener('offline', () => atualizarEstado({ online: false }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sincronizarPendentes({ forcar: true }); });
  setInterval(() => sincronizarPendentes(), INTERVALO_TIMER_MS);
  sincronizarPendentes({ forcar: true });
}
