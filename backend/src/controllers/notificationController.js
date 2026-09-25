// src/controllers/notificationController.js
import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  async listar(req, res) {
    try {
      const setor = req.headers['x-usuario'];
      const [notificacoes, naoLidas] = await Promise.all([
        notificationService.listarPorSetor(setor),
        notificationService.contarNaoLidas(setor),
      ]);
      res.status(200).json({ notificacoes, naoLidas });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async marcarComoLida(req, res) {
    try {
      const resultado = await notificationService.marcarComoLida(req.params.id);
      res.status(200).json(resultado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async marcarTodasComoLidas(req, res) {
    try {
      await notificationService.marcarTodasComoLidas(req.headers['x-usuario']);
      res.status(200).json({ message: 'ok' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async excluir(req, res) {
    try {
      await notificationService.excluir(req.params.id);
      res.status(200).json({ message: 'ok' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
