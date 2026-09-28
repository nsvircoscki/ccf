// src/routes/usuarioRoutes.js
import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController.js';

// Montado em server.js atrás de autenticar + exigirSetor('ENG', 'DEV'):
// só a administração cadastra e edita pessoas.
const router = Router();

router.get('/', usuarioController.listar);
router.get('/setores', usuarioController.setores);
router.post('/', usuarioController.criar);
router.put('/:id', usuarioController.atualizar);
router.put('/:id/senha', usuarioController.definirSenha);

export default router;
