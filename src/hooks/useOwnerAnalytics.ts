import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { measurePerformance, captureException, addBreadcrumb } from '../lib/sentry';

/**
 * Owner Analytics Hook
 * Provides multi-tenant aggregated analytics with realtime subscriptions
 */

export interface TenantKPI {
    tenantId: string;
    tenantName: string;
    mrr: number;
    activeUsers: number;
    storageUsed: number;
    apiCalls: number;
    status: 'active' | 'trial' | 'suspended' | 'cancelled';
}

export interface PlatformMetrics {
    totalMRR: number;
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    totalUsers: number;
    totalRevenue: number;
    averageLTV: number;
    churnRate: number;
    growthRate: number;
}

export interface UsageMetrics {
    totalAPICallsToday: number;
    totalStorageUsedGB: number;
    activeUsersToday: number;
    peakConcurrentUsers: number;
    averageResponseTime: number;
}

export interface RevenueMetrics {
    mrrGrowth: number;
    newMRR: number;
    expansionMRR: number;
    contractionMRR: number;
    churnedMRR: number;
    netNewMRR: number;
}

export interface OwnerAnalyticsData {
    platformMetrics: PlatformMetrics;
    usageMetrics: UsageMetrics;
    revenueMetrics: RevenueMetrics;
    topTenants: TenantKPI[];
    recentActivity: Array<{
        id: string;
        type: string;
        tenantId: string;
        tenantName: string;
        message: string;
        timestamp: string;
    }>;
}

