// src/routes/documentoRoutes.js
import { Router } from 'express';
import { documentoController } from '../controllers/documentoController.js';

const router = Router();

router.get('/templates', documentoController.listarTemplates);
router.get('/:servicoId/:templateKey', documentoController.gerar);

export default router;
