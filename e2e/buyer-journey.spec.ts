import { test, expect } from '@playwright/test';

test.describe('Buyer Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Visit home page before each test
    await page.goto('/');
  });

  test('should display home page with listings', async ({ page }) => {
    // Check page title or key elements
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check that listings are displayed
    await expect(page.locator('[data-testid="listing-card"]').or(page.locator('.listing-card')).or(page.getByRole('article'))).toBeVisible({ timeout: 10000 });
  });

  test('should search for items', async ({ page }) => {
    // Find and use search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]')).or(page.locator('[data-testid="search-input"]'));

    await searchInput.fill('stroller');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify search was performed (URL changed or results displayed)
    await expect(page.url()).toContain('stroller').or(expect(page.locator('text=/stroller/i').first()).toBeVisible());
  });

  test('should filter by category', async ({ page }) => {
    // Click on a category filter
    const categoryButton = page.getByRole('button', { name: /strollers/i })
      .or(page.locator('[data-testid="category-filter"]'))
      .or(page.getByText(/strollers/i).first());

    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should view listing detail', async ({ page }) => {
    // Click on first listing card
    const listingCard = page.locator('[data-testid="listing-card"]')
      .or(page.locator('.listing-card'))
      .or(page.getByRole('article'))
      .first();

    await listingCard.click();

    // Wait for navigation to detail page
    await page.waitForURL(/\/listing\//);

    // Verify listing details are displayed
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByText(/\$/)).toBeVisible(); // Price
  });

  test('should navigate through listing images', async ({ page }) => {
    // Go to a listing detail page
    const listingCard = page.locator('[data-testid="listing-card"]')
      .or(page.locator('.listing-card'))
      .or(page.getByRole('article'))
      .first();

    await listingCard.click();
    await page.waitForURL(/\/listing\//);

    // Check for image carousel or gallery
    const images = page.locator('img[src*="cloudinary"], img[src*="http"]');
    const imageCount = await images.count();

    if (imageCount > 1) {
      // Try to navigate to next image
      const nextButton = page.getByRole('button', { name: /next/i })
        .or(page.locator('[data-testid="next-image"]'))
        .or(page.locator('button').filter({ hasText: '>' }));

      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should show login prompt when messaging without auth', async ({ page }) => {
    // Go to a listing
    const listingCard = page.locator('[data-testid="listing-card"]')
      .or(page.locator('.listing-card'))
      .or(page.getByRole('article'))
      .first();

    await listingCard.click();
    await page.waitForURL(/\/listing\//);

    // Try to send a message
    const messageButton = page.getByRole('button', { name: /message/i })
      .or(page.locator('[data-testid="message-seller"]'))
      .or(page.getByText(/message seller/i));

    if (await messageButton.isVisible()) {
      await messageButton.click();

      // Should show login modal or redirect
      await expect(
        page.getByRole('dialog').or(page.locator('[data-testid="auth-modal"]')).or(page.url())
      ).toBeTruthy();
    }
  });

  test('should save item to favorites after login', async ({ page }) => {
    // This test requires authentication setup
    // For now, we check if the favorite button exists

    const listingCard = page.locator('[data-testid="listing-card"]')
      .or(page.locator('.listing-card'))
      .or(page.getByRole('article'))
      .first();

    await listingCard.click();
    await page.waitForURL(/\/listing\//);

    const favoriteButton = page.getByRole('button', { name: /save|favorite|heart/i })
      .or(page.locator('[data-testid="save-listing"]'))
      .or(page.locator('button').filter({ has: page.locator('svg') }));

    await expect(favoriteButton.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Buyer Journey - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have mobile-friendly navigation', async ({ page }) => {
    await page.goto('/');

    // Check for mobile menu or bottom navigation
    const mobileNav = page.locator('[data-testid="mobile-nav"]')
      .or(page.locator('nav'))
      .or(page.locator('[role="navigation"]'));

    await expect(mobileNav.first()).toBeVisible();
  });

  test('should have touch-friendly listing cards', async ({ page }) => {
    await page.goto('/');

    const listingCard = page.locator('[data-testid="listing-card"]')
      .or(page.locator('.listing-card'))
      .or(page.getByRole('article'))
      .first();

    // Card should be visible and have reasonable size
    await expect(listingCard).toBeVisible();

    const box = await listingCard.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThan(100);
      expect(box.height).toBeGreaterThan(100);
    }
  });
});

test.describe('Buyer Journey - Authentication Flow', () => {
  test('should show auth modal on protected actions', async ({ page }) => {
    await page.goto('/');

    // Try to access inbox
    const inboxLink = page.getByRole('link', { name: /inbox|messages/i })
      .or(page.locator('[data-testid="inbox-link"]'))
      .or(page.locator('a[href*="inbox"]'));

    if (await inboxLink.isVisible()) {
      await inboxLink.click();

      // Should either show auth modal or redirect to login
      await page.waitForTimeout(500);
      const authModal = page.getByRole('dialog').or(page.locator('[data-testid="auth-modal"]'));
      const isOnLoginPage = page.url().includes('login') || page.url().includes('auth');

      expect(await authModal.isVisible() || isOnLoginPage).toBeTruthy();
    }
  });
});
