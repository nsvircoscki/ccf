// src/controllers/authController.js
import { authService } from '../services/authService.js';

export const authController = {
  async login(req, res) {
    try {
      const resultado = await authService.login(req.body.login, req.body.senha);
      res.json(resultado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async criarSenha(req, res) {
    try {
      const resultado = await authService.criarSenha(req.body.login, req.body.novaSenha);
      res.json(resultado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // req.usuario vem do middleware autenticar — a senha trocada é sempre a de
  // quem está logado.
  async alterarSenha(req, res) {
    try {
      await authService.alterarSenha(req.usuario.id, req.body.senhaAtual, req.body.novaSenha);
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Usado pelo front ao recarregar a página: confirma que o token guardado
  // ainda vale e devolve a pessoa atualizada (nome/setor podem ter mudado).
  async me(req, res) {
    res.json(req.usuario);
  },
};
