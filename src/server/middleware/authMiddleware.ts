import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user: { userId: string; username: string; role: 'master' | 'admin' | 'cliente' | 'operador' };
}

import { db } from '../database/index.js';

const lastActiveUpdate: Map<string, number> = new Map();
const DEBOUNCE_INTERVAL = 60 * 1000; // 60 seconds

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    return res.status(500).json({ message: 'Internal Server Error: JWT secret not configured.' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado: Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
      role: 'master' | 'admin' | 'cliente' | 'operador';
    };
    req.user = decoded; // Adjuntar la información del usuario a la solicitud

    // Debounced update to lastActiveAt
    const now = Date.now();
    const lastUpdate = lastActiveUpdate.get(decoded.userId) || 0;

    if (now - lastUpdate > DEBOUNCE_INTERVAL) {
      // Fire-and-forget update to lastActiveAt to avoid delaying the response
      db.users.updateOne({ _id: decoded.userId }, { $set: { lastActiveAt: new Date() } }).exec();
      lastActiveUpdate.set(decoded.userId, now); // Record the new update time
    }

    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return res.status(403).json({ message: 'No autorizado: Token inválido o expirado.' });
  }
};

export default authMiddleware;
