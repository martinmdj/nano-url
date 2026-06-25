import { createMiddleware } from 'hono/factory';
import { logger } from '../lib/logger';

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info({
    method,
    path,
    status,
    duration: `${duration}ms`,
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    userAgent: c.req.header('user-agent'),
  }, `${method} ${path} ${status} ${duration}ms`);
});