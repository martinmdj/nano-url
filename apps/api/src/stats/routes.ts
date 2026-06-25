import { Hono } from 'hono';
import { eq, and, sql, count, desc } from 'drizzle-orm';
import type { Variables } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { urls, clicks } from '@nano-url/shared';

const statsRoutes = new Hono<{ Variables: Variables }>();

statsRoutes.get('/:id/stats', authMiddleware, async (c) => {
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

  const [totalClicksResult] = await db
    .select({ count: count() })
    .from(clicks)
    .where(eq(clicks.urlId, id));

  const [uniqueVisitorsResult] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${clicks.ip})::int` })
    .from(clicks)
    .where(eq(clicks.urlId, id));

  const clicksByDay = await db
    .select({
      date: sql<string>`DATE(${clicks.clickedAt})`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clicks)
    .where(eq(clicks.urlId, id))
    .groupBy(sql`DATE(${clicks.clickedAt})`)
    .orderBy(sql`DATE(${clicks.clickedAt})`);

  const referrersRaw = await db
    .select({
      referer: clicks.referer,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clicks)
    .where(eq(clicks.urlId, id))
    .groupBy(clicks.referer);

  const referrers: Record<string, number> = {};
  for (const row of referrersRaw) {
    let domain = row.referer || 'direct';
    if (domain !== 'direct') {
      try {
        domain = new URL(domain).hostname;
      } catch {
        domain = 'unknown';
      }
    }
    referrers[domain] = (referrers[domain] || 0) + row.count;
  }

  const browsersRaw = await db
    .select({
      userAgent: clicks.userAgent,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clicks)
    .where(eq(clicks.urlId, id))
    .groupBy(clicks.userAgent);

  const browsers: Record<string, number> = {};
  for (const row of browsersRaw) {
    const family = extractBrowserFamily(row.userAgent);
    browsers[family] = (browsers[family] || 0) + row.count;
  }

  return c.json({
    success: true,
    data: {
      totalClicks: totalClicksResult.count,
      uniqueVisitors: uniqueVisitorsResult.count,
      clicksByDay,
      referrers,
      browsers,
    },
  });
});

statsRoutes.get('/overview', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const [totalUrlsResult] = await db
    .select({ count: count() })
    .from(urls)
    .where(eq(urls.userId, userId));

  const [totalClicksResult] = await db
    .select({ count: sql<number>`COALESCE(SUM(${urls.clicks}), 0)::int` })
    .from(urls)
    .where(eq(urls.userId, userId));

  const [activeUrlsResult] = await db
    .select({ count: count() })
    .from(urls)
    .where(and(eq(urls.userId, userId), eq(urls.isActive, true)));

  const topUrls = await db
    .select({
      id: urls.id,
      shortCode: urls.shortCode,
      longUrl: urls.longUrl,
      clicks: urls.clicks,
    })
    .from(urls)
    .where(eq(urls.userId, userId))
    .orderBy(desc(urls.clicks))
    .limit(10);

  return c.json({
    success: true,
    data: {
      totalUrls: totalUrlsResult.count,
      totalClicks: totalClicksResult.count,
      activeUrls: activeUrlsResult.count,
      topUrls,
    },
  });
});

function extractBrowserFamily(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('opera')) return 'Opera';
  if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer';
  return 'Other';
}

export { statsRoutes };