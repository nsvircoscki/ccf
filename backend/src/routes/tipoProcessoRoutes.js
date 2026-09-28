// src/routes/tipoProcessoRoutes.js
import { Router } from 'express';
import { tipoProcessoController } from '../controllers/tipoProcessoController.js';
import { exigirSetor } from '../middlewares/autenticar.js';

const router = Router();

// Só ENG/DEV editam as etapas padrão. O setor vem da sessão (req.usuario,
// preenchido pelo autenticar em server.js) — antes vinha do header x-usuario,
// que o próprio navegador mandava com o valor que quisesse.
router.get('/', tipoProcessoController.listar);
router.put('/:tipo', exigirSetor('ENG', 'DEV'), tipoProcessoController.atualizar);

export default router;
