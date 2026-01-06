/**
 * Initialize Monitoring & System Health Schema
 * Creates collections for real-time system monitoring and health tracking
 * Run: node scripts/init-monitoring-schema.js
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function authenticate() {
    try {
        await pb.collection('_superusers').authWithPassword(
            'owner@growyourneed.com',
            'Darnag123456789@'
        );
        console.log('✅ Authenticated as superuser');
    } catch (err) {
        console.error('❌ Authentication failed:', err.message);
        process.exit(1);
    }
}

async function createCollections() {
    const collections = [
        {
            name: 'system_health',
            type: 'base',
            schema: [
                {
                    name: 'service_name',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 100
                    }
                },
                {
                    name: 'status',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: ['operational', 'degraded', 'down', 'maintenance']
                    }
                },
                {
                    name: 'uptime_percentage',
                    type: 'number',
                    required: true,
                    options: {
                        min: 0,
                        max: 100
                    }
                },
                {
                    name: 'latency_ms',
                    type: 'number',
                    required: false,
                    options: {
                        min: 0
                    }
                },
                {
                    name: 'last_check',
                    type: 'date',
                    required: true
                },
                {
                    name: 'error_count',
                    type: 'number',
                    required: false,
                    options: {
                        min: 0
                    }
                },
                {
                    name: 'metadata',
                    type: 'json',
                    required: false
                }
            ],
            indexes: [
                'CREATE INDEX idx_system_health_service ON system_health(service_name)',
                'CREATE INDEX idx_system_health_status ON system_health(status)',
                'CREATE INDEX idx_system_health_check ON system_health(last_check)'
            ],
            listRule: '@request.auth.role = "Owner"',
            viewRule: '@request.auth.role = "Owner"',
            createRule: '@request.auth.role = "Owner"',
            updateRule: '@request.auth.role = "Owner"',
            deleteRule: '@request.auth.role = "Owner"'
        },
        {
            name: 'monitoring_events',
            type: 'base',
            schema: [
                {
                    name: 'service_name',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 100
                    }
                },
                {
                    name: 'event_type',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: ['status_change', 'error', 'warning', 'info', 'recovery']
                    }
                },
                {
                    name: 'severity',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: ['low', 'medium', 'high', 'critical']
                    }
                },
                {
                    name: 'message',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 1000
                    }
                },
                {
                    name: 'details',
                    type: 'json',
                    required: false
                },
                {
                    name: 'resolved',
                    type: 'bool',
                    required: false
                },
                {
                    name: 'resolved_at',
                    type: 'date',
                    required: false
                },
                {
                    name: 'resolved_by',
                    type: 'relation',
                    required: false,
                    options: {
                        collectionId: 'users',
                        cascadeDelete: false,
                        maxSelect: 1
                    }
                }
            ],
            indexes: [
                'CREATE INDEX idx_monitoring_events_service ON monitoring_events(service_name)',
                'CREATE INDEX idx_monitoring_events_type ON monitoring_events(event_type)',
                'CREATE INDEX idx_monitoring_events_severity ON monitoring_events(severity)',
                'CREATE INDEX idx_monitoring_events_resolved ON monitoring_events(resolved)'
            ],
            listRule: '@request.auth.role = "Owner"',
            viewRule: '@request.auth.role = "Owner"',
            createRule: '@request.auth.role = "Owner"',
            updateRule: '@request.auth.role = "Owner"',
            deleteRule: '@request.auth.role = "Owner"'
        },
        {
            name: 'webhook_logs',
            type: 'base',
            schema: [
                {
                    name: 'webhook_name',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 100
                    }
                },
                {
                    name: 'event_type',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 100
                    }
                },
                {
                    name: 'status',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: ['success', 'failed', 'pending', 'retrying']
                    }
                },
                {
                    name: 'payload',
                    type: 'json',
                    required: false
                },
                {
                    name: 'response',
                    type: 'json',
                    required: false
                },
                {
                    name: 'error_message',
                    type: 'text',
                    required: false,
                    options: {
                        max: 1000
                    }
                },
                {
                    name: 'retry_count',
                    type: 'number',
                    required: false,
                    options: {
                        min: 0
                    }
                },
                {
                    name: 'duration_ms',
                    type: 'number',
                    required: false,
                    options: {
                        min: 0
                    }
                }
            ],
            indexes: [
                'CREATE INDEX idx_webhook_logs_name ON webhook_logs(webhook_name)',
                'CREATE INDEX idx_webhook_logs_status ON webhook_logs(status)',
                'CREATE INDEX idx_webhook_logs_event ON webhook_logs(event_type)'
            ],
            listRule: '@request.auth.role = "Owner"',
            viewRule: '@request.auth.role = "Owner"',
            createRule: null, // Allow system to create
            updateRule: '@request.auth.role = "Owner"',
            deleteRule: '@request.auth.role = "Owner"'
        },
        {
            name: 'api_usage',
            type: 'base',
            schema: [
                {
                    name: 'endpoint',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 200
                    }
                },
                {
                    name: 'method',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
                    }
                },
                {
                    name: 'user_id',
                    type: 'relation',
                    required: false,
                    options: {
                        collectionId: 'users',
                        cascadeDelete: false,
                        maxSelect: 1
                    }
                },
                {
                    name: 'tenant_id',
                    type: 'text',
                    required: false,
                    options: {
                        max: 50
                    }
                },
                {
                    name: 'status_code',
                    type: 'number',
                    required: true,
                    options: {
                        min: 100,
                        max: 599
                    }
                },
                {
                    name: 'duration_ms',
                    type: 'number',
                    required: true,
                    options: {
                        min: 0
                    }
                },
                {
                    name: 'ip_address',
                    type: 'text',
                    required: false,
                    options: {
                        max: 45
                    }
                },
                {
                    name: 'user_agent',
                    type: 'text',
                    required: false,
                    options: {
                        max: 500
                    }
                }
            ],
            indexes: [
                'CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint)',
                'CREATE INDEX idx_api_usage_user ON api_usage(user_id)',
                'CREATE INDEX idx_api_usage_tenant ON api_usage(tenant_id)',
                'CREATE INDEX idx_api_usage_status ON api_usage(status_code)'
            ],
            listRule: '@request.auth.role = "Owner"',
            viewRule: '@request.auth.role = "Owner"',
            createRule: null, // Allow system to create
            updateRule: null,
            deleteRule: '@request.auth.role = "Owner"'
        },
        {
            name: 'email_logs',
            type: 'base',
            schema: [
                {
                    name: 'to_email',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 255
                    }
                },
                {
                    name: 'from_email',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 255
                    }
                },
                {
                    name: 'subject',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 500
                    }
                },
                {
                    name: 'status',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: ['queued', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked']
                    }
                },
                {
                    name: 'provider',
                    type: 'text',
                    required: false,
                    options: {
                        max: 50
                    }
                },
                {
                    name: 'provider_message_id',
                    type: 'text',
                    required: false,
                    options: {
                        max: 255
                    }
                },
                {
                    name: 'template_name',
                    type: 'text',
                    required: false,
                    options: {
                        max: 100
                    }
                },
                {
                    name: 'error_message',
                    type: 'text',
                    required: false,
                    options: {
                        max: 1000
                    }
                },
                {
                    name: 'sent_at',
                    type: 'date',
                    required: false
                },
                {
                    name: 'delivered_at',
                    type: 'date',
                    required: false
                },
                {
                    name: 'opened_at',
                    type: 'date',
                    required: false
                },
                {
                    name: 'metadata',
                    type: 'json',
                    required: false
                }
            ],
            indexes: [
                'CREATE INDEX idx_email_logs_to ON email_logs(to_email)',
                'CREATE INDEX idx_email_logs_status ON email_logs(status)',
                'CREATE INDEX idx_email_logs_sent ON email_logs(sent_at)',
                'CREATE INDEX idx_email_logs_template ON email_logs(template_name)'
            ],
            listRule: '@request.auth.role = "Owner"',
            viewRule: '@request.auth.role = "Owner"',
            createRule: null, // Allow system to create
            updateRule: null,
            deleteRule: '@request.auth.role = "Owner"'
        }
    ];

    for (const collectionData of collections) {
        try {
            // Check if collection exists
            let collection;
            try {
                collection = await pb.collections.getOne(collectionData.name);
                console.log(`⚠️  Collection '${collectionData.name}' already exists, updating...`);
                
                // Update existing collection
                await pb.collections.update(collection.id, {
                    schema: collectionData.schema,
                    listRule: collectionData.listRule,
                    viewRule: collectionData.viewRule,
                    createRule: collectionData.createRule,
                    updateRule: collectionData.updateRule,
                    deleteRule: collectionData.deleteRule
                });
                console.log(`✅ Updated collection: ${collectionData.name}`);
            } catch (err) {
                // Collection doesn't exist, create it
                await pb.collections.create({
                    name: collectionData.name,
                    type: collectionData.type,
                    schema: collectionData.schema,
                    listRule: collectionData.listRule,
                    viewRule: collectionData.viewRule,
                    createRule: collectionData.createRule,
                    updateRule: collectionData.updateRule,
                    deleteRule: collectionData.deleteRule
                });
                console.log(`✅ Created collection: ${collectionData.name}`);
            }
        } catch (err) {
            console.error(`❌ Error with collection '${collectionData.name}':`, err.message);
        }
    }
}

async function seedSystemHealthData() {
    console.log('\n📊 Seeding initial system health data...');
    
    const services = [
        {
            service_name: 'API Server',
            status: 'operational',
            uptime_percentage: 99.98,
            latency_ms: 45,
            last_check: new Date().toISOString(),
            error_count: 0,
            metadata: {
                version: '1.0.0',
                host: 'localhost:8090',
                endpoints: 150
            }
        },
        {
            service_name: 'Database',
            status: 'operational',
            uptime_percentage: 99.99,
            latency_ms: 12,
            last_check: new Date().toISOString(),
            error_count: 0,
            metadata: {
                type: 'PocketBase',
                size: '2.4GB',
                collections: 45
            }
        },
        {
            service_name: 'Authentication',
            status: 'operational',
            uptime_percentage: 99.95,
            latency_ms: 28,
            last_check: new Date().toISOString(),
            error_count: 0,
            metadata: {
                active_sessions: 234,
                auth_methods: ['email', 'oauth']
            }
        },
        {
            service_name: 'Storage',
            status: 'operational',
            uptime_percentage: 99.92,
            latency_ms: 85,
            last_check: new Date().toISOString(),
            error_count: 0,
            metadata: {
                used: '245GB',
                available: '755GB',
                total: '1TB'
            }
        },
        {
            service_name: 'AI Service',
            status: 'operational',
            uptime_percentage: 99.87,
            latency_ms: 150,
            last_check: new Date().toISOString(),
            error_count: 0,
            metadata: {
                model: 'gpt-4',
                requests_today: 1842,
                avg_tokens: 450
            }
        },
        {
            service_name: 'Email Service',
            status: 'operational',
            uptime_percentage: 99.94,
            latency_ms: 220,
            last_check: new Date().toISOString(),
            error_count: 0,
            metadata: {
                provider: 'SendGrid',
                sent_today: 1523,
                delivery_rate: 98.5
            }
        }
    ];

    for (const service of services) {
        try {
            await pb.collection('system_health').create(service);
            console.log(`✅ Seeded: ${service.service_name}`);
        } catch (err) {
            console.error(`❌ Error seeding ${service.service_name}:`, err.message);
        }
    }
}

async function main() {
    console.log('🚀 Starting Monitoring Schema Initialization...\n');
    
    await authenticate();
    await createCollections();
    await seedSystemHealthData();
    
    console.log('\n✅ Monitoring schema initialization complete!');
    console.log('\n📋 Created Collections:');
    console.log('   - system_health (real-time service health tracking)');
    console.log('   - monitoring_events (event history & alerts)');
    console.log('   - webhook_logs (integration debugging)');
    console.log('   - api_usage (rate limiting & analytics)');
    console.log('   - email_logs (delivery tracking)');
    console.log('\n🔍 Next Steps:');
    console.log('   1. Update ownerService.ts with monitoring methods');
    console.log('   2. Replace mock data in SystemOverview.tsx');
    console.log('   3. Connect OwnerDashboard.tsx to real uptime data');
}

main().catch(console.error);
