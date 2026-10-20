// src/routes/servicoRoutes.js
import { Router } from 'express';
import { servicoController } from '../controllers/servicoController.js';
import { exigirModulo } from '../config/permissoes.js';

const router = Router();

router.get('/', servicoController.listar);
router.get('/:id/pdf', servicoController.pdf);
router.get('/:id/imagem', servicoController.imagem);
router.get('/:id', servicoController.buscarPorId);
router.post('/', exigirModulo('cadastro'), servicoController.criar);
router.put('/:id', exigirModulo('cadastro'), servicoController.atualizar);
router.post('/:id/pdf-previa', exigirModulo('orcamento'), servicoController.previaPdf);
router.put('/:id/vinculacao', exigirModulo('vinculacao'), servicoController.atualizarVinculacao);
router.put('/:id/orcamento', exigirModulo('orcamento'), servicoController.salvarOrcamento);
router.post('/:id/aprovar-orcamento', exigirModulo('orcamento'), servicoController.aprovarOrcamento);

export default router;
