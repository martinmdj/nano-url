import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';
const TEST_USER = {
  username: `spa_user_${Date.now()}`,
  password: 'password123',
};

test.describe('Login SPA', () => {
  test.beforeAll(async ({ request }) => {
    // Create the user via API so we can test login via UI
    await request.post(`${API}/api/auth/register`, {
      data: {
        ...TEST_USER,
        confirmPassword: TEST_USER.password,
      },
    });
  });

  test('Navigate to /login, fill form, submit, and verify redirect to /dashboard', async ({
    page,
  }) => {
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="password"]', TEST_USER.password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');

    // Verify we're on the dashboard page
    expect(page.url()).toContain('/dashboard');
  });

  test('Test register toggle', async ({ page }) => {
    await page.goto('/login');

    // Click the toggle to switch to register mode
    await page.click('text=Register');

    // Confirm confirmPassword field is visible
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();

    // Fill registration form
    const newUser = `toggle_user_${Date.now()}`;
    await page.fill('input[name="username"]', newUser);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    // Submit registration
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after registration
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});