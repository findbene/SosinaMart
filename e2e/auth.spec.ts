import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /welcome back|sign in/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /create|sign up|register/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login');

    await page.locator('a', { hasText: /create|register|sign up/i }).click();

    await expect(page).toHaveURL(/\/register/);
  });

  test('should navigate from register to login', async ({ page }) => {
    await page.goto('/register');

    await page.locator('a', { hasText: /sign in|login|already have/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');

    // Click submit without filling form
    await page.locator('button[type="submit"]').click();

    // Should show validation message (HTML5 or custom)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('nonexistent@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Should show error message
    await expect(page.locator('text=invalid|error|incorrect', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/login');

    await page.locator('a', { hasText: /forgot/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('should display forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /reset|forgot|password/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login for /account when not authenticated', async ({ page }) => {
    await page.goto('/account');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login for /admin when not authenticated', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
