import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error.stack || error.message);

  // Custom operational errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message
    });
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values((error as any).errors).map((e: any) => e.message)
    });
  }

  // Mongoose duplicate key error
  if ((error as any).code === 11000) {
    return res.status(400).json({
      message: 'Duplicate field value',
      field: Object.keys((error as any).keyPattern)[0]
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error
  return res.status(500).json({
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};