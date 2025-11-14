import mongoose from 'mongoose'; // Import mongoose
import { db } from './index.js';
import { Order, Payment } from '../../types'; // Explicitly import Order and Payment

// Generic function to create a notification
async function createNotification(orderId: mongoose.Types.ObjectId | string, message: string): Promise<void> {
  try {
    const newNotification = new db.notifications({
      orderId: orderId,
      message: message,
      createdAt: new Date().toISOString(),
      read: false,
    });
    await newNotification.save();
    console.log(`Generated notification for order ${orderId}`);
  } catch (err) {
    console.error('Error creating notification:', err);
    // Decide if the error should be re-thrown
    throw err;
  }
}

async function checkUnpaidOrders(): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const query = {
    status: 'Completado',
    completionDate: { $lt: sevenDaysAgo.toISOString() },
  };

  try {
    const orders: Order[] = await db.orders.find(query);

    for (const order of orders) {
      const pendingBalance =
        order.cost - (order.payments?.reduce((sum: number, p: Payment) => sum + p.amount, 0) || 0);

      if (pendingBalance > 0) {
        // Check if a notification for this unpaid order *already exists* to avoid duplicates
        const existingNotification = await db.notifications.findOne({
          orderId: order._id, // Use _id from Mongoose
          message: { $regex: /saldo pendiente/ },
        });

        if (!existingNotification) {
          const orderNumber = order.orderNumber || 'N/A';
          const patientName = order.patientName || 'N/A';
          const message = `La orden ${orderNumber} para ${patientName} tiene un saldo pendiente de ${pendingBalance.toFixed(2)}.`;
          await createNotification(order._id, message);
        }
      }
    }
  } catch (err) {
    console.error('Error checking unpaid orders:', err);
  }
}

export { createNotification, checkUnpaidOrders };
