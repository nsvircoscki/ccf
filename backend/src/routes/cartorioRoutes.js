import { Router } from 'express';
import { cartorioController } from '../controllers/cartorioController.js';

const router = Router();
router.get('/:cns', cartorioController.buscarPorCns);

export default router;

