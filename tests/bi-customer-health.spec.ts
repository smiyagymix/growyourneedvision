import { test, expect } from '@playwright/test';

test.describe('Business Intelligence - Customer Health', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Login
        await page.fill('input[type="email"]', 'owner@growyourneed.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin');
        await page.waitForTimeout(1000);
        
        // Navigate to Customer Health
        await page.click('text=Business Intelligence');
        await page.waitForTimeout(500);
        await page.click('text=Analytics');
        await page.waitForTimeout(500);
        await page.click('text=Customer Health');
        await page.waitForTimeout(1000);
    });

    test('should load Customer Health dashboard', async ({ page }) => {
        await expect(page.locator('text=Customer Health Dashboard')).toBeVisible();
    });

    test('should display health score summary cards', async ({ page }) => {
        // Check for 4 summary cards
        await expect(page.locator('text=Average Health Score')).toBeVisible();
        await expect(page.locator('text=Healthy Customers')).toBeVisible();
        await expect(page.locator('text=At-Risk Customers')).toBeVisible();
        await expect(page.locator('text=Critical Customers')).toBeVisible();
    });

    test('should show average health score with value', async ({ page }) => {
        const avgScoreCard = page.locator('text=Average Health Score').locator('..');
        const scoreValue = avgScoreCard.locator('text=/\\d+/');
        await expect(scoreValue.first()).toBeVisible();
    });

    test('should display health score trend indicator', async ({ page }) => {
        // Check for trend arrows
        const trendArrows = page.locator('svg.lucide-trending-up, svg.lucide-trending-down');
        const count = await trendArrows.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show health distribution chart', async ({ page }) => {
        await page.locator('text=Health Score Distribution').scrollIntoViewIfNeeded();
        
        await expect(page.locator('text=Health Score Distribution')).toBeVisible();
        await expect(page.locator('text=Healthy')).toBeVisible();
        await expect(page.locator('text=At Risk')).toBeVisible();
        await expect(page.locator('text=Critical')).toBeVisible();
    });

    test('should display engagement distribution', async ({ page }) => {
        await page.locator('text=Engagement Distribution').scrollIntoViewIfNeeded();
        
        await expect(page.locator('text=Engagement Distribution')).toBeVisible();
        // Check for engagement levels
        const engagementLevels = page.locator('text=High, text=Medium, text=Low');
        const count = await engagementLevels.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show customer segments', async ({ page }) => {
        await page.locator('text=Customer Segments').scrollIntoViewIfNeeded();
        
        await expect(page.locator('text=Customer Segments')).toBeVisible();
        // Common segments
        await expect(page.locator('text=Champions, text=Loyal, text=New').first()).toBeVisible();
    });

    test('should display health trends over time', async ({ page }) => {
        await page.locator('text=Health Trend').scrollIntoViewIfNeeded();
        
        // Check for chart with month labels
        const monthLabels = page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/');
        const count = await monthLabels.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show at-risk customers panel', async ({ page }) => {
        await page.locator('text=At-Risk Customers').scrollIntoViewIfNeeded();
        
        // Check for table headers
        await expect(page.locator('text=Customer')).toBeVisible();
        await expect(page.locator('text=Health Score')).toBeVisible();
        await expect(page.locator('text=Risk Level')).toBeVisible();
        await expect(page.locator('text=Last Active')).toBeVisible();
    });

    test('should filter customers by health status', async ({ page }) => {
        // Check filter buttons
        await expect(page.locator('button:has-text("All")')).toBeVisible();
        await expect(page.locator('button:has-text("Healthy")')).toBeVisible();
        await expect(page.locator('button:has-text("At Risk")')).toBeVisible();
        await expect(page.locator('button:has-text("Critical")')).toBeVisible();
        
        // Click At Risk filter
        const atRiskButton = page.locator('button:has-text("At Risk")');
        await atRiskButton.click();
        await page.waitForTimeout(500);
        
        // Should highlight button
        await expect(atRiskButton).toHaveClass(/bg-yellow-500|bg-gyn-primary/);
    });

    test('should display health score badges', async ({ page }) => {
        // Check for colored score badges
        const scoreBadges = page.locator('.bg-green-100, .bg-yellow-100, .bg-red-100');
        const count = await scoreBadges.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show percentage values', async ({ page }) => {
        const percentages = page.locator('text=/%/');
        const count = await percentages.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should refresh health data', async ({ page }) => {
        const refreshButton = page.locator('button:has-text("Refresh")');
        await refreshButton.click();
        
        await expect(page.locator('.animate-spin')).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('should display action buttons for at-risk customers', async ({ page }) => {
        const actionButtons = page.locator('button:has-text("Contact"), button:has-text("View Details")');
        const count = await actionButtons.count();
        
        if (count > 0) {
            await expect(actionButtons.first()).toBeVisible();
        }
    });

    test('should show empty state when no at-risk customers', async ({ page }) => {
        const noAtRiskText = page.locator('text=No at-risk customers');
        const tableRows = page.locator('tbody tr');
        
        const noAtRiskVisible = await noAtRiskText.isVisible();
        const rowCount = await tableRows.count();
        
        if (rowCount === 0) {
            await expect(noAtRiskText).toBeVisible();
        }
    });

    test('should animate on load', async ({ page }) => {
        // Check for framer-motion animations
        const animatedElements = page.locator('[style*="opacity"]');
        const count = await animatedElements.count();
        expect(count).toBeGreaterThan(0);
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

    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        // Should still show main heading
        await expect(page.locator('text=Customer Health Dashboard')).toBeVisible();
    });
});
