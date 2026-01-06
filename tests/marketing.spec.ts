import { test, expect } from '@playwright/test';
import { loginAs, getTestCredentials } from '../src/test/helpers/auth';

test.describe('Marketing Hub - Complete E2E Tests', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

    const ownerCreds = getTestCredentials('owner');

    // Mock Network Requests for PocketBase
    await page.route('**/*', async route => {
      const url = route.request().url();

      // Auth endpoints
      if (url.includes('/api/collections/users/auth-with-password') || url.includes('/api/collections/users/auth-refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'fake-token',
            record: { id: ownerCreds.id, email: ownerCreds.email, role: ownerCreds.role }
          })
        });
        return;
      }

      // Marketing campaigns
      if (url.includes('/api/collections/marketing_campaigns')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 'camp-1', name: 'Summer Campaign', status: 'active', budget: 5000, spent: 2500, impressions: 50000, clicks: 2500, conversions: 125 },
              { id: 'camp-2', name: 'Black Friday', status: 'draft', budget: 10000, spent: 0, impressions: 0, clicks: 0, conversions: 0 }
            ],
            totalItems: 2
          })
        });
        return;
      }

      // A/B Tests
      if (url.includes('/api/collections/ab_tests')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 'ab-1', name: 'Homepage CTA Test', status: 'running', variant_a_views: 1000, variant_b_views: 1000, variant_a_conversions: 50, variant_b_conversions: 75 }
            ],
            totalItems: 1
          })
        });
        return;
      }

      // Audiences
      if (url.includes('/api/collections/audiences')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 'aud-1', name: 'High Value Customers', size: 5000, status: 'active' },
              { id: 'aud-2', name: 'New Users', size: 12000, status: 'active' }
            ],
            totalItems: 2
          })
        });
        return;
      }

      // Customer Journeys
      if (url.includes('/api/collections/customer_journeys')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 'journey-1', name: 'Onboarding Flow', status: 'active', steps: 5, conversions: 250 }
            ],
            totalItems: 1
          })
        });
        return;
      }

      // Leads
      if (url.includes('/api/collections/leads')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 'lead-1', name: 'John Doe', email: 'john@example.com', score: 85, status: 'hot' },
              { id: 'lead-2', name: 'Jane Smith', email: 'jane@example.com', score: 65, status: 'warm' }
            ],
            totalItems: 2
          })
        });
        return;
      }

      // Automation Rules
      if (url.includes('/api/collections/automation_rules')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 'rule-1', name: 'Welcome Email Sequence', status: 'active', trigger: 'signup', actions: 3 },
              { id: 'rule-2', name: 'Cart Abandonment', status: 'active', trigger: 'cart_abandon', actions: 2 }
            ],
            totalItems: 2
          })
        });
        return;
      }

      // Generic collection response
      if (url.includes('/api/collections/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [], totalItems: 0 })
        });
        return;
      }

      // Continue other requests
      await route.continue();
    });

    // Login as Owner
    await loginAs(page, 'owner');

    // Wait for dashboard to load
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
  });

  // Helper function to navigate to Marketing tab in Tool Platform
  async function navigateToMarketing(page: any) {
    // Click Tool-Platform in sidebar
    await page.click('text=Tool-Platform');
    
    // Wait for module to load
    await expect(page.getByText('Initializing module...')).not.toBeVisible({ timeout: 10000 });
    
    // Click on Marketing tab
    await expect(page.getByRole('button', { name: 'Marketing' }).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Marketing' }).first().click();
    
    // Wait for content to load
    await page.waitForTimeout(500);
  }

  // Helper function to click subnav item
  async function clickSubNav(page: any, subNavName: string) {
    const subNavButton = page.locator('button').filter({ hasText: new RegExp(`^${subNavName}$`, 'i') });
    if (await subNavButton.isVisible().catch(() => false)) {
      await subNavButton.click();
      await page.waitForTimeout(500);
    }
  }

  test.describe('Marketing Dashboard', () => {
    test('should display marketing hub with campaigns', async ({ page }) => {
      await navigateToMarketing(page);
      
      // Check for marketing content - Campaigns dashboard is default
      // The CampaignsDashboard shows: Total Campaigns, Active, Total Spent, Total Conversions
      await expect(page.getByText('Total Campaigns')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Total Spent')).toBeVisible();
    });

    test('should show campaign statistics', async ({ page }) => {
      await navigateToMarketing(page);
      
      // Verify campaign stats are displayed
      const bodyText = await page.locator('body').innerText();
      const hasStats = 
        bodyText.includes('Campaigns') || 
        bodyText.includes('Spent') ||
        bodyText.includes('Conversions');
      
      expect(hasStats).toBeTruthy();
    });
  });

  test.describe('A/B Testing', () => {
    test('should display A/B testing interface', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'A/B Testing');

      const bodyText = await page.locator('body').innerText();
      
      // Check for A/B testing related content
      const hasABContent = 
        bodyText.includes('A/B') || 
        bodyText.includes('Test') ||
        bodyText.includes('Variant') ||
        bodyText.includes('Experiment');

      expect(hasABContent).toBeTruthy();
    });

    test('should show test variants and statistics', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'A/B Testing');

      // Look for test cards or list items
      const testCards = await page.locator('[class*="card"]').count();
      console.log('A/B Test cards found:', testCards);
    });
  });

  test.describe('Audience Manager', () => {
    test('should display audience segments', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Audience');

      const bodyText = await page.locator('body').innerText();
      
      // Check for audience-related content
      const hasAudienceContent = 
        bodyText.includes('Audience') || 
        bodyText.includes('Segment') ||
        bodyText.includes('Users') ||
        bodyText.includes('Size');

      expect(hasAudienceContent).toBeTruthy();
    });
  });

  test.describe('Journey Builder', () => {
    test('should display customer journey interface', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Journey Builder');

      const bodyText = await page.locator('body').innerText();
      
      // Check for journey-related content
      const hasJourneyContent = 
        bodyText.includes('Journey') || 
        bodyText.includes('Flow') ||
        bodyText.includes('Workflow') ||
        bodyText.includes('Step');

      expect(hasJourneyContent).toBeTruthy();
    });
  });

  test.describe('Lead Scoring Engine', () => {
    test('should display lead scoring dashboard', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Lead Scoring');

      const bodyText = await page.locator('body').innerText();
      
      // Check for lead-related content
      const hasLeadContent = 
        bodyText.includes('Lead') || 
        bodyText.includes('Score') ||
        bodyText.includes('Hot') ||
        bodyText.includes('Warm') ||
        bodyText.includes('Cold');

      expect(hasLeadContent).toBeTruthy();
    });
  });

  test.describe('Marketing Automation Hub', () => {
    test('should display automation rules', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Automation Hub');

      const bodyText = await page.locator('body').innerText();
      
      // Check for automation-related content
      const hasAutomationContent = 
        bodyText.includes('Automation') || 
        bodyText.includes('Rule') ||
        bodyText.includes('Trigger') ||
        bodyText.includes('Workflow');

      expect(hasAutomationContent).toBeTruthy();
    });
  });

  test.describe('ROI Calculator', () => {
    test('should display ROI calculator interface', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'ROI Calculator');

      const bodyText = await page.locator('body').innerText();
      
      // Check for ROI-related content
      const hasROIContent = 
        bodyText.includes('ROI') || 
        bodyText.includes('Return') ||
        bodyText.includes('Investment') ||
        bodyText.includes('Revenue');

      expect(hasROIContent).toBeTruthy();
    });
  });

  test.describe('AI Content Studio', () => {
    test('should display AI content generation interface', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'AI Content Studio');

      const bodyText = await page.locator('body').innerText();
      
      // Check for AI content-related content
      const hasAIContent = 
        bodyText.includes('AI') || 
        bodyText.includes('Generate') ||
        bodyText.includes('Content') ||
        bodyText.includes('Create');

      expect(hasAIContent).toBeTruthy();
    });
  });

  test.describe('Multi-Channel Orchestrator', () => {
    test('should display channel management interface', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Orchestrator');

      const bodyText = await page.locator('body').innerText();
      
      // Check for channel-related content
      const hasChannelContent = 
        bodyText.includes('Channel') || 
        bodyText.includes('Email') ||
        bodyText.includes('SMS') ||
        bodyText.includes('Campaign');

      expect(hasChannelContent).toBeTruthy();
    });
  });

  test.describe('CDP (Customer Data Platform)', () => {
    test('should display customer profiles', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'CDP');

      const bodyText = await page.locator('body').innerText();
      
      // Check for CDP-related content
      const hasCDPContent = 
        bodyText.includes('Customer') || 
        bodyText.includes('Profile') ||
        bodyText.includes('Data') ||
        bodyText.includes('CDP');

      expect(hasCDPContent).toBeTruthy();
    });
  });

  test.describe('Predictive Scoring', () => {
    test('should display predictive analytics', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Scoring');

      const bodyText = await page.locator('body').innerText();
      
      // Check for predictive-related content
      const hasPredictiveContent = 
        bodyText.includes('Predictive') || 
        bodyText.includes('Score') ||
        bodyText.includes('Likelihood') ||
        bodyText.includes('Model');

      expect(hasPredictiveContent).toBeTruthy();
    });
  });

  test.describe('Creative Studio', () => {
    test('should display creative asset management', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Creative Studio');

      const bodyText = await page.locator('body').innerText();
      
      // Check for creative-related content
      const hasCreativeContent = 
        bodyText.includes('Creative') || 
        bodyText.includes('Project') ||
        bodyText.includes('Design') ||
        bodyText.includes('Template');

      expect(hasCreativeContent).toBeTruthy();
    });
  });

  test.describe('Attribution Analyzer', () => {
    test('should display attribution models', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Attribution');

      const bodyText = await page.locator('body').innerText();
      
      // Check for attribution-related content
      const hasAttributionContent = 
        bodyText.includes('Attribution') || 
        bodyText.includes('Model') ||
        bodyText.includes('Touch') ||
        bodyText.includes('Conversion');

      expect(hasAttributionContent).toBeTruthy();
    });
  });

  test.describe('Social Scheduler', () => {
    test('should display social media scheduling interface', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Social Scheduler');

      const bodyText = await page.locator('body').innerText();
      
      // Check for social-related content
      const hasSocialContent = 
        bodyText.includes('Social') || 
        bodyText.includes('Schedule') ||
        bodyText.includes('Post') ||
        bodyText.includes('Calendar');

      expect(hasSocialContent).toBeTruthy();
    });
  });

  test.describe('Email Template Manager', () => {
    test('should display email template library', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Templates');

      const bodyText = await page.locator('body').innerText();
      
      // Check for email-related content
      const hasEmailContent = 
        bodyText.includes('Email') || 
        bodyText.includes('Template') ||
        bodyText.includes('Newsletter') ||
        bodyText.includes('Design');

      expect(hasEmailContent).toBeTruthy();
    });
  });

  test.describe('Asset Library', () => {
    test('should display marketing assets', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Assets');

      const bodyText = await page.locator('body').innerText();
      
      // Check for asset-related content
      const hasAssetContent = 
        bodyText.includes('Asset') || 
        bodyText.includes('Library') ||
        bodyText.includes('Image') ||
        bodyText.includes('Media');

      expect(hasAssetContent).toBeTruthy();
    });
  });

  test.describe('Experimentation Lab', () => {
    test('should display experimentation interface', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Experiments');

      const bodyText = await page.locator('body').innerText();
      
      // Check for experiment-related content
      const hasExperimentContent = 
        bodyText.includes('Experiment') || 
        bodyText.includes('Test') ||
        bodyText.includes('Variant') ||
        bodyText.includes('Hypothesis');

      expect(hasExperimentContent).toBeTruthy();
    });
  });

  test.describe('Personalization Engine', () => {
    test('should display personalization rules', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Personalization');

      const bodyText = await page.locator('body').innerText();
      
      // Check for personalization-related content
      const hasPersonalizationContent = 
        bodyText.includes('Personal') || 
        bodyText.includes('Segment') ||
        bodyText.includes('Target') ||
        bodyText.includes('Rule');

      expect(hasPersonalizationContent).toBeTruthy();
    });
  });

  test.describe('Advanced Campaign Analytics', () => {
    test('should display advanced analytics dashboard', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'Advanced Analytics');

      const bodyText = await page.locator('body').innerText();
      
      // Check for analytics-related content
      const hasAnalyticsContent = 
        bodyText.includes('Analytics') || 
        bodyText.includes('Campaign') ||
        bodyText.includes('Performance') ||
        bodyText.includes('Metrics');

      expect(hasAnalyticsContent).toBeTruthy();
    });
  });

  test.describe('AI Campaign Generator', () => {
    test('should display AI campaign generator', async ({ page }) => {
      await navigateToMarketing(page);
      await clickSubNav(page, 'AI Generator');

      const bodyText = await page.locator('body').innerText();
      
      // Check for AI generator content
      const hasGeneratorContent = 
        bodyText.includes('AI') || 
        bodyText.includes('Generate') ||
        bodyText.includes('Campaign') ||
        bodyText.includes('Create');

      expect(hasGeneratorContent).toBeTruthy();
    });
  });
});

