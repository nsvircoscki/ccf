// src/routes/ticketRoutes.js
import { Router } from 'express';
import { ticketController } from '../controllers/ticketController.js'; // <-- Atenção ao .js aqui também

const router = Router();

router.get('/', ticketController.listar);
router.post('/', ticketController.criar);
router.post('/move', ticketController.mover);
router.post('/:id/comments', ticketController.comentar);
router.put('/:id', ticketController.atualizar);
router.delete('/:id', ticketController.excluir);

export default router;