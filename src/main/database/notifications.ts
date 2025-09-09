import { db } from './index';
import { Order, Notification } from '../../types';

// Generic function to create a notification
function createNotification(orderId: string, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Add random part for uniqueness
      orderId: orderId,
      message: message,
      createdAt: new Date().toISOString(),
      read: false
    };

    db.notifications.insert(newNotification, (err: Error | null) => {
      if (err) {
        console.error("Error creating notification:", err);
        reject(err);
      } else {
        console.log(`Generated notification for order ${orderId}`);
        resolve();
      }
    });
  });
}


function checkUnpaidOrders(): void {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  interface OrderQuery {
    status: string;
    completionDate: { $lt: string };
  }

  const query: OrderQuery = {
    status: 'Completado',
    completionDate: { $lt: sevenDaysAgo.toISOString() }
  };

  db.orders.find(query, (err: Error | null, orders: Order[]) => {
    if (err) {
      console.error("Error finding unpaid orders:", err);
      return;
    }

    orders.forEach(order => {
      const pendingBalance = order.cost - order.payments.reduce((sum, p) => sum + p.amount, 0);
      if (pendingBalance > 0) {
        // Check if a notification for this unpaid order *already exists* to avoid duplicates
        db.notifications.findOne({ orderId: order.id, message: { $regex: /saldo pendiente/ } }, (err: Error | null, notification: Notification | null) => {
          if (err) {
            console.error("Error finding notification:", err);
            return;
          }
          if (!notification) {
            const message = `La orden ${order.id} para ${order.patientName} tiene un saldo pendiente de ${pendingBalance.toFixed(2)}.`;
            createNotification(order.id, message).catch(console.error);
          }
        });
      }
    });
  });
}

export {
  createNotification,
  checkUnpaidOrders,
};