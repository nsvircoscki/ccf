// src/routes/tipoProcessoRoutes.js
import { Router } from 'express';
import { tipoProcessoController } from '../controllers/tipoProcessoController.js';

const router = Router();

// Só ENG pode editar as etapas padrão — checagem simples via header
// (mesmo nível de confiança do resto do sistema hoje, que não tem
// sessão/token; o front manda o usuário logado em x-usuario).
function exigirEng(req, res, next) {
  if (!['ENG', 'DEV'].includes(req.headers['x-usuario'])) {
    return res.status(403).json({ error: 'Só ENG ou DEV podem configurar etapas padrão.' });
  }
  next();
}


router.get('/', tipoProcessoController.listar);
router.put('/:tipo', exigirEng, tipoProcessoController.atualizar);

export default router;
