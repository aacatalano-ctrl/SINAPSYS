import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIoServer, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { db } from './database/index.js';
import { connectDB, initializeDb, isDatabaseConnected } from './database/index.js';
import {
  purgeOldOrders,
  initializeCounters,
  cleanupStaleSessions,
} from './database/maintenance.js';
import { checkUnpaidOrders } from './database/notifications.js';
import { jobCategories, jobTypeCosts, jobTypePrefixMap } from './database/constants.js';

// Cargar variables de entorno desde .env
dotenv.config();

const REDIS_URL = process.env.UPSTASH_REDIS_URL;

if (!REDIS_URL) {
  console.error('FATAL ERROR: UPSTASH_REDIS_URL is not defined.');
  process.exit(1);
}

const pubClient = new Redis(REDIS_URL, {
  lazyConnect: true, // Connect only when first command is issued
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000); // Exponential backoff up to 2 seconds
    return delay;
  },
});
const subClient = pubClient.duplicate();

pubClient.on('error', (err) => console.error('Redis PubClient Error:', err));
subClient.on('error', (err) => console.error('Redis SubClient Error:', err));

const app = express();
const httpServer = createServer(app);
export const io = new SocketIoServer(httpServer, {
  cors: {
    origin: '*', // En producción, deberías restringir esto a la URL de tu frontend
  },
  pingInterval: 1000,
  pingTimeout: 3000,
});

// Apply Redis adapter
io.adapter(createAdapter(pubClient, subClient));
console.log('Socket.io Redis adapter applied successfully.');

// @upstash/redis connects on demand, so explicit connect() calls are not needed.
// We can add a simple check for connection status if desired, but adapter handles it.
// For example, you might want to ping Redis to ensure it's reachable.
// pubClient.ping().then(() => console.log('Upstash Redis pubClient connected.')).catch(err => console.error('Upstash Redis pubClient connection error:', err));
// subClient.ping().then(() => console.log('Upstash Redis subClient connected.')).catch(err => console.error('Upstash Redis subClient connection error:', err));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set this environment variable.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// --- Socket.io Logic ---
io.on('connection', (socket: Socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('authenticate', async (token: string) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      if (decoded.userId) {
        const user = await db.users.findById(decoded.userId);
        if (user) {
          user.isOnline = true;
          user.socketId = socket.id;
          await user.save();
          socket.data.userId = user._id.toString(); // Guardar userId en el socket
          io.emit('user_status_change', { userId: user._id, isOnline: true });
          console.log(`User ${user.username} authenticated and set to online.`);
        }
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.disconnect();
    }
  });

  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.data.userId) {
      try {
        const user = await db.users.findById(socket.data.userId);
        if (user) {
          user.isOnline = false;
          user.socketId = undefined;
          await user.save();
          io.emit('user_status_change', { userId: user._id, isOnline: false });
          console.log(`User ${user.username} set to offline.`);
        }
      } catch (error) {
        console.error('Error during user disconnect cleanup:', error);
      }
    }
  });
});

app.use((req, res, next) => {
  console.log('Incoming request URL:', req.url, 'Path:', req.path);
  next();
});

app.get('/api/job-categories', (req, res) => {
  res.json({ jobCategories, jobTypeCosts, jobTypePrefixMap });
});

// --- API ENDPOINTS ---
import authRouter from './routes/auth.routes.js';
app.use('/api/auth', authRouter);

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

import statusRouter from './routes/status.routes.js';
app.use('/api', statusRouter);

// --- SERVER INITIALIZATION ---
let isInitialized = false;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    console.log('Using cached database connection.');
    return;
  }

  console.log('Attempting to connect to MongoDB...');
  await connectDB(); // connectDB now handles retries and sets isDatabaseConnected

  if (!isInitialized && isDatabaseConnected) {
    console.log('Initializing database and tasks...');
    await initializeDb();
    await initializeCounters();

    if (!process.env.VERCEL) {
      console.log('Scheduling background tasks for local development...');
      setInterval(checkUnpaidOrders, 24 * 60 * 60 * 1000);
      setInterval(purgeOldOrders, 7 * 24 * 60 * 60 * 1000);
      setInterval(cleanupStaleSessions, 60 * 60 * 1000); // Run every hour
    }
    isInitialized = true;
  }
}

// Export a handler function for Vercel
export default async (req: Request, res: Response) => {
  console.log('Serverless handler invoked.');
  await connectToDatabase();
  // Attach server to the handler, ensuring it's listening
  // This is a workaround for serverless environments
  if (!httpServer.listening) {
    const port = process.env.PORT || 3001;
    httpServer.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }
  return app(req, res);
};
