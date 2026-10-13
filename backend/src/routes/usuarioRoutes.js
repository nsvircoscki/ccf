// src/routes/usuarioRoutes.js
import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController.js';
import { listarSessoes, revogarSessoes } from '../services/ponto/sessaoPontoService.js';

// Montado em server.js atrás de autenticar + exigirSetor('ENG', 'DEV'):
// só a administração cadastra e edita pessoas.
const router = Router();

router.get('/', usuarioController.listar);
router.get('/setores', usuarioController.setores);
router.post('/', usuarioController.criar);
router.put('/:id', usuarioController.atualizar);
router.put('/:id/senha', usuarioController.definirSenha);

// Aparelhos com sessão do ponto ativa (token "só ponto") e revogação:
// { sessaoId } revoga um aparelho; corpo vazio revoga todos da pessoa.
router.get('/:id/sessoes-ponto', async (req, res) => {
  try {
    res.json(await listarSessoes(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao listar aparelhos.' });
  }
});
router.post('/:id/sessoes-ponto/revogar', async (req, res) => {
  try {
    res.json(await revogarSessoes(req.params.id, { sessaoId: req.body?.sessaoId }, req.usuario));
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao revogar.' });
  }
});

export default router;
