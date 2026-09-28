// src/routes/authRoutes.js
import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = Router();

// Públicas: são o que a pessoa usa antes de ter um token. (Não existe mais
// lista pública de usuários: o login é digitado.)
router.post('/login', authController.login);
router.post('/criar-senha', authController.criarSenha);

// Exigem sessão.
router.post('/alterar-senha', autenticar, authController.alterarSenha);
router.get('/me', autenticar, authController.me);

export default router;
