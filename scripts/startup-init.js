#!/usr/bin/env node

/**
 * Startup Initialization
 * Runs before all services to ensure PocketBase is properly configured
 */

import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const pbUrl = process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const maxRetries = 10;
const retryDelay = 1000; // 1 second

async function waitForPocketBase() {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const response = await fetch(`${pbUrl}/api/health`);
      if (response.ok) {
        console.log('✅ PocketBase is ready\n');
        return true;
      }
    } catch (err) {
      // PocketBase not ready yet
    }
    attempts++;
    if (attempts < maxRetries) {
      process.stdout.write(`⏳ Waiting for PocketBase (${attempts}/${maxRetries})...\r`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  console.warn('⚠️  PocketBase not responding after retries');
  return false;
}

async function initializeCollections() {
  console.log('🔧 Initializing PocketBase collections...\n');

  const publicCollections = [
    'platform_settings',
    'branding_settings', 
    'feature_flags',
    'settings',
    'branding',
    'help_articles',
    'faqs'
  ];

  const adminOnlyCollections = [
    'ip_rate_limits',
    'ip_violations',
    'audit_logs'
  ];

  try {
    // Get all collections
    const res = await fetch(`${pbUrl}/api/collections`);
    if (!res.ok) {
      console.warn('⚠️  Could not fetch collections:', res.status);
      return;
    }
    
    const data = await res.json();
    
    // Handle both array and paginated responses
    let allCollections = [];
    if (Array.isArray(data)) {
      allCollections = data;
    } else if (data.items && Array.isArray(data.items)) {
      allCollections = data.items;
    } else if (typeof data === 'object') {
      // Single response object, convert to array
      allCollections = [data];
    } else {
      console.warn('⚠️  Unexpected API response format');
      return;
    }

    if (!allCollections.length) {
      console.log('ℹ️  No collections found to initialize');
      return;
    }

    const existingNames = allCollections.map(c => c.name).filter(n => n);

    // Create platform_settings if it doesn't exist
    if (!existingNames.includes('platform_settings')) {
      console.log('📝 Creating platform_settings collection...');
      try {
        await fetch(`${pbUrl}/api/collections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'platform_settings',
            type: 'base',
            schema: [
              { name: 'category', type: 'text', required: true },
              { name: 'key', type: 'text', required: true },
              { name: 'value', type: 'text', required: false },
              { name: 'description', type: 'text', required: false }
            ],
            listRule: null,
            viewRule: null,
            createRule: '@request.auth.role = "admin"',
            updateRule: '@request.auth.role = "admin"',
            deleteRule: '@request.auth.role = "admin"'
          })
        });
        console.log('✅ Created platform_settings collection');
      } catch (err) {
        console.warn('⚠️  Could not create platform_settings:', err.message);
      }
    }

    // Fix permissions for all public read collections
    let publicCount = 0;
    let adminCount = 0;

    for (const collection of allCollections) {
      if (!collection.id || !collection.name) continue;

      if (publicCollections.includes(collection.name)) {
        try {
          await fetch(`${pbUrl}/api/collections/${collection.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listRule: null,
              viewRule: null,
              createRule: '@request.auth.role = "admin"',
              updateRule: '@request.auth.role = "admin"',
              deleteRule: '@request.auth.role = "admin"'
            })
          });
          console.log(`✅ ${collection.name}: public read enabled`);
          publicCount++;
        } catch (err) {
          // Ignore errors - may not have permissions or already correct
        }
      } else if (adminOnlyCollections.includes(collection.name)) {
        try {
          await fetch(`${pbUrl}/api/collections/${collection.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listRule: '@request.auth.role = "admin"',
              viewRule: '@request.auth.role = "admin"',
              createRule: '@request.auth.role = "admin"',
              updateRule: '@request.auth.role = "admin"',
              deleteRule: '@request.auth.role = "admin"'
            })
          });
          console.log(`✅ ${collection.name}: admin-only access enabled`);
          adminCount++;
        } catch (err) {
          // Ignore errors
        }
      }
    }

    if (publicCount > 0 || adminCount > 0) {
      console.log(`\n📊 Permissions updated: ${publicCount} public + ${adminCount} admin-only`);
    }
  } catch (err) {
    console.warn('⚠️  Collection initialization warning:', err.message);
  }
}

async function main() {
  console.log('🚀 Initializing Grow Your Need Platform\n');
  console.log('=' .repeat(50) + '\n');

  // Wait for PocketBase
  const pbReady = await waitForPocketBase();
  
  if (pbReady) {
    await initializeCollections();
  }

  console.log('=' .repeat(50));
  console.log('✅ Initialization complete - Services ready!\n');
}

main().catch(err => {
  console.error('❌ Initialization error:', err);
  process.exit(1);
});
