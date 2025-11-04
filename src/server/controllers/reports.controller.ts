import { Request, Response } from 'express';
import { db } from '../database/index.js';

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
