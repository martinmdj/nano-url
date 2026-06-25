import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';
const TEST_USER: { username: string; password: string; token?: string } = {
  username: `testuser_${Date.now()}`,
  password: 'password123',
};

test.describe('Auth API', () => {
  let api: any;

  test.beforeAll(async ({ request }) => {
    api = request;
  });

  test('POST /api/auth/register — register a new user, expect 201 with token', async () => {
    const res = await api.post(`${API}/api/auth/register`, {
      data: {
        ...TEST_USER,
        confirmPassword: TEST_USER.password,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.username).toBe(TEST_USER.username);
    // Store token for subsequent tests
    TEST_USER['token'] = body.data.token;
  });

  test('POST /api/auth/login — login with created user, expect 200 with token', async () => {
    const res = await api.post(`${API}/api/auth/login`, {
      data: {
        username: TEST_USER.username,
        password: TEST_USER.password,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
  });

  test('POST /api/auth/login — wrong password, expect 401', async () => {
    const res = await api.post(`${API}/api/auth/login`, {
      data: {
        username: TEST_USER.username,
        password: 'wrongpassword',
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('POST /api/auth/register — duplicate username, expect 409', async () => {
    const res = await api.post(`${API}/api/auth/register`, {
      data: {
        ...TEST_USER,
        confirmPassword: TEST_USER.password,
      },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('GET /api/auth/me — with valid token, expect 200 with user info', async () => {
    const res = await api.get(`${API}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${TEST_USER['token']}`,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe(TEST_USER.username);
  });

  test('GET /api/auth/me — without token, expect 401', async () => {
    const res = await api.get(`${API}/api/auth/me`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});