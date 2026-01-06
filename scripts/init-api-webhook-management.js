/**
 * API and Webhook Management Collections Initialization
 * 
 * Sets up collections for:
 * - API keys and usage tracking
 * - Webhooks and delivery tracking
 * - Usage reports
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Authenticate as admin
await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
    process.env.POCKETBASE_ADMIN_PASSWORD || '12345678'
);

async function createAPIKeysCollection() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'api_keys');

        if (!exists) {
            await pb.collections.create({
                name: 'api_keys',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'key', type: 'text', required: true },
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'tenantName', type: 'text', required: true },
                    { name: 'permissions', type: 'json', required: true },
                    { name: 'status', type: 'select', required: true, options: { values: ['active', 'suspended', 'revoked'] } },
                    { name: 'expiresAt', type: 'date', required: false },
                    { name: 'lastUsed', type: 'date', required: false },
                    { name: 'usageCount', type: 'number', required: true },
                    { name: 'rateLimit', type: 'number', required: true },
                    { name: 'createdBy', type: 'text', required: true },
                    { name: 'ipWhitelist', type: 'json', required: false },
                    { name: 'allowedOrigins', type: 'json', required: false },
                    { name: 'rotatedAt', type: 'date', required: false },
                    { name: 'revokedAt', type: 'date', required: false }
                ],
                listRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                viewRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                updateRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ api_keys collection created');
        } else {
            console.log('api_keys collection already exists');
        }
    } catch (error) {
        console.error('Error creating api_keys:', error);
    }
}

async function createAPIKeyUsageCollection() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'api_key_usage');

        if (!exists) {
            await pb.collections.create({
                name: 'api_key_usage',
                type: 'base',
                schema: [
                    { name: 'keyId', type: 'text', required: true },
                    { name: 'endpoint', type: 'text', required: true },
                    { name: 'method', type: 'text', required: true },
                    { name: 'statusCode', type: 'number', required: true },
                    { name: 'responseTime', type: 'number', required: true },
                    { name: 'ipAddress', type: 'text', required: true },
                    { name: 'userAgent', type: 'text', required: false },
                    { name: 'timestamp', type: 'date', required: true }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '', // System creates these
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ api_key_usage collection created');
        } else {
            console.log('api_key_usage collection already exists');
        }
    } catch (error) {
        console.error('Error creating api_key_usage:', error);
    }
}

async function createWebhooksCollection() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'webhooks');

        if (!exists) {
            await pb.collections.create({
                name: 'webhooks',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'url', type: 'url', required: true },
                    { name: 'events', type: 'json', required: true },
                    { name: 'secret', type: 'text', required: true },
                    { name: 'status', type: 'select', required: true, options: { values: ['active', 'disabled'] } },
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'headers', type: 'json', required: false },
                    { name: 'retryPolicy', type: 'json', required: true },
                    { name: 'timeout', type: 'number', required: true },
                    { name: 'lastDeliveryAt', type: 'date', required: false },
                    { name: 'successCount', type: 'number', required: true },
                    { name: 'failureCount', type: 'number', required: true }
                ],
                listRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                viewRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                updateRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                deleteRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"'
            });
            console.log('✓ webhooks collection created');
        } else {
            console.log('webhooks collection already exists');
        }
    } catch (error) {
        console.error('Error creating webhooks:', error);
    }
}

async function createWebhookDeliveriesCollection() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'webhook_deliveries');

        if (!exists) {
            await pb.collections.create({
                name: 'webhook_deliveries',
                type: 'base',
                schema: [
                    { name: 'webhookId', type: 'text', required: true },
                    { name: 'event', type: 'text', required: true },
                    { name: 'payload', type: 'json', required: true },
                    { name: 'status', type: 'select', required: true, options: { values: ['pending', 'success', 'failed', 'retrying'] } },
                    { name: 'attempts', type: 'number', required: true },
                    { name: 'responseCode', type: 'number', required: false },
                    { name: 'responseBody', type: 'text', required: false },
                    { name: 'errorMessage', type: 'text', required: false },
                    { name: 'deliveredAt', type: 'date', required: false },
                    { name: 'nextRetryAt', type: 'date', required: false }
                ],
                listRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                viewRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                createRule: '', // System creates these
                updateRule: '', // System updates these
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ webhook_deliveries collection created');
        } else {
            console.log('webhook_deliveries collection already exists');
        }
    } catch (error) {
        console.error('Error creating webhook_deliveries:', error);
    }
}

async function createUsageReportsCollection() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'usage_reports');

        if (!exists) {
            await pb.collections.create({
                name: 'usage_reports',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'tenantName', type: 'text', required: true },
                    { name: 'reportPeriod', type: 'select', required: true, options: { values: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] } },
                    { name: 'startDate', type: 'date', required: true },
                    { name: 'endDate', type: 'date', required: true },
                    { name: 'metrics', type: 'json', required: true },
                    { name: 'costs', type: 'json', required: true },
                    { name: 'trends', type: 'json', required: true },
                    { name: 'recommendations', type: 'json', required: true },
                    { name: 'generatedAt', type: 'date', required: true },
                    { name: 'generatedBy', type: 'text', required: true }
                ],
                listRule: '@request.auth.role = "Owner" || (@request.auth.role = "SchoolAdmin" && tenantId = @request.auth.tenantId)',
                viewRule: '@request.auth.role = "Owner" || (@request.auth.role = "SchoolAdmin" && tenantId = @request.auth.tenantId)',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ usage_reports collection created');
        } else {
            console.log('usage_reports collection already exists');
        }
    } catch (error) {
        console.error('Error creating usage_reports:', error);
    }
}

async function createReportSchedulesCollection() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'report_schedules');

        if (!exists) {
            await pb.collections.create({
                name: 'report_schedules',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'reportType', type: 'text', required: true },
                    { name: 'period', type: 'select', required: true, options: { values: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] } },
                    { name: 'recipients', type: 'json', required: true },
                    { name: 'active', type: 'bool', required: true },
                    { name: 'nextRun', type: 'date', required: true },
                    { name: 'lastRun', type: 'date', required: false }
                ],
                listRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                viewRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                updateRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                deleteRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"'
            });
            console.log('✓ report_schedules collection created');
        } else {
            console.log('report_schedules collection already exists');
        }
    } catch (error) {
        console.error('Error creating report_schedules:', error);
    }
}

// Run initialization
console.log('Initializing API and webhook management collections...');
await createAPIKeysCollection();
await createAPIKeyUsageCollection();
await createWebhooksCollection();
await createWebhookDeliveriesCollection();
await createUsageReportsCollection();
await createReportSchedulesCollection();
console.log('API and webhook management collections initialized successfully!');

process.exit(0);
