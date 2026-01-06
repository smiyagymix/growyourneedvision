/**
 * Bulk User Operations Service
 * 
 * Perform bulk operations on multiple users: role changes, status updates,
 * mass messaging, exports, and deletions with progress tracking
 */

import pb from '../lib/pocketbase';
import * as Sentry from '@sentry/react';
import { isMockEnv } from '../utils/mockData';

export interface BulkOperation {
    id: string;
    type: 'role_change' | 'status_update' | 'send_message' | 'export' | 'delete' | 'suspend';
    targetUserIds: string[];
    params: Record<string, any>;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number; // 0-100
    processedCount: number;
    failedCount: number;
    errors: { userId: string; error: string }[];
    createdBy: string;
    created: string;
    completedAt?: string;
}

export interface BulkOperationOptions {
    type: BulkOperation['type'];
    userIds?: string[];
    filters?: string; // PocketBase filter for dynamic selection
    params: Record<string, any>;
    validateOnly?: boolean;
}

export interface BulkOperationResult {
    success: boolean;
    operationId: string;
    total: number;
    processed: number;
    failed: number;
    errors: { userId: string; error: string }[];
}

const MOCK_OPERATIONS: BulkOperation[] = [
    {
        id: '1',
        type: 'role_change',
        targetUserIds: ['u1', 'u2', 'u3'],
        params: { newRole: 'Teacher' },
        status: 'completed',
        progress: 100,
        processedCount: 3,
        failedCount: 0,
        errors: [],
        createdBy: 'admin@school.com',
        created: new Date().toISOString(),
        completedAt: new Date().toISOString()
    }
];

class BulkUserOperationsService {
    /**
     * Start bulk operation
     */
    async startBulkOperation(options: BulkOperationOptions): Promise<BulkOperation> {
        return await Sentry.startSpan(
            { name: 'startBulkOperation', op: 'bulk.start' },
            async () => {
                try {
                    if (isMockEnv()) {
                        return {
                            id: 'mock-' + Date.now(),
                            type: options.type,
                            targetUserIds: options.userIds || [],
                            params: options.params,
                            status: 'processing',
                            progress: 0,
                            processedCount: 0,
                            failedCount: 0,
                            errors: [],
                            createdBy: 'current-user',
                            created: new Date().toISOString()
                        };
                    }

                    // Resolve target users
                    let targetUserIds: string[];
                    if (options.userIds) {
                        targetUserIds = options.userIds;
                    } else if (options.filters) {
                        const users = await pb.collection('users').getFullList({
                            filter: options.filters,
                            requestKey: null
                        });
                        targetUserIds = users.map(u => u.id);
                    } else {
                        throw new Error('Must provide either userIds or filters');
                    }

                    // Create operation record
                    const operation = await pb.collection('bulk_operations').create({
                        type: options.type,
                        targetUserIds: JSON.stringify(targetUserIds),
                        params: JSON.stringify(options.params),
                        status: 'pending',
                        progress: 0,
                        processedCount: 0,
                        failedCount: 0,
                        errors: JSON.stringify([]),
                        createdBy: 'current-user' // Should get from auth context
                    });

                    // If not validate only, start processing
                    if (!options.validateOnly) {
                        // Process in background
                        this.processBulkOperation(operation.id).catch(error => {
                            console.error('Background processing error:', error);
                        });
                    }

                    return {
                        ...operation,
                        targetUserIds,
                        params: options.params,
                        errors: []
                    } as unknown as BulkOperation;
                } catch (error) {
                    Sentry.captureException(error);
                    throw error;
                }
            }
        );
    }

