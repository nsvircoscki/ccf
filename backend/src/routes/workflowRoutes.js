// src/routes/workflowRoutes.js
import { Router } from 'express';
import { workflowController } from '../controllers/workflowController.js'; // <-- Atenção ao workflowController e ao .js no final
import { exigirSetor } from '../middlewares/autenticar.js';

const router = Router();

router.get('/', workflowController.listar);
router.post('/', exigirSetor('ENG', 'DEV'), workflowController.criar);
router.put('/:id', exigirSetor('ENG', 'DEV'), workflowController.editar);
router.put('/:id/details', workflowController.detalhes);
router.delete('/:id', exigirSetor('ENG', 'DEV'), workflowController.excluir);
router.patch('/:id/status', workflowController.alterarStatus);

export default router;