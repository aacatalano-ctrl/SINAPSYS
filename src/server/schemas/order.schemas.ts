import { z } from 'zod';
import mongoose from 'mongoose';

export const paymentSchema = z.object({
  amount: z.number().positive("El monto del pago debe ser un número positivo."),
  date: z.coerce.date(),
  description: z.string().optional().or(z.literal('')),
});

export const noteSchema = z.object({
  text: z.string().min(1, "El texto de la nota es requerido."),
  timestamp: z.coerce.date(),
  author: z.string().min(1, "El autor de la nota es requerido."),
});

export const updateNoteSchema = z.object({
  text: z.string().min(1, "El texto de la nota es requerido."),
});

export const createOrderSchema = z.object({
  doctorId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "El ID del doctor no es válido.",
  }),
  patientName: z.string().min(1, "El nombre del paciente es requerido."),
  jobType: z.string().min(1, "El tipo de trabajo es requerido."),
  cost: z.number().positive("El costo debe ser un número positivo."),
  status: z.string().min(1, "El estado de la orden es requerido."),
  creationDate: z.coerce.date(),
  completionDate: z.string().optional().transform((str) => (str === '' || str === undefined) ? undefined : new Date(str)),
  priority: z.string().optional().or(z.literal('')),
  caseDescription: z.string().optional().or(z.literal('')),
  payments: z.array(paymentSchema).optional(),
  notes: z.array(noteSchema).optional(),
});

export const updateOrderSchema = z.object({
  doctorId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "El ID del doctor no es válido.",
  }).optional(),
  patientName: z.string().min(1, "El nombre del paciente es requerido.").optional(),
  jobType: z.string().min(1, "El tipo de trabajo es requerido.").optional(),
  cost: z.number().positive("El costo debe ser un número positivo.").optional(),
  status: z.string().min(1, "El estado de la orden es requerido.").optional(),
  creationDate: z.coerce.date().optional(),
  completionDate: z.string().optional().transform((str) => (str === '' || str === undefined) ? undefined : new Date(str)),
  priority: z.string().optional().or(z.literal('')),
  caseDescription: z.string().optional().or(z.literal('')),
  payments: z.array(paymentSchema).optional(),
  notes: z.array(noteSchema).optional(),
});
