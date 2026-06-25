import type { ErrorHandler } from 'hono';
import { AppError } from '../lib/errors';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json({
      success: false,
      error: err.message,
    }, err.statusCode as any);
  }

  console.error(`[ERROR] ${err.message}`, err.stack);

  return c.json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  }, 500);
};