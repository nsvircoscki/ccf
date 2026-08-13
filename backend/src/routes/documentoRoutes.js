// src/routes/documentoRoutes.js
import { Router } from 'express';
import { documentoController } from '../controllers/documentoController.js';

const router = Router();

router.get('/templates', documentoController.listarTemplates);
router.put('/mapeamento-tipos', documentoController.salvarMapeamentoTipos);
router.put('/:servicoId/protocolo', documentoController.registrarNoProtocolo);
router.get('/:servicoId/:templateKey', documentoController.gerar);

export default router;
