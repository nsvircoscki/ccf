// src/controllers/cartorioController.js
import { cartorioService } from '../services/cartorioService.js';

export const cartorioController = {
  async buscarPorCns(req, res) {
    const resultado = await cartorioService.buscarPorCns(req.params.cns);
    if (!resultado) return res.status(404).json({ error: 'CNS ainda não encontrado na base.' });
    res.json(resultado);
  },
};
