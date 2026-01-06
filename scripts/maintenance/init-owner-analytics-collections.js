/**
 * Initialize Owner Analytics Collections in PocketBase
 * 
 * This script creates the missing collections that ownerService.ts depends on:
 * - analytics_pages: Track most visited pages
 * - analytics_sources: Track user access sources  
 * - finance_expenses: Track expenses by category
 * - system_health: Real-time system health metrics
 * - system_alerts: Critical system alerts for owner
 * 
 * Run this script once to setup the database schema for owner dashboard.
 * 
 * Usage: node scripts/maintenance/init-owner-analytics-collections.js
 */

const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://localhost:8090');

async function authenticate() {
    try {
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD
        );
        console.log('✅ Authenticated as admin');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        console.log('Make sure PocketBase is running and admin credentials are correct');
        process.exit(1);
    }
}

async function createCollectionIfNotExists(collectionName, schema) {
    try {
        // Check if collection exists
        await pb.collections.getOne(collectionName);
        console.log(`ℹ️  Collection "${collectionName}" already exists, skipping...`);
        return false;
    } catch (err) {
        // Collection doesn't exist, create it
        try {
            await pb.collections.create(schema);
            console.log(`✅ Created collection: ${collectionName}`);
            return true;
        } catch (createErr) {
            console.error(`❌ Failed to create ${collectionName}:`, createErr.message);
            return false;
        }
    }
}

async function main() {
    console.log('🚀 Starting Owner Analytics Collections Setup...\n');

    await authenticate();

    const collections = [
        // 1. Analytics Pages Collection
        {
            name: 'analytics_pages',
            type: 'base',
            schema: [
                {
                    name: 'path',
                    type: 'text',
                    required: true,
                    options: {
                        max: 500
                    }
                },
                {
                    name: 'visitors',
                    type: 'number',
                    required: true,
                    options: {
                        min: 0
                    }
                },
                {
                    name: 'category',
                    type: 'select',
                    required: false,
                    options: {
                        maxSelect: 1,
                        values: ['Social', 'Internal', 'External', 'Dashboard', 'Settings']
                    }
                }
            ],
            indexes: [
                'CREATE INDEX idx_analytics_pages_visitors ON analytics_pages (visitors DESC)',
                'CREATE INDEX idx_analytics_pages_path ON analytics_pages (path)'
            ],
            listRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            viewRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            createRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            updateRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            deleteRule: '@request.auth.id != "" && @request.auth.role = "Owner"'
        },

        // 2. Analytics Sources Collection
        {
            name: 'analytics_sources',
            type: 'base',
            schema: [
                {
                    name: 'source',
                    type: 'text',
                    required: true,
                    options: {
                        max: 200
                    }
                },
                {
                    name: 'visitors',
                    type: 'number',
                    required: true,
                    options: {
                        min: 0
                    }
                },
                {
                    name: 'color',
                    type: 'text',
                    required: false,
                    options: {
                        max: 20,
                        pattern: '^#[0-9a-fA-F]{6}$'
                    }
                }
            ],
            indexes: [
                'CREATE INDEX idx_analytics_sources_visitors ON analytics_sources (visitors DESC)'
            ],
            listRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            viewRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            createRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            updateRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            deleteRule: '@request.auth.id != "" && @request.auth.role = "Owner"'
        },

        // 3. Finance Expenses Collection
        {
            name: 'finance_expenses',
            type: 'base',
            schema: [
                {
                    name: 'category',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: [
                            'Infrastructure',
                            'AI Services',
                            'Marketing',
                            'Personnel',
                            'Software',
                            'Support',
                            'Legal',
                            'Other'
                        ]
                    }
                },
                {
                    name: 'amount',
                    type: 'number',
                    required: true,
                    options: {
                        min: 0
                    }
                },
                {
                    name: 'color',
                    type: 'text',
                    required: false,
                    options: {
                        max: 20
                    }
                },
                {
                    name: 'percentage',
                    type: 'number',
                    required: false,
                    options: {
                        min: 0,
                        max: 100
                    }
                },
                {
                    name: 'month',
                    type: 'date',
                    required: true
                }
            ],
            indexes: [
                'CREATE INDEX idx_finance_expenses_amount ON finance_expenses (amount DESC)',
                'CREATE INDEX idx_finance_expenses_month ON finance_expenses (month DESC)'
            ],
            listRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            viewRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            createRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            updateRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            deleteRule: '@request.auth.id != "" && @request.auth.role = "Owner"'
        },

        // 4. System Health Collection
        {
            name: 'system_health',
            type: 'base',
            schema: [
                {
                    name: 'uptime',
                    type: 'number',
                    required: true,
                    options: {
                        min: 0,
                        max: 100
                    }
                },
                {
                    name: 'api_response_time',
                    type: 'number',
                    required: true,
                    options: {
                        min: 0
                    }
                },
                {
                    name: 'error_rate',
                    type: 'number',
                    required: true,
                    options: {
                        min: 0,
                        max: 100
                    }
                },
                {
                    name: 'db_latency',
                    type: 'number',
                    required: true,
                    options: {
                        min: 0
                    }
                },
                {
                    name: 'service_status',
                    type: 'json',
                    required: false
                }
            ],
            indexes: [
                'CREATE INDEX idx_system_health_created ON system_health (created DESC)'
            ],
            listRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            viewRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            createRule: null, // System only
            updateRule: null,
            deleteRule: '@request.auth.id != "" && @request.auth.role = "Owner"'
        },

        // 5. System Alerts Collection
        {
            name: 'system_alerts',
            type: 'base',
            schema: [
                {
                    name: 'severity',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: ['critical', 'warning', 'info']
                    }
                },
                {
                    name: 'message',
                    type: 'text',
                    required: true,
                    options: {
                        max: 1000
                    }
                },
                {
                    name: 'action_url',
                    type: 'url',
                    required: false
                },
                {
                    name: 'resolved',
                    type: 'bool',
                    required: false,
                    options: {}
                },
                {
                    name: 'metadata',
                    type: 'json',
                    required: false
                }
            ],
            indexes: [
                'CREATE INDEX idx_system_alerts_severity ON system_alerts (severity)',
                'CREATE INDEX idx_system_alerts_created ON system_alerts (created DESC)',
                'CREATE INDEX idx_system_alerts_resolved ON system_alerts (resolved)'
            ],
            listRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            viewRule: '@request.auth.id != "" && @request.auth.role = "Owner"',
            createRule: null, // System only
            updateRule: '@request.auth.id != "" && @request.auth.role = "Owner"', // Can mark as resolved
            deleteRule: '@request.auth.id != "" && @request.auth.role = "Owner"'
        }
    ];

    let created = 0;
    let skipped = 0;

    for (const collection of collections) {
        const wasCreated = await createCollectionIfNotExists(collection.name, collection);
        if (wasCreated) {
            created++;
        } else {
            skipped++;
        }
    }

    console.log('\n✨ Setup Complete!');
    console.log(`   Created: ${created} collections`);
    console.log(`   Skipped: ${skipped} collections (already exist)`);
    console.log('\n📊 Next Steps:');
    console.log('   1. Run seed script to populate sample data');
    console.log('   2. Verify collections in PocketBase admin UI');
    console.log('   3. Test owner dashboard data loading');
}

main().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
