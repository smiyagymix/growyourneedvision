import { test, expect } from '@playwright/test';

test('Chat persistence (Multiverse Caching)', async ({ page }) => {
  test.setTimeout(60000);
  // 1. Navigate to the test page
  await page.goto('/#/test-chat');

  // 2. Check if the component loaded (look for the header)
  await expect(page.getByText('Debug Page')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Concierge AI')).toBeVisible({ timeout: 10000 });

  // 3. Send a message
  const testMessage = `Test Message ${Date.now()}`;
  await page.getByPlaceholder('Type a command or query...').fill(testMessage);
  await page.getByRole('button').click(); 

  // 4. Verify message appears in the list
  await expect(page.getByText(testMessage)).toBeVisible();

  // 5. Reload the page
  await page.reload({ waitUntil: 'networkidle' });

  // 6. Verify message is still there (Persistence Check)
  await expect(page.getByText(testMessage)).toBeVisible();

  // 7. Verify LocalStorage
  const localStorage = await page.evaluate(() => window.localStorage);
  const keys = Object.keys(localStorage).filter(k => k.startsWith('gyn_multiverse_cache_'));
  expect(keys.length).toBeGreaterThan(0);
  
  const cacheContent = localStorage[keys[0]];
  expect(cacheContent).toContain(testMessage);
});
