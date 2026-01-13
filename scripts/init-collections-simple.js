#!/usr/bin/env node

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

async function initCollections() {
  try {
    console.log('🚀 Initializing PocketBase collections...\n');

    // Try to authenticate with default admin
    try {
      const adminData = await pb.admins.authWithPassword('admin@example.com', 'admin123456');
      console.log('✅ Authenticated as admin');
    } catch (err) {
      console.log('⚠️  Could not authenticate, trying without auth...');
    }

    // Collections to create
    const collections = [
      {
        name: 'platform_settings',
        type: 'base',
        schema: [
          { name: 'category', type: 'text', required: true },
          { name: 'key', type: 'text', required: true },
          { name: 'value', type: 'text', required: false },
          { name: 'valueType', type: 'select', options: { values: ['string', 'number', 'boolean', 'json'] } }
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
        ]
      },
      {
        name: 'ip_rate_limits',
        type: 'base',
        schema: [
          { name: 'ipAddress', type: 'text', required: true },
          { name: 'requestsPerMinute', type: 'number', required: true },
          { name: 'windowMinutes', type: 'number', required: true }
        ]
      },
      {
        name: 'ip_violations',
        type: 'base',
        schema: [
          { name: 'ipAddress', type: 'text', required: true },
          { name: 'violationCount', type: 'number', required: true },
          { name: 'lastViolation', type: 'date', required: true }
        ]
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
        ]
      }
    ];

    for (const collectionConfig of collections) {
      try {
        // Check if collection exists
        const existing = await pb.collections.getOne(collectionConfig.name).catch(() => null);
        
        if (existing) {
          console.log(`✅ Collection "${collectionConfig.name}" already exists`);
          continue;
        }

        // Create collection using native PocketBase API
        const collection = await pb.collections.create({
          name: collectionConfig.name,
          type: collectionConfig.type,
          schema: collectionConfig.schema.map(field => ({
            name: field.name,
            type: field.type,
            required: field.required || false,
            ...((field.options || field.options === false) && { options: field.options })
          })),
          listRule: '@request.auth.id != ""',
          viewRule: '@request.auth.id != ""',
          createRule: '@request.auth.id != ""',
          updateRule: '@request.auth.id != ""',
          deleteRule: '@request.auth.role = "admin"'
        });

        console.log(`✅ Created collection: ${collectionConfig.name}`);
      } catch (err) {
        console.error(`❌ Failed to create "${collectionConfig.name}":`, err.message);
      }
    }

    console.log('\n✨ Collection initialization complete!');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

initCollections();
