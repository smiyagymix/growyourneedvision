import { test, expect } from '@playwright/test';

test.describe('Theme Switcher Functionality', () => {
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    
    // 1. Login as Owner
    console.log('Navigating to login...');
    await page.goto('/#/login');
    
    console.log('Filling credentials...');
    await page.fill('input[type="email"]', 'owner@growyourneed.com');
    await page.fill('input[type="password"]', 'Darnag123456789@');
    
    console.log('Clicking Sign In...');
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to Admin Dashboard
    console.log('Waiting for redirect...');
    await page.waitForURL(/.*\/admin/, { timeout: 60000 });
    console.log('Redirected to Admin Dashboard');
    
    // Wait for the dashboard content to load
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
    // Dashboard loaded - checking for admin dashboard content
    await expect(page.locator('[data-testid="owner-dashboard"]')).toBeVisible({ timeout: 15000 });
    
    // Set viewport to ensure elements are visible
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should switch between Light, Dark, and System themes', async ({ page }) => {
    // 1. Navigate to Platform Settings
    console.log('Navigating to Platform Settings...');
    // The sidebar might be collapsed or expanded. We look for the button with the label "Platform Settings"
    // Depending on sidebar implementation, it might be an icon or text.
    // Let's try to find it by text first, assuming sidebar is expanded or has tooltips/text.
    // If sidebar is collapsed, we might need to expand it or click the icon.
    // Based on AdminPanelPage, sidebarExpanded is from context.
    
    // Let's try to click the sidebar item.
    // The sidebar items are rendered in OwnerSidebarRight.
    // We can look for the text "Platform Settings" or the icon.
    // Let's try text first.
    const settingsLink = page.getByText('Platform Settings');
    if (await settingsLink.isVisible()) {
        await settingsLink.click();
    } else {
        // If text is not visible, maybe sidebar is collapsed.
        // Try to find by icon or aria-label if available.
        // Or expand sidebar.
        // Let's assume for now we can find it or click the expand button.
        // Let's try to click the expand button if settings is not visible.
        const expandButton = page.locator('button[aria-label="Toggle Sidebar"]'); // Hypothetical
        if (await expandButton.isVisible()) {
             await expandButton.click();
             await expect(page.getByText('Platform Settings')).toBeVisible();
             await page.getByText('Platform Settings').click();
        } else {
             // Fallback: try to find by icon title or similar?
             // Actually, let's just try to click the element that contains "Platform Settings" text, 
             // forcing it if it's hidden? No, Playwright checks visibility.
             
             // Let's look at OwnerSidebarRight implementation if this fails.
             // For now, let's assume it works or use a more robust selector if needed.
             // We can also try to click the icon if we know the icon name/class.
             // But let's stick to text for now.
             await page.getByText('Platform Settings').click();
        }
    }

    // 2. Verify we are on Platform Settings page
    await expect(page.getByText('Platform Settings')).toBeVisible();
    
    // 3. Switch to Appearance Tab
    console.log('Switching to Appearance tab...');
    await page.click('button:has-text("Appearance")');
    
    // 4. Verify Theme Preferences section
    await expect(page.getByText('Theme Preference')).toBeVisible();
    
    // 5. Test Dark Mode
    console.log('Testing Dark Mode...');
    const darkButton = page.getByRole('button', { name: 'Dark' });
    await darkButton.click();
    
    // Verify HTML class
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Verify button state (optional, e.g. ring/border)
    // The active button usually has a ring or specific border color.
    // We can check if the "Dark" button has the active styles.
    // Based on implementation: border-gyn-blue-medium
    await expect(darkButton).toHaveClass(/border-gyn-blue-medium/);

    // 6. Test Light Mode
    console.log('Testing Light Mode...');
    const lightButton = page.getByRole('button', { name: 'Light' });
    await lightButton.click();
    
    // Verify HTML class (should NOT have dark)
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(lightButton).toHaveClass(/border-gyn-blue-medium/);

    // 7. Test System Mode
    console.log('Testing System Mode...');
    const systemButton = page.getByRole('button', { name: 'System' });
    await systemButton.click();
    
    // Verify button active
    await expect(systemButton).toHaveClass(/border-gyn-blue-medium/);
    
    // We can't easily test the actual system preference without emulating it.
    // Playwright allows emulating media features.
    
    // Emulate dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    // Should be dark now
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Emulate light mode preference
    await page.emulateMedia({ colorScheme: 'light' });
    // Should be light now
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
  });
});
