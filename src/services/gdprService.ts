/**
 * GDPR Compliance Service
 * Provides user data portability and right-to-be-forgotten functionality
 */

import { pocketBaseClient } from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { Result, Ok, Err } from '../lib/types';
import { AppError } from './errorHandler';
import { RecordModel } from 'pocketbase';

// Inline helper to avoid module resolution issues
function createTypedCollection<T extends RecordModel>(collectionName: string) {
    return pocketBaseClient.getRawClient().collection<T>(collectionName);
}
import { UserExportData } from '../types/userData';

export interface GDPRExportData extends RecordModel {
    exportId: string;
    userId: string;
    requestedAt: string;
    completedAt?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresAt?: string;
    data?: UserExportData;
}

/**
 * Request GDPR data export for a user
 * Aggregates all user data across collections
 */
export async function requestGDPRExport(userId: string, tenantId?: string): Promise<Result<GDPRExportData, AppError>> {
    if (isMockEnv()) {
        return Ok({
            exportId: 'mock-export-123',
            userId,
            requestedAt: new Date().toISOString(),
            status: 'pending'
        });
    }

    try {
        const pb = pocketBaseClient.getRawClient();
        const exportService = createTypedCollection<GDPRExportData>(pb, 'gdpr_export_requests');

        // Create export request record
        const exportRequest = await exportService.create({
            userId,
            tenantId: tenantId || undefined,
            status: 'pending',
            requestedAt: new Date().toISOString()
        } as Partial<GDPRExportData>);

        // Start async export process (in production, this would be a background job)
        processGDPRExport(exportRequest.id, userId, tenantId).catch(error => {
            console.error('Background GDPR export failed:', error);
        });

        return Ok({
            exportId: exportRequest.id,
            userId,
            requestedAt: exportRequest.created!,
            status: 'pending'
        });
    } catch (error) {
        if (error instanceof AppError) {
            return Err(error);
        }
        return Err(new AppError(
            error instanceof Error ? error.message : 'Failed to initiate data export',
            'GDPR_EXPORT_FAILED',
            500
        ));
    }
}

/**
 * Process GDPR export (background task)
 */
async function processGDPRExport(exportId: string, userId: string, tenantId?: string): Promise<void> {
    const pb = pocketBaseClient.getRawClient();
    try {
        // Update status to processing
        await pb.collection('gdpr_export_requests').update(exportId, {
            status: 'processing',
            processing_started_at: new Date().toISOString()
        });

        // Collections to export
        const collections = [
            'users',
            'messages',
            'wellness_logs',
            'assignments',
            'submissions',
            'grades',
            'courses',
            'attendance',
            'notifications',
            'activity_logs',
            'documents'
        ];

        const exportData: UserExportData = {
            profile: {
                id: userId,
                name: '',
                email: '',
                role: 'User',
                verified: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            activities: [],
            messages: [],
            documents: [],
            metadata: {
                totalRecords: 0,
                collections: [],
                format: 'json',
                exportedAt: new Date().toISOString(),
                collectionCount: 0
            },
            collections: {}
        };

        // Fetch user profile
        try {
            const user = await pb.collection('users').getOne(userId);
            exportData.profile = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.created,
                updatedAt: user.updated,
                verified: user.verified,
                avatar: user.avatar,
                tenantId: user.tenantId
            };
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
        }

        // Fetch data from each collection
        for (const collectionName of collections) {
            try {
                const filter = tenantId
                    ? `user = "${userId}" && tenantId = "${tenantId}"`
                    : `user = "${userId}"`;

                const records = await pb.collection(collectionName).getFullList({
                    filter,
                    requestKey: null
                });

                exportData.collections[collectionName] = records;
            } catch (err) {
                // Collection might not exist or user might not have data
                console.log(`No data in ${collectionName} for user ${userId}`);
            }
        }

        // Calculate totals
        exportData.metadata = {
            totalRecords: Object.values(exportData.collections).reduce(
                (sum, records: unknown) => sum + (Array.isArray(records) ? records.length : 0) as number,
                0
            ),
            collectionCount: Object.keys(exportData.collections).length,
            collections: Object.keys(exportData.collections),
            format: 'JSON',
            exportedAt: new Date().toISOString()
        };

        // In production, would upload to S3 and generate presigned URL
        // For now, store JSON directly
        const dataJson = JSON.stringify(exportData, null, 2);

        // Update export record with completion
        await pb.collection('gdpr_export_requests').update(exportId, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            data_json: dataJson,
            download_url: `/api/gdpr/exports/${exportId}/download`,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            total_records: exportData.metadata.totalRecords
        });

        console.log(`GDPR export completed for user ${userId}: ${exportData.metadata.totalRecords} records`);
    } catch (error) {
        console.error('Failed to process GDPR export:', error);

        // Update status to failed
        try {
            await pb.collection('gdpr_export_requests').update(exportId, {
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unknown error',
                failed_at: new Date().toISOString()
            });
        } catch (updateError) {
            console.error('Failed to update export status:', updateError);
        }
    }
}

/**
 * Check status of GDPR export
 */
