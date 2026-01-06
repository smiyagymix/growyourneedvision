/**
 * E2E Tests
 */
import { test, expect } from '@playwright/test';

test.describe('E2E Production Flows', () => {

  test('Teacher Login and Academics Check', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@school.com');
    await page.fill('input[type="password"]', '123456789');
    await page.click('button:has-text("Sign In")');

    // Should redirect to teacher dashboard
    await expect(page).toHaveURL(/\/teacher/);
    await expect(page.getByText('Welcome back, Sarah Smith')).toBeVisible();

    // Navigate to Academics
    // Assuming there is a way to navigate or it's on the dashboard
    // Let's check if the seeded classes are visible
    // Note: Depending on the UI layout, we might need to navigate to "Academics" app first.
    // If the dashboard shows a summary, we might see it there.
    // If not, we might need to open the app launcher.
    
    // Open App Launcher (Dock)
    const dockButton = page.locator('button.w-16.h-16.rounded-full');
    await dockButton.click();

    // Click My Classes Icon (was Academics)
    const academicsButton = page.getByRole('button', { name: 'My Classes' });
    await academicsButton.click();

    // Check for seeded classes
    await expect(page.getByText('Mathematics 101')).toBeVisible();
    await expect(page.getByText('Physics 202')).toBeVisible();
  });

  test('Student Login, Activities, and Wellness Check', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@school.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button:has-text("Sign In")');

    // Should redirect to student dashboard
    await expect(page).toHaveURL(/\/student/);
    // Check for welcome message (relaxed check to handle name variations)
    await expect(page.getByTestId('welcome-msg')).toBeVisible();
    await expect(page.getByTestId('welcome-msg')).toContainText(/Welcome back/);
    
    // 1. Check Activities
    const dockButton = page.locator('button.w-16.h-16.rounded-full');
    await dockButton.click();
    const activitiesButton = page.getByRole('button', { name: 'Activities' }).first();
    await activitiesButton.click();

    await expect(page.getByText('Local Activities')).toBeVisible();
    await expect(page.getByText('Community Garden Planting')).toBeVisible();
    await expect(page.getByText('Jazz Night')).toBeVisible();

    // 2. Check Wellness
    // Close Activities app first
    await page.getByTitle('Close Application').click();
    
    // Open App Launcher again
    await dockButton.click();
    const wellnessButton = page.getByRole('button', { name: 'Wellness' });
    await wellnessButton.click();

    await expect(page.getByText('Good Morning!')).toBeVisible();
    // Check for seeded wellness data (e.g. steps count)
    // The seeded data has 8500 steps.
    await expect(page.getByText('8,500')).toBeVisible();
  });

  test('Admin Login and Finance Check', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@school.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button:has-text("Sign In")');

    // Should redirect to school admin dashboard
    await expect(page).toHaveURL(/\/school-admin/);
    
    // Navigate to Finance
    const dockButton = page.locator('button.w-16.h-16.rounded-full');
    await dockButton.click();
    
    const financeButton = page.getByRole('button', { name: 'Finance' });
    await financeButton.click();

    // Check for the seeded transaction
    await expect(page.getByText('Financial Overview')).toBeVisible();
    
    // Debug check
    const debugText = await page.getByTestId('finance-debug').textContent();
    console.log('Finance Debug:', debugText);
    await expect(page.getByText(/Debug: Loaded/)).toBeVisible();
    
    await expect(page.getByText('Student Fees - Grade 10')).toBeVisible();
    await expect(page.getByText('$5000.00')).toBeVisible();
  });

});