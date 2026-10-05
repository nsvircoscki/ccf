// src/routes/imovelRoutes.js
import { Router } from 'express';
import { imovelController } from '../controllers/imovelController.js';
import { exigirModulo } from '../config/permissoes.js';

const router = Router();

router.get('/', imovelController.listar);
router.post('/extrair-descricao', exigirModulo('imoveis', 'vinculacao'), imovelController.extrairDescricao);
router.get('/:id', imovelController.buscarPorId);
router.post('/', exigirModulo('imoveis', 'vinculacao'), imovelController.criar);
router.put('/:id', exigirModulo('imoveis', 'vinculacao'), imovelController.atualizar);
router.delete('/:id', exigirModulo('imoveis'), imovelController.remover);

export default router;
