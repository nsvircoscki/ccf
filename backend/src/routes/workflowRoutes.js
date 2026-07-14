// src/routes/workflowRoutes.js
import { Router } from 'express';
import { workflowController } from '../controllers/workflowController.js'; // <-- Atenção ao workflowController e ao .js no final

const router = Router();

router.get('/', workflowController.listar);
router.post('/', workflowController.criar);
router.put('/:id', workflowController.editar);
router.delete('/:id', workflowController.excluir);

export default router;