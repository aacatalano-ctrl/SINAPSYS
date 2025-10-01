import express from 'express';
console.log('Serverless function src/server/server.ts started.');
import { IncomingMessage, ServerResponse } from 'http';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import adminAuthMiddleware from './middleware/adminAuthMiddleware.js';
import authMiddleware from './middleware/authMiddleware.js';
import PDFDocument from 'pdfkit';
import { connectDB, initializeDb, db } from './database/index.js';
import { purgeOldOrders } from './database/maintenance.js';
import { checkUnpaidOrders, createNotification } from './database/notifications.js';
import { jobCategories, jobTypeCosts, jobTypePrefixMap } from './database/constants.js';
import type { Payment, Note } from '../types.js';
import { z } from 'zod';

// --- SEQUENCE COUNTER SCHEMA ---
const SequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Sequence = mongoose.model('Sequence', SequenceSchema);

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set this environment variable.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('Incoming request URL:', req.url, 'Path:', req.path);
  next();
});

app.get('/api/job-categories', (req, res) => {
  res.json({ jobCategories, jobTypeCosts, jobTypePrefixMap });
});

// --- API ENDPOINTS ---

import { createUserSchema, updateUserSchema, updateUserStatusSchema } from './schemas/user.schemas.js';

import { createDoctorSchema, updateDoctorSchema } from './schemas/doctor.schemas.js';

import { paymentSchema, noteSchema, updateOrderSchema, updateNoteSchema, createOrderSchema } from './schemas/order.schemas.js';

import { loginSchema, securityQuestionSchema, verifyAnswerSchema, resetPasswordSchema } from './schemas/auth.schemas.js';

import authRouter from './routes/auth.routes.js';

app.use('/api', authRouter);


import userRouter from './routes/user.routes.js';

app.use('/api/users', userRouter);







import doctorRouter from './routes/doctor.routes.js';

app.use('/api/doctors', doctorRouter);

import orderRouter from './routes/order.routes.js';

app.use('/api/orders', orderRouter);

import reportRouter from './routes/report.routes.js';

app.use('/api/reports', reportRouter);

import notificationRouter from './routes/notification.routes.js';

app.use('/api/notifications', notificationRouter);

// --- SERVER INITIALIZATION ---
// --- SERVERLESS INITIALIZATION ---
let cachedDb: unknown = null;
let isInitialized = false;

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

async function connectToDatabase() {
  if (cachedDb) {
    console.log('Using cached database connection.');
    return cachedDb;
  }

  console.log('Attempting to connect to MongoDB...');
  try {
    await connectDB();
    console.log('MongoDB connected successfully.');
    cachedDb = db; // Cache the connected database instance
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error; // Re-throw to indicate failure
  }

  console.log('Attempting to initialize database...');
  try {
    await initializeDb();
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error; // Re-throw to indicate failure
  }

  console.log('Attempting to initialize counters...');
  try {
    await initializeCounters();
    console.log('Counters initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize counters:', error);
    throw error; // Re-throw to indicate failure
  }

  // Schedule background tasks only once if not on Vercel (for local development)
  if (!process.env.VERCEL && !isInitialized) {
    console.log('Scheduling background tasks for local development...');
    setInterval(checkUnpaidOrders, 24 * 60 * 60 * 1000);
    setInterval(purgeOldOrders, 7 * 24 * 60 * 60 * 1000);
    isInitialized = true;
  }

  return cachedDb;
}

// Export a handler function for Vercel
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  console.log('Serverless handler invoked.');
  try {
    await connectToDatabase();
    // Now that the database is connected, let the express app handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless handler initialization failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error during initialization.' }));
  }
}
