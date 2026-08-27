import { Router } from 'express';
import { cobrancaController } from '../controllers/cobrancaController.js';

const router = Router();

router.get('/', cobrancaController.listar);
router.post('/', cobrancaController.criar);
router.post('/:id/parcelas/:numero/emitir', cobrancaController.emitirParcela);
router.post('/:id/parcelas/:numero/baixar-pdf', cobrancaController.tentarBaixarPdf);
router.get('/:id/parcelas/:numero/pdf', cobrancaController.pdfParcela);

export default router;
