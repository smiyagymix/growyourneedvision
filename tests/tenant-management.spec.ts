import { test, expect } from '@playwright/test';

test.describe('Tenant Management', () => {
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

    // Mock Notifications
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

    // Mock User Creation (for Tenant Admin)
    await page.route('**/api/collections/users/records', async route => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: `user-${Date.now()}`,
            ...postData,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock Tenants List
    const tenants: any[] = [];
    await page.route('**/api/collections/tenants/records*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            page: 1,
            perPage: 50,
            totalItems: tenants.length,
            totalPages: 1,
            items: tenants
          })
        });
      } else if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        const newTenant = {
            id: `tenant-${Date.now()}`,
            ...postData,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        tenants.push(newTenant);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newTenant)
        });
      } else {
        await route.continue();
      }
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

  test('should load Tenant Management and create a new tenant', async ({ page }) => {
    // Navigate to Tenant Management
    await page.click('text=Tenant Mgt');
    
    // Check if the list is empty initially
    // console.log(await page.content()); // Debug
    await expect(page.getByRole('heading', { name: 'No Tenants Found' })).toBeVisible();
    
    // Open Create Wizard
    // The EmptyState button says "Create Tenant"
    await page.click('button:has-text("Create Tenant")');
    await expect(page.getByText('New School Onboarding')).toBeVisible();
    
    // Step 1: Basic Info
    const tenantName = `Test School ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Springfield High"]', tenantName);
    await page.fill('input[placeholder="springfield.edu"]', `school-${Date.now()}.edu`);
    await page.fill('input[placeholder="admin@springfield.edu"]', 'admin@school.com');
    await page.fill('input[placeholder="********"]', 'password123');
    await page.click('button:has-text("Next Step")');
    
    // Step 2: Branding (Defaults are fine)
    await expect(page.getByText('White Labeling')).toBeVisible();
    await page.click('button:has-text("Next Step")');
    
    // Step 3: Configuration (Defaults are fine)
    await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible();
    await page.click('button:has-text("Next Step")');
    
    // Step 4: Review & Submit
    await expect(page.getByText('Ready to Launch?')).toBeVisible();
    await expect(page.getByText(tenantName)).toBeVisible();
    await page.click('button:has-text("Launch School")');
    
    // Verify Modal Closes and Tenant Appears
    await expect(page.getByText('New School Onboarding')).not.toBeVisible();
    await expect(page.getByText(tenantName)).toBeVisible();
  });
});
