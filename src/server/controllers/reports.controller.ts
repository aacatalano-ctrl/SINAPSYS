import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../database/index.js';

type ReportItem = {
  _id: string | { doctorName?: string };
  totalIncome?: number;
  totalPaid?: number;
  totalBalance?: number;
  count?: number;
  totalOrders?: number;
};

export const getIncomeBreakdown = async (req: Request, res: Response) => {
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
};

export const getDoctorPerformance = async (req: Request, res: Response) => {
  console.log('Request received for /api/reports/doctor-performance.');
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
    console.log(`Generated doctor performance report. Count: ${doctorPerformance.length}. Sample:`, doctorPerformance.length > 0 ? doctorPerformance[0] : 'None');
    res.json(doctorPerformance);
  } catch (error) {
    console.error('Error al generar el reporte de rendimiento de doctores:', error);
    res.status(500).json({ error: 'Error al generar el reporte de rendimiento de doctores.' });
  }
};

export const getOrderStatus = async (req: Request, res: Response) => {
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
};

export const getDailySummary = async (req: Request, res: Response) => {
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
};

export const generateReportPDF = async (req: Request, res: Response) => {
  const { reportType } = req.params;
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
};

// Backward compatibility endpoint - aggregates data from main branch format
export const getReports = async (req: Request, res: Response) => {
  try {
    const generalStatsPipeline = await db.orders.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalCost: { $sum: { $ifNull: ['$cost', 0] } },
          totalPaid: { $sum: { $ifNull: [{ $sum: '$payments.amount' }, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalIncome: '$totalPaid',
          totalPendingBalance: { $subtract: ['$totalCost', '$totalPaid'] }
        }
      }
    ]);
    const stats = generalStatsPipeline[0] || { totalOrders: 0, totalIncome: 0, totalPendingBalance: 0 };

    const ordersByDoctor = await db.orders.aggregate([
      { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doctorInfo' } },
      { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$doctorInfo',
          totalOrders: { $sum: 1 },
          totalCost: { $sum: { $ifNull: ['$cost', 0] } },
          totalPaid: { $sum: { $ifNull: [{ $sum: '$payments.amount' }, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          doctor: {
            $trim: {
              input: {
                $cond: {
                  if: { $eq: ['$_id', null] },
                  then: 'Sin Asignar',
                  else: { $concat: [ { $ifNull: ['$_id.title', ''] }, ' ', { $ifNull: ['$_id.firstName', ''] }, ' ', { $ifNull: ['$_id.lastName', ''] } ] }
                }
              }
            }
          },
          totalOrders: 1,
          totalCost: 1,
          totalPaid: 1,
          pendingBalance: { $subtract: ['$totalCost', '$totalPaid'] }
        }
      },
      { $sort: { doctor: 1 } }
    ]);

    const ordersByJobType = await db.orders.aggregate([
        {
          $group: {
            _id: '$jobType',
            totalOrders: { $sum: 1 },
            totalCost: { $sum: { $ifNull: ['$cost', 0] } },
            totalPaid: { $sum: { $ifNull: [{ $sum: '$payments.amount' }, 0] } }
          }
        },
        { $project: { _id: 0, jobType: '$_id', totalOrders: 1, totalCost: 1, totalPaid: 1 } },
        { $sort: { jobType: 1 } }
    ]);

    res.json({
      generalStats: stats,
      ordersByDoctor,
      ordersByJobType,
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ message: 'Error al generar los reportes' });
  }
};
