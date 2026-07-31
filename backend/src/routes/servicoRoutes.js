// src/routes/servicoRoutes.js
import { Router } from 'express';
import { servicoController } from '../controllers/servicoController.js';

const router = Router();

router.get('/', servicoController.listar);
router.get('/:id', servicoController.buscarPorId);
router.post('/', servicoController.criar);
router.post('/:id/aprovar-orcamento', servicoController.aprovarOrcamento);

export default router;
