// src/controllers/authController.js
import { authService } from '../services/authService.js';

export const authController = {
  async login(req, res) {
    try {
      const resultado = await authService.login(req.body.usuario, req.body.senha);
      res.json(resultado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async criarSenha(req, res) {
    try {
      await authService.criarSenha(req.body.usuario, req.body.novaSenha);
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async alterarSenha(req, res) {
    try {
      await authService.alterarSenha(req.body.usuario, req.body.senhaAtual, req.body.novaSenha);
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
