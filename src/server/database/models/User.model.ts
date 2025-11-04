import mongoose from 'mongoose';
import type { User } from '../../../types.js';

const userSchema = new mongoose.Schema<User>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  cedula: { type: String, required: true },
  direccion: { type: String, required: true },
  razonSocial: { type: String, required: true },
  rif: { type: String, required: true },
  role: { type: String, enum: ['admin', 'cliente', 'operador'], default: 'cliente' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
});

export const UserModel = mongoose.model<User>('User', userSchema);
