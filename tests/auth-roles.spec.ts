import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Role-Based Authentication
 * Tests real login flows with PocketBase and verifies correct dashboard routing
 */

// Test credentials for each role
// NOTE: These must be provided via environment variables in CI/CD
const TEST_USERS = {
    owner: {
        email: process.env.TEST_OWNER_EMAIL,
        password: process.env.TEST_OWNER_PASSWORD,
        expectedRoute: '/admin',
        role: 'Owner',
    },
    admin: {
        email: process.env.TEST_ADMIN_EMAIL,
        password: process.env.TEST_ADMIN_PASSWORD,
        expectedRoute: '/school-admin',
        role: 'Admin',
    },
    teacher: {
        email: process.env.TEST_TEACHER_EMAIL,
        password: process.env.TEST_TEACHER_PASSWORD,
        expectedRoute: '/teacher',
        role: 'Teacher',
    },
    student: {
        email: process.env.TEST_STUDENT_EMAIL,
        password: process.env.TEST_STUDENT_PASSWORD,
        expectedRoute: '/student',
        role: 'Student',
    },
    parent: {
        email: process.env.TEST_PARENT_EMAIL,
        password: process.env.TEST_PARENT_PASSWORD,
        expectedRoute: '/parent',
        role: 'Parent',
    },
    individual: {
        email: process.env.TEST_INDIVIDUAL_EMAIL,
        password: process.env.TEST_INDIVIDUAL_PASSWORD,
        expectedRoute: '/individual',
        role: 'Individual',
    },
};

/**
 * Helper function to perform login
 */
async function loginAsUser(page: Page, email: string, password: string) {
    // Navigate to login page (HashRouter)
    await page.goto('/#/login', { waitUntil: 'networkidle' });

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });

    // Fill in credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Click login button and wait for navigation
    // We expect the hash to change from #/login to something else (e.g. #/admin)
    await Promise.all([
        page.waitForURL((url: URL) => !url.hash.includes('#/login'), { timeout: 10000 }),
        page.click('button[type="submit"]'),
    ]);

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
}

test.describe('Role-Based Authentication E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any existing session
        await page.context().clearCookies();

        // Capture console logs
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    });

    test('Owner should login and redirect to /admin dashboard', async ({ page }) => {
        const user = TEST_USERS.owner;

        await loginAsUser(page, user.email!, user.password!);

        // Verify we're on the correct dashboard with retry
        await expect(page).toHaveURL(new RegExp(user.expectedRoute));

        // Take screenshot for verification
        await page.screenshot({ path: `playwright-report/${user.role.toLowerCase()}-dashboard.png`, fullPage: true });

        console.log(`✅ ${user.role} redirected to ${page.url()}`);
    });

    test('Admin should login and redirect to /school-admin dashboard', async ({ page }) => {
        const user = TEST_USERS.admin;

        await loginAsUser(page, user.email!, user.password!);

        // Verify we're on the correct dashboard with retry
        await expect(page).toHaveURL(new RegExp(user.expectedRoute));

        // Take screenshot for verification
        await page.screenshot({ path: `playwright-report/${user.role.toLowerCase()}-dashboard.png`, fullPage: true });

        console.log(`✅ ${user.role} redirected to ${page.url()}`);
    });

    test('Teacher should login and redirect to /teacher dashboard', async ({ page }) => {
        const user = TEST_USERS.teacher;

        await loginAsUser(page, user.email!, user.password!);

        // Verify we're on the correct dashboard with retry
        await expect(page).toHaveURL(new RegExp(user.expectedRoute));

        // Take screenshot for verification
        await page.screenshot({ path: `playwright-report/${user.role.toLowerCase()}-dashboard.png`, fullPage: true });

        console.log(`✅ ${user.role} redirected to ${page.url()}`);
    });

    test('Student should login and redirect to /student dashboard', async ({ page }) => {
        const user = TEST_USERS.student;

        await loginAsUser(page, user.email!, user.password!);

        // Verify we're on the correct dashboard with retry
        await expect(page).toHaveURL(new RegExp(user.expectedRoute));

        // Take screenshot for verification
        await page.screenshot({ path: `playwright-report/${user.role.toLowerCase()}-dashboard.png`, fullPage: true });

        console.log(`✅ ${user.role} redirected to ${page.url()}`);
    });

    test('Parent should login and redirect to /parent dashboard', async ({ page }) => {
        const user = TEST_USERS.parent;

        await loginAsUser(page, user.email!, user.password!);

        // Verify we're on the correct dashboard with retry
        await expect(page).toHaveURL(new RegExp(user.expectedRoute));

        // Take screenshot for verification
        await page.screenshot({ path: `playwright-report/${user.role.toLowerCase()}-dashboard.png`, fullPage: true });

        console.log(`✅ ${user.role} redirected to ${page.url()}`);
    });

    test('Individual should login and redirect to /individual dashboard', async ({ page }) => {
        const user = TEST_USERS.individual;

        await loginAsUser(page, user.email!, user.password!);

        // Verify we're on the correct dashboard with retry
        await expect(page).toHaveURL(new RegExp(user.expectedRoute));

        // Take screenshot for verification
        await page.screenshot({ path: `playwright-report/${user.role.toLowerCase()}-dashboard.png`, fullPage: true });

        console.log(`✅ ${user.role} redirected to ${page.url()}`);
    });

    test('Invalid credentials should show error and stay on login page', async ({ page }) => {
        await page.goto('/#/login', { waitUntil: 'networkidle' });

        // Try to login with invalid credentials
        await page.fill('input[type="email"]', 'invalid@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Wait a bit for error to appear
        await page.waitForTimeout(3000);

        // Should still be on login page
        await expect(page).toHaveURL(/.*#\/login/);

        console.log('✅ Invalid credentials correctly stayed on login page');
    });

    test('Unauthenticated user accessing protected route should redirect to login', async ({ page }) => {
        // Try to access a protected route without authentication
        await page.goto('/#/admin');

        // Should be redirected to login
        await page.waitForURL((url) => url.hash.includes('#/login'), { timeout: 5000 });
        await expect(page).toHaveURL(/.*#\/login/);

        console.log('✅ Unauthenticated access correctly redirected to login');
    });
});
