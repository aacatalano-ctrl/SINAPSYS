import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/index.js';
import { loginSchema, securityQuestionSchema, verifyAnswerSchema, resetPasswordSchema } from '../validation/auth.validation.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set this environment variable.');
  process.exit(1);
}

export const login = async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.error.flatten().fieldErrors });
  }
  const { username, password } = validation.data;

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Este usuario ha sido bloqueado.' });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ success: true, user: { username: user.username, role: user.role }, token });
  } catch (error) {
    console.error(`Error during login for user ${username}:`, error);
    res.status(500).json({ success: false, message: 'Error del servidor durante el inicio de sesión.' });
  }
};

export const getSecurityQuestion = async (req: Request, res: Response) => {
  const validation = securityQuestionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.error.flatten().fieldErrors });
  }
  const { username } = validation.data;

  try {
    const user = await db.users.findOne({ username });
    if (user) {
      res.json({ success: true, securityQuestion: user.securityQuestion });
    } else {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al buscar la pregunta de seguridad:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al buscar la pregunta de seguridad.' });
  }
};

export const verifySecurityAnswer = async (req: Request, res: Response) => {
  const validation = verifyAnswerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.error.flatten().fieldErrors });
  }
  const { username, answer } = validation.data;

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    const isMatch = await bcrypt.compare(answer, user.securityAnswer!);
    if (isMatch) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Respuesta de seguridad incorrecta.' });
    }
  } catch (error) {
    console.error('Error al verificar la respuesta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al verificar la respuesta.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const validation = resetPasswordSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, errors: validation.error.flatten().fieldErrors });
  }
  const { username, newPassword } = validation.data;

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.users.updateOne({ username }, { $set: { password: hashedPassword } });

    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
