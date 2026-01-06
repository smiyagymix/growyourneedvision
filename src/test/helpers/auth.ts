/**
 * Test Authentication Helpers
 * Provides utilities for authenticating users in tests
 */

import { Page } from '@playwright/test';

// Load test credentials from environment variables
const TEST_CREDENTIALS = {
  owner: {
    email: process.env.TEST_OWNER_EMAIL || 'owner@test.local',
    password: process.env.TEST_OWNER_PASSWORD || 'TestSecure2024!K9mP#vL8qR@nX5wY',
    role: 'Owner',
    id: 'owner123'
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.local',
    password: process.env.TEST_ADMIN_PASSWORD || 'TestAdmin2024!H7jN#pM3sQ@tW6xZ',
    role: 'Admin',
    id: 'admin123'
  },
  teacher: {
    email: process.env.TEST_TEACHER_EMAIL || 'teacher@test.local',
    password: process.env.TEST_TEACHER_PASSWORD || 'TestTeacher2024!F5kL#nP9rT@uV2yA',
    role: 'Teacher',
    id: 'teacher123'
  },
  student: {
    email: process.env.TEST_STUDENT_EMAIL || 'student@test.local',
    password: process.env.TEST_STUDENT_PASSWORD || 'TestStudent2024!D3hJ#mN7qS@vX4zB',
    role: 'Student',
    id: 'student123'
  },
  parent: {
    email: process.env.TEST_PARENT_EMAIL || 'parent@test.local',
    password: process.env.TEST_PARENT_PASSWORD || 'TestParent2024!C1gK#lM5pR@wY8aE',
    role: 'Parent',
    id: 'parent123'
  }
};

export type UserRole = keyof typeof TEST_CREDENTIALS;

/**
 * Login helper function
 * @param page - Playwright page object
 * @param role - User role to login as
 */
export async function loginAs(page: Page, role: UserRole = 'owner') {
  const credentials = TEST_CREDENTIALS[role];
  
  // Navigate to login page
  await page.goto('/#/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  
  // Fill in credentials
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  
  // Click sign in button
  await page.click('button:has-text("Sign In")');
  
  // Wait for navigation to complete
  await page.waitForURL(/\/#\/(dashboard|owner|admin|teacher|student|parent)/, { timeout: 10000 });
  
  return credentials;
}

/**
 * Mock PocketBase authentication for the given role
 * @param page - Playwright page object
 * @param role - User role to mock
 */
export async function mockPocketBaseAuth(page: Page, role: UserRole = 'owner') {
  const credentials = TEST_CREDENTIALS[role];
  
  await page.addInitScript((mockData) => {
    // Mock PocketBase client
    (window as any).mockPocketBaseAuth = {
      model: {
        id: mockData.id,
        email: mockData.email,
        name: `${mockData.role} User`,
        role: mockData.role,
        verified: true
      },
      token: 'mock-jwt-token-' + mockData.id,
      isValid: true
    };
    
    // Override localStorage
    localStorage.setItem('pocketbase_auth', JSON.stringify({
      token: 'mock-jwt-token-' + mockData.id,
      model: {
        id: mockData.id,
        email: mockData.email,
        name: `${mockData.role} User`,
        role: mockData.role,
        verified: true
      }
    }));
  }, credentials);
}

/**
 * Get test credentials for a specific role
 * @param role - User role
 */
export function getTestCredentials(role: UserRole = 'owner') {
  return TEST_CREDENTIALS[role];
}

/**
 * Logout helper function
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Try to find and click logout button
  try {
    await page.click('button:has-text("Logout")', { timeout: 2000 });
  } catch {
    // If logout button not found, clear storage and navigate to login
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/#/login');
  }
}

/**
 * Check if user is authenticated
 * @param page - Playwright page object
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const auth = localStorage.getItem('pocketbase_auth');
    return !!auth;
  });
}

/**
 * Get current user from page context
 * @param page - Playwright page object
 */
export async function getCurrentUser(page: Page) {
  return await page.evaluate(() => {
    const auth = localStorage.getItem('pocketbase_auth');
    if (!auth) return null;
    try {
      return JSON.parse(auth).model;
    } catch {
      return null;
    }
  });
}

/**
 * Wait for authentication to complete
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds
 */
export async function waitForAuth(page: Page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      const auth = localStorage.getItem('pocketbase_auth');
      return !!auth;
    },
    { timeout }
  );
}

/**
 * Setup test environment with mocked authentication
 * @param page - Playwright page object
 * @param role - User role to setup
 */
export async function setupTestAuth(page: Page, role: UserRole = 'owner') {
  await mockPocketBaseAuth(page, role);
  await page.goto('/#/dashboard');
  await waitForAuth(page);
}
