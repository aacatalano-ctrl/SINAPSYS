import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../database/index.js';

const router = Router();

// GET /api/reports/income-breakdown
router.get('/income-breakdown', async (req, res) => {
  try {
    const incomeBreakdown = await db.orders.aggregate([
      {
        $group: {
          _id: '$jobType',
          totalIncome: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    res.json(incomeBreakdown);
  } catch (error) {
    console.error('Error al generar el reporte de desglose de ingresos:', error);
    res.status(500).json({ error: 'Error al generar el reporte de desglose de ingresos.' });
  }
});

// GET /api/reports/doctor-performance
router.get('/doctor-performance', async (req, res) => {
  try {
    const doctorPerformance = await db.orders.aggregate([
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $unwind: {
          path: '$doctorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            doctorId: '$doctorId',
            doctorName: {
              $cond: {
                if: { $and: ['$doctorInfo.firstName', '$doctorInfo.lastName'] },
                then: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] },
                else: 'N/A'
              }
            }
          },
          totalOrders: { $sum: 1 },
          totalIncome: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' }
        }
      },
      {
        $sort: { '_id.doctorName': 1 }
      }
    ]);
    res.json(doctorPerformance);
  } catch (error) {
    console.error('Error al generar el reporte de rendimiento de doctores:', error);
    res.status(500).json({ error: 'Error al generar el reporte de rendimiento de doctores.' });
  }
});

// GET /api/reports/order-status
router.get('/order-status', async (req, res) => {
  try {
    const orderStatus = await db.orders.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalIncome: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    res.json(orderStatus);
  } catch (error) {
    console.error('Error al generar el reporte de estado de órdenes:', error);
    res.status(500).json({ error: 'Error al generar el reporte de estado de órdenes.' });
  }
});

// GET /api/reports/daily-summary
router.get('/daily-summary', async (req, res) => {
  try {
    const dailySummary = await db.orders.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalOrders: { $sum: 1 },
          totalIncome: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    res.json(dailySummary);
  } catch (error) {
    console.error('Error al generar el reporte de resumen diario:', error);
    res.status(500).json({ error: 'Error al generar el reporte de resumen diario.' });
  }
});

// GET /api/reports/pdf/:reportType
router.get('/pdf/:reportType', async (req, res) => {
  const { reportType } = req.params;
  type ReportItem = {
    _id: string | { doctorName?: string };
    totalIncome?: number;
    totalPaid?: number;
    totalBalance?: number;
    count?: number;
    totalOrders?: number;
  };
  let data: ReportItem[] = [];
  let title = '';

  try {
    switch (reportType) {
      case 'income-breakdown':
        data = await db.orders.aggregate([
          {
            $group: {
              _id: '$jobType',
              totalIncome: { $sum: '$totalPrice' },
              totalPaid: { $sum: '$paidAmount' },
              totalBalance: { $sum: '$balance' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        title = 'Reporte de Desglose de Ingresos';
        break;
      case 'doctor-performance':
        data = await db.orders.aggregate([
          {
            $lookup: {
              from: 'doctors',
              localField: 'doctorId',
              foreignField: '_id',
              as: 'doctorInfo'
            }
          },
          {
            $unwind: {
              path: '$doctorInfo',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: {
                doctorId: '$doctorId',
                doctorName: { $ifNull: ['$doctorInfo.name', 'N/A'] }
              },
              totalOrders: { $sum: 1 },
              totalIncome: { $sum: '$totalPrice' },
              totalPaid: { $sum: '$paidAmount' },
              totalBalance: { $sum: '$balance' }
            }
          },
          { $sort: { '_id.doctorName': 1 } }
        ]);
        title = 'Reporte de Rendimiento de Doctores';
        break;
      case 'order-status':
        data = await db.orders.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalIncome: { $sum: '$totalPrice' },
              totalPaid: { $sum: '$paidAmount' },
              totalBalance: { $sum: '$balance' }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        title = 'Reporte de Estado de Órdenes';
        break;
      case 'daily-summary':
        data = await db.orders.aggregate([
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              totalOrders: { $sum: 1 },
              totalIncome: { $sum: '$totalPrice' },
              totalPaid: { $sum: '$paidAmount' },
              totalBalance: { $sum: '$balance' }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        title = 'Reporte de Resumen Diario';
        break;
      default:
        return res.status(400).json({ error: 'Tipo de reporte no válido.' });
    }

    const doc = new PDFDocument();
    doc.pipe(res);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.pdf`);

    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();

    data.forEach((item: ReportItem) => {
      doc.fontSize(12).text(`ID: ${typeof item._id === 'string' ? item._id : item._id?.doctorName || 'N/A'}`);
      doc.text(`Total Órdenes: ${item.totalOrders || item.count || 0}`);
      doc.text(`Ingresos Totales: ${item.totalIncome?.toFixed(2) || '0.00'}`);
      doc.text(`Pagado Total: ${item.totalPaid?.toFixed(2) || '0.00'}`);
      doc.text(`Balance Pendiente: ${item.totalBalance?.toFixed(2) || '0.00'}`);
      doc.moveDown();
    });

    doc.end();

  } catch (error) {
    console.error(`Error al generar el PDF del reporte ${reportType}:`, error);
    res.status(500).json({ error: `Error al generar el PDF del reporte ${reportType}.` });
  }
});

export default router;
