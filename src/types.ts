import mongoose from 'mongoose';

// src/types.d.ts

export interface JobService {
  name: string;
  price: number;
}

export interface JobCategory {
  category: string;
  services: JobService[];
}

export interface User {
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

export interface Doctor {
  _id?: string;
  title: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Payment {
  _id?: string;
  amount: number;
  date: string;
  description?: string;
}

export interface Note {
  _id?: string;
  text: string;
  timestamp: string;
  author: string;
}

export interface Order {
  _id?: string;
  orderNumber?: string;
  doctorId: mongoose.Types.ObjectId | string;
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

export interface Notification {
  _id?: string;
  orderId: string;
  message: string;
  createdAt: string;
  read: boolean;
}