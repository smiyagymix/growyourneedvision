#!/usr/bin/env node

/**
 * Initialize missing collections required for production
 * Ensures platform_settings, feature_flags, and other critical collections exist
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Service token authentication
const token = process.env.POCKETBASE_SERVICE_TOKEN;
if (!token) {
    console.error('❌ POCKETBASE_SERVICE_TOKEN not set');
    process.exit(1);
}

pb.authStore.save(token, null);

const collections = [
    {
        name: 'platform_settings',
        type: 'base',
        fields: [
            { name: 'category', type: 'text', required: true },
            { name: 'key', type: 'text', required: true },
            { name: 'value', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'dataType', type: 'select', options: { values: ['string', 'number', 'boolean', 'json'] } }
        ]
    },
    {
        name: 'feature_flags',
        type: 'base',
        fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'enabled', type: 'checkbox', required: true },
            { name: 'rolloutPercentage', type: 'number', min: 0, max: 100 },
            { name: 'category', type: 'select', options: { values: ['core', 'ai', 'payment', 'communication', 'analytics', 'overlay'] } },
            { name: 'requiresPlan', type: 'select', options: { values: ['free', 'starter', 'professional', 'enterprise'] } }
        ]
    },
    {
        name: 'ip_rate_limits',
        type: 'base',
        fields: [
            { name: 'tenantId', type: 'text', required: true },
            { name: 'tenantName', type: 'text' },
            { name: 'requestsPerHour', type: 'number', required: true },
            { name: 'requestsPerDay', type: 'number', required: true },
            { name: 'ipWhitelist', type: 'json' },
            { name: 'ipBlacklist', type: 'json' },
            { name: 'enabled', type: 'checkbox', required: true },
            { name: 'violationThreshold', type: 'number' },
            { name: 'currentViolations', type: 'number' }
        ]
    },
    {
        name: 'ip_violations',
        type: 'base',
        fields: [
            { name: 'tenantId', type: 'text', required: true },
            { name: 'ipAddress', type: 'text', required: true },
            { name: 'endpoint', type: 'text' },
            { name: 'requestCount', type: 'number' },
            { name: 'limit', type: 'number' },
            { name: 'timestamp', type: 'date', required: true },
            { name: 'action', type: 'select', options: { values: ['warn', 'throttle', 'ban'] } }
        ]
    },
    {
        name: 'audit_logs',
        type: 'base',
        fields: [
            { name: 'tenantId', type: 'text' },
            { name: 'userId', type: 'text' },
            { name: 'action', type: 'text', required: true },
            { name: 'resourceType', type: 'text' },
            { name: 'resourceId', type: 'text' },
            { name: 'severity', type: 'select', options: { values: ['info', 'warning', 'error', 'critical'] } },
            { name: 'metadata', type: 'json' },
            { name: 'timestamp', type: 'date', required: true },
            { name: 'ipAddress', type: 'text' }
        ]
    }
];

async function initializeCollections() {
    try {
        console.log('🔄 Initializing required collections...\n');
        
        const existingCollections = await pb.collections.getFullList();
        const existingNames = existingCollections.map(c => c.name);
        
        for (const collectionDef of collections) {
            if (existingNames.includes(collectionDef.name)) {
                console.log(`✓ ${collectionDef.name} already exists`);
                continue;
            }
            
            console.log(`⏳ Creating ${collectionDef.name}...`);
            
            try {
                await pb.collections.create({
                    name: collectionDef.name,
                    type: collectionDef.type,
                    schema: collectionDef.fields.map(field => ({
                        name: field.name,
                        type: field.type,
                        required: field.required || false,
                        ...Object.fromEntries(
                            Object.entries(field)
                                .filter(([k]) => !['name', 'type', 'required'].includes(k))
                                .map(([k, v]) => [k, v])
                        )
                    }))
                });
                console.log(`✓ ${collectionDef.name} created successfully`);
            } catch (error) {
                if (error.message?.includes('already exists')) {
                    console.log(`✓ ${collectionDef.name} already exists (concurrent creation)`);
                } else {
                    console.error(`✗ Failed to create ${collectionDef.name}:`, error.message);
                }
            }
        }
        
        console.log('\n✓ Collection initialization complete\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing collections:', error.message);
        process.exit(1);
    }
}

initializeCollections();
