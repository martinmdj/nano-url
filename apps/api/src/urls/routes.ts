import { Hono } from 'hono';
import { eq, and, desc, count } from 'drizzle-orm';
import type { Variables } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { urls } from '@nano-url/shared';
import { createUrlSchema, updateUrlSchema, paginationSchema } from '@nano-url/shared';
import { cacheDel, cacheDelPattern, cacheKeys } from '../lib/cache';

function generateShortCode(length = 7): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateUniqueShortCode(db: any, maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateShortCode();
    const existing = await db.select().from(urls).where(eq(urls.shortCode, code)).limit(1);
    if (existing.length === 0) return code;
  }
  throw new Error('Failed to generate unique short code');
}

const urlsRoutes = new Hono<{ Variables: Variables }>();

urlsRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = createUrlSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { longUrl, shortCode } = parsed.data;
  const code = shortCode || await generateUniqueShortCode(db);

  const [created] = await db.insert(urls).values({
    longUrl,
    shortCode: code,
    userId,
  }).returning();

  await cacheDelPattern(`userurls:${userId}:*`);

  return c.json({ success: true, data: created }, 201);
});

urlsRoutes.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const query = c.req.query();
  const parsed = paginationSchema.safeParse(query);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const [totalResult] = await db.select({ total: count() }).from(urls).where(eq(urls.userId, userId));
  const total = totalResult.total;

  const data = await db.select()
    .from(urls)
    .where(eq(urls.userId, userId))
    .orderBy(desc(urls.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

urlsRoutes.get('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid ID' }, 400);
  }

  const [url] = await db.select()
    .from(urls)
    .where(and(eq(urls.id, id), eq(urls.userId, userId)))
    .limit(1);

  if (!url) {
    return c.json({ success: false, error: 'URL not found' }, 404);
  }

  return c.json({ success: true, data: url });
});

urlsRoutes.patch('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid ID' }, 400);
  }

  const body = await c.req.json();
  const parsed = updateUrlSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: parsed.error.errors[0].message }, 400);
  }

  const [existing] = await db.select()
    .from(urls)
    .where(and(eq(urls.id, id), eq(urls.userId, userId)))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'URL not found' }, 404);
  }

  const [updated] = await db.update(urls)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(urls.id, id), eq(urls.userId, userId)))
    .returning();

  // Invalidate cache for updated URL
  await cacheDel(cacheKeys.shortUrl(existing.shortCode));
  await cacheDel(cacheKeys.urlData(id));
  await cacheDelPattern(`userurls:${userId}:*`);

  return c.json({ success: true, data: updated });
});

urlsRoutes.delete('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid ID' }, 400);
  }

  const [existing] = await db.select()
    .from(urls)
    .where(and(eq(urls.id, id), eq(urls.userId, userId)))
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: 'URL not found' }, 404);
  }

  await db.delete(urls).where(and(eq(urls.id, id), eq(urls.userId, userId)));

  // Invalidate cache for deleted URL
  await cacheDel(cacheKeys.shortUrl(existing.shortCode));
  await cacheDel(cacheKeys.urlData(id));
  await cacheDelPattern(`userurls:${userId}:*`);
  await cacheDel(`stats:${id}`);

  return c.body(null, 204);
});

export { urlsRoutes };
