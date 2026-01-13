#!/usr/bin/env node

/**
 * Complete PocketBase Setup Script
 * - Creates all required collections
 * - Sets proper permissions
 * - Seeds initial data
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Collection definitions with proper schemas and permissions
const collectionsConfig = [
  {
    name: 'platform_settings',
    type: 'base',
    schema: [
      { name: 'category', type: 'text', required: true },
      { name: 'key', type: 'text', required: true },
      { name: 'value', type: 'text', required: false },
      { name: 'description', type: 'text', required: false },
      { name: 'valueType', type: 'select', options: { values: ['string', 'number', 'boolean', 'json'] } }
    ],
    listRule: null, // Public read
    viewRule: null, // Public read
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    seedData: [
      { category: 'Branding', key: 'primary_color', value: '#3041c7', description: 'Main brand color', valueType: 'string' },
      { category: 'Branding', key: 'secondary_color', value: '#f5a623', description: 'Secondary accent color', valueType: 'string' },
      { category: 'Branding', key: 'portal_name', value: 'Grow Your Need', description: 'Platform display name', valueType: 'string' },
      { category: 'Branding', key: 'logo_url', value: '', description: 'Main logo image URL', valueType: 'string' },
      { category: 'Features', key: 'enable_payments', value: 'false', description: 'Enable payment features', valueType: 'boolean' },
      { category: 'Features', key: 'enable_ai', value: 'true', description: 'Enable AI features', valueType: 'boolean' },
      { category: 'Security', key: 'enforce_2fa', value: 'false', description: 'Require 2FA for all users', valueType: 'boolean' },
    ]
  },
  {
    name: 'feature_flags',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'enabled', type: 'bool', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'rolloutPercentage', type: 'number', options: { min: 0, max: 100 } }
    ],
    listRule: null,
    viewRule: null,
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    seedData: [
      { name: 'beta_features', enabled: true, description: 'Enable beta features', rolloutPercentage: 100 },
      { name: 'dark_mode', enabled: true, description: 'Allow dark mode', rolloutPercentage: 100 },
    ]
  },
  {
    name: 'ip_rate_limits',
    type: 'base',
    schema: [
      { name: 'ipAddress', type: 'text', required: true },
      { name: 'requestsPerMinute', type: 'number', required: true },
      { name: 'windowMinutes', type: 'number', required: true }
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    seedData: []
  },
  {
    name: 'ip_violations',
    type: 'base',
    schema: [
      { name: 'ipAddress', type: 'text', required: true },
      { name: 'violationCount', type: 'number', required: true },
      { name: 'lastViolation', type: 'date', required: true }
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    seedData: []
  },
  {
    name: 'audit_logs',
    type: 'base',
    schema: [
      { name: 'userId', type: 'text', required: false },
      { name: 'action', type: 'text', required: true },
      { name: 'resource', type: 'text', required: false },
      { name: 'details', type: 'json', required: false },
      { name: 'status', type: 'select', options: { values: ['success', 'failure', 'warning'] } }
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    seedData: []
  }
];

async function setupCollections() {
  console.log('🚀 Starting PocketBase setup...\n');

  for (const collectionConfig of collectionsConfig) {
    try {
      // Check if collection exists
      const existing = await pb.collections.getOne(collectionConfig.name).catch(() => null);
      
      if (existing) {
        console.log(`✅ Collection "${collectionConfig.name}" already exists`);
        
        // Update permissions if needed
        try {
          await pb.collections.update(collectionConfig.name, {
            listRule: collectionConfig.listRule,
            viewRule: collectionConfig.viewRule,
            createRule: collectionConfig.createRule,
            updateRule: collectionConfig.updateRule,
            deleteRule: collectionConfig.deleteRule
          });
          console.log(`   ✏️  Updated permissions`);
        } catch (err) {
          console.log(`   ⚠️  Could not update permissions (may need admin auth)`);
        }
        
        continue;
      }

      // Create collection
      const collection = await pb.collections.create({
        name: collectionConfig.name,
        type: collectionConfig.type,
        schema: collectionConfig.schema.map(field => {
          const fieldDef = {
            name: field.name,
            type: field.type,
            required: field.required || false
          };
          
          if (field.type === 'select' && field.options) {
            fieldDef.options = field.options;
          }
          if (field.type === 'number' && field.options) {
            fieldDef.options = field.options;
          }
          
          return fieldDef;
        }),
        listRule: collectionConfig.listRule,
        viewRule: collectionConfig.viewRule,
        createRule: collectionConfig.createRule,
        updateRule: collectionConfig.updateRule,
        deleteRule: collectionConfig.deleteRule
      });

      console.log(`✅ Created collection: ${collectionConfig.name}`);

      // Seed data
      if (collectionConfig.seedData && collectionConfig.seedData.length > 0) {
        for (const record of collectionConfig.seedData) {
          try {
            await pb.collection(collectionConfig.name).create(record);
          } catch (err) {
            // Ignore duplicates
            if (!err.message.includes('duplicate')) {
              console.warn(`   ⚠️  Could not seed record:`, err.message);
            }
          }
        }
        console.log(`   📊 Seeded ${collectionConfig.seedData.length} records`);
      }

    } catch (err) {
      console.error(`❌ Failed to create "${collectionConfig.name}":`, err.message);
    }
  }

  console.log('\n✨ PocketBase setup complete!');
  console.log('📋 Collections ready at: http://localhost:8090/_/');
}

// Run setup
setupCollections().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
