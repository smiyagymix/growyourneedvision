import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

/**
 * Audit logging service for tracking user actions
 */
export async function logAuditEvent(eventData) {
    try {
        const { action, userId, userEmail, resource, details, ipAddress } = eventData;

        await pb.collection('audit_logs').create({
            action,
            userId: userId || 'system',
            userEmail: userEmail || 'unknown',
            resource,
            details: JSON.stringify(details || {}),
            ipAddress: ipAddress || 'unknown',
            timestamp: new Date().toISOString()
        });

        console.log(`[AUDIT] ${action} - ${userEmail} - ${resource}`);
    } catch (error) {
        // Don't throw - audit logging failures shouldn't break the app
        console.error('Error logging audit event:', error);
    }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters = {}) {
    try {
        const { userId, action, resource, startDate, endDate, page = 1, perPage = 50 } = filters;

        let filterString = '';
        const conditions = [];

        if (userId) conditions.push(`userId = "${userId}"`);
        if (action) conditions.push(`action = "${action}"`);
        if (resource) conditions.push(`resource = "${resource}"`);
        if (startDate) conditions.push(`timestamp >= "${startDate}"`);
        if (endDate) conditions.push(`timestamp <= "${endDate}"`);

        if (conditions.length > 0) {
            filterString = conditions.join(' && ');
        }

        const logs = await pb.collection('audit_logs').getList(page, perPage, {
            filter: filterString,
            sort: '-timestamp'
        });

        return logs;
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
    }
}

/**
 * Get audit statistics
 */
export async function getAuditStats() {
    try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [total, last24h, last7d] = await Promise.all([
            pb.collection('audit_logs').getList(1, 1),
            pb.collection('audit_logs').getList(1, 1, {
                filter: `timestamp >= "${last24Hours}"`
            }),
            pb.collection('audit_logs').getList(1, 1, {
                filter: `timestamp >= "${last7Days}"`
            })
        ]);

        return {
            total: total.totalItems,
            last24Hours: last24h.totalItems,
            last7Days: last7d.totalItems
        };
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        return { total: 0, last24Hours: 0, last7Days: 0 };
    }
}

export default {
    logAuditEvent,
    getAuditLogs,
    getAuditStats
};
