/**
 * Initialize Tenant Notifications and Health Monitoring Collections
 * 
 * Creates collections for notifications, rate limiting, and health monitoring
 */

require('dotenv').config();
const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeCollections() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || 'Darnag123456789@'
        );

        console.log('✅ Authenticated as admin\n');

        const collections = await pb.collections.getFullList();

        // ==================== TENANT NOTIFICATIONS ====================

        console.log('Creating Tenant Notifications collections...');

        // Collection 1: tenant_notifications
        const notificationsExists = collections.find(c => c.name === 'tenant_notifications');
        if (!notificationsExists) {
            await pb.collections.create({
                name: 'tenant_notifications',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: false },
                    { name: 'title', type: 'text', required: true },
                    { name: 'message', type: 'text', required: true },
                    { name: 'type', type: 'select', required: true, options: { maxSelect: 1, values: ['info', 'warning', 'error', 'success'] } },
                    { name: 'priority', type: 'select', required: true, options: { maxSelect: 1, values: ['low', 'normal', 'high', 'urgent'] } },
                    { name: 'channels', type: 'json', required: true },
                    { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['pending', 'sent', 'failed'] } },
                    { name: 'scheduledFor', type: 'date', required: false },
                    { name: 'sentAt', type: 'date', required: false },
                    { name: 'metadata', type: 'json', required: false },
                    { name: 'actionUrl', type: 'text', required: false },
                    { name: 'actionLabel', type: 'text', required: false },
                    { name: 'expiresAt', type: 'date', required: false },
                    { name: 'readBy', type: 'json', required: false }
                ],
                listRule: '@request.auth.role = "Owner" || @request.auth.tenantId = tenantId',
                viewRule: '@request.auth.role = "Owner" || @request.auth.tenantId = tenantId',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created tenant_notifications collection');
        } else {
            console.log('⏭️  tenant_notifications collection already exists');
        }

        // Collection 2: notification_templates
        const templatesExists = collections.find(c => c.name === 'notification_templates');
        if (!templatesExists) {
            await pb.collections.create({
                name: 'notification_templates',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'subject', type: 'text', required: true },
                    { name: 'body', type: 'text', required: true },
                    { name: 'type', type: 'text', required: true },
                    { name: 'channels', type: 'json', required: true },
                    { name: 'variables', type: 'json', required: true }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created notification_templates collection');
        } else {
            console.log('⏭️  notification_templates collection already exists');
        }

        // ==================== RATE LIMITING ====================

        console.log('\nCreating Rate Limiting collections...');

        // Collection 3: rate_limit_configs
        const rateLimitConfigsExists = collections.find(c => c.name === 'rate_limit_configs');
        if (!rateLimitConfigsExists) {
            await pb.collections.create({
                name: 'rate_limit_configs',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'endpoint', type: 'text', required: false },
                    { name: 'maxRequests', type: 'number', required: true },
                    { name: 'windowSeconds', type: 'number', required: true },
                    { name: 'burstAllowed', type: 'bool', required: true },
                    { name: 'burstLimit', type: 'number', required: false },
                    { name: 'isEnabled', type: 'bool', required: true }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created rate_limit_configs collection');
        } else {
            console.log('⏭️  rate_limit_configs collection already exists');
        }

        // Collection 4: rate_limit_usage
        const rateLimitUsageExists = collections.find(c => c.name === 'rate_limit_usage');
        if (!rateLimitUsageExists) {
            await pb.collections.create({
                name: 'rate_limit_usage',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'endpoint', type: 'text', required: true },
                    { name: 'requestCount', type: 'number', required: true },
                    { name: 'windowStart', type: 'date', required: true },
                    { name: 'windowEnd', type: 'date', required: true },
                    { name: 'throttled', type: 'bool', required: true },
                    { name: 'exceededAt', type: 'date', required: false }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null,
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created rate_limit_usage collection');
        } else {
            console.log('⏭️  rate_limit_usage collection already exists');
        }

        // Collection 5: rate_limit_violations
        const rateLimitViolationsExists = collections.find(c => c.name === 'rate_limit_violations');
        if (!rateLimitViolationsExists) {
            await pb.collections.create({
                name: 'rate_limit_violations',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'endpoint', type: 'text', required: true },
                    { name: 'requestCount', type: 'number', required: true },
                    { name: 'limit', type: 'number', required: true },
                    { name: 'timestamp', type: 'date', required: true },
                    { name: 'ipAddress', type: 'text', required: false },
                    { name: 'userAgent', type: 'text', required: false }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null,
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created rate_limit_violations collection');
        } else {
            console.log('⏭️  rate_limit_violations collection already exists');
        }

        // ==================== TENANT HEALTH ====================

        console.log('\nCreating Tenant Health Monitoring collections...');

        // Collection 6: tenant_health_scores
        const healthScoresExists = collections.find(c => c.name === 'tenant_health_scores');
        if (!healthScoresExists) {
            await pb.collections.create({
                name: 'tenant_health_scores',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'overallScore', type: 'number', required: true },
                    { name: 'metrics', type: 'json', required: true },
                    { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['healthy', 'at-risk', 'critical', 'churned'] } },
                    { name: 'alerts', type: 'json', required: true },
                    { name: 'recommendations', type: 'json', required: true },
                    { name: 'lastCalculated', type: 'date', required: true }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null,
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created tenant_health_scores collection');
        } else {
            console.log('⏭️  tenant_health_scores collection already exists');
        }

        // Collection 7: tenant_health_history
        const healthHistoryExists = collections.find(c => c.name === 'tenant_health_history');
        if (!healthHistoryExists) {
            await pb.collections.create({
                name: 'tenant_health_history',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'score', type: 'number', required: true },
                    { name: 'metrics', type: 'json', required: true },
                    { name: 'timestamp', type: 'date', required: true }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null,
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created tenant_health_history collection');
        } else {
            console.log('⏭️  tenant_health_history collection already exists');
        }

        console.log('\n✅ All collections initialized successfully!');

    } catch (error) {
        console.error('❌ Error initializing collections:', error);
        process.exit(1);
    }
}

initializeCollections();
