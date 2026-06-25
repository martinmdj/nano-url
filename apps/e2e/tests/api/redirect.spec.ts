import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';
const TEST_USER = {
  username: `redirect_user_${Date.now()}`,
  password: 'password123',
};

test.describe('Redirect API', () => {
  let shortCode: string;

  test.beforeAll(async ({ request }) => {
    // Register and create a URL to redirect to
    const regRes = await request.post(`${API}/api/auth/register`, {
      data: {
        ...TEST_USER,
        confirmPassword: TEST_USER.password,
      },
    });
    const regBody = await regRes.json();
    const token = regBody.data.token;

    const urlRes = await request.post(`${API}/api/urls`, {
      data: { longUrl: 'https://example.com' },
      headers: { Authorization: `Bearer ${token}` },
    });
    const urlBody = await urlRes.json();
    shortCode = urlBody.data.shortCode;
  });

  test('GET /:shortCode — redirect to long URL, expect 302', async ({ request }) => {
    const res = await request.get(`${API}/${shortCode}`, { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    expect(res.headers()['location']).toBe('https://example.com');
  });

  test('Follow redirect and confirm destination', async ({ request }) => {
    const res = await request.get(`${API}/${shortCode}`);
    // Playwright's request context follows redirects by default
    // The final response should be from example.com
    expect(res.url()).toContain('example.com');
    expect(res.status()).toBe(200);
  });
});