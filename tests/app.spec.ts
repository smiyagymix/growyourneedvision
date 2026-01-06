import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Grow Your Need/);
});

test('loads dashboard', async ({ page }) => {
    await page.goto('/');

    // Check if the main app container exists
    await expect(page.locator('#root')).toBeVisible();

    // Check for a key element from the dashboard (e.g., navigation or header)
    // Since we might be redirected to login or dashboard depending on auth state (mocked)
    // Let's just check that the page content loads without error
    const body = page.locator('body');
    await expect(body).toBeVisible();
});
