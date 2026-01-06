/**
 * Initialize Platform Management Collections
 * 
 * Creates 8 missing Owner dashboard collections for advanced management
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function authenticate() {
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com';
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || '12345678';
    
    try {
        await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
        console.log('✅ Authenticated as admin');
        return true;
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        return false;
    }
}

async function initPlatformManagementSchema() {
    console.log('🚀 Initializing Platform Management Collections...\n');

    const collections = [
        {
            name: 'platform_settings',
            type: 'base',
            schema: [
                { name: 'key', type: 'text', required: true, options: { min: 1, max: 255 } },
                { name: 'value', type: 'json' },
                { name: 'category', type: 'select', options: { 
                    maxSelect: 1,
                    values: ['general', 'security', 'billing', 'features', 'integrations', 'performance'] 
                }},
                { name: 'description', type: 'text', options: { max: 500 } },
                { name: 'isPublic', type: 'bool' },
                { name: 'lastModifiedBy', type: 'relation', options: { 
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['email']
                }}
            ],
            indexes: [
                'CREATE UNIQUE INDEX idx_platform_settings_key ON platform_settings (key)'
            ]
        },
        {
            name: 'feature_rollouts',
            type: 'base',
            schema: [
                { name: 'featureId', type: 'relation', required: true, options: { 
                    collectionId: 'feature_flags',
                    cascadeDelete: true,
                    maxSelect: 1,
                    displayFields: ['name']
                }},
                { name: 'tenantId', type: 'relation', options: { 
                    collectionId: 'tenants',
                    cascadeDelete: true,
                    maxSelect: 1,
                    displayFields: ['name']
                }},
                { name: 'enabled', type: 'bool', required: true },
                { name: 'rolloutPercentage', type: 'number', options: { min: 0, max: 100 } },
                { name: 'startDate', type: 'date' },
                { name: 'endDate', type: 'date' },
                { name: 'targetUsers', type: 'json' },
                { name: 'metrics', type: 'json' },
                { name: 'status', type: 'select', options: {
                    maxSelect: 1,
                    values: ['planned', 'active', 'paused', 'completed', 'rolled_back']
                }}
            ],
            indexes: [
                'CREATE INDEX idx_feature_rollouts_tenant ON feature_rollouts (tenantId)',
                'CREATE INDEX idx_feature_rollouts_feature ON feature_rollouts (featureId)'
            ]
        },
        {
            name: 'tenant_migrations',
            type: 'base',
            schema: [
                { name: 'sourceTenantId', type: 'relation', options: { 
                    collectionId: 'tenants',
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['name']
                }},
                { name: 'targetTenantId', type: 'relation', options: { 
                    collectionId: 'tenants',
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['name']
                }},
                { name: 'status', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'] 
                }},
                { name: 'migrationType', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['clone', 'merge', 'export', 'import'] 
                }},
                { name: 'dataTypes', type: 'json' },
                { name: 'progress', type: 'number', options: { min: 0, max: 100 } },
                { name: 'totalRecords', type: 'number' },
                { name: 'migratedRecords', type: 'number' },
                { name: 'errors', type: 'json' },
                { name: 'startedAt', type: 'date' },
                { name: 'completedAt', type: 'date' },
                { name: 'initiatedBy', type: 'relation', options: { 
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['email']
                }}
            ],
            indexes: [
                'CREATE INDEX idx_tenant_migrations_source ON tenant_migrations (sourceTenantId)',
                'CREATE INDEX idx_tenant_migrations_target ON tenant_migrations (targetTenantId)',
                'CREATE INDEX idx_tenant_migrations_status ON tenant_migrations (status)'
            ]
        },
        {
            name: 'compliance_records',
            type: 'base',
            schema: [
                { name: 'tenantId', type: 'relation', options: { 
                    collectionId: 'tenants',
                    cascadeDelete: true,
                    maxSelect: 1,
                    displayFields: ['name']
                }},
                { name: 'standard', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['GDPR', 'SOC2', 'HIPAA', 'CCPA', 'PCI_DSS', 'ISO27001'] 
                }},
                { name: 'status', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['compliant', 'non_compliant', 'pending_review', 'expired', 'in_progress'] 
                }},
                { name: 'certificateUrl', type: 'url' },
                { name: 'certificateFile', type: 'file', options: { maxSize: 10485760, maxSelect: 1 } },
                { name: 'expiryDate', type: 'date' },
                { name: 'lastAuditDate', type: 'date' },
                { name: 'nextAuditDate', type: 'date' },
                { name: 'findings', type: 'json' },
                { name: 'remediationPlan', type: 'editor' },
                { name: 'auditor', type: 'text' },
                { name: 'score', type: 'number', options: { min: 0, max: 100 } }
            ],
            indexes: [
                'CREATE INDEX idx_compliance_tenant ON compliance_records (tenantId)',
                'CREATE INDEX idx_compliance_standard ON compliance_records (standard)',
                'CREATE INDEX idx_compliance_status ON compliance_records (status)'
            ]
        },
        {
            name: 'sla_metrics',
            type: 'base',
            schema: [
                { name: 'tenantId', type: 'relation', options: { 
                    collectionId: 'tenants',
                    cascadeDelete: true,
                    maxSelect: 1,
                    displayFields: ['name']
                }},
                { name: 'metricType', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['uptime', 'response_time', 'resolution_time', 'support_sla', 'api_availability'] 
                }},
                { name: 'target', type: 'number', required: true },
                { name: 'actual', type: 'number', required: true },
                { name: 'unit', type: 'select', options: {
                    maxSelect: 1,
                    values: ['percentage', 'milliseconds', 'hours', 'minutes', 'count']
                }},
                { name: 'period', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] 
                }},
                { name: 'startDate', type: 'date', required: true },
                { name: 'endDate', type: 'date', required: true },
                { name: 'breached', type: 'bool' },
                { name: 'breachDetails', type: 'json' },
                { name: 'impactLevel', type: 'select', options: {
                    maxSelect: 1,
                    values: ['low', 'medium', 'high', 'critical']
                }}
            ],
            indexes: [
                'CREATE INDEX idx_sla_metrics_tenant ON sla_metrics (tenantId)',
                'CREATE INDEX idx_sla_metrics_type ON sla_metrics (metricType)',
                'CREATE INDEX idx_sla_metrics_period ON sla_metrics (period, startDate)'
            ]
        },
        {
            name: 'cost_attribution',
            type: 'base',
            schema: [
                { name: 'tenantId', type: 'relation', required: true, options: { 
                    collectionId: 'tenants',
                    cascadeDelete: true,
                    maxSelect: 1,
                    displayFields: ['name']
                }},
                { name: 'resourceType', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['compute', 'storage', 'bandwidth', 'database', 'ai_api', 'email', 'sms', 'support'] 
                }},
                { name: 'cost', type: 'number', required: true },
                { name: 'currency', type: 'text', required: true, options: { 
                    min: 3,
                    max: 3,
                    pattern: '^[A-Z]{3}$' 
                }},
                { name: 'usageAmount', type: 'number' },
                { name: 'usageUnit', type: 'text' },
                { name: 'billingPeriod', type: 'date', required: true },
                { name: 'providerId', type: 'text' },
                { name: 'providerName', type: 'select', options: {
                    maxSelect: 1,
                    values: ['AWS', 'Azure', 'GCP', 'Stripe', 'OpenAI', 'SendGrid', 'Twilio', 'Other']
                }},
                { name: 'invoiceId', type: 'text' },
                { name: 'tags', type: 'json' }
            ],
            indexes: [
                'CREATE INDEX idx_cost_attribution_tenant ON cost_attribution (tenantId)',
                'CREATE INDEX idx_cost_attribution_period ON cost_attribution (billingPeriod)',
                'CREATE INDEX idx_cost_attribution_type ON cost_attribution (resourceType)'
            ]
        },
        {
            name: 'abuse_reports',
            type: 'base',
            schema: [
                { name: 'reportedTenantId', type: 'relation', options: { 
                    collectionId: 'tenants',
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['name']
                }},
                { name: 'reportedUserId', type: 'relation', options: { 
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['email']
                }},
                { name: 'reportedBy', type: 'relation', options: { 
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['email']
                }},
                { name: 'abuseType', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['spam', 'phishing', 'copyright', 'tos_violation', 'harassment', 'illegal_content', 'bot_abuse', 'payment_fraud'] 
                }},
                { name: 'severity', type: 'select', options: {
                    maxSelect: 1,
                    values: ['low', 'medium', 'high', 'critical']
                }},
                { name: 'description', type: 'editor', required: true },
                { name: 'evidence', type: 'file', options: { maxSize: 10485760, maxSelect: 10 } },
                { name: 'evidenceUrls', type: 'json' },
                { name: 'status', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['open', 'investigating', 'resolved', 'dismissed', 'escalated'] 
                }},
                { name: 'resolution', type: 'editor' },
                { name: 'actionTaken', type: 'select', options: { 
                    maxSelect: 1,
                    values: ['warning', 'temporary_suspension', 'permanent_suspension', 'termination', 'legal_action', 'none'] 
                }},
                { name: 'assignedTo', type: 'relation', options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['email']
                }},
                { name: 'resolvedAt', type: 'date' },
                { name: 'escalatedAt', type: 'date' }
            ],
            indexes: [
                'CREATE INDEX idx_abuse_reports_tenant ON abuse_reports (reportedTenantId)',
                'CREATE INDEX idx_abuse_reports_user ON abuse_reports (reportedUserId)',
                'CREATE INDEX idx_abuse_reports_status ON abuse_reports (status)',
                'CREATE INDEX idx_abuse_reports_type ON abuse_reports (abuseType)'
            ]
        },
        {
            name: 'tenant_communications',
            type: 'base',
            schema: [
                { name: 'targetTenants', type: 'json' },
                { name: 'targetFilter', type: 'text' },
                { name: 'subject', type: 'text', required: true, options: { min: 1, max: 500 } },
                { name: 'body', type: 'editor', required: true },
                { name: 'sendAt', type: 'date' },
                { name: 'sentAt', type: 'date' },
                { name: 'status', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'] 
                }},
                { name: 'channelType', type: 'select', required: true, options: { 
                    maxSelect: 1,
                    values: ['email', 'in_app', 'sms', 'webhook', 'push'] 
                }},
                { name: 'priority', type: 'select', options: { 
                    maxSelect: 1,
                    values: ['low', 'medium', 'high', 'urgent'] 
                }},
                { name: 'deliveryStats', type: 'json' },
                { name: 'totalRecipients', type: 'number' },
                { name: 'successfulDeliveries', type: 'number' },
                { name: 'failedDeliveries', type: 'number' },
                { name: 'createdBy', type: 'relation', required: true, options: { 
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1,
                    displayFields: ['email']
                }},
                { name: 'attachments', type: 'file', options: { maxSize: 52428800, maxSelect: 5 } },
                { name: 'metadata', type: 'json' }
            ],
            indexes: [
                'CREATE INDEX idx_tenant_communications_status ON tenant_communications (status)',
                'CREATE INDEX idx_tenant_communications_sendAt ON tenant_communications (sendAt)',
                'CREATE INDEX idx_tenant_communications_channel ON tenant_communications (channelType)'
            ]
        }
    ];

    let successCount = 0;
    let skipCount = 0;

    for (const collectionConfig of collections) {
        try {
            // Check if collection exists
            const existing = await pb.collections.getFullList().catch(() => []);
            const collectionExists = existing.some(c => c.name === collectionConfig.name);

            if (collectionExists) {
                console.log(`⏭️  Skipping ${collectionConfig.name} (already exists)`);
                skipCount++;
                continue;
            }

            // Create collection
            const collection = await pb.collections.create(collectionConfig);
            console.log(`✅ Created collection: ${collectionConfig.name}`);

            // Create indexes if specified
            if (collectionConfig.indexes && collectionConfig.indexes.length > 0) {
                console.log(`   Creating ${collectionConfig.indexes.length} index(es)...`);
                // Note: Indexes are typically created via migrations or direct SQL
                // For now, just log them
                collectionConfig.indexes.forEach(idx => {
                    console.log(`   📊 ${idx}`);
                });
            }

            successCount++;
        } catch (error) {
            console.error(`❌ Error creating ${collectionConfig.name}:`, error.message);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   📦 Total: ${collections.length}`);
}

async function seedInitialData() {
    console.log('\n📝 Seeding initial platform settings...');

    const defaultSettings = [
        {
            key: 'maintenance_mode',
            value: { enabled: false, message: '' },
            category: 'general',
            description: 'Enable/disable platform maintenance mode',
            isPublic: true
        },
        {
            key: 'max_tenants',
            value: { limit: 1000 },
            category: 'general',
            description: 'Maximum number of tenants allowed',
            isPublic: false
        },
        {
            key: 'default_trial_days',
            value: { days: 14 },
            category: 'billing',
            description: 'Default trial period in days',
            isPublic: false
        },
        {
            key: 'stripe_webhook_tolerance',
            value: { seconds: 300 },
            category: 'billing',
            description: 'Stripe webhook timestamp tolerance',
            isPublic: false
        },
        {
            key: 'rate_limit_api',
            value: { requests: 1000, window: '15m' },
            category: 'security',
            description: 'API rate limiting configuration',
            isPublic: false
        }
    ];

    for (const setting of defaultSettings) {
        try {
            // Check if setting exists
            const existing = await pb.collection('platform_settings').getFullList({
                filter: `key = "${setting.key}"`
            });

            if (existing.length === 0) {
                await pb.collection('platform_settings').create(setting);
                console.log(`   ✅ Created setting: ${setting.key}`);
            } else {
                console.log(`   ⏭️  Skipped setting: ${setting.key} (exists)`);
            }
        } catch (error) {
            console.error(`   ❌ Error creating setting ${setting.key}:`, error.message);
        }
    }
}

async function main() {
    const authenticated = await authenticate();
    if (!authenticated) {
        console.error('❌ Failed to authenticate. Exiting...');
        process.exit(1);
    }

    await initPlatformManagementSchema();
    await seedInitialData();

    console.log('\n✅ Platform Management Schema initialization complete!\n');
}

main().catch(console.error);
