import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { db } from '../database/index.js';
import { createDoctorSchema, updateDoctorSchema } from '../validation/doctors.validation.js';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; username: string; role: 'admin' | 'cliente' | 'operador' };
}

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await db.doctors.find({});
    res.json(doctors);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  const validation = createDoctorSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }

  try {
    const newDoctor = new db.doctors(validation.data);
    await newDoctor.save();
    res.status(201).json(newDoctor);
  } catch (error) {
    // Handle potential database errors, e.g., unique constraint violation
    console.error("Error al agregar doctor:", error);
    res.status(500).json({ error: 'Error interno del servidor al agregar el doctor.' });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  const validation = updateDoctorSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }

  try {
    const updatedDoctor = await db.doctors.findByIdAndUpdate(req.params.id, validation.data, { new: true });
    if (!updatedDoctor) {
      return res.status(404).json({ error: 'Doctor no encontrado.' });
    }
    res.json(updatedDoctor);
  } catch (error) {
    console.error('Error al actualizar doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar el doctor.' });
  }
};

export const deleteDoctor = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user && req.user.role === 'operador') {
    return res.status(403).json({ error: 'Los operadores no tienen permiso para eliminar doctores.' });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const doctorId = req.params.id;

    // Primero, eliminar todas las órdenes asociadas a este doctor
    await db.orders.deleteMany({ doctorId: doctorId }, { session });

    // Luego, eliminar al doctor
    const deletedDoctor = await db.doctors.findByIdAndDelete(doctorId, { session });

    if (!deletedDoctor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Doctor no encontrado.' });
    }
    
    await session.commitTransaction();
    session.endSession();

    console.log(`Doctor with ID ${doctorId} and all their associated orders have been deleted.`);
    res.status(204).send();

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`Error deleting doctor and their orders for ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al eliminar el doctor y sus órdenes asociadas.' });
  }
};
