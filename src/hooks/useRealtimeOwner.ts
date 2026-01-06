/**
 * Real-time Owner Dashboard Updates Hook
 * Subscribes to critical Owner-level PocketBase collections with auto-refresh
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import pb from '../lib/pocketbase';
import { logger } from '../utils/logger';
import { useAuth } from '../context/AuthContext';

export interface RealtimeUpdate {
    collection: string;
    action: 'create' | 'update' | 'delete';
    record: any;
    timestamp: string;
}

interface UseRealtimeOwnerOptions {
    collections?: string[];
    autoRefresh?: boolean;
    refreshInterval?: number; // milliseconds
    onUpdate?: (update: RealtimeUpdate) => void;
}

const DEFAULT_OPTIONS: UseRealtimeOwnerOptions = {
    collections: [
        'tenants',
        'system_alerts',
        'tenant_usage',
        'abuse_reports',
        'compliance_records',
        'webhooks',
        'audit_logs',
    ],
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
};

export function useRealtimeOwner(options: UseRealtimeOwnerOptions = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { user } = useAuth();
    const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const unsubscribeFnsRef = useRef<Array<() => void>>([]);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleUpdate = useCallback(
        (collection: string, action: 'create' | 'update' | 'delete', record: any) => {
            const update: RealtimeUpdate = {
                collection,
                action,
                record,
                timestamp: new Date().toISOString(),
            };

            setUpdates((prev) => [update, ...prev.slice(0, 99)]); // Keep last 100 updates
            setLastUpdate(new Date());

            if (opts.onUpdate) {
                opts.onUpdate(update);
            }

            logger.info(`Owner realtime update: ${collection}.${action}`, {
                component: 'useRealtimeOwner',
                collection,
                action,
                recordId: record.id,
            });
        },
        [opts.onUpdate]
    );

    const subscribeToCollection = useCallback(
        async (collection: string) => {
            try {
                const unsubscribe = await pb.collection(collection).subscribe('*', (e) => {
                    handleUpdate(collection, e.action as 'create' | 'update' | 'delete', e.record);
                });

                unsubscribeFnsRef.current.push(unsubscribe);
                logger.debug(`Subscribed to collection: ${collection}`, {
                    component: 'useRealtimeOwner',
                });
            } catch (error) {
                logger.error(`Failed to subscribe to ${collection}`, error, {
                    component: 'useRealtimeOwner',
                    collection,
                });
            }
        },
        [handleUpdate]
    );

    const connect = useCallback(() => {
        if (!user || user.role !== 'Owner') {
            logger.warn('useRealtimeOwner: User is not Owner, skipping subscriptions', {
                component: 'useRealtimeOwner',
            });
            return;
        }

        opts.collections?.forEach(subscribeToCollection);
        setIsConnected(true);

        logger.info('Owner realtime subscriptions established', {
            component: 'useRealtimeOwner',
            collections: opts.collections,
        });
    }, [user, opts.collections, subscribeToCollection]);

    const disconnect = useCallback(() => {
        unsubscribeFnsRef.current.forEach((unsubscribe) => {
            try {
                unsubscribe();
            } catch (error) {
                logger.warn('Error unsubscribing from realtime', {
                    component: 'useRealtimeOwner',
                });
            }
        });

        unsubscribeFnsRef.current = [];
        setIsConnected(false);

        logger.info('Owner realtime subscriptions disconnected', {
            component: 'useRealtimeOwner',
        });
    }, []);

    const clearUpdates = useCallback(() => {
        setUpdates([]);
    }, []);

    // Auto-refresh timer
    useEffect(() => {
        if (opts.autoRefresh && isConnected) {
            refreshTimerRef.current = setInterval(() => {
                setLastUpdate(new Date());
                logger.debug('Auto-refresh triggered', {
                    component: 'useRealtimeOwner',
                });
            }, opts.refreshInterval);
        }

        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, [opts.autoRefresh, opts.refreshInterval, isConnected]);

    // Connect/disconnect on mount/unmount
    useEffect(() => {
        connect();
        return disconnect;
    }, [connect, disconnect]);

    return {
        updates,
        isConnected,
        lastUpdate,
        clearUpdates,
        reconnect: () => {
            disconnect();
            connect();
        },
    };
}

/**
 * Hook for monitoring specific tenant in realtime
 */
export function useRealtimeTenant(tenantId: string) {
    const { updates } = useRealtimeOwner({
        collections: ['users', 'tenant_usage', 'audit_logs'],
    });

    const tenantUpdates = updates.filter((update) => {
        return update.record.tenantId === tenantId;
    });

    return {
        updates: tenantUpdates,
        hasUpdates: tenantUpdates.length > 0,
    };
}
