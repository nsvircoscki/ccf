// src/routes/pontoExportRoutes.js
// Export de pontos pro PC da folha (pull). Protegido por token de máquina
// (tokenExportPonto), não por sessão — montado em server.js antes das rotas
// /sis-ponto autenticadas. Só pontos: o CCF não tem salário.
import { Router } from 'express';
import { tokenExportPonto } from '../middlewares/tokenExportPonto.js';
import { exportarCsv, exportarPendencias } from '../services/ponto/batidaService.js';
import { interpretarPeriodo, nomePeriodo } from '../services/ponto/exportCsv.js';

const router = Router();

function periodoOu400(req, res) {
  const periodo = interpretarPeriodo(req.query);
  if (!periodo) res.status(400).json({ error: 'Informe ?mes=YYYY-MM ou ?ano=YYYY.' });
  return periodo;
}

router.get('/export.csv', tokenExportPonto, async (req, res) => {
  const periodo = periodoOu400(req, res);
  if (!periodo) return;
  try {
    const csv = await exportarCsv(periodo);
    const nome = `pontos-${nomePeriodo(periodo)}.csv`;
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="${nome}"`);
    res.set('Cache-Control', 'no-store');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao gerar o CSV de pontos.' });
  }
});

router.get('/export-pendencias.json', tokenExportPonto, async (req, res) => {
  const periodo = periodoOu400(req, res);
  if (!periodo) return;
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await exportarPendencias(periodo));
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao gerar as pendências de ponto.' });
  }
});

export default router;
