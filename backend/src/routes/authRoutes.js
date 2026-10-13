// src/routes/authRoutes.js
import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { criarSessaoPonto, revogarSessoes } from '../services/ponto/sessaoPontoService.js';

const router = Router();

// Públicas: são o que a pessoa usa antes de ter um token. (Não existe mais
// lista pública de usuários: o login é digitado.)
router.post('/login', authController.login);
router.post('/criar-senha', authController.criarSenha);

// Exigem sessão.
router.post('/alterar-senha', autenticar, authController.alterarSenha);
router.get('/me', autenticar, authController.me);

// Token "só ponto" deste aparelho (depois de um login normal): { deviceId }.
router.post('/sessao-ponto', autenticar, async (req, res) => {
  try {
    res.json(await criarSessaoPonto(req.usuario, req.body?.deviceId, req.headers['user-agent']));
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao criar a sessão do ponto.' });
  }
});

// "Sair" no aparelho: revoga a sessão do ponto dele. { deviceId }
router.post('/sessao-ponto/sair', autenticar, async (req, res) => {
  try {
    if (!req.body?.deviceId) return res.status(400).json({ error: 'Aparelho não identificado.' });
    res.json(await revogarSessoes(req.usuario.id, { deviceId: req.body.deviceId }, req.usuario));
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao encerrar a sessão do ponto.' });
  }
});

export default router;
