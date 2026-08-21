// src/routes/imovelRoutes.js
import { Router } from 'express';
import { imovelController } from '../controllers/imovelController.js';

const router = Router();

router.get('/', imovelController.listar);
router.post('/extrair-descricao', imovelController.extrairDescricao);
router.get('/:id', imovelController.buscarPorId);
router.post('/', imovelController.criar);
router.put('/:id', imovelController.atualizar);
router.delete('/:id', imovelController.remover);

export default router;
