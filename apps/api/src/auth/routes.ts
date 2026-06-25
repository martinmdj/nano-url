import { Hono } from 'hono';
import type { Variables } from '../middleware/auth';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '@nano-url/shared';
import { loginSchema, registerSchema } from '@nano-url/shared';
import { hashPassword, verifyPassword, generateToken } from '.';
import { authMiddleware } from '../middleware/auth';

const authRoutes = new Hono<{ Variables: Variables }>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { username, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user) {
    return c.json({ success: false, error: 'Invalid username or password' }, 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.json({ success: false, error: 'Invalid username or password' }, 401);
  }

  const token = generateToken(user.id, user.username);
  return c.json({
    success: true,
    data: {
      token,
      user: { id: user.id, username: user.username },
    },
  });
});

authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { username, password } = parsed.data;

  const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing) {
    return c.json({ success: false, error: 'Username already exists' }, 409);
  }

  const passwordHash = await hashPassword(password);
  const [inserted] = await db.insert(users).values({ username, passwordHash }).returning();

  const token = generateToken(inserted.id, inserted.username);
  return c.json({
    success: true,
    data: {
      token,
      user: { id: inserted.id, username: inserted.username },
    },
  }, 201);
});

authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  return c.json({
    success: true,
    data: { id: user.id, username: user.username },
  });
});

export { authRoutes };