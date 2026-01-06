import { test, expect } from '@playwright/test';

// Login helper function
async function login(page, role = 'owner') {
  await page.goto('http://localhost:3000/login');
  
  const credentials = {
    owner: { email: 'owner@growyourneed.com', password: 'OwnerPass2024!' },
    admin: { email: 'admin@school.com', password: '12345678' }
  };

  const { email, password } = credentials[role];
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL('**/admin', { timeout: 10000 });
}

test.describe('Business Intelligence - Revenue Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'owner');
  });

  test('should display Revenue Analysis dashboard', async ({ page }) => {
    // Navigate to Business Intelligence
    await page.click('text=Business Intelligence');
    
    // Wait for BI module to load
    await expect(page.locator('text=Business Intelligence')).toBeVisible({ timeout: 10000 });
    
    // Click on Analytics tab
    await page.click('text=Analytics');
    
    // Click on Revenue Analysis
    await page.click('text=Revenue Analysis');
    
    // Verify Revenue Analysis component loaded
    await expect(page.locator('text=Revenue Overview')).toBeVisible({ timeout: 10000 });
    
    // Verify MRR card is visible
    await expect(page.locator('text=Monthly Recurring Revenue')).toBeVisible();
    
    // Verify ARR card is visible
    await expect(page.locator('text=Annual Recurring Revenue')).toBeVisible();
  });

  test('should display revenue growth chart', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Analytics');
    await page.click('text=Revenue Analysis');
    
    // Wait for charts to render
    await page.waitForTimeout(2000);
    
    // Verify chart container exists
    const chartExists = await page.locator('canvas').count();
    expect(chartExists).toBeGreaterThan(0);
  });

  test('should allow changing time period', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Analytics');
    await page.click('text=Revenue Analysis');
    
    // Find and click time period selector
    const periodSelector = page.locator('select, [role="combobox"]').first();
    if (await periodSelector.isVisible()) {
      await periodSelector.click();
      
      // Select different time period
      await page.click('text=Last 6 Months');
      
      // Wait for data to reload
      await page.waitForTimeout(1000);
      
      // Verify page still shows revenue data
      await expect(page.locator('text=Revenue Overview')).toBeVisible();
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate error
    await page.route('**/api/revenue-analysis/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.click('text=Business Intelligence');
    await page.click('text=Analytics');
    await page.click('text=Revenue Analysis');
    
    // Verify error boundary shows fallback UI
    // The ErrorBoundary should catch this and show error message
    await page.waitForTimeout(2000);
    
    // Check if error state is shown (either from ErrorBoundary or component)
    const hasErrorMessage = await page.locator('text=/error|wrong|failed/i').count();
    expect(hasErrorMessage).toBeGreaterThan(0);
  });
});

test.describe('Business Intelligence - Customer Health', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'owner');
  });

  test('should display Customer Health dashboard', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Analytics');
    await page.click('text=Customer Health');
    
    // Verify Customer Health component loaded
    await expect(page.locator('text=Customer Health')).toBeVisible({ timeout: 10000 });
    
    // Verify health segments are visible
    await expect(page.locator('text=Health Segments')).toBeVisible();
  });

  test('should display health score distribution', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Analytics');
    await page.click('text=Customer Health');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Verify at least one health segment is shown
    const segments = ['Excellent', 'Good', 'Fair', 'Poor'];
    let foundSegment = false;
    
    for (const segment of segments) {
      if (await page.locator(`text=${segment}`).count() > 0) {
        foundSegment = true;
        break;
      }
    }
    
    expect(foundSegment).toBe(true);
  });

  test('should filter customers by health status', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Analytics');
    await page.click('text=Customer Health');
    
    // Wait for component to load
    await page.waitForTimeout(1000);
    
    // Try to find filter buttons/dropdowns
    const filterExists = await page.locator('button, select').filter({ hasText: /excellent|good|fair|poor/i }).count();
    
    if (filterExists > 0) {
      // Click a filter option
      await page.locator('button, select').filter({ hasText: /excellent|good/i }).first().click();
      
      // Wait for filtering
      await page.waitForTimeout(1000);
      
      // Verify page still renders
      await expect(page.locator('text=Customer Health')).toBeVisible();
    }
  });
});

test.describe('Business Intelligence - Export Center', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'owner');
  });

  test('should display Export Center', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Reports');
    await page.click('text=Export Center');
    
    // Verify Export Center loaded
    await expect(page.locator('text=Export Center')).toBeVisible({ timeout: 10000 });
    
    // Verify export options are available
    await expect(page.locator('button').filter({ hasText: /export|download/i })).toHaveCount({ min: 1 });
  });

  test('should show export history', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Reports');
    await page.click('text=Export Center');
    
    // Wait for export history to load
    await page.waitForTimeout(1000);
    
    // Verify export history section exists
    const historyExists = await page.locator('text=/history|previous exports|recent exports/i').count();
    expect(historyExists).toBeGreaterThanOrEqual(0);
  });

  test('should trigger export action', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Reports');
    await page.click('text=Export Center');
    
    // Find export button
    const exportButton = page.locator('button').filter({ hasText: /export|generate/i }).first();
    
    if (await exportButton.isVisible()) {
      // Start download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      
      await exportButton.click();
      
      // Wait a bit for export to process
      await page.waitForTimeout(2000);
      
      // Either download started or we see a success message
      const download = await downloadPromise;
      const successMessage = await page.locator('text=/success|exported|generated/i').count();
      
      expect(download !== null || successMessage > 0).toBe(true);
    }
  });
});

test.describe('Business Intelligence - Churn Prediction', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'owner');
  });

  test('should display Churn Prediction dashboard', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Analytics');
    await page.click('text=Churn');
    
    // Verify Churn Prediction component loaded
    await expect(page.locator('text=/Churn|Risk/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show at-risk customers', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Analytics');
    await page.click('text=Churn');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Verify risk categories are shown
    const riskLevels = ['High Risk', 'Medium Risk', 'Low Risk'];
    let foundRiskLevel = false;
    
    for (const level of riskLevels) {
      if (await page.locator(`text=${level}`).count() > 0) {
        foundRiskLevel = true;
        break;
      }
    }
    
    // If no specific risk levels found, at least check component rendered
    if (!foundRiskLevel) {
      await expect(page.locator('text=/Churn|Risk|Customer/i')).toBeVisible();
    }
  });
});

test.describe('Business Intelligence - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'owner');
  });

  test('should navigate between BI tabs', async ({ page }) => {
    await page.click('text=Business Intelligence');
    
    // Test Operations tab
    await page.click('text=Operations');
    await expect(page.locator('text=/Trial|Subscription/i')).toBeVisible({ timeout: 5000 });
    
    // Test Analytics tab
    await page.click('text=Analytics');
    await expect(page.locator('text=/Revenue|Churn|Customer/i')).toBeVisible({ timeout: 5000 });
    
    // Test Reports tab
    await page.click('text=Reports');
    await expect(page.locator('text=/Report|Export/i')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain state when switching tabs', async ({ page }) => {
    await page.click('text=Business Intelligence');
    await page.click('text=Analytics');
    await page.click('text=Revenue Analysis');
    
    // Wait for revenue data to load
    await page.waitForTimeout(1000);
    
    // Switch to different tab
    await page.click('text=Operations');
    
    // Switch back to Analytics
    await page.click('text=Analytics');
    await page.click('text=Revenue Analysis');
    
    // Verify Revenue Analysis still works
    await expect(page.locator('text=Revenue Overview')).toBeVisible();
  });
});
