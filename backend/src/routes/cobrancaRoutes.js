import { Router } from 'express';
import { cobrancaController } from '../controllers/cobrancaController.js';
import { exigirModulo } from '../config/permissoes.js';

const router = Router();
router.use(exigirModulo('faturamento'));

router.get('/', cobrancaController.listar);
router.post('/', cobrancaController.criar);
router.post('/:id/parcelas/:numero/emitir', cobrancaController.emitirParcela);
router.post('/:id/parcelas/:numero/baixar-pdf', cobrancaController.tentarBaixarPdf);
router.get('/:id/parcelas/:numero/pdf', cobrancaController.pdfParcela);
router.delete('/:id', cobrancaController.excluir);
export default router;
