import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { urls, clicks } from '@nano-url/shared';
import { cacheGet, cacheSet, cacheKeys, CACHE_TTL } from '../lib/cache';

const redirectRoutes = new Hono();

redirectRoutes.get('/:shortCode{[a-zA-Z0-9]{7}}', async (c) => {
  const shortCode = c.req.param('shortCode');

  // 80/20 cache: check short URL cache first
  const cached = await cacheGet<typeof urls.$inferSelect>(cacheKeys.shortUrl(shortCode));
  if (cached) {
    // Cache hit — use cached URL data for redirect
    const url = cached;

    // Track click asynchronously (fire-and-forget)
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent');
    const referer = c.req.header('referer');

    db.transaction(async (tx) => {
      await tx.insert(clicks).values({
        urlId: url.id,
        ip,
        userAgent,
        referer,
      });
      await tx.update(urls).set({ clicks: sql`${urls.clicks} + 1` }).where(eq(urls.id, url.id));
    }).catch(() => {});

    return c.redirect(url.longUrl, 302);
  }

  const [url] = await db.select().from(urls).where(eq(urls.shortCode, shortCode)).limit(1);

  if (!url || !url.isActive) {
    return c.json({ success: false, error: 'URL not found' }, 404);
  }

  // Cache the URL data for future redirects
  await cacheSet(cacheKeys.shortUrl(shortCode), url, CACHE_TTL.SHORT_URL);

  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const userAgent = c.req.header('user-agent');
  const referer = c.req.header('referer');

  db.transaction(async (tx) => {
    await tx.insert(clicks).values({
      urlId: url.id,
      ip,
      userAgent,
      referer,
    });
    await tx.update(urls).set({ clicks: sql`${urls.clicks} + 1` }).where(eq(urls.id, url.id));
  }).catch(() => {});

  return c.redirect(url.longUrl, 302);
});

export { redirectRoutes };