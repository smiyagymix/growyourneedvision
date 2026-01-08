/**
 * Initialize Cost Attribution Collections
 * 
 * Creates PocketBase collections for infrastructure cost tracking:
 * - cost_attribution: Cost tracking per tenant
 * - cost_breakdown: Detailed cost breakdown by service/resource
 * - cost_alerts: Cost threshold alerts
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeCollections() {
    try {
        // Authenticate as superuser
        console.log('🔐 Authenticating with PocketBase...');
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || process.env.SUPERUSER_PASSWORD || 'Darnag123456789@'
        );
        console.log('✓ Authenticated as superuser');

        const collections = await pb.collections.getFullList();

        // ==================== COST ATTRIBUTION ====================
        const costExists = collections.find(c => c.name === 'cost_attribution');

        if (!costExists) {
            console.log('\n📋 Creating cost_attribution collection...');
            await pb.collections.create({
                name: 'cost_attribution',
                type: 'base',
                schema: [
                    {
                        name: 'tenantId',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'tenants',
                            cascadeDelete: true
                        }
                    },
                    {
                        name: 'period',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['daily', 'weekly', 'monthly', 'yearly']
                        }
                    },
                    {
                        name: 'periodStart',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'periodEnd',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'totalCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'currency',
                        type: 'text',
                        required: true,
                        options: { max: 3 }
                    },
                    {
                        name: 'computeCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'storageCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'bandwidthCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'databaseCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'apiCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'aiCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'otherCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'breakdown',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        required: false
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created cost_attribution collection');
        } else {
            console.log('\n✓ cost_attribution collection already exists');
        }

        // ==================== COST BREAKDOWN ====================
        const breakdownExists = collections.find(c => c.name === 'cost_breakdown');

        if (!breakdownExists) {
            console.log('\n📋 Creating cost_breakdown collection...');
            await pb.collections.create({
                name: 'cost_breakdown',
                type: 'base',
                schema: [
                    {
                        name: 'attributionId',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'cost_attribution',
                            cascadeDelete: true
                        }
                    },
                    {
                        name: 'service',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'resourceType',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'resourceId',
                        type: 'text',
                        required: false,
                        options: { max: 255 }
                    },
                    {
                        name: 'quantity',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'unit',
                        type: 'text',
                        required: true,
                        options: { max: 50 }
                    },
                    {
                        name: 'unitCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'totalCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'currency',
                        type: 'text',
                        required: true,
                        options: { max: 3 }
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        required: false
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created cost_breakdown collection');
        } else {
            console.log('\n✓ cost_breakdown collection already exists');
        }

        // ==================== COST ALERTS ====================
        const alertsExists = collections.find(c => c.name === 'cost_alerts');

        if (!alertsExists) {
            console.log('\n📋 Creating cost_alerts collection...');
            await pb.collections.create({
                name: 'cost_alerts',
                type: 'base',
                schema: [
                    {
                        name: 'tenantId',
                        type: 'relation',
                        required: false,
                        options: {
                            collectionId: 'tenants',
                            cascadeDelete: true
                        }
                    },
                    {
                        name: 'alertType',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['threshold', 'anomaly', 'budget-exceeded', 'forecast-warning']
                        }
                    },
                    {
                        name: 'threshold',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'currentCost',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'currency',
                        type: 'text',
                        required: true,
                        options: { max: 3 }
                    },
                    {
                        name: 'period',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['daily', 'weekly', 'monthly', 'yearly']
                        }
                    },
                    {
                        name: 'severity',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['info', 'warning', 'critical']
                        }
                    },
                    {
                        name: 'message',
                        type: 'text',
                        required: true,
                        options: { max: 1000 }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['active', 'acknowledged', 'resolved', 'dismissed']
                        }
                    },
                    {
                        name: 'acknowledgedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'resolvedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        required: false
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created cost_alerts collection');
        } else {
            console.log('\n✓ cost_alerts collection already exists');
        }

        console.log('\n✅ Cost attribution collections initialized successfully!');
        console.log('\n📊 Summary:');
        console.log('  • cost_attribution: Cost tracking per tenant by period');
        console.log('  • cost_breakdown: Detailed cost breakdown by service/resource');
        console.log('  • cost_alerts: Cost threshold and anomaly alerts');
        
    } catch (error) {
        console.error('❌ Failed to initialize collections:', error);
        process.exit(1);
    }
}

initializeCollections();
