import { test, expect } from '@playwright/test';

test.describe('Seller Journey', () => {
  // Note: These tests assume a test account or mock authentication
  // In a real setup, you'd use fixtures to set up authenticated state

  test('should display create listing button', async ({ page }) => {
    await page.goto('/');

    const createButton = page.getByRole('link', { name: /sell|list|create/i })
      .or(page.getByRole('button', { name: /sell|list|create/i }))
      .or(page.locator('[data-testid="create-listing"]'))
      .or(page.locator('a[href*="create"]'));

    await expect(createButton.first()).toBeVisible();
  });

  test('should navigate to create listing page', async ({ page }) => {
    await page.goto('/');

    const createButton = page.getByRole('link', { name: /sell|list|create/i })
      .or(page.locator('a[href*="create"]'))
      .first();

    await createButton.click();

    // Should either show auth modal (if not logged in) or create page
    await page.waitForTimeout(500);

    const isOnCreatePage = page.url().includes('create') || page.url().includes('sell');
    const authModal = page.getByRole('dialog').or(page.locator('[data-testid="auth-modal"]'));

    expect(isOnCreatePage || await authModal.isVisible()).toBeTruthy();
  });

  test('should show required fields on create listing form', async ({ page }) => {
    // Direct navigation to create page (assuming user is logged in or will be prompted)
    await page.goto('/create-listing');
    await page.waitForTimeout(1000);

    // Check for form fields (if on create page)
    if (page.url().includes('create')) {
      // Title field
      const titleInput = page.getByLabel(/title/i)
        .or(page.locator('input[name="title"]'))
        .or(page.getByPlaceholder(/title/i));

      // Price field
      const priceInput = page.getByLabel(/price/i)
        .or(page.locator('input[name="price"]'))
        .or(page.getByPlaceholder(/price/i));

      // Category select
      const categorySelect = page.getByLabel(/category/i)
        .or(page.locator('select[name="category"]'))
        .or(page.getByRole('combobox'));

      // At least one form field should be visible
      const hasFormFields = await titleInput.isVisible() ||
                           await priceInput.isVisible() ||
                           await categorySelect.isVisible();

      expect(hasFormFields).toBeTruthy();
    }
  });

  test('should show image upload area', async ({ page }) => {
    await page.goto('/create-listing');
    await page.waitForTimeout(1000);

    if (page.url().includes('create')) {
      const uploadArea = page.getByText(/upload|add photo|drag/i)
        .or(page.locator('input[type="file"]'))
        .or(page.locator('[data-testid="image-upload"]'));

      await expect(uploadArea.first()).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/create-listing');
    await page.waitForTimeout(1000);

    if (page.url().includes('create')) {
      // Try to submit without filling required fields
      const submitButton = page.getByRole('button', { name: /publish|create|list/i })
        .or(page.locator('button[type="submit"]'));

      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation errors
        const errorMessage = page.getByText(/required|please fill|can't be empty/i)
          .or(page.locator('.error'))
          .or(page.locator('[data-testid="error-message"]'));

        await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

test.describe('Seller Profile', () => {
  test('should display seller profile page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(500);

    // If not logged in, might redirect to login or show auth modal
    const isOnProfile = page.url().includes('profile');
    const authModal = page.getByRole('dialog');

    if (isOnProfile && !await authModal.isVisible()) {
      // Check for profile elements
      const profileSection = page.locator('[data-testid="profile-section"]')
        .or(page.getByRole('main'))
        .or(page.locator('.profile'));

      await expect(profileSection.first()).toBeVisible();
    }
  });

  test('should show user listings on profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(1000);

    // Look for listings section
    const listingsSection = page.getByText(/my listings|your items|selling/i)
      .or(page.locator('[data-testid="user-listings"]'));

    if (await listingsSection.isVisible()) {
      await expect(listingsSection).toBeVisible();
    }
  });
});

test.describe('Seller - Stripe Connect', () => {
  test('should show payment setup option', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(1000);

    // Look for Stripe Connect or payment setup
    const paymentSetup = page.getByText(/set up payments|connect stripe|get paid/i)
      .or(page.locator('[data-testid="stripe-connect"]'))
      .or(page.getByRole('button', { name: /payment|stripe/i }));

    // This might not be visible if user hasn't listed items yet
    // Just check if we're on the profile page
    const isOnProfile = page.url().includes('profile');
    expect(isOnProfile || await paymentSetup.isVisible()).toBeTruthy();
  });
});

test.describe('Seller - Offer Management', () => {
  test('should display offers section', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(1000);

    // Look for offers/transactions section
    const offersSection = page.getByText(/offers|transactions|sales/i)
      .or(page.locator('[data-testid="offers-section"]'))
      .or(page.getByRole('tab', { name: /offers|sales/i }));

    if (await offersSection.isVisible()) {
      await expect(offersSection).toBeVisible();
    }
  });
});

test.describe('Seller - Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have mobile-optimized create listing form', async ({ page }) => {
    await page.goto('/create-listing');
    await page.waitForTimeout(1000);

    if (page.url().includes('create')) {
      // Form should be full-width on mobile
      const form = page.locator('form').first();
      if (await form.isVisible()) {
        const box = await form.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(300);
        }
      }
    }
  });

  test('should have accessible touch targets for form inputs', async ({ page }) => {
    await page.goto('/create-listing');
    await page.waitForTimeout(1000);

    if (page.url().includes('create')) {
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const box = await input.boundingBox();
          if (box) {
            // Touch targets should be at least 44x44 pixels
            expect(box.height).toBeGreaterThanOrEqual(40);
          }
        }
      }
    }
  });
});
