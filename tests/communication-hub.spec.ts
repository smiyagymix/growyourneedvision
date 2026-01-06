import { test, expect } from '@playwright/test';
import { loginAs, getTestCredentials } from '../src/test/helpers/auth';

test.describe('Communication Hub', () => {
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    const ownerCreds = getTestCredentials('owner');

    // Mock Network Requests
    await page.route('**/api/collections/users/auth-refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          record: {
            id: ownerCreds.id,
            email: ownerCreds.email,
            name: 'Owner User',
            role: ownerCreds.role,
            avatar: ''
          }
        })
      });
    });

    // Mock User Presence Update (Heartbeat)
    await page.route(`**/api/collections/users/records/${ownerCreds.id}`, async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: ownerCreds.id,
            lastActive: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock Notifications
    await page.route('**/api/collections/notifications/records*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 20,
          totalItems: 0,
          totalPages: 1,
          items: []
        })
      });
    });

    // Mock Messages (Email View)
    await page.route('**/api/collections/messages/records*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 20,
          totalItems: 2,
          totalPages: 1,
          items: [
            { id: 'msg1', content: 'Subject: Welcome to the platform\n\nHello...', from: 'system', to: ownerCreds.id, read: false, created: new Date().toISOString() },
            { id: 'msg2', content: 'Subject: Weekly Report\n\nHere is the report...', from: 'analytics', to: ownerCreds.id, read: true, created: new Date().toISOString() }
          ]
        })
      });
    });

    // Mock Social Posts
    await page.route('**/api/collections/social_posts/records*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1,
          items: [
            { id: 'post1', content: 'New feature launch!', platform: 'Twitter', status: 'published', likes: 10, shares: 5, created: new Date().toISOString() }
          ]
        })
      });
    });

    // Mock Community Posts
    await page.route('**/api/collections/posts/records*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          perPage: 20,
          totalItems: 1,
          totalPages: 1,
          items: [
            { id: 'topic1', title: 'Feature Request: Dark Mode', content: 'Please add dark mode...', author: 'user1', likes: 5, tags: ['feature-request'], created: new Date().toISOString(), expand: { author: { name: 'John Doe' } } }
          ]
        })
      });
    });

    // Mock login response
    await page.route('**/api/collections/users/auth-with-password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          record: {
            id: ownerCreds.id,
            email: ownerCreds.email,
            name: 'Owner User',
            role: ownerCreds.role
          }
        })
      });
    });

    // Login as Owner using helper
    await loginAs(page, 'owner');
    await expect(page.locator('.animate-spin')).not.toBeVisible();
  });

  test('should load Communication Hub and display Email View', async ({ page }) => {
    await page.click('text=Communication');
    
    // Wait for module loading
    await expect(page.getByText('Initializing module...')).not.toBeVisible();

    // Check Email View Header
    await expect(page.getByText('Inbox')).toBeVisible();
    
    // Check for mocked messages
    await expect(page.getByText('Welcome to the platform')).toBeVisible();
    await expect(page.getByText('Weekly Report')).toBeVisible();
  });

  test('should navigate to Social Media View', async ({ page }) => {
    await page.click('text=Communication');
    await expect(page.getByText('Initializing module...')).not.toBeVisible();
    
    // Navigate to Social-Media tab
    await expect(page.getByRole('button', { name: 'Social-Media' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Social-Media' }).first().click();
    
    // Check Header
    await expect(page.getByText('Social Media Manager')).toBeVisible();
    
    // Check for mocked post
    await expect(page.getByText('New feature launch!')).toBeVisible();
  });

  test('should navigate to Community View', async ({ page }) => {
    await page.click('text=Communication');
    await expect(page.getByText('Initializing module...')).not.toBeVisible();
    
    // Navigate to Community tab
    await expect(page.getByRole('button', { name: 'Community' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Community' }).first().click();
    
    // Check Header
    await expect(page.getByText('Community Forums')).toBeVisible();
    
    // Check for mocked topic
    await expect(page.getByText('Feature Request: Dark Mode')).toBeVisible();
  });
});
