import { Router } from 'express';
import { getIncomeBreakdown, getDoctorPerformance, getOrderStatus, getDailySummary, generateReportPDF } from '../controllers/reports.controller.js';

const router = Router();

router.get('/income-breakdown', getIncomeBreakdown);
router.get('/doctor-performance', getDoctorPerformance);
router.get('/order-status', getOrderStatus);
router.get('/daily-summary', getDailySummary);
router.get('/pdf/:reportType', generateReportPDF);

export default router;
