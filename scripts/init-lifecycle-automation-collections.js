/**
 * Initialize Lifecycle Automation Collections
 * 
 * Creates PocketBase collections for tenant lifecycle automation:
 * - lifecycle_workflows: Automation workflow definitions
 * - lifecycle_executions: Workflow execution history
 * - lifecycle_triggers: Event triggers for workflows
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

        // ==================== LIFECYCLE WORKFLOWS ====================
        const workflowsExists = collections.find(c => c.name === 'lifecycle_workflows');

        if (!workflowsExists) {
            console.log('\n📋 Creating lifecycle_workflows collection...');
            await pb.collections.create({
                name: 'lifecycle_workflows',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: false,
                        options: { max: 1000 }
                    },
                    {
                        name: 'triggerEvent',
                        type: 'select',
                        required: true,
                        options: {
                            values: [
                                'tenant.created',
                                'tenant.trial_started',
                                'tenant.trial_expiring',
                                'tenant.trial_expired',
                                'tenant.subscription_started',
                                'tenant.payment_failed',
                                'tenant.payment_succeeded',
                                'tenant.subscription_cancelled',
                                'tenant.subscription_expired',
                                'tenant.suspended',
                                'tenant.activated',
                                'tenant.deleted'
                            ]
                        }
                    },
                    {
                        name: 'conditions',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'actions',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'isActive',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'priority',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'delay',
                        type: 'number',
                        required: false
                    },
                    {
                        name: 'delayUnit',
                        type: 'select',
                        required: false,
                        options: {
                            values: ['seconds', 'minutes', 'hours', 'days']
                        }
                    },
                    {
                        name: 'maxExecutions',
                        type: 'number',
                        required: false
                    },
                    {
                        name: 'executionCount',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'lastExecutedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'createdBy',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'users',
                            cascadeDelete: false
                        }
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
            console.log('✓ Created lifecycle_workflows collection');
        } else {
            console.log('\n✓ lifecycle_workflows collection already exists');
        }

        // ==================== LIFECYCLE EXECUTIONS ====================
        const executionsExists = collections.find(c => c.name === 'lifecycle_executions');

        if (!executionsExists) {
            console.log('\n📋 Creating lifecycle_executions collection...');
            await pb.collections.create({
                name: 'lifecycle_executions',
                type: 'base',
                schema: [
                    {
                        name: 'workflowId',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'lifecycle_workflows',
                            cascadeDelete: true
                        }
                    },
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
                        name: 'triggerEvent',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['pending', 'running', 'completed', 'failed', 'cancelled']
                        }
                    },
                    {
                        name: 'startedAt',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'completedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'duration',
                        type: 'number',
                        required: false
                    },
                    {
                        name: 'actionsExecuted',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'actionsFailed',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'errorMessage',
                        type: 'text',
                        required: false,
                        options: { max: 2000 }
                    },
                    {
                        name: 'retryCount',
                        type: 'number',
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
                createRule: '',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created lifecycle_executions collection');
        } else {
            console.log('\n✓ lifecycle_executions collection already exists');
        }

        // ==================== LIFECYCLE TRIGGERS ====================
        const triggersExists = collections.find(c => c.name === 'lifecycle_triggers');

        if (!triggersExists) {
            console.log('\n📋 Creating lifecycle_triggers collection...');
            await pb.collections.create({
                name: 'lifecycle_triggers',
                type: 'base',
                schema: [
                    {
                        name: 'workflowId',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'lifecycle_workflows',
                            cascadeDelete: true
                        }
                    },
                    {
                        name: 'event',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'entityType',
                        type: 'text',
                        required: true,
                        options: { max: 50 }
                    },
                    {
                        name: 'entityId',
                        type: 'text',
                        required: true,
                        options: { max: 255 }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['pending', 'processing', 'completed', 'failed', 'skipped']
                        }
                    },
                    {
                        name: 'triggeredAt',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'processedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'executionId',
                        type: 'relation',
                        required: false,
                        options: {
                            collectionId: 'lifecycle_executions',
                            cascadeDelete: false
                        }
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        required: false
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created lifecycle_triggers collection');
        } else {
            console.log('\n✓ lifecycle_triggers collection already exists');
        }

        console.log('\n✅ Lifecycle automation collections initialized successfully!');
        console.log('\n📊 Summary:');
        console.log('  • lifecycle_workflows: Automation workflow definitions');
        console.log('  • lifecycle_executions: Workflow execution history');
        console.log('  • lifecycle_triggers: Event triggers for workflows');
        
    } catch (error) {
        console.error('❌ Failed to initialize collections:', error);
        process.exit(1);
    }
}

initializeCollections();
