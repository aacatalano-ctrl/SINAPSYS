import { Router } from 'express';
import mongoose from 'mongoose';
import { db } from '../database/index.js';
import { createDoctorSchema, updateDoctorSchema } from '../schemas/doctor.schemas.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Protect all doctor routes
router.use(authMiddleware);

// GET /api/doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await db.doctors.find({});
    res.json(doctors);
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
});

// POST /api/doctors
router.post('/', async (req, res) => {
  const validation = createDoctorSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }

  try {
    const newDoctor = new db.doctors(validation.data);
    await newDoctor.save();
    res.status(201).json(newDoctor);
  } catch (error) {
    console.error('Error al agregar doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor al agregar el doctor.' });
  }
});

// PUT /api/doctors/:id
router.put('/:id', async (req, res) => {
  const validation = updateDoctorSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
  }

  try {
    const updatedDoctor = await db.doctors.findByIdAndUpdate(req.params.id, validation.data, {
      new: true,
    });
    if (!updatedDoctor) {
      return res.status(404).json({ error: 'Doctor no encontrado.' });
    }
    res.json(updatedDoctor);
  } catch (error) {
    console.error('Error al actualizar doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar el doctor.' });
  }
});

// DELETE /api/doctors/:id
router.delete('/:id', async (req, res) => {
  if (req.user && req.user.role === 'operador') {
    return res
      .status(403)
      .json({ error: 'Los operadores no tienen permiso para eliminar doctores.' });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const doctorId = req.params.id;

    await db.orders.deleteMany({ doctorId: doctorId }, { session });

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
});

export default router;
