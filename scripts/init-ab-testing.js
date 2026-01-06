/**
 * Initialize A/B Testing Collections
 * 
 * Creates collections for A/B tests, assignments, and metrics
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeABTestingCollections() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');

        console.log('✅ Authenticated as admin');

        const collections = await pb.collections.getFullList();

        // Collection 1: ab_tests
        const abTestsExists = collections.find(c => c.name === 'ab_tests');
        if (!abTestsExists) {
            await pb.collections.create({
                name: 'ab_tests',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'feature',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['draft', 'running', 'paused', 'completed']
                        }
                    },
                    {
                        name: 'variants',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'targeting',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'metrics',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'startDate',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'endDate',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'winnerVariant',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'createdBy',
                        type: 'text',
                        required: true
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created ab_tests collection');
        } else {
            console.log('⏭️  ab_tests collection already exists');
        }

        // Collection 2: ab_test_assignments
        const assignmentsExists = collections.find(c => c.name === 'ab_test_assignments');
        if (!assignmentsExists) {
            await pb.collections.create({
                name: 'ab_test_assignments',
                type: 'base',
                schema: [
                    {
                        name: 'testId',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'userId',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'variantId',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'assignedAt',
                        type: 'date',
                        required: true
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null, // Allow system to create assignments
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created ab_test_assignments collection');
        } else {
            console.log('⏭️  ab_test_assignments collection already exists');
        }

        // Collection 3: ab_test_metrics
        const metricsExists = collections.find(c => c.name === 'ab_test_metrics');
        if (!metricsExists) {
            await pb.collections.create({
                name: 'ab_test_metrics',
                type: 'base',
                schema: [
                    {
                        name: 'testId',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'variantId',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'metricName',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'value',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'userId',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'recordedAt',
                        type: 'date',
                        required: true
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null, // Allow system to track metrics
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created ab_test_metrics collection');
        } else {
            console.log('⏭️  ab_test_metrics collection already exists');
        }

        console.log('\n✅ A/B testing collections initialized successfully!');

    } catch (error) {
        console.error('❌ Error initializing A/B testing collections:', error);
        process.exit(1);
    }
}

initializeABTestingCollections();
