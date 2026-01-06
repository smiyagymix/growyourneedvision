/**
 * PocketBase Schema Initialization for Missing Collections
 * Collections: platform_settings, feature_rollouts, tenant_migrations, 
 *             system_alerts, payment_disputes, payment_refunds,
 *             gdpr_export_requests, gdpr_deletion_requests
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'Darnag123456789@';

const pb = new PocketBase(PB_URL);

async function initMissingCollections() {
    try {
        console.log('Authenticating admin...');
        await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('Authenticated successfully\n');

        const collections = await pb.collections.getFullList();
        const existingNames = collections.map(c => c.name);

        // 1. Platform Settings Collection
        if (!existingNames.includes('platform_settings')) {
            console.log('Creating platform_settings collection...');
            await pb.collections.create({
                name: 'platform_settings',
                type: 'base',
                schema: [
                    { name: 'key', type: 'text', required: true, options: { max: 100 } },
                    { name: 'value', type: 'json', required: true },
                    { name: 'category', type: 'select', required: true, options: { values: ['general', 'security', 'billing', 'features', 'email', 'integrations'] } },
                    { name: 'description', type: 'text', options: { max: 500 } },
                    { name: 'is_public', type: 'bool', required: true },
                    { name: 'updated_by', type: 'text' }
                ]
            });
            console.log('✓ platform_settings collection created\n');
        }

        // 2. Feature Rollouts Collection
        if (!existingNames.includes('feature_rollouts')) {
            console.log('Creating feature_rollouts collection...');
            await pb.collections.create({
                name: 'feature_rollouts',
                type: 'base',
                schema: [
                    { name: 'feature_key', type: 'text', required: true, options: { max: 100 } },
                    { name: 'rollout_percentage', type: 'number', required: true, options: { min: 0, max: 100 } },
                    { name: 'target_tenants', type: 'json' },
                    { name: 'excluded_tenants', type: 'json' },
                    { name: 'start_date', type: 'date' },
                    { name: 'end_date', type: 'date' },
                    { name: 'status', type: 'select', required: true, options: { values: ['planned', 'active', 'paused', 'completed', 'rolled_back'] } },
                    { name: 'description', type: 'text' },
                    { name: 'created_by', type: 'text' }
                ]
            });
            console.log('✓ feature_rollouts collection created\n');
        }

        // 3. Tenant Migrations Collection
        if (!existingNames.includes('tenant_migrations')) {
            console.log('Creating tenant_migrations collection...');
            await pb.collections.create({
                name: 'tenant_migrations',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'migration_name', type: 'text', required: true },
                    { name: 'version', type: 'text', required: true },
                    { name: 'status', type: 'select', required: true, options: { values: ['pending', 'running', 'completed', 'failed', 'rolled_back'] } },
                    { name: 'started_at', type: 'date' },
                    { name: 'completed_at', type: 'date' },
                    { name: 'error_message', type: 'text' },
                    { name: 'records_affected', type: 'number' }
                ]
            });
            console.log('✓ tenant_migrations collection created\n');
        }

        // 4. System Alerts Collection
        if (!existingNames.includes('system_alerts')) {
            console.log('Creating system_alerts collection...');
            await pb.collections.create({
                name: 'system_alerts',
                type: 'base',
                schema: [
                    { name: 'severity', type: 'select', required: true, options: { values: ['critical', 'warning', 'info'] } },
                    { name: 'category', type: 'select', required: true, options: { values: ['revenue', 'usage', 'performance', 'security', 'system'] } },
                    { name: 'title', type: 'text', required: true, options: { max: 200 } },
                    { name: 'message', type: 'text', required: true },
                    { name: 'metric', type: 'text' },
                    { name: 'currentValue', type: 'number' },
                    { name: 'threshold', type: 'number' },
                    { name: 'tenantId', type: 'text' },
                    { name: 'tenantName', type: 'text' },
                    { name: 'acknowledged', type: 'bool', required: true },
                    { name: 'acknowledgedBy', type: 'text' },
                    { name: 'acknowledgedAt', type: 'date' },
                    { name: 'resolved', type: 'bool', required: true },
                    { name: 'resolvedAt', type: 'date' },
                    { name: 'actionUrl', type: 'text' }
                ]
            });
            console.log('✓ system_alerts collection created\n');
        }

        // 5. Payment Disputes Collection
        if (!existingNames.includes('payment_disputes')) {
            console.log('Creating payment_disputes collection...');
            await pb.collections.create({
                name: 'payment_disputes',
                type: 'base',
                schema: [
                    { name: 'dispute_id', type: 'text', required: true, options: { max: 100 } },
                    { name: 'charge_id', type: 'text', required: true },
                    { name: 'amount', type: 'number', required: true },
                    { name: 'currency', type: 'text', required: true, options: { max: 3 } },
                    { name: 'reason', type: 'text', required: true },
                    { name: 'status', type: 'select', required: true, options: { values: ['warning_needs_response', 'warning_under_review', 'warning_closed', 'needs_response', 'under_review', 'charge_refunded', 'won', 'lost'] } },
                    { name: 'evidence_due_by', type: 'date' },
                    { name: 'customer', type: 'text' },
                    { name: 'tenantId', type: 'text' },
                    { name: 'created_at', type: 'date', required: true },
                    { name: 'is_resolved', type: 'bool', required: true }
                ]
            });
            console.log('✓ payment_disputes collection created\n');
        }

        // 6. Payment Refunds Collection
        if (!existingNames.includes('payment_refunds')) {
            console.log('Creating payment_refunds collection...');
            await pb.collections.create({
                name: 'payment_refunds',
                type: 'base',
                schema: [
                    { name: 'refund_id', type: 'text', required: true, options: { max: 100 } },
                    { name: 'charge_id', type: 'text', required: true },
                    { name: 'amount_refunded', type: 'number', required: true },
                    { name: 'refund_reason', type: 'text' },
                    { name: 'refund_status', type: 'select', required: true, options: { values: ['pending', 'succeeded', 'failed', 'cancelled'] } },
                    { name: 'refunded_at', type: 'date', required: true },
                    { name: 'tenantId', type: 'text' }
                ]
            });
            console.log('✓ payment_refunds collection created\n');
        }

        // 7. GDPR Export Requests Collection
        if (!existingNames.includes('gdpr_export_requests')) {
            console.log('Creating gdpr_export_requests collection...');
            await pb.collections.create({
                name: 'gdpr_export_requests',
                type: 'base',
                schema: [
                    { name: 'user', type: 'text', required: true },
                    { name: 'tenantId', type: 'text' },
                    { name: 'status', type: 'select', required: true, options: { values: ['pending', 'processing', 'completed', 'failed'] } },
                    { name: 'requested_at', type: 'date', required: true },
                    { name: 'processing_started_at', type: 'date' },
                    { name: 'completed_at', type: 'date' },
                    { name: 'failed_at', type: 'date' },
                    { name: 'data_json', type: 'text' },
                    { name: 'download_url', type: 'text' },
                    { name: 'expires_at', type: 'date' },
                    { name: 'total_records', type: 'number' },
                    { name: 'error_message', type: 'text' }
                ]
            });
            console.log('✓ gdpr_export_requests collection created\n');
        }

        // 8. GDPR Deletion Requests Collection
        if (!existingNames.includes('gdpr_deletion_requests')) {
            console.log('Creating gdpr_deletion_requests collection...');
            await pb.collections.create({
                name: 'gdpr_deletion_requests',
                type: 'base',
                schema: [
                    { name: 'user', type: 'text', required: true },
                    { name: 'tenantId', type: 'text' },
                    { name: 'reason', type: 'text' },
                    { name: 'status', type: 'select', required: true, options: { values: ['pending', 'processing', 'completed', 'failed'] } },
                    { name: 'requested_at', type: 'date', required: true },
                    { name: 'completed_at', type: 'date' },
                    { name: 'records_deleted', type: 'json' },
                    { name: 'errors', type: 'json' }
                ]
            });
            console.log('✓ gdpr_deletion_requests collection created\n');
        }

        console.log('\n✅ All missing collections created successfully!');
        console.log('\nCollections created:');
        console.log('  - platform_settings');
        console.log('  - feature_rollouts');
        console.log('  - tenant_migrations');
        console.log('  - system_alerts');
        console.log('  - payment_disputes');
        console.log('  - payment_refunds');
        console.log('  - gdpr_export_requests');
        console.log('  - gdpr_deletion_requests');

    } catch (error) {
        console.error('❌ Error creating collections:', error);
        process.exit(1);
    }
}

initMissingCollections();
