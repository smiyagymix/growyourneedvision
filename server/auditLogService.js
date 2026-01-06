import PocketBase from 'pocketbase';
import { randomUUID } from 'crypto';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

/**
 * Audit Log Service
 * Tracks all critical operations for compliance and debugging
 *
 * @typedef {Object} AuditLogEntry
 * @property {string} [id]
 * @property {string} timestamp
 * @property {string} userId
 * @property {string} userEmail
 * @property {string} action
 * @property {string} resource
 * @property {string} [resourceId]
 * @property {Record<string, any>} details
 * @property {string} [ipAddress]
 * @property {string} [userAgent]
 * @property {'success'|'failure'|'pending'} status
 * @property {string} [errorMessage]
 */

/**
 * Log an audit event
 * @param {Object} entry - Audit log entry (excluding id and timestamp)
 * @returns {Promise<void>}
 */
export async function logAudit(entry) {
    try {
        const auditEntry = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            ...entry
        };

        // Log to console for development
        console.log('[AUDIT]', JSON.stringify(auditEntry, null, 2));

        // Try to save to PocketBase if authenticated
        try {
            await pb.collection('audit_logs').create(auditEntry);
        } catch (pbError) {
            // If PocketBase fails, still log to console/file
            console.warn('[AUDIT] Failed to save to PocketBase, logged to console only:', pbError);
        }

        // Also log to file for persistent storage
        await logToFile(auditEntry);
    } catch (error) {
        console.error('[AUDIT] Failed to log audit entry:', error);
    }
}

/**
 * Log export actions
 */
export async function logExport(params) {
    await logAudit({
        userId: params.userId,
        userEmail: params.userEmail,
        action: 'EXPORT',
        resource: 'data_export',
        resourceId: params.fileName,
        details: {
            exportType: params.exportType,
            fileName: params.fileName,
            recordCount: params.recordCount,
            fileSize: params.fileSize
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        status: 'success'
    });
}

/**
 * Log subscription lifecycle changes
 */
export async function logSubscriptionChange(params) {
    await logAudit({
        userId: params.userId,
        userEmail: params.userEmail,
        action: `SUBSCRIPTION_${params.action.toUpperCase()}`,
        resource: 'subscription',
        resourceId: params.subscriptionId,
        details: {
            customerId: params.customerId,
            previousPlan: params.previousPlan,
            newPlan: params.newPlan,
            reason: params.reason
        },
        ipAddress: params.ipAddress,
        status: 'success'
    });
}

/**
 * Log report generation
 */
export async function logReportGeneration(params) {
    await logAudit({
        userId: params.userId,
        userEmail: params.userEmail,
        action: 'GENERATE_REPORT',
        resource: 'report',
        details: {
            reportType: params.reportType,
            filters: params.filters,
            format: params.format
        },
        ipAddress: params.ipAddress,
        status: 'success'
    });
}

/**
 * Log data access
 */
export async function logDataAccess(params) {
    await logAudit({
        userId: params.userId,
        userEmail: params.userEmail,
        action: `DATA_${params.action.toUpperCase()}`,
        resource: params.resource,
        resourceId: params.resourceId,
        details: {},
        ipAddress: params.ipAddress,
        status: 'success'
    });
}

/**
 * Log authentication events
 */
export async function logAuth(params) {
    await logAudit({
        userId: params.userId || 'unknown',
        userEmail: params.userEmail,
        action: `AUTH_${params.action.toUpperCase()}`,
        resource: 'authentication',
        details: {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        status: params.errorMessage ? 'failure' : 'success',
        errorMessage: params.errorMessage
    });
}

/**
 * Log administrative actions
 */
export async function logAdminAction(params) {
    await logAudit({
        userId: params.userId,
        userEmail: params.userEmail,
        action: `ADMIN_${params.action.toUpperCase()}`,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.ipAddress,
        status: 'success'
    });
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters) {
    try {
        const filterConditions = [];
        
        if (filters.userId) filterConditions.push(`userId = "${filters.userId}"`);
        if (filters.action) filterConditions.push(`action = "${filters.action}"`);
        if (filters.resource) filterConditions.push(`resource = "${filters.resource}"`);
        if (filters.startDate) filterConditions.push(`timestamp >= "${filters.startDate}"`);
        if (filters.endDate) filterConditions.push(`timestamp <= "${filters.endDate}"`);

        const filterString = filterConditions.length > 0 ? filterConditions.join(' && ') : '';

        const records = await pb.collection('audit_logs').getList(1, filters.limit || 100, {
            filter: filterString,
            sort: '-timestamp',
            requestKey: null
        });

        return records.items;
    } catch (error) {
        console.error('[AUDIT] Failed to fetch audit logs:', error);
        return [];
    }
}

/**
 * Export audit logs
 */
export async function exportAuditLogs(params) {
    const logs = await getAuditLogs({
        startDate: params.startDate,
        endDate: params.endDate,
        limit: 10000
    });

    if (params.format === 'csv') {
        const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'Status', 'IP Address'];
        const rows = logs.map(log => [
            log.timestamp,
            log.userEmail,
            log.action,
            log.resource,
            log.resourceId || '',
            log.status,
            log.ipAddress || ''
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
    } else {
        return JSON.stringify(logs, null, 2);
    }
}

/**
 * Log to file (fallback for when PocketBase is unavailable)
 */
async function logToFile(entry) {
    // In production, you would write to a persistent log file
    // For now, we'll just log to console
    const logLine = `${entry.timestamp} [${entry.action}] ${entry.userEmail} - ${entry.resource}${entry.resourceId ? '/' + entry.resourceId : ''} - ${entry.status}`;
    console.log('[AUDIT FILE]', logLine);
}

/**
 * Cleanup old audit logs (retention policy)
 */
export async function cleanupOldLogs(retentionDays = 90) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const oldLogs = await pb.collection('audit_logs').getList(1, 1000, {
            filter: `timestamp < "${cutoffDate.toISOString()}"`,
            requestKey: null
        });

        let deletedCount = 0;
        for (const log of oldLogs.items) {
            try {
                await pb.collection('audit_logs').delete(log.id);
                deletedCount++;
            } catch (err) {
                console.error(`Failed to delete audit log ${log.id}:`, err);
            }
        }

        console.log(`[AUDIT] Cleaned up ${deletedCount} old audit logs (older than ${retentionDays} days)`);
        return deletedCount;
    } catch (error) {
        console.error('[AUDIT] Failed to cleanup old logs:', error);
        return 0;
    }
}

export default {
    logAudit,
    logExport,
    logSubscriptionChange,
    logReportGeneration,
    logDataAccess,
    logAuth,
    logAdminAction,
    getAuditLogs,
    exportAuditLogs,
    cleanupOldLogs
};






