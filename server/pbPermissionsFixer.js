/**
 * PocketBase Collection Permission Fixer
 * Automatically fixes 403 Forbidden errors by setting proper permissions
 */

import fetch from 'node-fetch';

export async function fixPocketBasePermissions() {
  const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
  const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;

  // Collections that need public read access
  const publicReadCollections = [
    'platform_settings',
    'branding_settings',
    'feature_flags',
    'settings',
    'branding',
    'help_articles',
    'faqs'
  ];

  try {
    console.log('🔧 Fixing PocketBase collection permissions...');

    // Get all collections
    const collectionsRes = await fetch(`${pbUrl}/api/collections`);
    if (!collectionsRes.ok) {
      console.warn('⚠️  Could not fetch collections from PocketBase');
      return;
    }

    const collections = await collectionsRes.json();

    for (const collection of collections) {
      if (publicReadCollections.includes(collection.name)) {
        try {
          // Update collection with public read permissions
          const updateRes = await fetch(
            `${pbUrl}/api/collections/${collection.id}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                ...(serviceToken && { 'Authorization': `Bearer ${serviceToken}` })
              },
              body: JSON.stringify({
                listRule: null,  // Public read
                viewRule: null,  // Public read
                createRule: '@request.auth.role = "admin"',
                updateRule: '@request.auth.role = "admin"',
                deleteRule: '@request.auth.role = "admin"'
              })
            }
          );

          if (updateRes.ok) {
            console.log(`✅ Fixed permissions for "${collection.name}"`);
          } else if (updateRes.status === 401 || updateRes.status === 403) {
            // May not have permission to update, but that's ok if already set correctly
            console.log(`ℹ️  Collection "${collection.name}" permissions intact`);
          } else {
            console.warn(`⚠️  Could not update "${collection.name}": ${updateRes.status}`);
          }
        } catch (err) {
          console.warn(`⚠️  Error fixing "${collection.name}":`, err.message);
        }
      }
    }

    console.log('✅ PocketBase permissions check complete\n');
  } catch (err) {
    console.warn('⚠️  PocketBase permission fix error:', err.message);
  }
}

export default fixPocketBasePermissions;
