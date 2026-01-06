/**
 * Initialize Usage Tracking Schema
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function authenticate() {
    try {
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');
        console.log('✅ Authenticated as admin');
        return true;
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        return false;
    }
}

async function initUsageSchema() {
    try {
        console.log('\n🔧 Initializing Usage Tracking Schema...\n');

        // Check if tenant_usage collection exists
        let usageExists = false;
        try {
            await pb.collection('tenant_usage').getList(1, 1);
            console.log('✅ tenant_usage collection already exists');
            usageExists = true;
        } catch (error) {
            console.log('📋 Creating tenant_usage collection...');
        }

        if (!usageExists) {
            await pb.collections.create({
                name: 'tenant_usage',
                type: 'base',
                schema: [
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: true,
                        options: { max: 50 }
                    },
                    {
                        name: 'date',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'metricType',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['api_calls', 'storage', 'active_users', 'bandwidth', 'exports']
                        }
                    },
                    {
                        name: 'value',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        required: false
                    }
                ],
                indexes: [
                    'CREATE INDEX idx_usage_tenant ON tenant_usage (tenantId)',
                    'CREATE INDEX idx_usage_date ON tenant_usage (date)',
                    'CREATE INDEX idx_usage_metric ON tenant_usage (metricType)',
                    'CREATE INDEX idx_usage_tenant_date ON tenant_usage (tenantId, date)'
                ],
                listRule: '@request.auth.tenantId = tenantId || @request.auth.role = "Owner"',
                viewRule: '@request.auth.tenantId = tenantId || @request.auth.role = "Owner"',
                createRule: null, // Server-side only
                updateRule: null, // Server-side only
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ tenant_usage collection created');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Usage Tracking Schema Initialized Successfully');
        console.log('='.repeat(60) + '\n');

        return true;
    } catch (error) {
        console.error('❌ Error initializing usage schema:', error);
        return false;
    }
}

const authenticated = await authenticate();
if (authenticated) {
    const success = await initUsageSchema();
    process.exit(success ? 0 : 1);
} else {
    process.exit(1);
}
