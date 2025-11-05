import { Request, Response } from 'express';
import { db } from '../database/index.js';

export const getReports = async (req: Request, res: Response) => {
  try {
    // 1. General Stats
    const totalOrders = await db.orders.countDocuments();
    const ordersWithPayments = await db.orders.find({ 'payments.0': { $exists: true } });

    let totalIncome = 0;
    let totalPendingBalance = 0;

    ordersWithPayments.forEach(order => {
      const paidAmount = order.payments.reduce((sum, p) => sum + p.amount, 0);
      totalIncome += paidAmount;
      if (order.cost) {
        totalPendingBalance += order.cost - paidAmount;
      }
    });

    // 2. Orders by Doctor
    const ordersByDoctor = await db.orders.aggregate([
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $unwind: '$doctorInfo'
      },
      {
        $project: {
          'doctorInfo.title': 1,
          'doctorInfo.firstName': 1,
          'doctorInfo.lastName': 1,
          status: 1,
          cost: 1,
          paidAmount: { $sum: '$payments.amount' }
        }
      },
      {
        $group: {
          _id: '$doctorInfo',
          totalOrders: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completado'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $ne: ['$status', 'Completado'] }, 1, 0] }
          },
          totalPaid: { $sum: '$paidAmount' },
          totalCost: { $sum: '$cost' }
        }
      },
      {
        $project: {
          _id: 0,
          doctor: {
            $concat: [
              '$_id.title',
              ' ',
              '$_id.firstName',
              ' ',
              '$_id.lastName'
            ]
          },
          totalOrders: '$totalOrders',
          completed: '$completed',
          pending: '$pending',
          totalPaid: '$totalPaid',
          pendingBalance: { $subtract: ['$totalCost', '$totalPaid'] }
        }
      }
    ]);

    // 3. Orders by Job Type
    const ordersByJobType = await db.orders.aggregate([
        {
          $group: {
            _id: '$jobType',
            totalOrders: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            totalPaid: { $sum: { $sum: '$payments.amount' } }
          }
        },
        {
          $project: {
            _id: 0,
            jobType: '$_id',
            totalOrders: 1,
            totalCost: 1,
            totalPaid: 1
          }
        }
    ]);

    res.json({
      generalStats: {
        totalOrders,
        totalIncome,
        totalPendingBalance,
      },
      ordersByDoctor,
      ordersByJobType,
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ message: 'Error al generar los reportes' });
  }
};
