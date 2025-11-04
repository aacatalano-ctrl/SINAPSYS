import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  securityQuestion: z.string().min(1, "La pregunta de seguridad es requerida."),
  securityAnswer: z.string().min(1, "La respuesta de seguridad es requerida."),
  nombre: z.string().min(1, "El nombre es requerido."),
  apellido: z.string().min(1, "El apellido es requerido."),
  cedula: z.string().min(1, "La cédula es requerida."),
  direccion: z.string().min(1, "La dirección es requerida."),
  razonSocial: z.string().min(1, "La razón social es requerida."),
  rif: z.string().min(1, "El RIF es requerido."),
  role: z.enum(['admin', 'cliente', 'operador'], { message: "El rol debe ser 'admin', 'cliente' o 'operador'." }).default('cliente').optional(),
  status: z.enum(['active', 'blocked'], { message: "El estado debe ser 'active' o 'blocked'." }).default('active').optional(),
});

export const updateUserSchema = z.object({
  username: z.string().min(1, "El nombre de usuario no puede estar vacío.").optional(),
  securityQuestion: z.string().min(1, "La pregunta de seguridad no puede estar vacía.").optional(),
  securityAnswer: z.string().min(1, "La respuesta de seguridad no puede estar vacía.").optional(),
  nombre: z.string().min(1, "El nombre no puede estar vacío.").optional(),
  apellido: z.string().min(1, "El apellido no puede estar vacío.").optional(),
  cedula: z.string().min(1, "La cédula no puede estar vacía.").optional(),
  direccion: z.string().min(1, "La dirección no puede estar vacía.").optional(),
  razonSocial: z.string().min(1, "La razón social no puede estar vacía.").optional(),
  rif: z.string().min(1, "El RIF no puede estar vacío.").optional(),
  role: z.enum(['admin', 'cliente', 'operador'], { message: "El rol debe ser 'admin', 'cliente' o 'operador'." }).optional(),
  status: z.enum(['active', 'blocked'], { message: "El estado debe ser 'active' o 'blocked'." }).optional(),
  masterCode: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'blocked'], { message: "El estado debe ser 'active' o 'blocked'." }),
  masterCode: z.string().optional(),
});
