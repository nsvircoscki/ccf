// src/routes/pontoSyncRoutes.js
// POST /sis-ponto/sync fica fora do autenticar() normal porque aceita:
//  - a sessão normal (login de 12h), ou
//  - o token "só ponto" do aparelho (60 dias, renovado a cada envio), ou
//  - nenhuma sessão válida: aí as batidas não entram no ponto, mas também não
//    se perdem — vão para a quarentena (revisão do RH) e o aparelho continua
//    com elas na fila até um login.
import { Router } from 'express';
import { extrairToken } from '../middlewares/autenticar.js';
import { sincronizar, quarentenarSemSessao } from '../services/ponto/batidaService.js';
import { identificarParaSync, renovarSessao } from '../services/ponto/sessaoPontoService.js';

const router = Router();

// Envio sem sessão válida é aberto: limite por IP para não virar porta de lixo.
const JANELA_MS = 15 * 60 * 1000;
const MAX_SEM_SESSAO_POR_IP = 30;
const semSessao = new Map(); // ip -> { quantidade, desde }
function excedeuSemSessao(ip) {
  const agora = Date.now();
  const atual = semSessao.get(ip);
  if (!atual || agora - atual.desde > JANELA_MS) {
    semSessao.set(ip, { quantidade: 1, desde: agora });
    return false;
  }
  atual.quantidade += 1;
  return atual.quantidade > MAX_SEM_SESSAO_POR_IP;
}
setInterval(() => {
  const agora = Date.now();
  for (const [ip, valor] of semSessao) if (agora - valor.desde > JANELA_MS) semSessao.delete(ip);
}, JANELA_MS).unref();

// { batidas: [...], dispositivo: { deviceId, pendentes } }. Resposta item a item:
// criado | duplicado (o aparelho marca como enviada) | quarentena (definitivo:
// true = está com o RH, o aparelho para de reenviar) | descartado | rejeitado.
// Com o token do aparelho, devolve também { tokenPonto, expiraEm } renovados.
router.post('/sync', async (req, res) => {
  try {
    const { quem, sessao, motivo } = await identificarParaSync(extrairToken(req));
    if (!quem) {
      if (excedeuSemSessao(req.ip || 'desconhecido')) {
        return res.status(429).json({ error: 'Muitos envios sem sessão. Entre de novo para enviar os pontos.' });
      }
      return res.json(await quarentenarSemSessao(req.body?.batidas, motivo));
    }
    const dispositivo = { ...(req.body?.dispositivo || {}), userAgent: req.headers['user-agent'] };
    const resultado = await sincronizar(req.body?.batidas, quem, dispositivo);
    const renovado = sessao ? await renovarSessao(sessao) : {};
    res.json({ ...resultado, ...renovado });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao sincronizar pontos.' });
  }
});

export default router;
