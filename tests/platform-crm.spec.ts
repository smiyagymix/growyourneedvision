import { test, expect } from '@playwright/test';

test.describe('Platform CRM', () => {
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    // Mock Network Requests
    await page.route('**/api/collections/users/auth-refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          record: {
            id: 'owner123',
            email: 'owner@growyourneed.com',
            name: 'Owner User',
            role: 'owner',
            avatar: ''
          }
        })
      });
    });

    // Mock User Presence Update (Heartbeat)
    await page.route('**/api/collections/users/records/owner123', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'owner123',
            lastActive: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock Notifications (to prevent errors)
    await page.route('**/api/collections/notifications/records*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 20,
          totalItems: 0,
          totalPages: 1,
          items: []
        })
      });
    });

    // Mock Deals
    const deals: any[] = [];
    await page.route('**/api/collections/deals/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            page: 1,
            perPage: 50,
            totalItems: deals.length,
            totalPages: 1,
            items: deals
          })
        });
      } else if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        const newDeal = {
            id: `deal-${Date.now()}`,
            ...postData,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        deals.push(newDeal);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newDeal)
        });
      } else {
        await route.continue();
      }
    });

    // Mock Forecasts
    await page.route('**/api/collections/forecasts/records*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 50,
          totalItems: 2,
          totalPages: 1,
          items: [
            { id: 'f1', month: 'Jan', projected: 10000, actual: 8000 },
            { id: 'f2', month: 'Feb', projected: 12000, actual: 9000 }
          ]
        })
      });
    });

    // Login as Owner
    await page.goto('/#/login');
    await page.fill('input[type="email"]', 'owner@growyourneed.com');
    await page.fill('input[type="password"]', 'Darnag123456789@');
    
    // Mock login response
    await page.route('**/api/collections/users/auth-with-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          record: {
            id: 'owner123',
            email: 'owner@growyourneed.com',
            name: 'Owner User',
            role: 'owner'
          }
        })
      });
    });

    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*\/admin/);
    await expect(page.locator('.animate-spin')).not.toBeVisible();
  });

  test('should load Platform CRM and display Deals', async ({ page }) => {
    await page.click('text=Platform CRM');
    
    await expect(page.getByText('Sales Pipeline')).toBeVisible();
    
    // Create a new Deal
    await page.click('button:has-text("Add Deal")');
    await expect(page.getByText('Create New Deal')).toBeVisible();
    
    const dealName = `Test Deal ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Enterprise License"]', dealName);
    await page.fill('input[type="number"]', '5000');
    await page.fill('input[placeholder="Primary contact person"]', 'John Doe');
    await page.click('button:has-text("Create Deal")');
    
    // Verify it appears
    await expect(page.getByText(dealName)).toBeVisible();
  });

  test('should display Forecast data', async ({ page }) => {
    await page.click('text=Platform CRM');
    
    // Wait for subnav to appear
    const forecastBtn = page.locator('button[title="Forecast"]');
    await expect(forecastBtn).toBeVisible();

    // Click Forecast subnav
    await forecastBtn.click();
    
    // Verify Forecast data
    // Check if the header appears
    await expect(page.getByRole('heading', { name: 'Revenue Forecast' })).toBeVisible({ timeout: 10000 });
    
    // Check for seeded data (e.g. Jan, Feb)
    await expect(page.getByText('Jan')).toBeVisible();
    await expect(page.getByText('Feb')).toBeVisible();
  });
});
