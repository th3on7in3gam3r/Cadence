import { test, expect } from '@playwright/test';

test.describe('smoke: landing → app', () => {
  test('homepage loads and navigates to app onboarding', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('button', { name: /get started|open app/i }).first().click();
    await expect(page).toHaveURL(/\/app/);
  });

  test('legal pages are reachable', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible();
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /terms/i })).toBeVisible();
  });
});

test.describe('smoke: analyze flow (requires API key)', () => {
  test.skip(!process.env.GEMINI_API_KEY, 'GEMINI_API_KEY required for live analyze test');

  test('onboarding submits URL and reaches dashboard', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/app/onboarding');
    await page.getByPlaceholder(/https/i).fill('https://example.com');
    await page.getByRole('button', { name: /analyze|launch|start/i }).click();
    await expect(page.getByText(/war room|action plan|readiness/i).first()).toBeVisible({
      timeout: 90_000,
    });
  });
});
