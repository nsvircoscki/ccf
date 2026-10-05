import { Router } from 'express';
import { notaFiscalController } from '../controllers/notaFiscalController.js';
import { exigirModulo } from '../config/permissoes.js';

const router = Router();
router.use(exigirModulo('faturamento'));

router.get('/', notaFiscalController.listar);
router.post('/', notaFiscalController.criar);
router.post('/:id/emitir', notaFiscalController.emitir);
router.post('/:id/baixar-pdf', notaFiscalController.tentarBaixarPdf);
router.get('/:id/pdf', notaFiscalController.pdf);
router.delete('/:id', notaFiscalController.excluir);
export default router;
