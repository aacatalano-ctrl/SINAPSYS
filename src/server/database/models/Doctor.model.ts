import mongoose from 'mongoose';
import type { Doctor } from '../../../types.js';

const doctorSchema = new mongoose.Schema<Doctor>({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
});

export const DoctorModel = mongoose.model<Doctor>('Doctor', doctorSchema);
