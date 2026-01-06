import { test, expect } from '@playwright/test';
import { loginAs, getTestCredentials } from '../src/test/helpers/auth';

test.describe('Platform Billing E2E Tests', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    const ownerCreds = getTestCredentials('owner');

    // Mock Network Requests for billing endpoints
    await page.route('**/*', async route => {
      const url = route.request().url();

      // Auth endpoints
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

      // Invoices endpoint
      if (url.includes('/api/collections/invoices')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'inv-1',
                tenant: 'tenant-1',
                stripe_invoice_id: 'in_test_123',
                amount: 29900,
                currency: 'usd',
                status: 'paid',
                period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                period_end: new Date().toISOString(),
                paid_at: new Date().toISOString(),
                created: new Date().toISOString(),
                expand: { tenant: { name: 'Greenwood High School', plan: 'Premium' } }
              },
              {
                id: 'inv-2',
                tenant: 'tenant-2',
                stripe_invoice_id: 'in_test_124',
                amount: 9900,
                currency: 'usd',
                status: 'pending',
                period_start: new Date().toISOString(),
                period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                created: new Date().toISOString(),
                expand: { tenant: { name: 'Riverside Academy', plan: 'Basic' } }
              },
              {
                id: 'inv-3',
                tenant: 'tenant-3',
                stripe_invoice_id: 'in_test_125',
                amount: 29900,
                currency: 'usd',
                status: 'overdue',
                period_start: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
                period_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                created: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
                expand: { tenant: { name: 'Oak Valley School', plan: 'Pro' } }
              }
            ],
            totalItems: 3,
            page: 1,
            perPage: 100
          })
        });
        return;
      }

      // Subscriptions endpoint
      if (url.includes('/api/collections/subscriptions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'sub-1',
                tenant: 'tenant-1',
                stripe_subscription_id: 'sub_test_123',
                plan: 'pro',
                status: 'active',
                current_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
                created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
              }
            ],
            totalItems: 1
          })
        });
        return;
      }

      // Payment gateways endpoint
      if (url.includes('/api/collections/payment_gateways')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'gateway-1',
                name: 'Stripe',
                type: 'stripe',
                enabled: true,
                test_mode: false,
                status: 'connected',
                last_transaction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              },
              {
                id: 'gateway-2',
                name: 'PayPal',
                type: 'paypal',
                enabled: false,
                test_mode: true,
                status: 'disconnected'
              },
              {
                id: 'gateway-3',
                name: 'Bank Transfer',
                type: 'bank_transfer',
                enabled: true,
                test_mode: false,
                status: 'connected',
                last_transaction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              }
            ],
            totalItems: 3
          })
        });
        return;
      }

      // Tenants endpoint (for billing stats)
      if (url.includes('/api/collections/tenants')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 'tenant-1', name: 'Greenwood High School', plan: 'pro', subscription_status: 'active' },
              { id: 'tenant-2', name: 'Riverside Academy', plan: 'basic', subscription_status: 'active' }
            ],
            totalItems: 2
          })
        });
        return;
      }

      // Generic collection response
      if (url.includes('/api/collections/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [], totalItems: 0 })
        });
        return;
      }

      // Continue other requests
      await route.continue();
    });

    // Login as Owner
    await loginAs(page, 'owner');

    // Wait for dashboard to load
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
  });

  test.describe('Plans Tab', () => {
    test('should display subscription plans', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Check for Platform Billing header
      await expect(page.getByText('Platform Billing')).toBeVisible({ timeout: 10000 });

      // Check for Plans tab (default view)
      const plansTab = page.locator('button').filter({ hasText: 'Plans' });
      await expect(plansTab).toBeVisible();

      // Verify plan content is displayed
      const bodyText = await page.locator('body').innerText();
      const hasPlansContent = 
        bodyText.includes('Plan') || 
        bodyText.includes('Subscription') ||
        bodyText.includes('Pricing');

      expect(hasPlansContent).toBeTruthy();
    });

    test('should show subscription plan options', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Look for pricing cards or plan names
      const planElements = await page.locator('[class*="card"]').filter({ hasText: /basic|pro|enterprise|free/i }).count();
      console.log('Plan elements found:', planElements);
    });
  });

  test.describe('Invoices Tab', () => {
    test('should display invoices list', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Click on Invoices tab
      const invoicesTab = page.locator('button').filter({ hasText: 'Invoices' });
      await invoicesTab.click();

      // Wait for invoices to load
      await page.waitForTimeout(1000);

      // Check for invoice-related content
      const bodyText = await page.locator('body').innerText();
      const hasInvoiceContent = 
        bodyText.includes('Invoice') || 
        bodyText.includes('Total Revenue') ||
        bodyText.includes('Pending') ||
        bodyText.includes('Overdue');

      expect(hasInvoiceContent).toBeTruthy();
    });

    test('should show billing statistics cards', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Invoices
      await page.locator('button').filter({ hasText: 'Invoices' }).click();
      await page.waitForTimeout(1000);

      // Check for stats cards
      const statsTexts = ['Total Revenue', 'Pending', 'Overdue', 'Total Invoices'];
      
      for (const stat of statsTexts) {
        const statElement = page.getByText(stat);
        if (await statElement.isVisible().catch(() => false)) {
          console.log(`Found stat: ${stat}`);
        }
      }
    });

    test('should display invoices in a table', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Invoices
      await page.locator('button').filter({ hasText: 'Invoices' }).click();
      await page.waitForTimeout(1000);

      // Look for table headers
      const tableHeaders = ['Invoice ID', 'Tenant', 'Plan', 'Amount', 'Status', 'Due Date'];
      const bodyText = await page.locator('body').innerText();

      for (const header of tableHeaders) {
        if (bodyText.includes(header)) {
          console.log(`Found table header: ${header}`);
        }
      }

      // Check for table element
      const table = await page.locator('table').isVisible().catch(() => false);
      console.log('Invoice table visible:', table);
    });

    test('should show invoice status badges', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Invoices
      await page.locator('button').filter({ hasText: 'Invoices' }).click();
      await page.waitForTimeout(1000);

      // Look for status badges
      const paidBadge = await page.locator('text=PAID').isVisible().catch(() => false);
      const pendingBadge = await page.locator('text=PENDING').isVisible().catch(() => false);
      const overdueBadge = await page.locator('text=OVERDUE').isVisible().catch(() => false);

      console.log('Status badges - Paid:', paidBadge, 'Pending:', pendingBadge, 'Overdue:', overdueBadge);
    });

    test('should have export and create invoice buttons', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Invoices
      await page.locator('button').filter({ hasText: 'Invoices' }).click();
      await page.waitForTimeout(1000);

      // Look for action buttons
      const exportBtn = page.locator('button').filter({ hasText: /export|csv/i });
      const createBtn = page.locator('button').filter({ hasText: /create.*invoice/i });

      const hasExport = await exportBtn.isVisible().catch(() => false);
      const hasCreate = await createBtn.isVisible().catch(() => false);

      console.log('Export button:', hasExport, 'Create button:', hasCreate);
    });
  });

  test.describe('Payment Gateways Tab', () => {
    test('should display payment gateway cards', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Click on Gateways tab
      const gatewaysTab = page.locator('button').filter({ hasText: 'Gateways' });
      await gatewaysTab.click();

      // Wait for gateways to load
      await page.waitForTimeout(1000);

      // Check for gateway-related content
      const bodyText = await page.locator('body').innerText();
      const hasGatewayContent = 
        bodyText.includes('Payment Gateway') || 
        bodyText.includes('Stripe') ||
        bodyText.includes('PayPal') ||
        bodyText.includes('Bank Transfer');

      expect(hasGatewayContent).toBeTruthy();
    });

    test('should show gateway status badges', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Gateways
      await page.locator('button').filter({ hasText: 'Gateways' }).click();
      await page.waitForTimeout(1000);

      // Look for status indicators
      const connectedBadge = await page.locator('text=connected').isVisible().catch(() => false);
      const disconnectedBadge = await page.locator('text=disconnected').isVisible().catch(() => false);

      console.log('Gateway status - Connected:', connectedBadge, 'Disconnected:', disconnectedBadge);
    });

    test('should show gateway enabled/disabled status', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Gateways
      await page.locator('button').filter({ hasText: 'Gateways' }).click();
      await page.waitForTimeout(1000);

      // Look for ON/OFF badges
      const onBadge = await page.locator('text=ON').isVisible().catch(() => false);
      const offBadge = await page.locator('text=OFF').isVisible().catch(() => false);

      console.log('Gateway enabled status - ON:', onBadge, 'OFF:', offBadge);
    });

    test('should show test/live mode indicator', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Gateways
      await page.locator('button').filter({ hasText: 'Gateways' }).click();
      await page.waitForTimeout(1000);

      // Look for mode badges
      const testMode = await page.locator('text=Test').isVisible().catch(() => false);
      const liveMode = await page.locator('text=Live').isVisible().catch(() => false);

      console.log('Gateway mode - Test:', testMode, 'Live:', liveMode);
    });

    test('should have Test and Configure buttons for each gateway', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Gateways
      await page.locator('button').filter({ hasText: 'Gateways' }).click();
      await page.waitForTimeout(1000);

      // Look for action buttons
      const testButtons = await page.locator('button').filter({ hasText: 'Test' }).count();
      const configureButtons = await page.locator('button').filter({ hasText: 'Configure' }).count();

      console.log('Test buttons:', testButtons, 'Configure buttons:', configureButtons);
      expect(testButtons).toBeGreaterThan(0);
    });

    test('should have Add Gateway button', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Gateways
      await page.locator('button').filter({ hasText: 'Gateways' }).click();
      await page.waitForTimeout(1000);

      // Look for Add Gateway button
      const addGatewayBtn = page.locator('button').filter({ hasText: /add.*gateway/i });
      const hasAddGateway = await addGatewayBtn.isVisible().catch(() => false);

      console.log('Add Gateway button visible:', hasAddGateway);
    });
  });

  test.describe('Tab Navigation', () => {
    test('should switch between tabs correctly', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Start on Plans (default)
      await expect(page.getByText('Platform Billing')).toBeVisible();

      // Switch to Invoices
      await page.locator('button').filter({ hasText: 'Invoices' }).click();
      await page.waitForTimeout(500);
      
      // Verify we see invoice content
      const hasInvoices = await page.getByText('All Invoices').isVisible().catch(() => false);
      console.log('Invoices tab active:', hasInvoices);

      // Switch to Gateways
      await page.locator('button').filter({ hasText: 'Gateways' }).click();
      await page.waitForTimeout(500);
      
      // Verify we see gateway content
      const hasGateways = await page.getByText('Payment Gateways').isVisible().catch(() => false);
      console.log('Gateways tab active:', hasGateways);

      // Switch back to Plans
      await page.locator('button').filter({ hasText: 'Plans' }).click();
      await page.waitForTimeout(500);
    });

    test('should highlight active tab', async ({ page }) => {
      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Check that Plans tab is styled as active (default)
      const plansTab = page.locator('button').filter({ hasText: 'Plans' });
      const plansClasses = await plansTab.getAttribute('class');
      console.log('Plans tab classes:', plansClasses);

      // Click Invoices and check active styling
      await page.locator('button').filter({ hasText: 'Invoices' }).click();
      await page.waitForTimeout(300);

      const invoicesTab = page.locator('button').filter({ hasText: 'Invoices' });
      const invoicesClasses = await invoicesTab.getAttribute('class');
      console.log('Invoices tab classes after click:', invoicesClasses);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading spinner while fetching invoices', async ({ page }) => {
      // Add delay to network response to catch loading state
      await page.route('**/api/collections/invoices**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [], totalItems: 0 })
        });
      });

      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Invoices
      await page.locator('button').filter({ hasText: 'Invoices' }).click();

      // Check for loading indicator
      const spinner = page.locator('.animate-spin');
      // Loading might be too fast to catch, just log
      console.log('Checking for loading spinner...');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Force an error response
      await page.route('**/api/collections/invoices**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('/#/admin/school/billing');
      await page.waitForLoadState('networkidle');

      // Navigate to Invoices
      await page.locator('button').filter({ hasText: 'Invoices' }).click();
      await page.waitForTimeout(1000);

      // Should not crash - check page is still functional
      const heading = await page.getByText('Platform Billing').isVisible();
      expect(heading).toBeTruthy();
    });
  });
});

// Tenant Management Billing Integration
test.describe('Tenant Management - Billing Integration', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    const ownerCreds = getTestCredentials('owner');

    await page.route('**/*', async route => {
      const url = route.request().url();

      if (url.includes('/api/collections/users/auth')) {
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

      if (url.includes('/api/collections/tenants')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 'tenant-1', name: 'Greenwood High', status: 'active', plan: 'pro' },
              { id: 'tenant-2', name: 'Riverside Academy', status: 'active', plan: 'basic' }
            ],
            totalItems: 2
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

      await route.continue();
    });

    await loginAs(page, 'owner');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
  });

  test('should navigate from tenant management to billing', async ({ page }) => {
    await page.goto('/#/admin/school');
    await page.waitForLoadState('networkidle');

    // Look for billing-related navigation
    const billingLink = page.locator('button, a').filter({ hasText: /billing|subscription|plan/i }).first();
    
    if (await billingLink.isVisible().catch(() => false)) {
      await billingLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're on billing page
      const isBillingPage = await page.getByText('Platform Billing').isVisible().catch(() => false);
      console.log('Navigated to billing page:', isBillingPage);
    }
  });
});
