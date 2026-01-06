import { test, expect } from '@playwright/test';
import { loginAs } from '../src/test/helpers/auth';

test.describe('Data Validation Tests', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // Mock Network Requests to prevent 400 errors from backend
    await page.route('**/api/collections/products/records**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], totalItems: 0 })
      });
    });

    await page.route('**/api/collections/events/records**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], totalItems: 0 })
      });
    });

    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    
    await loginAs(page, 'owner');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
  });

  test('should validate Marketplace Product inputs', async ({ page }) => {
    // Navigate to Overlay-Setting via URL to avoid UI flakiness
    await page.goto('/#/admin/overlay_setting');
    
    // Wait for module to load - try to find the Apps tab directly
    await expect(page.getByRole('button', { name: 'Apps' })).toBeVisible({ timeout: 10000 });
    
    // Click Apps tab
    await page.getByRole('button', { name: 'Apps' }).click();
    
    // Now click 'Marketplace' in the subnav (sidebar or top bar depending on layout)
    await page.getByRole('button', { name: 'Marketplace' }).click();

    // Verify Marketplace Manager loaded
    await expect(page.getByText('Marketplace Content')).toBeVisible();

    // Click Add Product
    await page.getByText('Add Product').click();

    // Fill invalid data
    await page.fill('input[name="title"]', 'A'); // Too short (using title instead of name based on schema)
    await page.fill('input[name="price"]', '-10'); // Negative price
    
    // Submit
    await page.getByRole('button', { name: 'Save Product' }).click();

    // Expect validation errors
    // Zod error messages:
    // title: "String must contain at least 2 character(s)" - Wait, schema says min(1) "Title is required"
    // Actually schema says: title: z.string().min(1, "Title is required")
    // But maybe the test expects something else?
    // Let's check the schema in MarketplaceContentManager.tsx:
    // title: z.string().min(1, "Title is required"),
    // price: z.number().min(0, "Price must be positive"),
    
    // If I type 'A', min(1) passes.
    // Wait, the previous test code said: await page.fill('input[name="name"]', 'A'); // Too short
    // And expected: "String must contain at least 2 character(s)"
    // But the schema I read in MarketplaceContentManager.tsx is: title: z.string().min(1, "Title is required")
    // So 'A' is valid for title.
    // I should clear the input to test "Title is required".
    
    await page.fill('input[name="title"]', '');
    await page.getByRole('button', { name: 'Save Product' }).click();
    
    // Check for toast message
    // Toast might be in a specific container
    // Use :not(.pointer-events-none) to avoid RealtimeStatus container
    await expect(page.locator('div.fixed.bottom-4.right-4:not(.pointer-events-none)')).toContainText('Title is required');
    
    // Fix title so we can test price
    await page.fill('input[name="title"]', 'Valid Title');
    await page.fill('input[name="price"]', '-10');
    await page.getByRole('button', { name: 'Save Product' }).click();
    await expect(page.locator('div.fixed.bottom-4.right-4:not(.pointer-events-none)')).toContainText('Price must be positive');
  });

  test('should validate Event dates', async ({ page }) => {
    // Navigate to Overlay-Setting -> Apps -> Events
    await page.goto('/#/admin/overlay_setting');
    await expect(page.getByRole('button', { name: 'Apps' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Apps' }).click();
    await page.getByRole('button', { name: 'Events' }).click();

    // Verify Events Manager loaded
    await expect(page.getByText('Events Management')).toBeVisible();

    // Click Add Event (opens modal)
    await page.getByText('Add Event').first().click();

    // Fill invalid dates (End before Start)
    await page.fill('input[name="title"]', 'Test Event');
    
    // Set Start Date: Tomorrow
    // Set End Date: Today
    const today = new Date().toISOString().slice(0, 16);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    
    // We want End < Start
    await page.fill('input[name="start_time"]', tomorrow);
    await page.fill('input[name="end_time"]', today);
    
    // Fill other required fields
    await page.fill('input[name="location"]', 'Test Location');
    
    // Submit (click the button inside the modal)
    // Use specific selector for the modal button
    await page.locator('.fixed.inset-0 button').filter({ hasText: 'Add Event' }).click();

    // Expect validation error
    await expect(page.locator('div.fixed.bottom-4.right-4:not(.pointer-events-none)')).toContainText('End time must be after start time');
  });
});
