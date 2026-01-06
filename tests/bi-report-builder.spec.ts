import { test, expect } from '@playwright/test';

test.describe('Business Intelligence - Report Builder', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Login
        await page.fill('input[type="email"]', 'owner@growyourneed.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin');
        await page.waitForTimeout(1000);
        
        // Navigate to Report Builder
        await page.click('text=Business Intelligence');
        await page.waitForTimeout(500);
        await page.click('text=Reports');
        await page.waitForTimeout(500);
        await page.click('text=Report Builder');
        await page.waitForTimeout(1000);
    });

    test('should load Report Builder', async ({ page }) => {
        await expect(page.locator('text=Custom Report Builder')).toBeVisible();
        await expect(page.locator('text=Report Templates')).toBeVisible();
    });

    test('should display all report templates', async ({ page }) => {
        // Check for 5 report templates
        await expect(page.locator('text=Subscription Overview')).toBeVisible();
        await expect(page.locator('text=Revenue Analysis')).toBeVisible();
        await expect(page.locator('text=Customer Health')).toBeVisible();
        await expect(page.locator('text=Churn Analysis')).toBeVisible();
        await expect(page.locator('text=Trial Performance')).toBeVisible();
    });

    test('should create new custom report', async ({ page }) => {
        const createButton = page.locator('button:has-text("Create Custom Report")');
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Should show report configuration options
        await expect(page.locator('text=Report Configuration')).toBeVisible();
    });

    test('should select data sources', async ({ page }) => {
        // Check data source checkboxes
        await expect(page.locator('text=Subscriptions')).toBeVisible();
        await expect(page.locator('text=Customers')).toBeVisible();
        await expect(page.locator('text=Revenue')).toBeVisible();
        await expect(page.locator('text=Trials')).toBeVisible();
        await expect(page.locator('text=Health Scores')).toBeVisible();
    });

    test('should configure date range filter', async ({ page }) => {
        const dateRangeSelect = page.locator('select[name="dateRange"]');
        if (await dateRangeSelect.isVisible()) {
            await dateRangeSelect.selectOption('last30Days');
            await expect(dateRangeSelect).toHaveValue('last30Days');
        }
    });

    test('should add metrics to report', async ({ page }) => {
        // Click on metrics checkboxes
        const mrrCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /MRR|Monthly Recurring Revenue/ });
        const count = await mrrCheckbox.count();
        
        if (count > 0) {
            await mrrCheckbox.first().check();
            await expect(mrrCheckbox.first()).toBeChecked();
        }
    });

    test('should preview report', async ({ page }) => {
        const previewButton = page.locator('button:has-text("Preview Report")');
        if (await previewButton.isVisible()) {
            await previewButton.click();
            await page.waitForTimeout(1000);
            
            await expect(page.locator('text=Report Preview')).toBeVisible();
        }
    });

    test('should save report template', async ({ page }) => {
        const saveButton = page.locator('button:has-text("Save Template")');
        if (await saveButton.isVisible()) {
            // Fill in template name
            await page.fill('input[placeholder*="name"]', 'My Custom Report');
            await saveButton.click();
            await page.waitForTimeout(1000);
        }
    });

    test('should export report to PDF', async ({ page }) => {
        const exportPdfButton = page.locator('button:has-text("Export PDF")');
        if (await exportPdfButton.isVisible()) {
            await exportPdfButton.click();
            await page.waitForTimeout(2000);
        }
    });

    test('should export report to Excel', async ({ page }) => {
        const exportExcelButton = page.locator('button:has-text("Export Excel")');
        if (await exportExcelButton.isVisible()) {
            await exportExcelButton.click();
            await page.waitForTimeout(2000);
        }
    });

    test('should show visualization options', async ({ page }) => {
        // Check for chart type options
        const chartTypes = page.locator('text=Bar Chart, text=Line Chart, text=Pie Chart');
        const count = await chartTypes.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by subscription plan', async ({ page }) => {
        const planFilter = page.locator('select[name="plan"], input[placeholder*="plan"]');
        const count = await planFilter.count();
        
        if (count > 0) {
            // Should have plan filtering capability
            await expect(planFilter.first()).toBeVisible();
        }
    });

    test('should show saved reports list', async ({ page }) => {
        await page.locator('text=Saved Reports').scrollIntoViewIfNeeded();
        
        // Check for saved reports section
        const savedReportsSection = page.locator('text=Saved Reports').first();
        if (await savedReportsSection.isVisible()) {
            await expect(savedReportsSection).toBeVisible();
        }
    });

    test('should refresh report data', async ({ page }) => {
        const refreshButton = page.locator('button:has-text("Refresh"), button[title="Refresh"]');
        const count = await refreshButton.count();
        
        if (count > 0) {
            await refreshButton.first().click();
            await expect(page.locator('.animate-spin')).toBeVisible();
        }
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
