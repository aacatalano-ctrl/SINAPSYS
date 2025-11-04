import express from 'express';
console.log('Serverless function src/server/server.ts started.');
import { IncomingMessage, ServerResponse } from 'http';
import cors from 'cors';
import { connectDB, initializeDb, db } from './database/index.js';
import { purgeOldOrders } from './database/maintenance.js';
import { checkUnpaidOrders } from './database/notifications.js';
import { jobTypePrefixMap } from './database/constants.js';
import { SequenceModel } from './database/models/Sequence.model.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import doctorsRoutes from './routes/doctors.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import notesRoutes from './routes/notes.routes.js';
import receiptsRoutes from './routes/receipts.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import jobCategoriesRoutes from './routes/jobCategories.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('Incoming request URL:', req.url, 'Path:', req.path);
  next();
});

// --- REGISTER API ROUTES ---
app.use('/api', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/orders', paymentsRoutes);
app.use('/api/orders', notesRoutes);
app.use('/api/orders', receiptsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/job-categories', jobCategoriesRoutes);

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

    await SequenceModel.updateOne(
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