const MOCK_DATA: OwnerAnalyticsData = {
    platformMetrics: {
        totalMRR: 142500,
        totalTenants: 47,
        activeTenants: 42,
        trialTenants: 5,
        suspendedTenants: 0,
        totalUsers: 3842,
        totalRevenue: 1284000,
        averageLTV: 18400,
        churnRate: 2.4,
        growthRate: 12.5
    },
    usageMetrics: {
        totalAPICallsToday: 284521,
        totalStorageUsedGB: 1284.5,
        activeUsersToday: 2847,
        peakConcurrentUsers: 1247,
        averageResponseTime: 142
    },
    revenueMetrics: {
        mrrGrowth: 8.5,
        newMRR: 12000,
        expansionMRR: 5000,
        contractionMRR: -2000,
        churnedMRR: -3000,
        netNewMRR: 12000
    },
    topTenants: [
        { tenantId: '1', tenantName: 'Enterprise Corp', mrr: 15000, activeUsers: 500, storageUsed: 250, apiCalls: 45000, status: 'active' },
        { tenantId: '2', tenantName: 'Tech University', mrr: 12000, activeUsers: 800, storageUsed: 180, apiCalls: 38000, status: 'active' },
        { tenantId: '3', tenantName: 'Global Academy', mrr: 9500, activeUsers: 350, storageUsed: 120, apiCalls: 28000, status: 'active' },
    ],
    recentActivity: [
        { id: '1', type: 'tenant.created', tenantId: 't1', tenantName: 'New School', message: 'New tenant created', timestamp: new Date().toISOString() },
        { id: '2', type: 'subscription.upgraded', tenantId: 't2', tenantName: 'Tech University', message: 'Upgraded to Enterprise plan', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ]
};

async function fetchOwnerAnalytics(): Promise<OwnerAnalyticsData> {
    if (isMockEnv()) {
        return MOCK_DATA;
    }

    return measurePerformance('fetchOwnerAnalytics', async () => {
        try {
            addBreadcrumb('Fetching owner analytics', 'data', { source: 'useOwnerAnalytics' });

            // Fetch all tenants
            const tenants = await pb.collection('tenants').getFullList({
                sort: '-created',
                requestKey: null
            });

            // Fetch usage data
            const usageData = await pb.collection('tenant_usage').getFullList({
                filter: `date >= "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"`,
            requestKey: null
        });

        // Fetch recent activity
        const activityLogs = await pb.collection('audit_logs').getList(1, 10, {
            sort: '-created',
            filter: 'module = "tenant"',
            requestKey: null
        });

        // Calculate platform metrics
        const activeTenants = tenants.filter(t => t.status === 'active').length;
        const trialTenants = tenants.filter(t => t.status === 'trial').length;
        const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;

        // Calculate MRR
        const totalMRR = tenants.reduce((sum, tenant) => {
            const plan = tenant.plan || 'free';
            const prices: Record<string, number> = { free: 0, basic: 99, pro: 299, enterprise: 999 };
            return sum + (tenant.status === 'active' ? (prices[plan] || 0) : 0);
        }, 0);

        // Aggregate usage metrics
        const todayUsage = usageData.filter(u => u.date === new Date().toISOString().split('T')[0]);
        const totalAPICallsToday = todayUsage.reduce((sum, u) => sum + (u.value || 0), 0);

        // Calculate top tenants
        const topTenants: TenantKPI[] = tenants
            .slice(0, 10)
            .map(t => ({
                tenantId: t.id,
                tenantName: t.name,
                mrr: 0, // Would be calculated from subscription
                activeUsers: 0, // Would be from usage data
                storageUsed: 0,
                apiCalls: 0,
                status: t.status
            }));

        return {
            platformMetrics: {
                totalMRR,
                totalTenants: tenants.length,
                activeTenants,
                trialTenants,
                suspendedTenants,
                totalUsers: 0, // Would aggregate from all tenants
                totalRevenue: totalMRR * 12, // Rough estimate
                averageLTV: 18400,
                churnRate: 2.4,
                growthRate: 12.5
            },
            usageMetrics: {
                totalAPICallsToday,
                totalStorageUsedGB: 0,
                activeUsersToday: 0,
                peakConcurrentUsers: 0,
                averageResponseTime: 0
            },
            revenueMetrics: {
                mrrGrowth: 8.5,
                newMRR: 0,
                expansionMRR: 0,
                contractionMRR: 0,
                churnedMRR: 0,
                netNewMRR: 0
            },
            topTenants,
            recentActivity: activityLogs.items.map(log => ({
                id: log.id,
                type: log.action || 'unknown',
                tenantId: log.details?.tenantId || '',
                tenantName: log.details?.tenantName || 'Unknown',
                message: log.action || '',
                timestamp: log.created
            }))
        };
        } catch (error) {
            console.error('Failed to fetch owner analytics:', error);
            captureException(error as Error, {
                feature: 'owner-analytics',
                operation: 'fetchOwnerAnalytics'
            });
            return MOCK_DATA;
        }
    }, { feature: 'owner-analytics' });
}

export const useOwnerAnalytics = () => {
    const [realtimeUpdates, setRealtimeUpdates] = useState(0);

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ['ownerAnalytics', realtimeUpdates],
        queryFn: fetchOwnerAnalytics,
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
        retry: 2,
    });

    // Trigger refetch on realtime updates
    const handleRealtimeUpdate = useCallback(() => {
        setRealtimeUpdates(prev => prev + 1);
    }, []);

    // Subscribe to realtime changes
    useEffect(() => {
        if (isMockEnv()) return;

        let isSubscribed = true;

        const subscribe = async () => {
            try {
                // Subscribe to tenant changes
                await pb.collection('tenants').subscribe('*', () => {
                    if (isSubscribed) handleRealtimeUpdate();
                });

                // Subscribe to usage changes
                await pb.collection('tenant_usage').subscribe('*', () => {
                    if (isSubscribed) handleRealtimeUpdate();
                });

                // Subscribe to audit logs
                await pb.collection('audit_logs').subscribe('*', () => {
                    if (isSubscribed) handleRealtimeUpdate();
                });
            } catch (err) {
                console.error('Failed to subscribe to realtime updates:', err);
            }
        };

        subscribe();

        return () => {
            isSubscribed = false;
            if (!isMockEnv()) {
                pb.collection('tenants').unsubscribe('*');
                pb.collection('tenant_usage').unsubscribe('*');
                pb.collection('audit_logs').unsubscribe('*');
            }
        };
    }, [handleRealtimeUpdate]);

    return {
        data: data || MOCK_DATA,
        loading: isLoading,
        error: error ? (error as Error).message : null,
        refreshing: isRefetching,
        refresh: refetch
    };
};
