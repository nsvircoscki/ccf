// src/routes/confrontanteRoutes.js
import { Router } from 'express';
import { confrontanteController } from '../controllers/confrontanteController.js';

const router = Router();

router.get('/', confrontanteController.listar);
router.get('/:id', confrontanteController.buscarPorId);
router.post('/', confrontanteController.criar);
router.put('/:id', confrontanteController.atualizar);
router.delete('/:id', confrontanteController.remover);

export default router;
