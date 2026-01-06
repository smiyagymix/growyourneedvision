import { test, expect } from '@playwright/test';
import { loginAs, getTestCredentials } from '../src/test/helpers/auth';

test.describe('Concierge AI', () => {
  test.setTimeout(60000);
  
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

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

    // Mock Chat Messages
    await page.route('**/api/collections/chat_messages/records*', async route => {
      if (route.request().method() === 'POST') {
        // Mock sending a message
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'msg_new_' + Date.now(),
            role: postData.role,
            content: postData.content,
            user: ownerCreds.id,
            created: new Date().toISOString()
          })
        });
      } else {
        // Mock listing messages
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            page: 1,
            perPage: 50,
            totalItems: 0,
            totalPages: 0,
            items: []
          })
        });
      }
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

  test('should load Concierge AI module and handle chat', async ({ page }) => {
    // Navigate to Concierge AI by clicking the sidebar button
    // The sidebar uses buttons, not links. We look for the button containing the text "Concierge AI"
    await page.click('button:has-text("Concierge AI")');
    
    // Wait for module to load (handle lazy loading)
    // await page.waitForLoadState('networkidle');

    // Check for the main heading
    await expect(page.getByRole('heading', { name: 'Concierge AI', level: 1 })).toBeVisible({ timeout: 30000 });

    // DEBUG: Print HTML
    // console.log(await page.content());

    // Check for the chat input
    const chatInput = page.getByPlaceholder('Ask Concierge AI...');
    await expect(chatInput).toBeVisible();

    // Send a message
    await chatInput.fill('Hello AI');
    await page.keyboard.press('Enter');

    // Verify message appears in the chat (optimistic update)
    await expect(page.getByText('Hello AI')).toBeVisible();
  });

  test('should navigate to Analytics tab', async ({ page }) => {
    await page.click('button:has-text("Concierge AI")');
    // await page.waitForLoadState('networkidle');

    // Click on Analytics tab
    await page.click('button:has-text("Analytics")');
    
    // Verify Analytics content
    await expect(page.getByText('Usage Trends')).toBeVisible();
  });
});
