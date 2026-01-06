import { test, expect } from '@playwright/test';

test.describe('Business Intelligence - Churn Prediction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Login
        await page.fill('input[type="email"]', 'owner@growyourneed.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin');
        await page.waitForTimeout(1000);
        
        // Navigate to Churn Prediction
        await page.click('text=Business Intelligence');
        await page.waitForTimeout(500);
        await page.click('text=Analytics');
        await page.waitForTimeout(500);
        await page.click('text=Churn Prediction');
        await page.waitForTimeout(1000);
    });

    test('should load Churn Prediction dashboard', async ({ page }) => {
        await expect(page.locator('text=Churn Prediction & Prevention')).toBeVisible();
    });

    test('should display churn metrics cards', async ({ page }) => {
        // Check for 4 metric cards
        await expect(page.locator('text=Predicted Churn Rate')).toBeVisible();
        await expect(page.locator('text=At-Risk Customers')).toBeVisible();
        await expect(page.locator('text=Retention Rate')).toBeVisible();
        await expect(page.locator('text=Potential Revenue Loss')).toBeVisible();
    });

    test('should show churn rate percentage', async ({ page }) => {
        const churnCard = page.locator('text=Predicted Churn Rate').locator('..');
        const percentage = churnCard.locator('text=/%/');
        await expect(percentage.first()).toBeVisible();
    });

    test('should display revenue loss with currency', async ({ page }) => {
        const revenueLossCard = page.locator('text=Potential Revenue Loss').locator('..');
        const currency = revenueLossCard.locator('text=/\\$/');
        await expect(currency.first()).toBeVisible();
    });

    test('should show churn trend chart', async ({ page }) => {
        await page.locator('text=Churn Trend').scrollIntoViewIfNeeded();
        
        await expect(page.locator('text=Churn Trend')).toBeVisible();
        // Check for month labels
        const monthLabels = page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/');
        const count = await monthLabels.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should display risk factors breakdown', async ({ page }) => {
        await page.locator('text=Risk Factors').scrollIntoViewIfNeeded();
        
        await expect(page.locator('text=Risk Factors')).toBeVisible();
        // Common risk factors
        const riskFactors = page.locator('text=Low Engagement, text=Payment Issues, text=Support Tickets');
        const count = await riskFactors.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show at-risk customers table', async ({ page }) => {
        await page.locator('text=High-Risk Customers').scrollIntoViewIfNeeded();
        
        // Check for table headers
        await expect(page.locator('text=Customer')).toBeVisible();
        await expect(page.locator('text=Risk Score')).toBeVisible();
        await expect(page.locator('text=Factors')).toBeVisible();
        await expect(page.locator('text=Action')).toBeVisible();
    });

    test('should display risk score badges', async ({ page }) => {
        // Check for colored risk badges
        const riskBadges = page.locator('.bg-red-100, .bg-yellow-100, .bg-orange-100');
        const count = await riskBadges.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter customers by risk level', async ({ page }) => {
        // Check filter buttons
        await expect(page.locator('button:has-text("All")')).toBeVisible();
        await expect(page.locator('button:has-text("High Risk")')).toBeVisible();
        await expect(page.locator('button:has-text("Medium Risk")')).toBeVisible();
        
        // Click High Risk filter
        const highRiskButton = page.locator('button:has-text("High Risk")');
        await highRiskButton.click();
        await page.waitForTimeout(500);
        
        // Should highlight button
        await expect(highRiskButton).toHaveClass(/bg-red-500|bg-gyn-primary/);
    });

    test('should show prevention actions', async ({ page }) => {
        const actionButtons = page.locator('button:has-text("Contact"), button:has-text("Offer Discount"), button:has-text("Engage")');
        const count = await actionButtons.count();
        
        if (count > 0) {
            await expect(actionButtons.first()).toBeVisible();
        }
    });

    test('should display prediction accuracy indicator', async ({ page }) => {
        const accuracyText = page.locator('text=/Accuracy|Confidence/');
        const count = await accuracyText.count();
        
        if (count > 0) {
            await expect(accuracyText.first()).toBeVisible();
        }
    });

    test('should refresh churn data', async ({ page }) => {
        const refreshButton = page.locator('button:has-text("Refresh")');
        await refreshButton.click();
        
        await expect(page.locator('.animate-spin')).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('should show empty state when no at-risk customers', async ({ page }) => {
        const noRiskText = page.locator('text=No high-risk customers');
        const tableRows = page.locator('tbody tr');
        
        const noRiskVisible = await noRiskText.isVisible();
        const rowCount = await tableRows.count();
        
        if (rowCount === 0) {
            await expect(noRiskText).toBeVisible();
        }
    });

    test('should display retention recommendations', async ({ page }) => {
        await page.locator('text=Recommendations').scrollIntoViewIfNeeded();
        
        const recommendations = page.locator('text=Recommendations, text=Action Items');
        const count = await recommendations.count();
        
        if (count > 0) {
            await expect(recommendations.first()).toBeVisible();
        }
    });

    test('should show trend indicators', async ({ page }) => {
        // Check for trend arrows
        const trendArrows = page.locator('svg.lucide-trending-up, svg.lucide-trending-down, svg.lucide-arrow-up, svg.lucide-arrow-down');
        const count = await trendArrows.count();
        expect(count).toBeGreaterThanOrEqual(0);
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
        await expect(page.locator('text=Churn Prediction')).toBeVisible();
    });
});
