// src/controllers/usuarioController.js
import { usuarioService } from '../services/usuarioService.js';

export const usuarioController = {
  async listar(req, res) {
    try {
      res.json(await usuarioService.listar());
    } catch (error) {
      res.status(500).json({ error: 'Erro ao carregar usuários.' });
    }
  },

  async setores(req, res) {
    try {
      res.json(await usuarioService.listarSetores());
    } catch (error) {
      res.status(500).json({ error: 'Erro ao carregar setores.' });
    }
  },

  async criar(req, res) {
    try {
      res.status(201).json(await usuarioService.criar(req.body));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // req.usuario.id: impede o admin de desativar a si mesmo ou sair do setor.
  async atualizar(req, res) {
    try {
      res.json(await usuarioService.atualizar(req.params.id, req.body, req.usuario.id));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async definirSenha(req, res) {
    try {
      await usuarioService.definirSenha(req.params.id, req.body.novaSenha);
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
