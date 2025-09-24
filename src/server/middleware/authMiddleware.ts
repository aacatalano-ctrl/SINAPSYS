import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; username: string; role: 'admin' | 'user' };
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado: Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
      role: 'admin' | 'user';
    };
    req.user = decoded; // Adjuntar la información del usuario a la solicitud
    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return res.status(403).json({ message: 'No autorizado: Token inválido o expirado.' });
  }
};

export default authMiddleware;
