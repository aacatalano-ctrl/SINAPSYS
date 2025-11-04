import mongoose from 'mongoose';
import type { Payment } from '../../../types.js';

export const paymentSchema = new mongoose.Schema<Payment>({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String },
});
