import { Router } from 'express';
import { getOrders, getOrderById, createOrder, updateOrder, deleteOrder } from '../controllers/orders.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', authMiddleware, deleteOrder);

export default router;
