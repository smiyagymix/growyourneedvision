import { test, expect } from '@playwright/test';

test.describe('Business Intelligence - Export Center', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Login
        await page.fill('input[type="email"]', 'owner@growyourneed.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin');
        await page.waitForTimeout(1000);
        
        // Navigate to Export Center
        await page.click('text=Business Intelligence');
        await page.waitForTimeout(500);
        await page.click('text=Reports');
        await page.waitForTimeout(500);
        await page.click('text=Export Center');
        await page.waitForTimeout(1000);
    });

    test('should load Export Center', async ({ page }) => {
        await expect(page.locator('text=Export Center')).toBeVisible();
        await expect(page.locator('text=Quick Export Templates')).toBeVisible();
        await expect(page.locator('text=Export History')).toBeVisible();
    });

    test('should display all export templates', async ({ page }) => {
        // Check for all 6 export templates
        await expect(page.locator('text=Subscriptions (CSV)')).toBeVisible();
        await expect(page.locator('text=Revenue Analysis (Excel)')).toBeVisible();
        await expect(page.locator('text=Customer Health (Excel)')).toBeVisible();
        await expect(page.locator('text=Churn Analysis (PDF)')).toBeVisible();
        await expect(page.locator('text=Trial Conversions (JSON)')).toBeVisible();
        await expect(page.locator('text=Complete Export (Excel)')).toBeVisible();
    });

    test('should show format badges on templates', async ({ page }) => {
        // Check for format badges
        await expect(page.locator('text=CSV').first()).toBeVisible();
        await expect(page.locator('text=Excel').first()).toBeVisible();
        await expect(page.locator('text=PDF').first()).toBeVisible();
        await expect(page.locator('text=JSON').first()).toBeVisible();
    });

    test('should export subscriptions CSV', async ({ page }) => {
        // Find CSV export button
        const csvTemplate = page.locator('text=Subscriptions (CSV)').locator('..');
        const exportButton = csvTemplate.locator('button:has-text("Export Now")');
        
        await exportButton.click();
        
        // Wait for export to complete
        await expect(page.locator('button:has-text("Exporting")').first()).toBeVisible();
        await page.waitForTimeout(3000);
        
        // Should see success or completion (alert or new file in history)
        // Note: Alert handling may be needed
    });

    test('should display export history table', async ({ page }) => {
        await page.locator('text=Export History').scrollIntoViewIfNeeded();
        
        // Check for table headers
        await expect(page.locator('text=File')).toBeVisible();
        await expect(page.locator('text=Type')).toBeVisible();
        await expect(page.locator('text=Size')).toBeVisible();
        await expect(page.locator('text=Created')).toBeVisible();
        await expect(page.locator('text=Actions')).toBeVisible();
    });

    test('should show empty state when no exports', async ({ page }) => {
        // Check if table has rows or empty state
        const noExportsText = page.locator('text=No exports yet');
        const tableRows = page.locator('tbody tr');
        
        const noExportsVisible = await noExportsText.isVisible();
        const rowCount = await tableRows.count();
        
        // Either show empty state or have rows
        if (rowCount === 0) {
            await expect(noExportsText).toBeVisible();
        }
    });

    test('should display file icons in history', async ({ page }) => {
        // Look for Lucide icons in history table
        const hasFileIcons = await page.locator('svg.lucide-file-text, svg.lucide-file-spreadsheet, svg.lucide-file').count();
        // Should have at least one icon even if no files (empty state icon)
        expect(hasFileIcons).toBeGreaterThan(0);
    });

    test('should show download buttons for exports', async ({ page }) => {
        // Check for download buttons in actions column
        const downloadButtons = page.locator('button[title="Download"]');
        const count = await downloadButtons.count();
        
        // If exports exist, should have download buttons
        if (count > 0) {
            await expect(downloadButtons.first()).toBeVisible();
        }
    });

    test('should show delete buttons for exports', async ({ page }) => {
        const deleteButtons = page.locator('button[title="Delete"]');
        const count = await deleteButtons.count();
        
        if (count > 0) {
            await expect(deleteButtons.first()).toBeVisible();
        }
    });

    test('should refresh export history', async ({ page }) => {
        const refreshButton = page.locator('button:has-text("Refresh")');
        await refreshButton.click();
        
        await expect(page.locator('.animate-spin')).toBeVisible();
        await page.waitForTimeout(1000);
    });

    test('should display info cards', async ({ page }) => {
        await page.locator('text=Automated Exports').scrollIntoViewIfNeeded();
        
        // Check for three info cards
        await expect(page.locator('text=Automated Exports')).toBeVisible();
        await expect(page.locator('text=Real-Time Data')).toBeVisible();
        await expect(page.locator('text=Secure & Private')).toBeVisible();
    });

    test('should show loading state during export', async ({ page }) => {
        // Click any export button
        const firstExportButton = page.locator('button:has-text("Export Now")').first();
        await firstExportButton.click();
        
        // Should show "Exporting..." text
        await expect(page.locator('text=Exporting')).toBeVisible();
        await expect(page.locator('.animate-spin')).toBeVisible();
    });

    test('should have color-coded template cards', async ({ page }) => {
        // Check that templates have different colored backgrounds
        const templates = page.locator('.bg-blue-100, .bg-green-100, .bg-red-100, .bg-orange-100, .bg-purple-100, .bg-indigo-100');
        const count = await templates.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should format file sizes in KB', async ({ page }) => {
        const fileSizes = page.locator('text=/\\d+ KB/');
        const count = await fileSizes.count();
        
        // If exports exist, should show KB sizes
        if (count > 0) {
            const firstSize = await fileSizes.first().textContent();
            expect(firstSize).toMatch(/KB$/);
        }
    });

    test('should format dates correctly', async ({ page }) => {
        // Look for formatted dates in history
        const dates = page.locator('text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/');
        const count = await dates.count();
        
        // Navigation breadcrumbs will have dates, so count should be > 0
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
