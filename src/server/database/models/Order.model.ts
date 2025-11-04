import mongoose from 'mongoose';
import type { Order } from '../../../types.js';
import { paymentSchema } from './Payment.model.js';
import { noteSchema } from './Note.model.js';

const orderSchema = new mongoose.Schema<Order>({
  orderNumber: { type: String, unique: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientName: { type: String, required: true },
  jobType: { type: String, required: true },
  cost: { type: Number, required: true },
  status: { type: String, required: true },
  creationDate: { type: Date, required: true },
  completionDate: { type: Date },
  priority: { type: String },
  caseDescription: { type: String },
  payments: [paymentSchema],
  notes: [noteSchema],
});

export const OrderModel = mongoose.model<Order>('Order', orderSchema);
