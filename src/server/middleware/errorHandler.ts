import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

// Custom error class for operational errors
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err: Error, req: Request, res: Response, // eslint-disable-next-line @typescript-eslint/no-unused-vars
_next: NextFunction) => {
  const error = { ...err };
  error.message = err.message;

  // Log the error
  logger.error(error.message, {
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    // user: req.user ? req.user.userId : 'guest', // Uncomment if req.user is available
    timestamp: new Date().toISOString(),
  });

  // Operational, trusted error: send message to client
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or other unknown error: don't leak error details
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

export default errorHandler;