export async function getGDPRExportStatus(exportId: string): Promise<GDPRExportData> {
    if (isMockEnv()) {
        return {
            exportId,
            userId: 'mock-user',
            requestedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            status: 'completed',
            downloadUrl: '/mock/download/url',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    }

    try {
        const pb = pocketBaseClient.getRawClient();
        const exportRequest = await pb.collection('gdpr_export_requests').getOne(exportId);

        return {
            exportId: exportRequest.id,
            userId: exportRequest.user,
            requestedAt: exportRequest.requested_at,
            completedAt: exportRequest.completed_at,
            status: exportRequest.status,
            downloadUrl: exportRequest.download_url,
            expiresAt: exportRequest.expires_at
        };
    } catch (error) {
        console.error('Failed to get export status:', error);
        throw new Error('Export request not found');
    }
}

/**
 * Download GDPR export data
 */
export async function downloadGDPRExport(exportId: string): Promise<string> {
    if (isMockEnv()) {
        return JSON.stringify({ message: 'Mock export data' }, null, 2);
    }

    try {
        const pb = pocketBaseClient.getRawClient();
        const exportRequest = await pb.collection('gdpr_export_requests').getOne(exportId);

        if (exportRequest.status !== 'completed') {
            throw new Error('Export is not yet completed');
        }

        if (new Date(exportRequest.expires_at) < new Date()) {
            throw new Error('Export has expired');
        }

        return exportRequest.data_json || JSON.stringify({ error: 'No data available' });
    } catch (error) {
        console.error('Failed to download export:', error);
        throw error;
    }
}

/**
 * Right to be forgotten - Delete all user data
 * CRITICAL: This is irreversible
 */
export async function executeRightToBeForgotten(userId: string, tenantId?: string, reason?: string): Promise<{
    success: boolean;
    deletedRecords: Record<string, number>;
    errors: string[];
}> {
    if (isMockEnv()) {
        return {
            success: true,
            deletedRecords: { users: 1, messages: 5, activities: 10 },
            errors: []
        };
    }

    const deletedRecords: Record<string, number> = {};
    const errors: string[] = [];

    try {
        const pb = pocketBaseClient.getRawClient();
        // Create deletion audit log before deleting
        await pb.collection('gdpr_deletion_requests').create({
            user: userId,
            tenantId: tenantId || null,
            reason: reason || 'User requested deletion',
            requested_at: new Date().toISOString(),
            status: 'processing'
        });

        // Collections to delete from (order matters - delete dependencies first)
        const collectionsToDelete = [
            'notifications',
            'activity_logs',
            'submissions',
            'grades',
            'attendance',
            'wellness_logs',
            'messages',
            'documents',
            'assignments', // Only if user is creator
            'courses' // Only if user is creator
        ];

        // Delete from each collection
        for (const collectionName of collectionsToDelete) {
            try {
                const filter = tenantId
                    ? `user = "${userId}" && tenantId = "${tenantId}"`
                    : `user = "${userId}"`;

                const records = await pb.collection(collectionName).getFullList({
                    filter,
                    requestKey: null
                });

                for (const record of records) {
                    try {
                        await pb.collection(collectionName).delete(record.id);
                    } catch (deleteError) {
                        console.error(`Failed to delete ${collectionName} record ${record.id}:`, deleteError);
                        errors.push(`Failed to delete ${collectionName} record`);
                    }
                }

                deletedRecords[collectionName] = records.length;
                console.log(`Deleted ${records.length} records from ${collectionName}`);
            } catch (err) {
                console.log(`No data in ${collectionName} for user ${userId}`);
                deletedRecords[collectionName] = 0;
            }
        }

        // Anonymize user record instead of deleting (for audit trail)
        try {
            await pb.collection('users').update(userId, {
                name: '[Deleted User]',
                email: `deleted-${userId}@gdpr-anonymized.local`,
                avatar: null,
                bio: null,
                phone: null,
                address: null,
                deleted: true,
                deleted_at: new Date().toISOString(),
                deletion_reason: reason || 'GDPR right to be forgotten'
            });
            deletedRecords['users'] = 1;
        } catch (err) {
            console.error('Failed to anonymize user record:', err);
            errors.push('Failed to anonymize user record');
        }

        // Update deletion request to completed
        await pb.collection('gdpr_deletion_requests').update(userId, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            records_deleted: JSON.stringify(deletedRecords),
            errors: errors.length > 0 ? JSON.stringify(errors) : null
        });

        return {
            success: errors.length === 0,
            deletedRecords,
            errors
        };
    } catch (error) {
        console.error('Failed to execute right to be forgotten:', error);
        errors.push('Critical failure during deletion process');

        return {
            success: false,
            deletedRecords,
            errors
        };
    }
}

/**
 * List user's GDPR export requests
 */
export async function listGDPRExports(userId: string): Promise<GDPRExportData[]> {
    if (isMockEnv()) {
        return [];
    }

    try {
        const pb = pocketBaseClient.getRawClient();
        const requests = await pb.collection('gdpr_export_requests').getFullList({
            filter: `user = "${userId}"`,
            sort: '-created'
        });

        return requests.map(req => ({
            exportId: req.id,
            userId: req.user,
            requestedAt: req.requested_at,
            completedAt: req.completed_at,
            status: req.status,
            downloadUrl: req.download_url,
            expiresAt: req.expires_at
        }));
    } catch (error) {
        console.error('Failed to list GDPR exports:', error);
        return [];
    }
}
