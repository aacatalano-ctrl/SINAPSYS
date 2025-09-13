import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import authMiddleware from './middleware/authMiddleware.js';
import adminAuthMiddleware from './middleware/adminAuthMiddleware.js';
import PDFDocument from 'pdfkit';
import { connectDB, initializeDb, db } from './database/index.js';
import { purgeOldOrders } from './database/maintenance.js';
import { checkUnpaidOrders } from './database/notifications.js';
import { jobTypePrefixMap } from './database/constants.js';
import type { Payment } from '../types.js';

// --- SEQUENCE COUNTER SCHEMA ---
const SequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Sequence = mongoose.model('Sequence', SequenceSchema);

const app = express();
const port = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set this environment variable.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('Incoming request URL:', req.url, 'Path:', req.path);
  next();
});

// --- API ENDPOINTS ---

// ... (user endpoints remain the same) ...

// --- DOCTORS ---
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await db.doctors.find({});
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const newDoctor = new db.doctors(req.body);
    await newDoctor.save();
    res.status(201).json(newDoctor);
  } catch (error) {
    res.status(400).json({ error: 'Error al agregar doctor' });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const updatedDoctor = await db.doctors.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDoctor) {
      return res.status(404).json({ error: 'Doctor no encontrado.' });
    }
    res.json(updatedDoctor);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar doctor.' });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
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
});

// --- ORDERS ---
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.orders.find({}).populate('doctorId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las órdenes.' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;

    const category = orderData.jobType.split(' - ')[0].trim();
    const prefix = jobTypePrefixMap[category] || 'ORD';
    const year = new Date().getFullYear().toString().slice(-2);
    const counterId = `${prefix}-${year}`;

    const counter = await Sequence.findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const sequencePadded = counter.seq.toString().padStart(4, '0');
    const newOrderNumber = `${counterId}-${sequencePadded}`;

    const newOrder = new db.orders({
      ...orderData,
      orderNumber: newOrderNumber,
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error: any) {
    if (error.code === 11000) {
      console.error("Error de clave duplicada al crear la orden:", error);
      return res.status(500).json({ error: 'Error crítico de numeración de orden. Por favor, contacte a soporte.' });
    }
    console.error("Error creating order:", error);
    res.status(400).json({ error: 'Error al crear la orden.' });
  }
});

// ... (resto de los endpoints de órdenes, etc. sin cambios)

// --- SERVER INITIALIZATION ---
const initializeCounters = async () => {
  console.log('Initializing order number counters...');
  
  const prefixes = Object.values(jobTypePrefixMap);
  const year = new Date().getFullYear().toString().slice(-2);

  for (const prefix of prefixes) {
    const counterId = `${prefix}-${year}`;
    const searchPrefix = `${counterId}-`;

    const lastOrder = await db.orders.findOne(
      { orderNumber: { $regex: new RegExp(`^${searchPrefix}`) } },
      {},
      { sort: { orderNumber: -1 } }
    );

    let maxSeq = 0;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSeqStr = lastOrder.orderNumber.split('-')[2];
      if (lastSeqStr) {
        maxSeq = parseInt(lastSeqStr, 10);
      }
    }

    await Sequence.updateOne(
      { _id: counterId },
      { $setOnInsert: { seq: maxSeq } },
      { upsert: true }
    );
    console.log(`Counter '${counterId}' initialized to sequence ${maxSeq}.`);
  }
  console.log('Counter initialization complete.');
};

const startServer = async () => {
  await connectDB();
  await initializeDb();
  await initializeCounters();

  if (!process.env.VERCEL) {
    app.listen(port, () => {
      console.log(`Servidor backend escuchando en http://localhost:${port}`);
      
      console.log('Scheduling background tasks...');
      setInterval(checkUnpaidOrders, 24 * 60 * 60 * 1000);
      setInterval(purgeOldOrders, 7 * 24 * 60 * 60 * 1000);
    });
  }
};

startServer();

export default app;
