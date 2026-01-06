/**
 * Owner Tenant Service
 * Specialized service for bulk tenant operations and management
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { logAudit } from './auditAdminService';
import { sendTenantWelcomeEmail, sendAccountSuspendedEmail } from './emailTemplateService';

export interface BulkOperationResult {
    success: boolean;
    successCount: number;
    failureCount: number;
    results: Array<{
        tenantId: string;
        tenantName: string;
        success: boolean;
        error?: string;
    }>;
}

/**
 * Bulk suspend tenants
 */
export async function bulkSuspendTenants(
    tenantIds: string[],
    reason: string,
    userId: string
): Promise<BulkOperationResult> {
    if (isMockEnv()) {
        return {
            success: true,
            successCount: tenantIds.length,
            failureCount: 0,
            results: tenantIds.map(id => ({
                tenantId: id,
                tenantName: 'Mock Tenant',
                success: true
            }))
        };
    }

    const results: BulkOperationResult['results'] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const tenantId of tenantIds) {
        try {
            const tenant = await pb.collection('tenants').getOne(tenantId);
            
            await pb.collection('tenants').update(tenantId, {
                status: 'suspended',
                suspended_at: new Date().toISOString(),
                suspension_reason: reason,
                updated: new Date().toISOString()
            });

            // Log audit
            await logAudit({
                action: 'tenant.suspended',
                resourceType: 'tenant',
                resourceId: tenantId,
                tenantId,
                userId,
                metadata: { reason, previous_status: tenant.status },
                severity: 'medium'
            });

            results.push({
                tenantId,
                tenantName: tenant.name,
                success: true
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to suspend tenant ${tenantId}:`, error);
            results.push({
                tenantId,
                tenantName: 'Unknown',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            failureCount++;
        }
    }

    return {
        success: failureCount === 0,
        successCount,
        failureCount,
        results
    };
}

/**
 * Bulk activate tenants
 */
export async function bulkActivateTenants(
    tenantIds: string[],
    userId: string
): Promise<BulkOperationResult> {
    if (isMockEnv()) {
        return {
            success: true,
            successCount: tenantIds.length,
            failureCount: 0,
            results: tenantIds.map(id => ({
                tenantId: id,
                tenantName: 'Mock Tenant',
                success: true
            }))
        };
    }

    const results: BulkOperationResult['results'] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const tenantId of tenantIds) {
        try {
            const tenant = await pb.collection('tenants').getOne(tenantId);
            
            await pb.collection('tenants').update(tenantId, {
                status: 'active',
                suspended_at: null,
                suspension_reason: null,
                activated_at: new Date().toISOString(),
                updated: new Date().toISOString()
            });

            // Log audit
            await logAudit({
                action: 'tenant.activated',
                resourceType: 'tenant',
                resourceId: tenantId,
                tenantId,
                userId,
                metadata: { previous_status: tenant.status },
                severity: 'low'
            });

            results.push({
                tenantId,
                tenantName: tenant.name,
                success: true
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to activate tenant ${tenantId}:`, error);
            results.push({
                tenantId,
                tenantName: 'Unknown',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            failureCount++;
        }
    }

    return {
        success: failureCount === 0,
        successCount,
        failureCount,
        results
    };
}

/**
 * Bulk update tenant plan
 */
export async function bulkUpdateTenantPlan(
    tenantIds: string[],
    newPlan: string,
    userId: string
): Promise<BulkOperationResult> {
    if (isMockEnv()) {
        return {
            success: true,
            successCount: tenantIds.length,
            failureCount: 0,
            results: tenantIds.map(id => ({
                tenantId: id,
                tenantName: 'Mock Tenant',
                success: true
            }))
        };
    }

    const results: BulkOperationResult['results'] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const tenantId of tenantIds) {
        try {
            const tenant = await pb.collection('tenants').getOne(tenantId);
            
            await pb.collection('tenants').update(tenantId, {
                plan: newPlan,
                plan_updated_at: new Date().toISOString(),
                updated: new Date().toISOString()
            });

            // Log audit
            await logAudit({
                action: 'tenant.plan_updated',
                resourceType: 'tenant',
                resourceId: tenantId,
                tenantId,
                userId,
                metadata: { 
                    previous_plan: tenant.plan,
                    new_plan: newPlan
                },
                severity: 'low'
            });

            results.push({
                tenantId,
                tenantName: tenant.name,
                success: true
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to update plan for tenant ${tenantId}:`, error);
            results.push({
                tenantId,
                tenantName: 'Unknown',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            failureCount++;
        }
    }

    return {
        success: failureCount === 0,
        successCount,
        failureCount,
        results
    };
}

/**
 * Bulk delete/archive tenants (soft delete)
 */
export async function bulkArchiveTenants(
    tenantIds: string[],
    reason: string,
    userId: string
): Promise<BulkOperationResult> {
    if (isMockEnv()) {
        return {
            success: true,
            successCount: tenantIds.length,
            failureCount: 0,
            results: tenantIds.map(id => ({
                tenantId: id,
                tenantName: 'Mock Tenant',
                success: true
            }))
        };
    }

    const results: BulkOperationResult['results'] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const tenantId of tenantIds) {
        try {
            const tenant = await pb.collection('tenants').getOne(tenantId);
            
            await pb.collection('tenants').update(tenantId, {
                status: 'cancelled',
                archived: true,
                archived_at: new Date().toISOString(),
                archive_reason: reason,
                updated: new Date().toISOString()
            });

            // Log audit with high severity
            await logAudit({
                action: 'tenant.archived',
                resourceType: 'tenant',
                resourceId: tenantId,
                tenantId,
                userId,
                metadata: { 
                    reason,
                    previous_status: tenant.status,
                    tenant_name: tenant.name
                },
                severity: 'high'
            });

            results.push({
                tenantId,
                tenantName: tenant.name,
                success: true
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to archive tenant ${tenantId}:`, error);
            results.push({
                tenantId,
                tenantName: 'Unknown',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            failureCount++;
        }
    }

    return {
        success: failureCount === 0,
        successCount,
        failureCount,
        results
    };
}

/**
 * Bulk send notification to tenants
 */
export async function bulkNotifyTenants(
    tenantIds: string[],
    notification: {
        title: string;
        message: string;
        type: 'info' | 'warning' | 'success' | 'error';
    },
    userId: string
): Promise<BulkOperationResult> {
    if (isMockEnv()) {
        return {
            success: true,
            successCount: tenantIds.length,
            failureCount: 0,
            results: tenantIds.map(id => ({
                tenantId: id,
                tenantName: 'Mock Tenant',
                success: true
            }))
        };
    }

    const results: BulkOperationResult['results'] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const tenantId of tenantIds) {
        try {
            const tenant = await pb.collection('tenants').getOne(tenantId);
            
            // Get tenant admin users
            const admins = await pb.collection('users').getFullList({
                filter: `tenantId = "${tenantId}" && role = "SchoolAdmin"`,
                requestKey: null
            });

            // Create notification for each admin
            for (const admin of admins) {
                await pb.collection('notifications').create({
                    user: admin.id,
                    tenantId,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    is_read: false,
                    created_by: userId
                });
            }

            // Log audit
            await logAudit({
                action: 'tenant.notification_sent',
                resourceType: 'tenant',
                resourceId: tenantId,
                tenantId,
                userId,
                metadata: { 
                    notification,
                    recipient_count: admins.length
                },
                severity: 'low'
            });

            results.push({
                tenantId,
                tenantName: tenant.name,
                success: true
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to notify tenant ${tenantId}:`, error);
            results.push({
                tenantId,
                tenantName: 'Unknown',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            failureCount++;
        }
    }

    return {
        success: failureCount === 0,
        successCount,
        failureCount,
        results
    };
}

/**
 * Get tenant health scores for multiple tenants
 */
export async function getBulkTenantHealth(tenantIds: string[]): Promise<Record<string, number>> {
    if (isMockEnv()) {
        return tenantIds.reduce((acc, id) => {
            acc[id] = Math.floor(Math.random() * 40) + 60; // 60-100
            return acc;
        }, {} as Record<string, number>);
    }

    const healthScores: Record<string, number> = {};

    for (const tenantId of tenantIds) {
        try {
            // Simplified health calculation
            const tenant = await pb.collection('tenants').getOne(tenantId);
            const users = await pb.collection('users').getFullList({
                filter: `tenantId = "${tenantId}"`,
                requestKey: null
            });

            // Calculate basic health score
            let score = 50; // Base score
            
            // Status factor
            if (tenant.status === 'active') score += 30;
            else if (tenant.status === 'trial') score += 20;
            
            // User activity factor
            if (users.length > 0) score += 10;
            if (users.length > 10) score += 10;
            
            healthScores[tenantId] = Math.min(100, score);
        } catch (error) {
            console.error(`Failed to calculate health for tenant ${tenantId}:`, error);
            healthScores[tenantId] = 0;
        }
    }

    return healthScores;
}
