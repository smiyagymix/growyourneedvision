import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

/**
 * System Alerts Hook
 * Real-time monitoring alerts for critical metrics
 */

export interface SystemAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    category: 'revenue' | 'usage' | 'performance' | 'security' | 'system';
    title: string;
    message: string;
    metric?: string;
    currentValue?: number;
    threshold?: number;
    tenantId?: string;
    tenantName?: string;
    timestamp: string;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    resolved: boolean;
    resolvedAt?: string;
    actionUrl?: string;
}

const MOCK_ALERTS: SystemAlert[] = [
    {
        id: '1',
        type: 'critical',
        category: 'revenue',
        title: 'MRR Drop Detected',
        message: 'Monthly Recurring Revenue dropped by 12% in the last 24 hours',
        metric: 'mrr',
        currentValue: 125000,
        threshold: 140000,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
        resolved: false,
        actionUrl: '/owner/revenue-analysis'
    },
    {
        id: '2',
        type: 'warning',
        category: 'usage',
        title: 'API Usage Spike',
        message: 'Tenant "Enterprise Corp" exceeded normal API usage by 250%',
        metric: 'api_calls',
        currentValue: 450000,
        threshold: 180000,
        tenantId: 't1',
        tenantName: 'Enterprise Corp',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
        acknowledgedBy: 'admin@platform.com',
        acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        resolved: false,
        actionUrl: '/owner/tenants/t1'
    },
    {
        id: '3',
        type: 'warning',
        category: 'performance',
        title: 'Slow Response Times',
        message: 'Average API response time increased to 1.2s (threshold: 500ms)',
        metric: 'response_time',
        currentValue: 1200,
        threshold: 500,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        acknowledged: false,
        resolved: false,
        actionUrl: '/owner/system-health'
    },
    {
        id: '4',
        type: 'info',
        category: 'system',
        title: 'Scheduled Maintenance',
        message: 'Database maintenance scheduled for Dec 30, 2025 at 2:00 AM UTC',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
        acknowledgedBy: 'system',
        acknowledgedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        resolved: false
    }
];

async function fetchSystemAlerts(): Promise<SystemAlert[]> {
    if (isMockEnv()) {
        return MOCK_ALERTS;
    }

    try {
        const alerts = await pb.collection('system_alerts').getFullList({
            filter: 'resolved = false',
            sort: '-created',
            requestKey: null
        });

        return alerts.map(alert => ({
            id: alert.id,
            type: alert.severity || 'info',
            category: alert.category || 'system',
            title: alert.title || '',
            message: alert.message || '',
            metric: alert.metric,
            currentValue: alert.currentValue,
            threshold: alert.threshold,
            tenantId: alert.tenantId,
            tenantName: alert.tenantName,
            timestamp: alert.created,
            acknowledged: alert.acknowledged || false,
            acknowledgedBy: alert.acknowledgedBy,
            acknowledgedAt: alert.acknowledgedAt,
            resolved: alert.resolved || false,
            resolvedAt: alert.resolvedAt,
            actionUrl: alert.actionUrl
        }));
    } catch (error) {
        console.error('Failed to fetch system alerts:', error);
        return MOCK_ALERTS;
    }
}

export const useSystemAlerts = () => {
    const [realtimeUpdates, setRealtimeUpdates] = useState(0);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['systemAlerts', realtimeUpdates],
        queryFn: fetchSystemAlerts,
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
        retry: 2,
    });

    // Subscribe to realtime alerts
    useEffect(() => {
        if (isMockEnv()) return;

        let isSubscribed = true;

        const subscribe = async () => {
            try {
                await pb.collection('system_alerts').subscribe('*', () => {
                    if (isSubscribed) {
                        setRealtimeUpdates(prev => prev + 1);
                    }
                });
            } catch (err) {
                console.error('Failed to subscribe to system alerts:', err);
            }
        };

        subscribe();

        return () => {
            isSubscribed = false;
            if (!isMockEnv()) {
                pb.collection('system_alerts').unsubscribe('*');
            }
        };
    }, []);

    const acknowledgeAlert = async (alertId: string, userId: string) => {
        try {
            if (!isMockEnv()) {
                await pb.collection('system_alerts').update(alertId, {
                    acknowledged: true,
                    acknowledgedBy: userId,
                    acknowledgedAt: new Date().toISOString()
                });
            }
            refetch();
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
            throw error;
        }
    };

    const resolveAlert = async (alertId: string) => {
        try {
            if (!isMockEnv()) {
                await pb.collection('system_alerts').update(alertId, {
                    resolved: true,
                    resolvedAt: new Date().toISOString()
                });
            }
            refetch();
        } catch (error) {
            console.error('Failed to resolve alert:', error);
            throw error;
        }
    };

    const criticalAlerts = (data || []).filter(a => a.type === 'critical' && !a.acknowledged);
    const warningAlerts = (data || []).filter(a => a.type === 'warning' && !a.acknowledged);
    const unacknowledgedCount = criticalAlerts.length + warningAlerts.length;

    return {
        alerts: data || [],
        criticalAlerts,
        warningAlerts,
        unacknowledgedCount,
        loading: isLoading,
        error: error ? (error as Error).message : null,
        refresh: refetch,
        acknowledgeAlert,
        resolveAlert
    };
};
