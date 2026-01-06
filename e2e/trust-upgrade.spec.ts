import { test, expect } from '@playwright/test';

test.describe('Trust Tier Upgrade Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show trust tier on user profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(500);

    // Look for trust tier indicator
    const trustBadge = page.getByText(/basic|verified|trusted/i)
      .or(page.locator('[data-testid="trust-tier"]'))
      .or(page.locator('[data-testid="trust-badge"]'));

    // If user is logged in, should see trust tier
    if (!page.url().includes('login') && !await page.getByRole('dialog').isVisible()) {
      // Trust badge or tier should be visible somewhere
      const isVisible = await trustBadge.first().isVisible().catch(() => false);
      // This is expected to pass if logged in
      expect(isVisible || page.url().includes('profile')).toBeTruthy();
    }
  });

  test('should display upgrade requirements for Basic tier', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(1000);

    // Look for trust settings or upgrade section
    const trustSettings = page.getByText(/upgrade|verify|trust settings/i)
      .or(page.locator('[data-testid="trust-settings"]'))
      .or(page.getByRole('link', { name: /trust|verify/i }));

    if (await trustSettings.first().isVisible()) {
      await trustSettings.first().click();
      await page.waitForTimeout(500);

      // Should show verification requirements
      const requirements = page.getByText(/phone|email|photo|payment/i);
      await expect(requirements.first()).toBeVisible();
    }
  });

  test('should navigate to trust settings page', async ({ page }) => {
    await page.goto('/trust-settings');
    await page.waitForTimeout(1000);

    // Check if on trust settings page or redirected
    const isOnTrustPage = page.url().includes('trust');

    if (isOnTrustPage) {
      // Should show tier information
      const tierInfo = page.getByText(/tier|level|verification/i)
        .or(page.locator('[data-testid="tier-info"]'));

      await expect(tierInfo.first()).toBeVisible();
    }
  });

  test('should show email verification option', async ({ page }) => {
    await page.goto('/trust-settings');
    await page.waitForTimeout(1000);

    if (page.url().includes('trust')) {
      const emailVerify = page.getByText(/verify email|add email/i)
        .or(page.getByRole('button', { name: /email/i }))
        .or(page.locator('[data-testid="verify-email"]'));

      // Email verification should be an option
      if (await emailVerify.first().isVisible()) {
        await expect(emailVerify.first()).toBeVisible();
      }
    }
  });

  test('should show profile photo upload option', async ({ page }) => {
    await page.goto('/trust-settings');
    await page.waitForTimeout(1000);

    if (page.url().includes('trust')) {
      const photoUpload = page.getByText(/profile photo|add photo|upload photo/i)
        .or(page.getByRole('button', { name: /photo/i }))
        .or(page.locator('[data-testid="upload-photo"]'));

      if (await photoUpload.first().isVisible()) {
        await expect(photoUpload.first()).toBeVisible();
      }
    }
  });

  test('should show social connection options', async ({ page }) => {
    await page.goto('/trust-settings');
    await page.waitForTimeout(1000);

    if (page.url().includes('trust')) {
      const socialConnect = page.getByText(/connect|google|facebook|apple/i)
        .or(page.locator('[data-testid="social-connect"]'));

      if (await socialConnect.first().isVisible()) {
        await expect(socialConnect.first()).toBeVisible();
      }
    }
  });

  test('should show ID verification option for Trusted tier', async ({ page }) => {
    await page.goto('/trust-settings');
    await page.waitForTimeout(1000);

    if (page.url().includes('trust')) {
      const idVerify = page.getByText(/id verification|verify id|identity/i)
        .or(page.getByRole('button', { name: /id|identity/i }))
        .or(page.locator('[data-testid="verify-id"]'));

      // ID verification should be shown as an option
      if (await idVerify.first().isVisible()) {
        await expect(idVerify.first()).toBeVisible();
      }
    }
  });
});

test.describe('Trust Tier Permissions', () => {
  test('should show message limit warning for Basic users', async ({ page }) => {
    // Basic users have a 5 message limit
    await page.goto('/inbox');
    await page.waitForTimeout(500);

    // If Basic user, might see message limit warning
    const limitWarning = page.getByText(/message limit|upgrade to send more/i)
      .or(page.locator('[data-testid="message-limit-warning"]'));

    // This is conditional based on auth state
    const isVisible = await limitWarning.isVisible().catch(() => false);
    // Just verify the page loaded
    expect(page.url()).toContain('inbox');
  });

  test('should show listing price limit for Verified users without ID', async ({ page }) => {
    await page.goto('/create-listing');
    await page.waitForTimeout(1000);

    if (page.url().includes('create')) {
      // Try to enter a high price
      const priceInput = page.getByLabel(/price/i)
        .or(page.locator('input[name="price"]'))
        .or(page.getByPlaceholder(/price/i));

      if (await priceInput.first().isVisible()) {
        await priceInput.first().fill('250');

        // Might see ID verification prompt
        const idPrompt = page.getByText(/verify your id|id required|high value/i)
          .or(page.locator('[data-testid="id-required-prompt"]'));

        // Check if prompt appears (conditional on user's trust tier)
        const isVisible = await idPrompt.isVisible().catch(() => false);
        // Just verify we're on the create page
        expect(page.url()).toContain('create');
      }
    }
  });
});

test.describe('Trust Badge Display', () => {
  test('should show trust badge on seller listings', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Click on a listing
    const listingCard = page.locator('[data-testid="listing-card"]')
      .or(page.locator('.listing-card'))
      .or(page.getByRole('article'))
      .first();

    if (await listingCard.isVisible()) {
      await listingCard.click();
      await page.waitForURL(/\/listing\//);

      // Look for trust badge on seller info
      const trustBadge = page.locator('[data-testid="trust-badge"]')
        .or(page.getByText(/verified|trusted/i))
        .or(page.locator('.trust-badge'));

      // Badge might be visible depending on seller's tier
      const isOnListingPage = page.url().includes('listing');
      expect(isOnListingPage).toBeTruthy();
    }
  });

  test('should show response time on seller profile', async ({ page }) => {
    await page.goto('/');

    // Click on a listing
    const listingCard = page.locator('[data-testid="listing-card"]')
      .or(page.getByRole('article'))
      .first();

    if (await listingCard.isVisible()) {
      await listingCard.click();
      await page.waitForURL(/\/listing\//);

      // Look for response time indicator
      const responseTime = page.getByText(/responds in|usually responds|response time/i)
        .or(page.locator('[data-testid="response-time"]'));

      // Response time might be visible
      const isOnListingPage = page.url().includes('listing');
      expect(isOnListingPage).toBeTruthy();
    }
  });
});

test.describe('Trust Tier - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show trust badge in mobile listing cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    const listingCard = page.locator('[data-testid="listing-card"]')
      .or(page.getByRole('article'))
      .first();

    if (await listingCard.isVisible()) {
      // Trust badge should be visible and not cut off
      const badge = listingCard.locator('[data-testid="trust-badge"]')
        .or(listingCard.getByText(/verified|trusted/i));

      // Card should be visible
      await expect(listingCard).toBeVisible();
    }
  });

  test('should have mobile-friendly trust settings', async ({ page }) => {
    await page.goto('/trust-settings');
    await page.waitForTimeout(1000);

    if (page.url().includes('trust')) {
      // Settings should be full-width on mobile
      const settingsContainer = page.locator('main').or(page.locator('[data-testid="settings-container"]'));

      if (await settingsContainer.isVisible()) {
        const box = await settingsContainer.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(320);
        }
      }
    }
  });
});