    /**
     * Get operation status
     */
    async getOperation(operationId: string): Promise<BulkOperation> {
        try {
            if (isMockEnv()) {
                return MOCK_OPERATIONS[0];
            }

            const operation = await pb.collection('bulk_operations').getOne(operationId, { requestKey: null });
            
            return {
                ...operation,
                targetUserIds: JSON.parse(operation.targetUserIds),
                params: JSON.parse(operation.params),
                errors: JSON.parse(operation.errors || '[]')
            } as unknown as BulkOperation;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Get all operations with pagination
     */
    async getOperations(page: number = 1, perPage: number = 20): Promise<{
        items: BulkOperation[];
        totalPages: number;
        totalItems: number;
    }> {
        try {
            if (isMockEnv()) {
                return {
                    items: MOCK_OPERATIONS,
                    totalPages: 1,
                    totalItems: MOCK_OPERATIONS.length
                };
            }

            const result = await pb.collection('bulk_operations').getList(page, perPage, {
                sort: '-created',
                requestKey: null
            });

            return {
                items: result.items.map(op => ({
                    ...op,
                    targetUserIds: JSON.parse(op.targetUserIds),
                    params: JSON.parse(op.params),
                    errors: JSON.parse(op.errors || '[]')
                })) as unknown as BulkOperation[],
                totalPages: result.totalPages,
                totalItems: result.totalItems
            };
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Cancel operation
     */
    async cancelOperation(operationId: string): Promise<void> {
        try {
            if (isMockEnv()) return;

            await pb.collection('bulk_operations').update(operationId, {
                status: 'cancelled',
                completedAt: new Date().toISOString()
            });
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Bulk change user roles
     */
    async changeUserRoles(userIds: string[], newRole: string): Promise<BulkOperationResult> {
        return this.executeBulkOperation({
            type: 'role_change',
            userIds,
            params: { newRole }
        });
    }

    /**
     * Bulk update user status
     */
    async updateUserStatus(userIds: string[], status: 'active' | 'suspended' | 'inactive'): Promise<BulkOperationResult> {
        return this.executeBulkOperation({
            type: 'status_update',
            userIds,
            params: { status }
        });
    }

    /**
     * Bulk send message to users
     */
    async sendBulkMessage(userIds: string[], message: { subject: string; body: string }): Promise<BulkOperationResult> {
        return this.executeBulkOperation({
            type: 'send_message',
            userIds,
            params: message
        });
    }

    /**
     * Bulk delete users (soft delete)
     */
    async bulkDeleteUsers(userIds: string[], permanent: boolean = false): Promise<BulkOperationResult> {
        return this.executeBulkOperation({
            type: 'delete',
            userIds,
            params: { permanent }
        });
    }

    /**
     * Execute bulk operation synchronously
     */
    private async executeBulkOperation(options: BulkOperationOptions): Promise<BulkOperationResult> {
        try {
            const operation = await this.startBulkOperation(options);
            
            // Wait for completion (poll every second)
            let completed = false;
            while (!completed) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const status = await this.getOperation(operation.id);
                
                if (['completed', 'failed', 'cancelled'].includes(status.status)) {
                    completed = true;
                    return {
                        success: status.status === 'completed',
                        operationId: status.id,
                        total: status.targetUserIds.length,
                        processed: status.processedCount,
                        failed: status.failedCount,
                        errors: status.errors
                    };
                }
            }

            throw new Error('Operation timed out');
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Process bulk operation in background
     */
    private async processBulkOperation(operationId: string): Promise<void> {
        try {
            const operation = await this.getOperation(operationId);
            
            // Update status to processing
            await pb.collection('bulk_operations').update(operationId, {
                status: 'processing'
            });

            const errors: { userId: string; error: string }[] = [];
            let processedCount = 0;
            let failedCount = 0;

            // Process each user
            for (let i = 0; i < operation.targetUserIds.length; i++) {
                const userId = operation.targetUserIds[i];
                
                try {
                    await this.processUser(userId, operation.type, operation.params);
                    processedCount++;
                } catch (error: any) {
                    failedCount++;
                    errors.push({ userId, error: error.message });
                }

                // Update progress
                const progress = Math.round(((i + 1) / operation.targetUserIds.length) * 100);
                await pb.collection('bulk_operations').update(operationId, {
                    progress,
                    processedCount,
                    failedCount,
                    errors: JSON.stringify(errors)
                });
            }

            // Mark as completed
            await pb.collection('bulk_operations').update(operationId, {
                status: failedCount === 0 ? 'completed' : 'failed',
                completedAt: new Date().toISOString()
            });
        } catch (error) {
            // Mark operation as failed
            await pb.collection('bulk_operations').update(operationId, {
                status: 'failed',
                completedAt: new Date().toISOString()
            }).catch(console.error);

            Sentry.captureException(error);
        }
    }

    /**
     * Process individual user operation
     */
    private async processUser(userId: string, type: BulkOperation['type'], params: any): Promise<void> {
        switch (type) {
            case 'role_change':
                await pb.collection('users').update(userId, {
                    role: params.newRole
                });
                break;

            case 'status_update':
                await pb.collection('users').update(userId, {
                    status: params.status,
                    statusChangedAt: new Date().toISOString()
                });
                break;

            case 'send_message':
                await pb.collection('messages').create({
                    recipientId: userId,
                    subject: params.subject,
                    body: params.body,
                    type: 'bulk',
                    sentAt: new Date().toISOString()
                });
                break;

            case 'delete':
                if (params.permanent) {
                    await pb.collection('users').delete(userId);
                } else {
                    await pb.collection('users').update(userId, {
                        status: 'deleted',
                        deletedAt: new Date().toISOString()
                    });
                }
                break;

            case 'suspend':
                await pb.collection('users').update(userId, {
                    status: 'suspended',
                    suspendedAt: new Date().toISOString(),
                    suspensionReason: params.reason
                });
                break;

            case 'export':
                // Export would generate a file - handled differently
                break;
        }
    }

    /**
     * Get operation statistics
     */
    async getStatistics(): Promise<{
        totalOperations: number;
        completedToday: number;
        averageProcessingTime: number;
        mostUsedOperation: string;
    }> {
        try {
            if (isMockEnv()) {
                return {
                    totalOperations: 150,
                    completedToday: 12,
                    averageProcessingTime: 45, // seconds
                    mostUsedOperation: 'role_change'
                };
            }

            const operations = await pb.collection('bulk_operations').getFullList({
                requestKey: null
            });

            const today = new Date().toISOString().split('T')[0];
            const completedToday = operations.filter(op => 
                op.created.startsWith(today) && op.status === 'completed'
            ).length;

            // Calculate average processing time
            const completed = operations.filter(op => op.completedAt);
            const processingTimes = completed.map(op => {
                const start = new Date(op.created).getTime();
                const end = new Date(op.completedAt).getTime();
                return (end - start) / 1000; // seconds
            });
            const avgTime = processingTimes.length > 0
                ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
                : 0;

            // Find most used operation
            const typeCounts: Record<string, number> = {};
            operations.forEach(op => {
                typeCounts[op.type] = (typeCounts[op.type] || 0) + 1;
            });
            const mostUsed = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

            return {
                totalOperations: operations.length,
                completedToday,
                averageProcessingTime: avgTime,
                mostUsedOperation: mostUsed
            };
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
}

export const bulkUserOperationsService = new BulkUserOperationsService();
