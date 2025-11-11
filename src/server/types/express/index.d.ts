// Este archivo le informa a TypeScript sobre nuestra modificación al objeto Request de Express.

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        username: string;
        nombre: string;
        role: 'master' | 'admin' | 'cliente' | 'operador';
      };
    }
  }
}

// Es necesario un export vacío para que TypeScript trate este archivo como un módulo.
export {};
