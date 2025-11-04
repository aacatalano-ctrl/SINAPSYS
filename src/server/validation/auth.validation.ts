import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido."),
  password: z.string().min(1, "La contraseña es requerida."),
});

export const securityQuestionSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido."),
});

export const verifyAnswerSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido."),
  answer: z.string().min(1, "La respuesta de seguridad es requerida."),
});

export const resetPasswordSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido."),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
});
