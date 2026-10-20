// src/routes/documentoRoutes.js
import { Router } from 'express';
import { documentoController } from '../controllers/documentoController.js';
import { exigirModulo } from '../config/permissoes.js';

const router = Router();

router.get('/templates', documentoController.listarTemplates);
router.put('/mapeamento-tipos', exigirModulo('config'), documentoController.salvarMapeamentoTipos);
router.put('/:servicoId/protocolo', exigirModulo('vinculacao', 'emissao-documentos'), documentoController.registrarNoProtocolo);
router.get('/:servicoId/:templateKey', exigirModulo('emissao-documentos', 'vinculacao'), documentoController.gerar);

export default router;
