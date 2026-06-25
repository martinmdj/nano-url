import { getRedis } from './redis';

export const CACHE_TTL = {
  SHORT_URL: 60 * 60,
  URL_DATA: 60 * 5,
  STATS: 60 * 2,
};

export const cacheKeys = {
  shortUrl: (code: string) => `shorturl:${code}`,
  urlData: (id: number) => `url:${id}`,
  stats: (id: number) => `stats:${id}`,
  userUrls: (userId: number, page: number) => `userurls:${userId}:${page}`,
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    const redis = getRedis();
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch {
    // silently fail
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // silently fail
  }
}