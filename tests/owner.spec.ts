import { test, expect } from '@playwright/test';
import { loginAs } from '../src/test/helpers/auth';

test.describe('Owner Dashboard & Tenant Management', () => {
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    
    // Login as Owner using helper
    console.log('Logging in as Owner...');
    await loginAs(page, 'owner');
    console.log('Logged in successfully');
    
    // Wait for the dashboard content to load
    // This is critical: wait for the loading spinner to disappear or main content to appear
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
    // Dashboard loaded - checking for admin dashboard content
    await expect(page.locator('[data-testid="owner-dashboard"]')).toBeVisible({ timeout: 15000 });
    
    // Ensure sidebar is expanded or visible if needed, though usually it's fine.
    // Set viewport to ensure elements are visible
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load the Owner Dashboard with KPIs and Charts', async ({ page }) => {
    // Verify Header
    await expect(page.getByText('Platform Overview')).toBeVisible();
    await expect(page.getByText('Super Admin Control Center')).toBeVisible();

    // Verify KPIs
    await expect(page.getByText('Monthly Recurring Revenue')).toBeVisible();
    await expect(page.getByText('Active Tenants')).toBeVisible();
    
    // Verify Charts
    await expect(page.getByText('Revenue Growth')).toBeVisible();
    await expect(page.getByText('New Tenant Acquisition')).toBeVisible();

    // Verify System Alerts (seeded data)
    await expect(page.getByText('System Alerts')).toBeVisible();
    // Check for one of the seeded alerts (partial match)
    await expect(page.getByText('High API Error Rate', { exact: false })).toBeVisible();
  });

  test('should navigate to Platform Controls', async ({ page }) => {
    // Click "Manage Subscription Plans"
    await page.click('button:has-text("Manage Subscription Plans")');
    
    // Verify URL
    await page.waitForURL('**/#/admin/school/billing');
    await expect(page.getByRole('heading', { name: 'Platform Billing' })).toBeVisible();
  });

  test('should filter and search in Tenant Management', async ({ page }) => {
    // Navigate to Tenant Management
    await page.goto('/#/admin/school');
    await expect(page.getByText('Tenant Management')).toBeVisible();

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible();

    // 1. Test Search
    // We assume there are tenants. If not, this might be flaky, but we seeded data or have existing data.
    // Let's search for a non-existent tenant first to verify empty state or filtering
    const searchInput = page.getByPlaceholder('Search tenants...');
    await searchInput.fill('NonExistentTenantXYZ');
    
    // Should show empty state or no results
    await expect(page.getByText('No Tenants Found')).toBeVisible();

    // Clear search
    await page.click('button:has-text("Reset Filters")');
    await expect(page.getByText('No Tenants Found')).not.toBeVisible();

    // 2. Test Status Filter
    const statusSelect = page.locator('select').first(); // Assuming it's the first select
    // Select 'Active' which we know exists from seeding
    await statusSelect.selectOption('Active');
    
    // Verify filter applied (URL doesn't change, but UI should)
    // We expect the table to be visible since we have Active tenants
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    
    // Check if we have rows
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    console.log(`Found ${count} rows in table`);
    // We expect at least 1 row if data is seeded
    if (count === 0) {
        // Dump content to debug
        console.log('Table empty, dumping page content:');
        // console.log(await page.content()); // Too verbose, maybe just text
        console.log(await page.innerText('body'));
    }
    expect(count).toBeGreaterThan(0);
  });

  test('should open Add New Tenant wizard', async ({ page }) => {
    await page.goto('/#/admin/school');
    
    // Button text changes based on active subnav (default is Schools)
    // Use a regex to match "Add New" followed by anything
    await page.click('button:has-text("Add New")');
    
    // Verify Wizard Modal
    // The modal title is "New School Onboarding"
    await expect(page.getByText('New School Onboarding')).toBeVisible();
    
    // Verify first step content
    await expect(page.getByText('School Details')).toBeVisible();
    await expect(page.getByLabel('School Name')).toBeVisible();
    
    // Close wizard
    await page.keyboard.press('Escape');
  });

});
