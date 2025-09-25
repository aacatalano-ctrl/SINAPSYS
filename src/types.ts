import mongoose, { Document } from 'mongoose';

// src/types.d.ts

export interface JobService {
  name: string;
  price: number;
}

export interface JobCategory {
  category: string;
  services: JobService[];
}

export interface User extends Document {
  _id?: string;
  username: string;
  password?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  nombre: string;
  apellido: string;
  cedula: string;
  direccion: string;
  razonSocial: string;
  rif: string;
  role: 'admin' | 'user';
  status: 'active' | 'blocked';
}

export interface Doctor extends Document {
  _id?: string;
  title: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Payment extends Document {
  _id?: string;
  amount: number;
  date: string;
  description?: string;
}

export interface Note extends Document {
  _id?: string;
  text: string;
  timestamp: string;
  author: string;
}

export interface Order extends Document {
  _id?: string;
  orderNumber?: string;
  doctorId: Doctor | mongoose.Types.ObjectId | string;
  patientName: string;
  jobType: string;
  cost: number;
  balance: number;
  paidAmount: number;
  status: 'Pendiente' | 'Procesando' | 'Completado';
  creationDate: string;
  completionDate?: string;
  priority: 'Baja' | 'Normal' | 'Alta' | 'Urgente';
  caseDescription: string;
  payments: Payment[];
  notes: Note[];
}

export interface Notification extends Document {
  _id?: string;
  orderId: mongoose.Types.ObjectId | string;
  message: string;
  createdAt: string;
  read: boolean;
}