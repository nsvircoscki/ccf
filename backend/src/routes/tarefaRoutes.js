import { Router } from 'express';
import { tarefaController } from '../controllers/tarefaController.js';
import { exigirModulo } from '../config/permissoes.js';

const router = Router();

router.get('/', tarefaController.listar);
router.post('/', exigirModulo('tarefas'), tarefaController.criar);
router.put('/reordenar', exigirModulo('tarefas'), tarefaController.reordenar);
router.put('/:id/observacao', exigirModulo('tarefas'), tarefaController.atualizarObservacao);
router.post('/:id/concluir', exigirModulo('tarefas'), tarefaController.concluir);
router.post('/:id/reabrir', exigirModulo('tarefas'), tarefaController.reabrir);
router.post('/:id/aguardar', exigirModulo('tarefas'), tarefaController.colocarEmAguardo);
router.post('/:id/retomar', exigirModulo('tarefas'), tarefaController.retomar);
router.delete('/:id', exigirModulo('tarefas'), tarefaController.excluir);

export default router;
