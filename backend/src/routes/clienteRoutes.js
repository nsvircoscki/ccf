// src/routes/clienteRoutes.js
import { Router } from 'express';
import { clienteController } from '../controllers/clienteController.js';

const router = Router();

router.get('/', clienteController.listar);
router.get('/:id', clienteController.buscarPorId);
router.post('/', clienteController.criar);
router.put('/:id', clienteController.atualizar);
router.delete('/:id', clienteController.remover);

export default router;
