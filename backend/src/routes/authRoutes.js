// src/routes/authRoutes.js
import { Router } from 'express';
import { authController } from '../controllers/authController.js';

const router = Router();

router.post('/login', authController.login);
router.post('/criar-senha', authController.criarSenha);
router.post('/alterar-senha', authController.alterarSenha);

export default router;
