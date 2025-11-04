import { Router } from 'express';
import { addPayment, updatePayment, deletePayment } from '../controllers/payments.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/:orderId/payments', addPayment);
router.put('/:orderId/payments/:paymentId', updatePayment);
router.delete('/:orderId/payments/:paymentId', authMiddleware, deletePayment);

export default router;
