// Este archivo le informa a TypeScript sobre nuestra modificación al objeto Request de Express.

declare global {
  namespace Express {
    interface Request {
      // La propiedad user es opcional porque solo existe después del authMiddleware.
      user?: {
        userId: string;
        username: string;
        role: 'admin' | 'cliente' | 'operador';
      };
    }
  }
}

// Es necesario un export vacío para que TypeScript trate este archivo como un módulo.
export {};
