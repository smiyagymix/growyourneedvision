import { test, expect } from '@playwright/test';

test.describe('Business Intelligence - Trial Management', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to login page
        await page.goto('http://localhost:3000');
        
        // Login as owner
        await page.fill('input[type="email"]', 'owner@growyourneed.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button[type="submit"]');
        
        // Wait for navigation
        await page.waitForURL('**/admin');
        await page.waitForTimeout(1000);
        
        // Navigate to Business Intelligence
        await page.click('text=Business Intelligence');
        await page.waitForTimeout(500);
        
        // Click Operations tab
        await page.click('text=Operations');
        await page.waitForTimeout(500);
        
        // Click Trial Management
        await page.click('text=Trial Management');
        await page.waitForTimeout(1000);
    });

    test('should load Trial Management dashboard', async ({ page }) => {
        // Check for main heading
        await expect(page.locator('text=Trial Management')).toBeVisible();
        
        // Check for summary cards
        await expect(page.locator('text=Active Trials')).toBeVisible();
        await expect(page.locator('text=Conversion Rate')).toBeVisible();
        await expect(page.locator('text=Expiring Soon')).toBeVisible();
        await expect(page.locator('text=Total Trials')).toBeVisible();
    });

    test('should display trial statistics', async ({ page }) => {
        // Wait for data to load
        await page.waitForSelector('text=Active Trials', { timeout: 5000 });
        
        // Check that numeric values are displayed
        const activeTrials = page.locator('text=Active Trials').locator('..');
        await expect(activeTrials).toContainText(/\d+/);
        
        // Check conversion rate has percentage
        const conversionRate = page.locator('text=Conversion Rate').locator('..');
        await expect(conversionRate).toContainText(/%/);
    });

    test('should refresh data when refresh button clicked', async ({ page }) => {
        // Find and click refresh button
        const refreshButton = page.locator('button:has-text("Refresh")');
        await expect(refreshButton).toBeVisible();
        await refreshButton.click();
        
        // Check for loading state
        await expect(page.locator('.animate-spin')).toBeVisible();
        
        // Wait for loading to complete
        await page.waitForTimeout(2000);
        await expect(page.locator('.animate-spin')).not.toBeVisible();
    });

    test('should display trial list table', async ({ page }) => {
        // Check for table headers
        await expect(page.locator('text=Customer')).toBeVisible();
        await expect(page.locator('text=Plan')).toBeVisible();
        await expect(page.locator('text=Status')).toBeVisible();
        await expect(page.locator('text=Trial End')).toBeVisible();
    });

    test('should filter trials by status', async ({ page }) => {
        // Check for filter buttons
        await expect(page.locator('button:has-text("All")').first()).toBeVisible();
        await expect(page.locator('button:has-text("Active")').first()).toBeVisible();
        await expect(page.locator('button:has-text("Expired")').first()).toBeVisible();
        
        // Click Active filter
        await page.locator('button:has-text("Active")').first().click();
        await page.waitForTimeout(1000);
        
        // Verify filter is applied (button should be highlighted)
        const activeButton = page.locator('button:has-text("Active")').first();
        await expect(activeButton).toHaveClass(/bg-gyn-primary/);
    });

    test('should display conversion funnel', async ({ page }) => {
        // Scroll to conversion funnel section
        await page.locator('text=Conversion Funnel').scrollIntoViewIfNeeded();
        
        // Check funnel stages
        await expect(page.locator('text=Trial Started')).toBeVisible();
        await expect(page.locator('text=Engaged')).toBeVisible();
        await expect(page.locator('text=Converted')).toBeVisible();
    });

    test('should show trial extension options', async ({ page }) => {
        // Look for extend trial buttons (if trials exist)
        const extendButtons = page.locator('button[title="Extend Trial"]');
        const count = await extendButtons.count();
        
        if (count > 0) {
            // Click first extend button
            await extendButtons.first().click();
            await page.waitForTimeout(500);
            
            // Should show alert or confirmation
            // Note: This depends on implementation
        }
    });

    test('should support dark mode', async ({ page }) => {
        // Toggle dark mode (assuming theme toggle exists)
        const themeToggle = page.locator('[aria-label="Toggle theme"]').first();
        if (await themeToggle.isVisible()) {
            await themeToggle.click();
            await page.waitForTimeout(500);
            
            // Check for dark mode class
            const html = page.locator('html');
            await expect(html).toHaveClass(/dark/);
        }
    });

    test('should display empty state when no trials', async ({ page }) => {
        // Click Converted filter (likely to have fewer results)
        await page.locator('button:has-text("Converted")').first().click();
        await page.waitForTimeout(1000);
        
        // Check for empty state or table rows
        const tableRows = page.locator('tbody tr');
        const count = await tableRows.count();
        
        if (count === 0) {
            await expect(page.locator('text=No trials found')).toBeVisible();
        }
    });

    test('should have working navigation breadcrumbs', async ({ page }) => {
        // Check for navigation structure
        await expect(page.locator('text=Business Intelligence')).toBeVisible();
        await expect(page.locator('text=Operations')).toBeVisible();
        await expect(page.locator('text=Trial Management')).toBeVisible();
    });
});
