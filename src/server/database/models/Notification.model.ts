import mongoose from 'mongoose';
import type { Notification } from '../../../types.js';

const notificationSchema = new mongoose.Schema<Notification>({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const NotificationModel = mongoose.model<Notification>('Notification', notificationSchema);
