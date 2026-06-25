import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';
const TEST_USER = {
  username: `urls_user_${Date.now()}`,
  password: 'password123',
};

test.describe('URLs CRUD API', () => {
  let token: string;
  let urlId: number;

  test.beforeAll(async ({ request }) => {
    // Register a user for URL tests
    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        ...TEST_USER,
        confirmPassword: TEST_USER.password,
      },
    });
    const body = await res.json();
    token = body.data.token;
  });

  test('POST /api/urls — create a URL, expect 201 with shortCode', async ({ request }) => {
    const res = await request.post(`${API}/api/urls`, {
      data: { longUrl: 'https://example.com' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.shortCode).toBeDefined();
    expect(body.data.shortCode).toHaveLength(7);
    expect(body.data.longUrl).toBe('https://example.com');
    urlId = body.data.id;
  });

  test('GET /api/urls — list URLs, expect 200 with paginated results', async ({ request }) => {
    const res = await request.get(`${API}/api/urls`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
  });

  test('GET /api/urls/:id — get specific URL, expect 200', async ({ request }) => {
    const res = await request.get(`${API}/api/urls/${urlId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(urlId);
  });

  test('PATCH /api/urls/:id — update URL, expect 200', async ({ request }) => {
    const res = await request.patch(`${API}/api/urls/${urlId}`, {
      data: { longUrl: 'https://updated-example.com' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.longUrl).toBe('https://updated-example.com');
  });

  test('DELETE /api/urls/:id — delete URL, expect 204', async ({ request }) => {
    const res = await request.delete(`${API}/api/urls/${urlId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(204);
  });

  test('GET /api/urls/:id — after delete, expect 404', async ({ request }) => {
    const res = await request.get(`${API}/api/urls/${urlId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(404);
  });

  test('POST /api/urls — without auth token, expect 401', async ({ request }) => {
    const res = await request.post(`${API}/api/urls`, {
      data: { longUrl: 'https://example.com' },
    });
    expect(res.status()).toBe(401);
  });
});