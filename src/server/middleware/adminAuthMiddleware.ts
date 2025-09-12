import { Request, Response, NextFunction } from 'express';
import authMiddleware from './authMiddleware';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; username: string; role: 'admin' | 'user' };
}

const adminAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Primero, asegurar que el usuario esté autenticado
  authMiddleware(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado: Usuario no autenticado.' });
    }

    // Luego, verificar si el usuario tiene el rol de administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador.' });
    }

    next();
  });
};

export default adminAuthMiddleware;
