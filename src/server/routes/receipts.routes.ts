import { Router } from 'express';
import { generateReceipt, generatePaymentHistoryPDF } from '../controllers/receipts.controller.js';

const router = Router();

router.post('/:orderId/receipt', generateReceipt);
router.post('/:orderId/payment-history-pdf', generatePaymentHistoryPDF);

export default router;
