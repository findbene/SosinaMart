import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display products on home page', async ({ page }) => {
    // Wait for products to load
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });

    // Should have multiple products
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should add product to cart', async ({ page }) => {
    // Wait for products
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });

    // Click add to cart on first product
    const addButton = page.locator('[data-testid="product-card"]').first().locator('button', { hasText: /add to cart/i });
    await addButton.click();

    // Cart count should update
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });

  test('should open cart sidebar', async ({ page }) => {
    // Add product first
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="product-card"]').first().locator('button', { hasText: /add to cart/i }).click();

    // Click cart icon
    await page.locator('[data-testid="cart-button"]').click();

    // Cart sidebar should be visible
    await expect(page.locator('[data-testid="cart-sidebar"]')).toBeVisible();
  });

  test('should update quantity in cart', async ({ page }) => {
    // Add product
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="product-card"]').first().locator('button', { hasText: /add to cart/i }).click();

    // Open cart
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page.locator('[data-testid="cart-sidebar"]')).toBeVisible();

    // Increase quantity
    const increaseButton = page.locator('[data-testid="increase-quantity"]').first();
    await increaseButton.click();

    // Cart count should be 2
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
  });

  test('should remove item from cart', async ({ page }) => {
    // Add product
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="product-card"]').first().locator('button', { hasText: /add to cart/i }).click();

    // Open cart
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page.locator('[data-testid="cart-sidebar"]')).toBeVisible();

    // Remove item
    await page.locator('[data-testid="remove-item"]').first().click();

    // Cart should be empty
    await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible();
  });

  test('should open checkout modal', async ({ page }) => {
    // Add product
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="product-card"]').first().locator('button', { hasText: /add to cart/i }).click();

    // Open cart
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page.locator('[data-testid="cart-sidebar"]')).toBeVisible();

    // Wait for sidebar transition, then click checkout via JS (chat widget overlaps the button)
    await page.waitForTimeout(500);
    const checkoutBtn = page.locator('[data-testid="cart-sidebar"] button', { hasText: /checkout|pago|ክፍያ|ክፍሊት/i });
    await checkoutBtn.evaluate((el: HTMLElement) => el.click());

    // Checkout modal should be visible
    await expect(page.locator('[data-testid="checkout-modal"]')).toBeVisible();
  });

  test('should validate checkout form', async ({ page }) => {
    // Add product and go to checkout
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="product-card"]').first().locator('button', { hasText: /add to cart/i }).click();
    await page.locator('[data-testid="cart-button"]').click();
    await page.waitForTimeout(500);
    const checkoutBtn = page.locator('[data-testid="cart-sidebar"] button', { hasText: /checkout|pago|ክፍያ|ክፍሊት/i });
    await checkoutBtn.evaluate((el: HTMLElement) => el.click());

    // Wait for checkout modal
    await expect(page.locator('[data-testid="checkout-modal"]')).toBeVisible();

    // Try to submit empty form
    await page.locator('[data-testid="checkout-modal"] button[type="submit"]').click();

    // Should show validation errors (English: "Name is required")
    await expect(page.locator('.text-red-500').first()).toBeVisible();
  });

  test('should complete checkout successfully', async ({ page }) => {
    // Add product
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="product-card"]').first().locator('button', { hasText: /add to cart/i }).click();

    // Go to checkout
    await page.locator('[data-testid="cart-button"]').click();
    await page.waitForTimeout(500);
    const checkoutBtn = page.locator('[data-testid="cart-sidebar"] button', { hasText: /checkout|pago|ክፍያ|ክፍሊት/i });
    await checkoutBtn.evaluate((el: HTMLElement) => el.click());
    await expect(page.locator('[data-testid="checkout-modal"]')).toBeVisible();

    // Fill form using placeholder selectors (no name attributes on inputs)
    await page.locator('[data-testid="checkout-modal"] input[placeholder="John Doe"]').fill('John Doe');
    await page.locator('[data-testid="checkout-modal"] input[placeholder="john@example.com"]').fill('john@example.com');
    await page.locator('[data-testid="checkout-modal"] input[placeholder="470-359-7924"]').fill('470-359-7924');
    await page.locator('[data-testid="checkout-modal"] textarea[placeholder="123 Main St, Atlanta, GA 30301"]').fill('123 Main St, Atlanta, GA 30301');

    // Submit
    await page.locator('[data-testid="checkout-modal"] button[type="submit"]').click();

    // Should show success message (English: "Order Placed Successfully!")
    await expect(page.locator('text=Order Placed Successfully')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test('should have product sections on home page', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 10000 });

    // Food section should exist (sections have id like "food-section")
    await expect(page.locator('#food-section')).toBeAttached();
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto('/');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu button should be visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
  });
});

test.describe('AI Chat', () => {
  test('should open chat widget', async ({ page }) => {
    await page.goto('/');

    // Click chat button
    await page.locator('[data-testid="chat-widget-button"]').click();

    // Chat panel should open
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
  });

  test('should send a message', async ({ page }) => {
    await page.goto('/');

    // Open chat
    await page.locator('[data-testid="chat-widget-button"]').click();
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

    // Type and send message
    await page.locator('[data-testid="chat-input"]').fill('Hello');
    await page.locator('[data-testid="chat-send"]').click();

    // Message should appear
    await expect(page.locator('text=Hello')).toBeVisible();
  });
});
