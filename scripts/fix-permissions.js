#!/usr/bin/env node

/**
 * Fix PocketBase Collection Permissions
 * Updates collection rules to allow public read access
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Authenticate as admin (using service token or admin credentials)
async function fixPermissions() {
  try {
    console.log('🔐 Fixing PocketBase collection permissions...\n');

    // Get all collections
    const collections = await pb.collections.getFullList();
    console.log(`Found ${collections.length} collections\n`);

    // Collections that need public read access
    const publicReadCollections = [
      'platform_settings',
      'feature_flags',
      'settings',
      'branding'
    ];

    for (const collection of collections) {
      if (publicReadCollections.includes(collection.name)) {
        try {
          console.log(`📝 Updating "${collection.name}"...`);
          
          // Update collection with public read permissions
          await pb.collections.update(collection.id, {
            listRule: null,  // Public read
            viewRule: null,  // Public read
            createRule: '@request.auth.role = "admin"',
            updateRule: '@request.auth.role = "admin"',
            deleteRule: '@request.auth.role = "admin"'
          });

          console.log(`   ✅ Updated permissions for "${collection.name}"`);
        } catch (err) {
          console.error(`   ⚠️  Error updating "${collection.name}":`, err.message);
        }
      }
    }

    console.log('\n✨ Permission fix complete!');
    console.log('🧪 Test access: curl http://localhost:8090/api/collections/platform_settings/records');
  } catch (err) {
    console.error('Fatal error:', err);
    console.error('Full error:', err.data || err.message);
    process.exit(1);
  }
}

fixPermissions();
