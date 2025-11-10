import { z } from 'zod';

export const createDoctorSchema = z.object({
  title: z.string().min(1, 'El título es requerido.'),
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().optional(),
  email: z.string().email('El formato del email no es válido.').optional().or(z.literal('')),
  phone: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos.'),
  address: z.string().optional().or(z.literal('')),
});

export const updateDoctorSchema = z.object({
  title: z.string().min(1, 'El título no puede estar vacío.').optional(),
  firstName: z.string().min(1, 'El nombre no puede estar vacío.').optional(),
  lastName: z.string().optional(),
  email: z.string().email('El formato del email no es válido.').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});
