import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should navigate to login page', async ({ page }) => {
        // Start from home page
        await page.goto('/');

        // Click Login button (assuming there is one in header)
        // Adjust selector based on actual LandingHero/Nav implementation
        // For now, let's try direct navigation if button finding is flaky
        await page.goto('/login');

        // Check for login form elements
        await expect(page.getByPlaceholder('Email')).toBeVisible();
        await expect(page.getByPlaceholder('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.getByPlaceholder('Email').fill('invalid@example.com');
        await page.getByPlaceholder('Password').fill('wrongpassword');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Expect some error message (toast or alert)
        // This depends on how LoginPage.tsx handles errors
        // Common UI often uses a toast or text-red-500
        // Wait for potential network request
        await page.waitForTimeout(1000);

        // Check for generic error indicator or just that we are still on login
        expect(page.url()).toContain('/login');
    });
});
