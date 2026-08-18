// src/routes/notificationRoutes.js
import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';

const router = Router();

router.get('/', notificationController.listar);
router.put('/:id/lida', notificationController.marcarComoLida);
router.put('/marcar-todas-lidas', notificationController.marcarTodasComoLidas);

export default router;
