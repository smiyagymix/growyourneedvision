import { test, expect } from '@playwright/test';
import { loginAs, getTestCredentials } from '../src/test/helpers/auth';

test.describe('Advanced Analytics Dashboard', () => {
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
    page.on('requestfailed', request => console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`));

    const ownerCreds = getTestCredentials('owner');

    // Mock Network Requests
    // Handle both localhost and 127.0.0.1 just in case
    await page.route('**/*', async route => {
        const url = route.request().url();
        
        if (url.includes('/api/collections/users/auth-with-password') || url.includes('/api/collections/users/auth-refresh')) {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                  token: 'fake-token',
                  record: { id: ownerCreds.id, email: ownerCreds.email, role: ownerCreds.role }
                })
              });
              return;
        }

        if (url.includes('/api/collections/')) {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ items: [], totalItems: 0 })
            });
            return;
        }

        // Continue other requests (assets, etc.)
        await route.continue();
    });

    // Login as Owner using helper
    await loginAs(page, 'owner');
    
    // Wait for dashboard to load
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
  });

  test('should display Advanced Analytics sections', async ({ page }) => {
    // Navigate to Admin Dashboard first
    await page.goto('/admin');
    console.log('Body text at /admin:', await page.locator('body').innerText());
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="owner-dashboard"]')).toBeVisible({ timeout: 15000 });

    // Click on Analytics tab
    await page.getByRole('button', { name: 'Analytics' }).click();

    // Wait for Analytics Dashboard to load
    // Check for potential error message first
    const errorMessage = page.locator('text=Failed to load analytics data');
    if (await errorMessage.isVisible()) {
        console.log('Error loading dashboard:', await errorMessage.textContent());
    }
    
    console.log('Current URL:', page.url());
    console.log('Body text:', await page.locator('body').innerText());

    await expect(page.getByText('Platform Analytics')).toBeVisible({ timeout: 10000 });

    // Check for Predictive Revenue
    // Since we mocked empty data, the chart might be empty, but the headers should be there.
    await expect(page.getByText('Predictive Revenue (Next 3 Months)')).toBeVisible();
    
    // Check for Cohort Retention
    // The service mocks this data internally even if API returns empty, so it SHOULD be visible.
    await expect(page.getByText('User Retention Cohorts')).toBeVisible();
    await expect(page.getByText('Month 0')).toBeVisible();
    await expect(page.getByText('Month 3')).toBeVisible();
    
    // Verify some cohort data is rendered (from the hardcoded mock in service)
    await expect(page.getByText('Aug 2024')).toBeVisible();
    await expect(page.getByText('100%').first()).toBeVisible();
  });
});
