import { db } from './index';
import { Order, Notification } from '../../types';

// Generic function to create a notification
async function createNotification(orderId: string, message: string): Promise<void> {
  try {
    const newNotification = new db.notifications({
      orderId: orderId,
      message: message,
      createdAt: new Date().toISOString(),
      read: false
    });
    await newNotification.save();
    console.log(`Generated notification for order ${orderId}`);
  } catch (err) {
    console.error("Error creating notification:", err);
    // Decide if the error should be re-thrown
    throw err;
  }
}

async function checkUnpaidOrders(): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const query = {
    status: 'Completado',
    completionDate: { $lt: sevenDaysAgo.toISOString() }
  };

  try {
    const orders = await db.orders.find(query);

    for (const order of orders) {
      const pendingBalance = order.cost - (order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
      
      if (pendingBalance > 0) {
        // Check if a notification for this unpaid order *already exists* to avoid duplicates
        const existingNotification = await db.notifications.findOne({
          orderId: order._id, // Use _id from Mongoose
          message: { $regex: /saldo pendiente/ }
        });

        if (!existingNotification) {
          const message = `La orden ${order._id} para ${order.patientName} tiene un saldo pendiente de ${pendingBalance.toFixed(2)}.`;
          await createNotification(order._id, message);
        }
      }
    }
  } catch (err) {
    console.error("Error checking unpaid orders:", err);
  }
}

export {
  createNotification,
  checkUnpaidOrders,
};