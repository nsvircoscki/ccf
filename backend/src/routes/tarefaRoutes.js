import { Router } from 'express';
import { tarefaController } from '../controllers/tarefaController.js';

const router = Router();

router.get('/', tarefaController.listar);
router.post('/', tarefaController.criar);
router.post('/:id/concluir', tarefaController.concluir);
router.post('/:id/reabrir', tarefaController.reabrir);
router.delete('/:id', tarefaController.excluir);

export default router;
