/**
 * User Management Collections Initialization
 * 
 * Sets up collections for:
 * - User merge/deduplication tracking
 * - Bulk user operations
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Authenticate as admin
await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
    process.env.POCKETBASE_ADMIN_PASSWORD || '12345678'
);

async function createUserMergeLogs() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'user_merge_logs');

        if (!exists) {
            await pb.collections.create({
                name: 'user_merge_logs',
                type: 'base',
                schema: [
                    {
                        name: 'primaryUserId',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'duplicateUserIds',
                        type: 'json',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'strategies',
                        type: 'json',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['completed', 'undone']
                        }
                    },
                    {
                        name: 'mergedAt',
                        type: 'date',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'undoneAt',
                        type: 'date',
                        required: false,
                        options: {}
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ user_merge_logs collection created');
        } else {
            console.log('user_merge_logs collection already exists');
        }
    } catch (error) {
        console.error('Error creating user_merge_logs:', error);
    }
}

async function createBulkOperations() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'bulk_operations');

        if (!exists) {
            await pb.collections.create({
                name: 'bulk_operations',
                type: 'base',
                schema: [
                    {
                        name: 'type',
                        type: 'select',
                        required: true,
                        options: {
                            values: [
                                'role_change',
                                'status_update',
                                'send_message',
                                'export',
                                'delete',
                                'suspend'
                            ]
                        }
                    },
                    {
                        name: 'targetUserIds',
                        type: 'json',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'params',
                        type: 'json',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: [
                                'pending',
                                'processing',
                                'completed',
                                'failed',
                                'cancelled'
                            ]
                        }
                    },
                    {
                        name: 'progress',
                        type: 'number',
                        required: true,
                        options: {
                            min: 0,
                            max: 100
                        }
                    },
                    {
                        name: 'processedCount',
                        type: 'number',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'failedCount',
                        type: 'number',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'errors',
                        type: 'json',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'createdBy',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: '_pb_users_auth_',
                            cascadeDelete: false,
                            maxSelect: 1
                        }
                    },
                    {
                        name: 'completedAt',
                        type: 'date',
                        required: false,
                        options: {}
                    }
                ],
                listRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                viewRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                updateRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ bulk_operations collection created');
        } else {
            console.log('bulk_operations collection already exists');
        }
    } catch (error) {
        console.error('Error creating bulk_operations:', error);
    }
}

// Run initialization
console.log('Initializing user management collections...');
await createUserMergeLogs();
await createBulkOperations();
console.log('User management collections initialized successfully!');

process.exit(0);
