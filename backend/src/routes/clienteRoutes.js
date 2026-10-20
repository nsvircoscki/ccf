// src/routes/clienteRoutes.js
import { Router } from 'express';
import { clienteController } from '../controllers/clienteController.js';
import { exigirModulo } from '../config/permissoes.js';

const router = Router();

router.get('/', clienteController.listar);
router.get('/:id', clienteController.buscarPorId);
router.post('/', exigirModulo('clientes', 'imoveis', 'vinculacao'), clienteController.criar);
router.put('/:id', exigirModulo('clientes', 'imoveis', 'vinculacao'), clienteController.atualizar);
router.delete('/:id', exigirModulo('clientes'), clienteController.remover);

export default router;
