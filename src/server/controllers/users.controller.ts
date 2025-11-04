import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database/index.js';
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from '../validation/users.validation.js';

export const createUser = async (req: Request, res: Response) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const { password, ...userData } = validation.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new db.users({ ...userData, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear usuario.' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await db.users.find({}, '-password -securityAnswer');
    res.json(users);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios.' });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const validation = updateUserStatusSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const { status, masterCode } = validation.data;

  try {
    const userToModify = await db.users.findById(req.params.id);
    if (!userToModify) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (userToModify.role === 'admin') {
      if (masterCode !== process.env.MASTER_CODE) {
        return res.status(403).json({ error: 'Código maestro incorrecto para modificar un usuario administrador.' });
      }
    }

    const updatedUser = await db.users.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password -securityAnswer');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el estado del usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del usuario.' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const validation = updateUserSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }
  const { username, nombre, apellido, cedula, direccion, razonSocial, rif, role, status, masterCode } = validation.data;
  const userId = req.params.id;

  try {
    const userToModify = await db.users.findById(userId);
    if (!userToModify) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (userToModify.role === 'admin') {
      if (masterCode !== process.env.MASTER_CODE) {
        return res.status(403).json({ error: 'Código maestro incorrecto para modificar un usuario administrador.' });
      }
    }

    const updatedUser = await db.users.findByIdAndUpdate(
      userId,
      { username, nombre, apellido, cedula, direccion, razonSocial, rif, role, status },
      { new: true }
    ).select('-password -securityAnswer');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const deletedUser = await db.users.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.status(204).send();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
};
