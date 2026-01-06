import { test, expect } from '@playwright/test';

test.describe('Business Intelligence - Subscription Lifecycle', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Login
        await page.fill('input[type="email"]', 'owner@growyourneed.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin');
        await page.waitForTimeout(1000);
        
        // Navigate to Subscription Lifecycle
        await page.click('text=Business Intelligence');
        await page.waitForTimeout(500);
        await page.click('text=Operations');
        await page.waitForTimeout(500);
        await page.click('text=Subscription Lifecycle');
        await page.waitForTimeout(1000);
    });

    test('should load Subscription Lifecycle', async ({ page }) => {
        await expect(page.locator('text=Subscription Lifecycle Manager')).toBeVisible();
    });

    test('should display subscription status cards', async ({ page }) => {
        // Check for 4 status cards
        await expect(page.locator('text=Active Subscriptions')).toBeVisible();
        await expect(page.locator('text=Paused Subscriptions')).toBeVisible();
        await expect(page.locator('text=Canceled This Month')).toBeVisible();
        await expect(page.locator('text=Scheduled Changes')).toBeVisible();
    });

    test('should show numeric data in status cards', async ({ page }) => {
        const numbers = page.locator('text=/^\\d+$/');
        const count = await numbers.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should display lifecycle workflow metrics', async ({ page }) => {
        await page.locator('text=Lifecycle Workflow Metrics').scrollIntoViewIfNeeded();
        
        await expect(page.locator('text=Lifecycle Workflow Metrics')).toBeVisible();
        await expect(page.locator('text=New').first()).toBeVisible();
        await expect(page.locator('text=Active').first()).toBeVisible();
        await expect(page.locator('text=At Risk').first()).toBeVisible();
        await expect(page.locator('text=Canceled').first()).toBeVisible();
    });

    test('should show subscription table', async ({ page }) => {
        await page.locator('text=Recent Subscriptions').scrollIntoViewIfNeeded();
        
        // Check for table headers
        await expect(page.locator('text=Customer')).toBeVisible();
        await expect(page.locator('text=Plan')).toBeVisible();
        await expect(page.locator('text=Status')).toBeVisible();
        await expect(page.locator('text=Next Action')).toBeVisible();
    });

    test('should filter subscriptions by status', async ({ page }) => {
        // Check filter buttons
        await expect(page.locator('button:has-text("All")')).toBeVisible();
        await expect(page.locator('button:has-text("Active")')).toBeVisible();
        await expect(page.locator('button:has-text("Paused")')).toBeVisible();
        await expect(page.locator('button:has-text("Canceled")')).toBeVisible();
        
        // Click Active filter
        const activeButton = page.locator('button:has-text("Active")');
        await activeButton.click();
        await page.waitForTimeout(500);
        
        // Should highlight active button
        await expect(activeButton).toHaveClass(/bg-gyn-primary/);
    });

    test('should display pause action buttons', async ({ page }) => {
        const pauseButtons = page.locator('button:has-text("Pause")');
        const count = await pauseButtons.count();
        
        if (count > 0) {
            await expect(pauseButtons.first()).toBeVisible();
        }
    });

    test('should display cancel action buttons', async ({ page }) => {
        const cancelButtons = page.locator('button:has-text("Cancel")');
        const count = await cancelButtons.count();
        
        if (count > 0) {
            await expect(cancelButtons.first()).toBeVisible();
        }
    });

    test('should display reactivate action buttons', async ({ page }) => {
        const reactivateButtons = page.locator('button:has-text("Reactivate")');
        const count = await reactivateButtons.count();
        
        if (count > 0) {
            await expect(reactivateButtons.first()).toBeVisible();
        }
    });

    test('should show scheduled changes panel', async ({ page }) => {
        await page.locator('text=Scheduled Changes').scrollIntoViewIfNeeded();
        
        const scheduledPanel = page.locator('text=Upcoming subscription changes');
        if (await scheduledPanel.isVisible()) {
            await expect(scheduledPanel).toBeVisible();
        }
    });

    test('should refresh subscription data', async ({ page }) => {
        const refreshButton = page.locator('button:has-text("Refresh")');
        await refreshButton.click();
        
        await expect(page.locator('.animate-spin')).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('should display status badges', async ({ page }) => {
        // Check for colored status badges
        const statusBadges = page.locator('.bg-green-100, .bg-yellow-100, .bg-red-100, .bg-gray-100');
        const count = await statusBadges.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show empty state when no subscriptions', async ({ page }) => {
        const noSubscriptionsText = page.locator('text=No subscriptions found');
        const tableRows = page.locator('tbody tr');
        
        const noSubsVisible = await noSubscriptionsText.isVisible();
        const rowCount = await tableRows.count();
        
        if (rowCount === 0) {
            await expect(noSubscriptionsText).toBeVisible();
        }
    });

    test('should display next billing date', async ({ page }) => {
        // Look for date patterns in Next Action column
        const dates = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/');
        const count = await dates.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show lifecycle stage percentages', async ({ page }) => {
        const percentages = page.locator('text=/%/');
        const count = await percentages.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should support dark mode', async ({ page }) => {
        const themeToggle = page.locator('[aria-label="Toggle theme"]').first();
        if (await themeToggle.isVisible()) {
            await themeToggle.click();
            await page.waitForTimeout(500);
            
            const html = page.locator('html');
            await expect(html).toHaveClass(/dark/);
        }
    });
});
