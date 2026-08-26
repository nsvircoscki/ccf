import { Router } from 'express';
import { notaFiscalController } from '../controllers/notaFiscalController.js';

const router = Router();

router.get('/', notaFiscalController.listar);
router.post('/', notaFiscalController.criar);
router.post('/:id/emitir', notaFiscalController.emitir);
router.get('/:id/pdf', notaFiscalController.pdf);

export default router;
