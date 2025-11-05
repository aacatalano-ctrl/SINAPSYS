import { Router } from 'express';
import { getIncomeBreakdown, getDoctorPerformance, getOrderStatus, getDailySummary, generateReportPDF } from '../controllers/reports.controller.js';
import { getReports } from '../controllers/report.controller.js';

const router = Router();

// Backward compatibility endpoint - aggregates all reports
router.get('/', getReports);

// Modular report endpoints
router.get('/income-breakdown', getIncomeBreakdown);
router.get('/doctor-performance', getDoctorPerformance);
router.get('/order-status', getOrderStatus);
router.get('/daily-summary', getDailySummary);
router.get('/pdf/:reportType', generateReportPDF);

export default router;
