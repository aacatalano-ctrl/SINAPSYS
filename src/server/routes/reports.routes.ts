import { Router } from 'express';
import { getIncomeBreakdown, getDoctorPerformance, getOrderStatus, getDailySummary, generateReportPDF, getReports } from '../controllers/reports.controller.js';

const router = Router();

// Backward compatibility endpoint - returns aggregate format from main
router.get('/', getReports);

// Modular report endpoints
router.get('/income-breakdown', getIncomeBreakdown);
router.get('/doctor-performance', getDoctorPerformance);
router.get('/order-status', getOrderStatus);
router.get('/daily-summary', getDailySummary);
router.get('/pdf/:reportType', generateReportPDF);

export default router;
