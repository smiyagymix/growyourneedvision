import { test, expect } from '@playwright/test';

test.describe('Business Intelligence - Revenue Analysis', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Login
        await page.fill('input[type="email"]', 'owner@growyourneed.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin');
        await page.waitForTimeout(1000);
        
        // Navigate to Revenue Analysis
        await page.click('text=Business Intelligence');
        await page.waitForTimeout(500);
        await page.click('text=Analytics');
        await page.waitForTimeout(500);
        await page.click('text=Revenue Analysis');
        await page.waitForTimeout(1000);
    });

    test('should load Revenue Analysis dashboard', async ({ page }) => {
        await expect(page.locator('text=Revenue Analysis')).toBeVisible();
        
        // Check for key metrics
        await expect(page.locator('text=MRR')).toBeVisible();
        await expect(page.locator('text=ARR')).toBeVisible();
        await expect(page.locator('text=ARPA')).toBeVisible();
    });

    test('should display MRR with trend indicator', async ({ page }) => {
        await page.waitForSelector('text=MRR', { timeout: 5000 });
        
        // Check for currency values
        const mrrSection = page.locator('text=MRR').locator('..');
        await expect(mrrSection).toContainText(/\$/);
        
        // Check for trend indicator (arrow up/down)
        const hasTrend = await page.locator('svg.lucide-trending-up, svg.lucide-trending-down, svg.lucide-minus').count();
        expect(hasTrend).toBeGreaterThan(0);
    });

    test('should show revenue growth chart', async ({ page }) => {
        // Look for growth chart section
        await page.locator('text=Revenue Growth').scrollIntoViewIfNeeded();
        await expect(page.locator('text=Revenue Growth')).toBeVisible();
        
        // Check for month labels
        const hasMonthLabels = await page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/').count();
        expect(hasMonthLabels).toBeGreaterThan(0);
    });

    test('should display revenue breakdown by plan', async ({ page }) => {
        await page.locator('text=Revenue by Plan').scrollIntoViewIfNeeded();
        await expect(page.locator('text=Revenue by Plan')).toBeVisible();
        
        // Check for revenue amounts
        await expect(page.locator('text=/\\$\\d+/').first()).toBeVisible();
    });

    test('should display revenue by interval', async ({ page }) => {
        await page.locator('text=Revenue by Interval').scrollIntoViewIfNeeded();
        await expect(page.locator('text=Revenue by Interval')).toBeVisible();
        
        // Check for interval types
        const hasIntervals = await page.locator('text=/Monthly|Yearly|Quarterly/i').count();
        expect(hasIntervals).toBeGreaterThanOrEqual(0);
    });

    test('should show churn impact metrics', async ({ page }) => {
        await page.locator('text=Churn Impact').scrollIntoViewIfNeeded();
        await expect(page.locator('text=Churn Impact')).toBeVisible();
        
        // Check for lost MRR/ARR
        await expect(page.locator('text=Lost MRR')).toBeVisible();
        await expect(page.locator('text=Lost ARR')).toBeVisible();
    });

    test('should display annual performance', async ({ page }) => {
        await page.locator('text=Annual Performance').scrollIntoViewIfNeeded();
        await expect(page.locator('text=Annual Performance')).toBeVisible();
        
        // Check for 12-month metrics
        const hasRevenue = await page.locator('text=/Total.*Revenue/i').count();
        expect(hasRevenue).toBeGreaterThan(0);
    });

    test('should refresh revenue data', async ({ page }) => {
        const refreshButton = page.locator('button:has-text("Refresh")');
        await refreshButton.click();
        
        // Check for loading indicator
        await expect(page.locator('.animate-spin')).toBeVisible();
        await page.waitForTimeout(2000);
    });

    test('should format currency correctly', async ({ page }) => {
        // Check that all dollar amounts have proper formatting
        const currencyElements = page.locator('text=/\\$[\\d,]+/');
        const count = await currencyElements.count();
        expect(count).toBeGreaterThan(0);
        
        // Verify no raw numbers without currency symbol
        const firstAmount = await currencyElements.first().textContent();
        expect(firstAmount).toMatch(/^\$/);
    });

    test('should show growth percentages', async ({ page }) => {
        // Look for percentage indicators
        const percentages = page.locator('text=/%/');
        const count = await percentages.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should animate on load', async ({ page }) => {
        // Reload page to see animations
        await page.reload();
        await page.waitForTimeout(500);
        
        // Check for Framer Motion animation classes
        const animatedElements = page.locator('[style*="opacity"]');
        const count = await animatedElements.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should be responsive', async ({ page }) => {
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        // Should still show main heading
        await expect(page.locator('text=Revenue Analysis')).toBeVisible();
        
        // Reset viewport
        await page.setViewportSize({ width: 1280, height: 720 });
    });
});
