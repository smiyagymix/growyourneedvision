#!/usr/bin/env node

/**
 * PocketBase Collection Setup & Permission Fixer
 * Runs automatically on `pnpm dev` startup
 * Ensures all collections have proper permissions for public read access
 */

import fetch from 'node-fetch';

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://localhost:8090';
const MAX_RETRIES = 10;
const RETRY_DELAY = 1000; // ms

// Collections that need public read access
const PUBLIC_READ_COLLECTIONS = [
  'platform_settings',
  'branding_settings',
  'feature_flags',
  'settings',
  'branding'
];

// Collections that need admin-only access
const ADMIN_ONLY_COLLECTIONS = [
  'ip_rate_limits',
  'ip_violations',
  'audit_logs'
];

/**
 * Wait for PocketBase to be ready
 */
async function waitForPocketBase(retries = MAX_RETRIES) {
  console.log(`\n🔄 Waiting for PocketBase to start (${PB_URL})...`);
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${PB_URL}/api/health`, {
        timeout: 5000
      });
      if (response.ok) {
        console.log('✅ PocketBase is ready!');
        return true;
      }
    } catch (err) {
      if (i < retries - 1) {
        console.log(`   Retry ${i + 1}/${retries} in ${RETRY_DELAY}ms...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
      }
    }
  }
  
  throw new Error('PocketBase failed to start after ' + retries + ' retries');
}

/**
 * Get all collections from PocketBase
 */
async function getCollections() {
  const response = await fetch(`${PB_URL}/api/collections`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch collections: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Update collection permissions
 */
async function updateCollectionPermissions(collectionId, collectionName, isPublic = true) {
  const permissions = isPublic
    ? {
        listRule: null,  // Public read
        viewRule: null,  // Public read
        createRule: '@request.auth.role = "admin"',
        updateRule: '@request.auth.role = "admin"',
        deleteRule: '@request.auth.role = "admin"'
      }
    : {
        listRule: '@request.auth.role = "admin"',
        viewRule: '@request.auth.role = "admin"',
        createRule: '@request.auth.role = "admin"',
        updateRule: '@request.auth.role = "admin"',
        deleteRule: '@request.auth.role = "admin"'
      };

  const response = await fetch(`${PB_URL}/api/collections/${collectionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(permissions)
  });

  if (!response.ok) {
    const error = await response.text();
    console.warn(`   ⚠️  Could not update "${collectionName}": ${error}`);
    return false;
  }

  const access = isPublic ? 'public' : 'admin-only';
  console.log(`   ✅ Updated "${collectionName}" to ${access}`);
  return true;
}

/**
 * Main setup function
 */
async function setupCollections() {
  console.log('\n' + '='.repeat(60));
  console.log('  🔧 PocketBase Collection Setup & Permission Fixer');
  console.log('='.repeat(60));

  try {
    // Wait for PocketBase to be ready
    await waitForPocketBase();

    // Get all collections
    console.log('\n📋 Fetching collections...');
    const collections = await getCollections();
    console.log(`   Found ${collections.length} collections`);

    // Update permissions
    console.log('\n🔐 Updating collection permissions...');
    
    let updated = 0;
    let skipped = 0;

    for (const collection of collections) {
      if (PUBLIC_READ_COLLECTIONS.includes(collection.name)) {
        const result = await updateCollectionPermissions(
          collection.id,
          collection.name,
          true
        );
        if (result) updated++;
        else skipped++;
      } else if (ADMIN_ONLY_COLLECTIONS.includes(collection.name)) {
        const result = await updateCollectionPermissions(
          collection.id,
          collection.name,
          false
        );
        if (result) updated++;
        else skipped++;
      }
    }

    console.log('\n✨ Setup complete!');
    console.log(`   ✅ Updated: ${updated} collections`);
    if (skipped > 0) console.log(`   ⚠️  Skipped: ${skipped} collections`);
    console.log(`\n📊 Total collections: ${collections.length}`);
    console.log(`🔓 Public read access: ${PUBLIC_READ_COLLECTIONS.length} configured`);
    console.log(`🔒 Admin-only access: ${ADMIN_ONLY_COLLECTIONS.length} configured`);
    console.log('\n' + '='.repeat(60));
    console.log('  ✅ All services are ready!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  • Make sure PocketBase is running on ' + PB_URL);
    console.error('  • Check that VITE_POCKETBASE_URL is set correctly');
    console.error('  • Verify PocketBase data directory has read/write permissions');
    process.exit(1);
  }
}

// Run setup
setupCollections().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