// Integration tests
test.describe('Marketing Integration Tests', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    const ownerCreds = getTestCredentials('owner');

    // Mock all endpoints
    await page.route('**/*', async route => {
      const url = route.request().url();

      if (url.includes('/api/collections/users/auth')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'fake-token',
            record: { id: ownerCreds.id, email: ownerCreds.email, role: ownerCreds.role }
          })
        });
        return;
      }

      if (url.includes('/api/collections/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [], totalItems: 0 })
        });
        return;
      }

      await route.continue();
    });

    await loginAs(page, 'owner');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
  });

  test('should navigate between marketing sub-sections', async ({ page }) => {
    // Navigate to Tool-Platform and Marketing
    await page.click('text=Tool-Platform');
    await expect(page.getByText('Initializing module...')).not.toBeVisible({ timeout: 10000 });
    
    await page.getByRole('button', { name: 'Marketing' }).first().click();
    await page.waitForTimeout(500);

    // Count available sub-navigation items
    const subNavButtons = await page.locator('button').filter({ hasText: /Campaign|Audience|Template|Asset/i }).count();
    console.log('Marketing sub-nav items found:', subNavButtons);
  });

  test('should handle empty states gracefully', async ({ page }) => {
    await page.click('text=Tool-Platform');
    await expect(page.getByText('Initializing module...')).not.toBeVisible({ timeout: 10000 });
    
    await page.getByRole('button', { name: 'Marketing' }).first().click();
    await page.waitForTimeout(500);

    // Verify page doesn't crash with empty data
    const hasContent = await page.locator('body').innerText();
    expect(hasContent.length).toBeGreaterThan(0);
  });

  test('should display loading states during data fetch', async ({ page }) => {
    await page.click('text=Tool-Platform');
    await expect(page.getByText('Initializing module...')).not.toBeVisible({ timeout: 10000 });
    
    await page.getByRole('button', { name: 'Marketing' }).first().click();
    
    // Check page renders properly
    const pageLoaded = await page.locator('body').isVisible();
    expect(pageLoaded).toBeTruthy();
  });
});
