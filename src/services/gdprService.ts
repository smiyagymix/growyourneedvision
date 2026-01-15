/**
 * GDPR Compliance Service
 * Provides user data portability and right-to-be-forgotten functionality
 */

import { pocketBaseClient } from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { Result, Ok, Err } from '../lib/types';
import { AppError } from './errorHandler';
import { RecordModel } from 'pocketbase';
import { z } from 'zod';

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

const gdprExportRecordSchema = z.object({
    id: z.string(),
    user: z.string().optional(),
    requested_at: z.string().optional(),
    completed_at: z.string().optional(),
    status: z.union([z.literal('pending'), z.literal('processing'), z.literal('completed'), z.literal('failed')]),
    download_url: z.string().optional(),
    expires_at: z.string().optional(),
    data_json: z.string().optional(),
    created: z.string().optional(),
    updated: z.string().optional(),
    collectionId: z.string().optional(),
    collectionName: z.string().optional()
});
type ParsedGDPRExportRecord = z.infer<typeof gdprExportRecordSchema>;

function parseGDPRExportRecord(record: unknown): ParsedGDPRExportRecord | null {
    const parsed = gdprExportRecordSchema.safeParse(record);
    if (!parsed.success) {
        console.error('gdprService: failed to parse export record', parsed.error, record);
        return null;
    }
    return parsed.data;
}

/**
 * Request GDPR data export for a user
 * Aggregates all user data across collections
 */
export async function requestGDPRExport(userId: string, tenantId?: string): Promise<Result<GDPRExportData, AppError>> {
    if (isMockEnv()) {
        return Ok({
            id: 'mock-export-123',
            collectionId: 'gdpr_export_requests',
            collectionName: 'gdpr_export_requests',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            exportId: 'mock-export-123',
            userId,
            requested_at: new Date().toISOString(),
            status: 'pending'
        } as unknown as GDPRExportData);
    }

    try {
        const pb = pocketBaseClient.getRawClient();
        const exportService = createTypedCollection<GDPRExportData>('gdpr_export_requests');

        // Create export request record
        const exportRequest = await exportService.create({
            user: userId,
            tenantId: tenantId || undefined,
            status: 'pending',
            requested_at: new Date().toISOString()
        } as any);

        // Start async export process (in production, this would be a background job)
        processGDPRExport(exportRequest.id, userId, tenantId).catch(error => {
            console.error('Background GDPR export failed:', error);
        });

        return Ok({
            id: exportRequest.id,
            collectionId: 'gdpr_export_requests',
            collectionName: 'gdpr_export_requests',
            created: exportRequest.created,
            updated: exportRequest.updated,
            exportId: exportRequest.id,
            userId,
            requestedAt: exportRequest.created!,
            status: 'pending'
        } as unknown as GDPRExportData);
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
            id: exportId,
            collectionId: 'gdpr_export_requests',
            collectionName: 'gdpr_export_requests',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            exportId,
            userId: 'mock-user',
            requestedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            status: 'completed',
            downloadUrl: '/mock/download/url',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } as unknown as GDPRExportData;
    }

    try {
        const pb = pocketBaseClient.getRawClient();
        const exportRequest = await pb.collection('gdpr_export_requests').getOne(exportId);
        const parsed = parseGDPRExportRecord(exportRequest);
        if (!parsed) throw new Error('Export request invalid');

        return {
            id: parsed.id,
            collectionId: parsed.collectionId || 'gdpr_export_requests',
            collectionName: parsed.collectionName || 'gdpr_export_requests',
            created: parsed.created,
            updated: parsed.updated,
            exportId: parsed.id,
            userId: parsed.user || 'unknown',
            requestedAt: parsed.requested_at || parsed.created || new Date().toISOString(),
            completedAt: parsed.completed_at,
            status: parsed.status,
            downloadUrl: parsed.download_url,
            expiresAt: parsed.expires_at
        } as unknown as GDPRExportData;
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
        const parsed = parseGDPRExportRecord(exportRequest);
        if (!parsed) throw new Error('Export request invalid');

        if (parsed.status !== 'completed') {
            throw new Error('Export is not yet completed');
        }

        if (parsed.expires_at && new Date(parsed.expires_at) < new Date()) {
            throw new Error('Export has expired');
        }

        return parsed.data_json || JSON.stringify({ error: 'No data available' });
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

        const parsed = requests.map(parseGDPRExportRecord).filter((r): r is ParsedGDPRExportRecord => r !== null);

        return parsed.map(req => ({
            id: req.id,
            collectionId: req.collectionId || 'gdpr_export_requests',
            collectionName: req.collectionName || 'gdpr_export_requests',
            created: req.created,
            updated: req.updated,
            exportId: req.id,
            userId: req.user || userId,
            requestedAt: req.requested_at || req.created || new Date().toISOString(),
            completedAt: req.completed_at,
            status: req.status,
            downloadUrl: req.download_url,
            expiresAt: req.expires_at
        } as unknown as GDPRExportData));
    } catch (error) {
        console.error('Failed to list GDPR exports:', error);
        return [];
    }
}
