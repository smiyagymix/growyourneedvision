/**
 * PocketBase Collection Schemas for Phase 2 Features
 * Run this script to create all necessary collections for new owner features
 */

import PocketBase from 'pocketbase';

const collections = [
    {
        name: 'legal_documents',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'type', type: 'select', required: true, options: { values: ['terms', 'privacy', 'gdpr', 'cookie', 'acceptable_use'] } },
            { name: 'version', type: 'text', required: true },
            { name: 'status', type: 'select', required: true, options: { values: ['draft', 'published', 'archived'] } },
            { name: 'content', type: 'editor', required: true },
            { name: 'updated_by', type: 'text', required: true },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner" || status = "published"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'email_templates',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'subject', type: 'text', required: true },
            { name: 'content', type: 'editor', required: true },
            { name: 'category', type: 'select', required: true, options: { values: ['welcome', 'notification', 'billing', 'marketing', 'system'] } },
            { name: 'status', type: 'select', required: true, options: { values: ['active', 'draft'] } },
            { name: 'usage_count', type: 'number', required: false },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'system_health_metrics',
        type: 'base',
        schema: [
            { name: 'service_name', type: 'text', required: true },
            { name: 'status', type: 'select', required: true, options: { values: ['healthy', 'degraded', 'down'] } },
            { name: 'uptime_percentage', type: 'number', required: true },
            { name: 'response_time_ms', type: 'number', required: false },
            { name: 'last_check', type: 'date', required: true },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '',  // System generated
        updateRule: '',  // System generated
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'webhooks',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'url', type: 'url', required: true },
            { name: 'events', type: 'json', required: true },
            { name: 'status', type: 'select', required: true, options: { values: ['active', 'paused', 'failed'] } },
            { name: 'secret_key', type: 'text', required: true },
            { name: 'last_triggered', type: 'date', required: false },
            { name: 'success_rate', type: 'number', required: false },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'scheduled_reports',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'type', type: 'select', required: true, options: { values: ['revenue', 'usage', 'tenants', 'engagement'] } },
            { name: 'frequency', type: 'select', required: true, options: { values: ['daily', 'weekly', 'monthly'] } },
            { name: 'recipients', type: 'json', required: true },
            { name: 'format', type: 'select', required: true, options: { values: ['pdf', 'csv', 'excel'] } },
            { name: 'status', type: 'select', required: true, options: { values: ['active', 'paused'] } },
            { name: 'next_run', type: 'date', required: true },
            { name: 'last_run', type: 'date', required: false },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'backups',
        type: 'base',
        schema: [
            { name: 'type', type: 'select', required: true, options: { values: ['full', 'incremental', 'manual'] } },
            { name: 'size_bytes', type: 'number', required: true },
            { name: 'status', type: 'select', required: true, options: { values: ['completed', 'in_progress', 'failed'] } },
            { name: 'file_path', type: 'text', required: true },
            { name: 'retention_days', type: 'number', required: true },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '',  // System generated
        updateRule: '',  // System generated
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'broadcast_messages',
        type: 'base',
        schema: [
            { name: 'subject', type: 'text', required: true },
            { name: 'message', type: 'editor', required: true },
            { name: 'target_audience', type: 'select', required: true, options: { values: ['all', 'schools', 'individuals', 'active', 'trial'] } },
            { name: 'priority', type: 'select', required: true, options: { values: ['normal', 'high', 'urgent'] } },
            { name: 'channels', type: 'json', required: true },
            { name: 'sent_at', type: 'date', required: false },
            { name: 'sent_by', type: 'text', required: true },
            { name: 'recipient_count', type: 'number', required: false },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    }
];

async function createCollections() {
    const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

    // Note: Collection creation usually requires admin auth, but may work without it in dev mode
    console.log('🚀 Creating Phase 2 collections...\n');
    console.log('⚠️  Note: You may need to create these manually in PocketBase Admin UI\n');
    console.log('Collections to create:');

    for (const collectionData of collections) {
        console.log(`\n📦 ${collectionData.name}`);
        console.log(`   Type: ${collectionData.type}`);
        console.log(`   Fields: ${collectionData.schema.length}`);
    }

    console.log('\n✨ Manual creation steps:');
    console.log('1. Open http://127.0.0.1:8090/_/');
    console.log('2. Go to Collections');
    console.log('3. Create each collection above with the specified fields');
    console.log('\nOr run the seed script which will attempt to use these collections.');
}

createCollections().catch(console.error);

export { createCollections, collections };
