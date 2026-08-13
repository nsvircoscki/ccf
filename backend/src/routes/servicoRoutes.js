// src/routes/servicoRoutes.js
import { Router } from 'express';
import { servicoController } from '../controllers/servicoController.js';

const router = Router();

router.get('/', servicoController.listar);
router.get('/:id/pdf', servicoController.pdf);
router.get('/:id/imagem', servicoController.imagem);
router.get('/:id', servicoController.buscarPorId);
router.post('/', servicoController.criar);
router.put('/:id', servicoController.atualizar);
router.post('/:id/pdf-previa', servicoController.previaPdf);
router.put('/:id/vinculacao', servicoController.atualizarVinculacao);
router.put('/:id/orcamento', servicoController.salvarOrcamento);
router.post('/:id/aprovar-orcamento', servicoController.aprovarOrcamento);

export default router;
