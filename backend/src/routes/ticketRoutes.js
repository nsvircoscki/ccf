// src/routes/ticketRoutes.js
import { Router } from 'express';
import { ticketController } from '../controllers/ticketController.js'; // <-- Atenção ao .js aqui também
import { exigirModulo } from '../config/permissoes.js';

const router = Router();

router.get('/', ticketController.listar);
router.post('/', exigirModulo('kanban'), ticketController.criar);
router.post('/move', exigirModulo('kanban'), ticketController.mover);
router.post('/:id/comments', exigirModulo('kanban'), ticketController.comentar);
router.put('/:id', exigirModulo('kanban'), ticketController.atualizar);
router.delete('/:id', exigirModulo('kanban'), ticketController.excluir);

export default router;