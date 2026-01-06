import { test, expect } from '@playwright/test';
import { loginAs, getTestCredentials } from '../src/test/helpers/auth';

test.describe('Tool Platform', () => {
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    const ownerCreds = getTestCredentials('owner');

    // Mock Network Requests
    await page.route('**/api/collections/users/auth-refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          record: {
            id: ownerCreds.id,
            email: ownerCreds.email,
            name: 'Owner User',
            role: ownerCreds.role,
            avatar: ''
          }
        })
      });
    });

    // Mock User Presence Update (Heartbeat)
    await page.route(`**/api/collections/users/records/${ownerCreds.id}`, async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: ownerCreds.id,
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

    // Mock Tenants for Billing Stats
    await page.route('**/api/collections/tenants/records*', async route => {
      const url = route.request().url();
      if (url.includes('subscription_status = "active"')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 't1', plan: 'pro', subscription_status: 'active' },
            { id: 't2', plan: 'basic', subscription_status: 'active' }
          ])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            page: 1,
            perPage: 1,
            totalItems: 10,
            totalPages: 10,
            items: []
          })
        });
      }
    });

    // Mock Invoices for Billing Stats
    await page.route('**/api/collections/invoices/records*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 1,
          totalItems: 0,
          totalPages: 0,
          items: []
        })
      });
    });

    // Mock Marketing Tools
    await page.route('**/api/collections/tools_marketing/records*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'm1', name: 'Campaign Manager', category: 'Marketing', status: 'active', icon: 'Megaphone' },
          { id: 'm2', name: 'Email Studio', category: 'Marketing', status: 'active', icon: 'Envelope' }
        ])
      });
    });

    // Mock Finance Tools
    await page.route('**/api/collections/tools_finance/records*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'f1', name: 'Revenue Reports', category: 'Finance', status: 'active', icon: 'ChartBar' }
        ])
      });
    });

    // Mock login response
    await page.route('**/api/collections/users/auth-with-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          record: {
            id: ownerCreds.id,
            email: ownerCreds.email,
            name: 'Owner User',
            role: ownerCreds.role
          }
        })
      });
    });

    // Login as Owner using helper
    await loginAs(page, 'owner');
    await expect(page.locator('.animate-spin')).not.toBeVisible();
  });

  test('should load Tool Platform and display Overview', async ({ page }) => {
    await page.click('text=Tool-Platform');
    
    // Wait for module loading
    await expect(page.getByText('Initializing module...')).not.toBeVisible();

    // Ensure we are on the right page
    // await expect(page).toHaveURL(/.*\/admin\/tool_platform/); // Optional, depends on routing

    // Check Overview Header
    // "Command Center" is the hero text in ToolPlatform Overview
    await expect(page.getByText('Command Center')).toBeVisible();
    
    // Check Stats
    await expect(page.getByText('Platform Intelligence')).toBeVisible();
  });

  test('should navigate to Marketing Dashboard', async ({ page }) => {
    await page.click('text=Tool-Platform');
    await expect(page.getByText('Initializing module...')).not.toBeVisible();
    
    // Wait for tabs to be visible
    await expect(page.getByRole('button', { name: 'Marketing' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Marketing' }).first().click();
    
    // Check for Marketing Dashboard elements
    // MarketingDashboard renders stats like "Active Campaigns"
    await expect(page.getByText('Active Campaigns')).toBeVisible();
    await expect(page.getByText('Total Spend')).toBeVisible();
  });

  test('should navigate to Finance Dashboard', async ({ page }) => {
    await page.click('text=Tool-Platform');
    await expect(page.getByText('Initializing module...')).not.toBeVisible();
    
    await expect(page.getByRole('button', { name: 'Finance' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Finance' }).first().click();
    
    // Check for Finance Dashboard elements
    // FinanceDashboard renders stats like "Total Revenue"
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Revenue Analytics' })).toBeVisible();
  });
});
