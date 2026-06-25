import type { Context, Next } from 'hono';
import { verifyToken } from '../auth';
import { UnauthorizedError } from '../lib/errors';

export type Variables = {
  userId: number;
  username: string;
};

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  c.set('userId', payload.userId);
  c.set('username', payload.username);

  await next();
}