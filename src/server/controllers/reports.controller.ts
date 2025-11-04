import { Request, Response } from 'express';
// ESTA ES LA RUTA CORRECTA QUE ARREGLA TODO
import { db } from '../database/index.js';

export const getReports = async (req: Request, res: Response) => {
  try {
    // 1. General Stats
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

    // 2. Orders by Doctor
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

