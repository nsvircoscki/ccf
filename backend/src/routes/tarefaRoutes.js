import { Router } from 'express';
import { tarefaController } from '../controllers/tarefaController.js';

const router = Router();

router.get('/', tarefaController.listar);
router.post('/', tarefaController.criar);
router.put('/:id/observacao', tarefaController.atualizarObservacao);
router.post('/:id/concluir', tarefaController.concluir);
router.post('/:id/reabrir', tarefaController.reabrir);
router.post('/abrir-pasta', tarefaController.abrirPasta);
router.delete('/:id', tarefaController.excluir);

export default router;
