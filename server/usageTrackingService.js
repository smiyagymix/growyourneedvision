/**
 * Usage Tracking Service
 * Tracks tenant usage for billing and analytics
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

/**
 * Track API call for tenant
 */
export async function trackAPICall(tenantId, endpoint, method, responseTime) {
    try {
        const date = new Date();
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        // Increment or create usage record
        const records = await pb.collection('tenant_usage').getFullList({
            filter: `tenantId = "${tenantId}" && date = "${dateKey}" && metricType = "api_calls"`
        });

        if (records.length > 0) {
            // Update existing record
            const record = records[0];
            await pb.collection('tenant_usage').update(record.id, {
                value: (record.value || 0) + 1,
                metadata: {
                    ...record.metadata,
                    avgResponseTime: ((record.metadata?.avgResponseTime || 0) * record.value + responseTime) / (record.value + 1),
                    lastEndpoint: endpoint,
                    lastMethod: method
                }
            });
        } else {
            // Create new record
            await pb.collection('tenant_usage').create({
                tenantId,
                date: dateKey,
                metricType: 'api_calls',
                value: 1,
                metadata: {
                    avgResponseTime: responseTime,
                    lastEndpoint: endpoint,
                    lastMethod: method
                }
            });
        }
    } catch (error) {
        console.error('Error tracking API call:', error);
        // Don't throw - usage tracking failures shouldn't break the app
    }
}

/**
 * Track storage usage for tenant
 */
export async function trackStorageUsage(tenantId, bytes, action = 'add') {
    try {
        const date = new Date().toISOString().split('T')[0];

        const records = await pb.collection('tenant_usage').getFullList({
            filter: `tenantId = "${tenantId}" && date = "${date}" && metricType = "storage"`
        });

        const delta = action === 'add' ? bytes : -bytes;

        if (records.length > 0) {
            const record = records[0];
            await pb.collection('tenant_usage').update(record.id, {
                value: Math.max(0, (record.value || 0) + delta)
            });
        } else {
            await pb.collection('tenant_usage').create({
                tenantId,
                date,
                metricType: 'storage',
                value: Math.max(0, delta)
            });
        }
    } catch (error) {
        console.error('Error tracking storage:', error);
    }
}

/**
 * Track active users for tenant
 */
export async function trackActiveUsers(tenantId, userId) {
    try {
        const date = new Date().toISOString().split('T')[0];

        const records = await pb.collection('tenant_usage').getFullList({
            filter: `tenantId = "${tenantId}" && date = "${date}" && metricType = "active_users"`
        });

        if (records.length > 0) {
            const record = records[0];
            const activeUsers = record.metadata?.activeUsers || [];
            
            if (!activeUsers.includes(userId)) {
                activeUsers.push(userId);
                await pb.collection('tenant_usage').update(record.id, {
                    value: activeUsers.length,
                    metadata: { activeUsers }
                });
            }
        } else {
            await pb.collection('tenant_usage').create({
                tenantId,
                date,
                metricType: 'active_users',
                value: 1,
                metadata: { activeUsers: [userId] }
            });
        }
    } catch (error) {
        console.error('Error tracking active users:', error);
    }
}

/**
 * Get usage summary for tenant
 */
export async function getUsageSummary(tenantId, startDate, endDate) {
    try {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        const records = await pb.collection('tenant_usage').getFullList({
            filter: `tenantId = "${tenantId}" && date >= "${start}" && date <= "${end}"`,
            sort: 'date'
        });

        const summary = {
            apiCalls: { total: 0, byDate: [] },
            storage: { current: 0, peak: 0, byDate: [] },
            activeUsers: { total: 0, byDate: [] }
        };

        for (const record of records) {
            if (record.metricType === 'api_calls') {
                summary.apiCalls.total += record.value;
                summary.apiCalls.byDate.push({ date: record.date, value: record.value });
            } else if (record.metricType === 'storage') {
                summary.storage.current = record.value;
                summary.storage.peak = Math.max(summary.storage.peak, record.value);
                summary.storage.byDate.push({ date: record.date, value: record.value });
            } else if (record.metricType === 'active_users') {
                summary.activeUsers.byDate.push({ date: record.date, value: record.value });
            }
        }

        // Calculate unique active users
        const allActiveUsers = new Set();
        records
            .filter(r => r.metricType === 'active_users')
            .forEach(r => {
                (r.metadata?.activeUsers || []).forEach(u => allActiveUsers.add(u));
            });
        summary.activeUsers.total = allActiveUsers.size;

        return summary;
    } catch (error) {
        console.error('Error getting usage summary:', error);
        throw error;
    }
}

/**
 * Calculate billing amount based on usage
 */
export async function calculateBilling(tenantId, startDate, endDate) {
    try {
        const summary = await getUsageSummary(tenantId, startDate, endDate);
        
        // Pricing tiers
        const pricing = {
            apiCall: 0.001,      // $0.001 per API call
            storage: 0.10,       // $0.10 per GB per month
            activeUser: 5.00     // $5 per active user per month
        };

        const costs = {
            apiCalls: summary.apiCalls.total * pricing.apiCall,
            storage: (summary.storage.current / (1024 ** 3)) * pricing.storage,
            activeUsers: summary.activeUsers.total * pricing.activeUser
        };

        const total = costs.apiCalls + costs.storage + costs.activeUsers;

        return {
            period: { startDate, endDate },
            usage: summary,
            costs,
            total: Math.round(total * 100) / 100,
            currency: 'USD'
        };
    } catch (error) {
        console.error('Error calculating billing:', error);
        throw error;
    }
}

/**
 * Check if tenant is over usage limits
 */
export async function checkUsageLimits(tenantId) {
    try {
        // Get tenant info
        const tenant = await pb.collection('tenants').getFirstListItem(`id = "${tenantId}"`);
        
        // Get current month usage
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const summary = await getUsageSummary(tenantId, startOfMonth, undefined);

        const limits = {
            storage: tenant.maxStorage * (1024 ** 2), // Convert MB to bytes
            users: tenant.maxUsers
        };

        const violations = [];

        if (summary.storage.current > limits.storage) {
            violations.push({
                type: 'storage',
                current: summary.storage.current,
                limit: limits.storage,
                overage: summary.storage.current - limits.storage
            });
        }

        if (summary.activeUsers.total > limits.users) {
            violations.push({
                type: 'users',
                current: summary.activeUsers.total,
                limit: limits.users,
                overage: summary.activeUsers.total - limits.users
            });
        }

        return {
            withinLimits: violations.length === 0,
            violations,
            usage: summary,
            limits
        };
    } catch (error) {
        console.error('Error checking usage limits:', error);
        throw error;
    }
}

export default {
    trackAPICall,
    trackStorageUsage,
    trackActiveUsers,
    getUsageSummary,
    calculateBilling,
    checkUsageLimits
};
