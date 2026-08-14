// src/routes/tipoProcessoRoutes.js
import { Router } from 'express';
import { tipoProcessoController } from '../controllers/tipoProcessoController.js';

const router = Router();

// Só Charles pode editar as etapas padrão — checagem simples via header
// (mesmo nível de confiança do resto do sistema hoje, que não tem
// sessão/token; o front manda o usuário logado em x-usuario).
function exigirCharles(req, res, next) {
  if (req.headers['x-usuario'] !== 'Charles') {
    return res.status(403).json({ error: 'Só o usuário Charles pode configurar etapas padrão.' });
  }
  next();
}

router.get('/', tipoProcessoController.listar);
router.put('/:tipo', exigirCharles, tipoProcessoController.atualizar);

export default router;
