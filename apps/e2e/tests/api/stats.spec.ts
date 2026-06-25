import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';
const TEST_USER = {
  username: `stats_user_${Date.now()}`,
  password: 'password123',
};

test.describe('Stats API', () => {
  let token: string;
  let urlId: number;
  let shortCode: string;

  test.beforeAll(async ({ request }) => {
    // Register and create a URL
    const regRes = await request.post(`${API}/api/auth/register`, {
      data: {
        ...TEST_USER,
        confirmPassword: TEST_USER.password,
      },
    });
    const regBody = await regRes.json();
    token = regBody.data.token;

    const urlRes = await request.post(`${API}/api/urls`, {
      data: { longUrl: 'https://example.com' },
      headers: { Authorization: `Bearer ${token}` },
    });
    const urlBody = await urlRes.json();
    urlId = urlBody.data.id;
    shortCode = urlBody.data.shortCode;

    // Visit the redirect to generate a click
    await request.get(`${API}/${shortCode}`, { maxRedirects: 0 });
  });

  test('GET /api/urls/:id/stats — expect stats with click data', async ({ request }) => {
    const res = await request.get(`${API}/api/stats/${urlId}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.totalClicks).toBeGreaterThanOrEqual(1);
    expect(body.data.uniqueVisitors).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(body.data.clicksByDay)).toBe(true);
    expect(body.data.referrers).toBeDefined();
    expect(body.data.browsers).toBeDefined();
  });

  test('GET /api/stats/overview — expect overview stats', async ({ request }) => {
    const res = await request.get(`${API}/api/stats/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.totalUrls).toBeGreaterThanOrEqual(1);
    expect(body.data.totalClicks).toBeGreaterThanOrEqual(0);
    expect(body.data.activeUrls).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(body.data.topUrls)).toBe(true);
  });
});