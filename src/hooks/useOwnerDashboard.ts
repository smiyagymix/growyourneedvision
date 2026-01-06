import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ownerService } from '../services/ownerService';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export const useOwnerDashboard = () => {
    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ['ownerDashboard'],
        queryFn: () => ownerService.getDashboardData(),
        staleTime: 60 * 1000, // 1 minute cache
        refetchInterval: 30 * 1000, // Poll every 30s as fallback
        retry: 1,
    });

    // Real-time subscriptions
    useEffect(() => {
        let isSubscribed = true;

        if (isMockEnv()) {
            return () => { isSubscribed = false; };
        }

        const subscribe = async () => {
            try {
                await Promise.all([
                    pb.collection('tenants').subscribe('*', () => {
                        if (isSubscribed) refetch();
                    }),
                    pb.collection('invoices').subscribe('*', () => {
                        if (isSubscribed) refetch();
                    }),
                    pb.collection('system_alerts').subscribe('*', () => {
                        if (isSubscribed) refetch();
                    })
                ]);
            } catch (err) {
                console.error('Failed to subscribe to realtime updates:', err);
            }
        };

        subscribe();

        return () => {
            isSubscribed = false;
            pb.collection('tenants').unsubscribe('*');
            pb.collection('invoices').unsubscribe('*');
            pb.collection('system_alerts').unsubscribe('*');
        };
    }, [refetch]);

    return {
        data: data || null,
        loading: isLoading,
        error: error ? (error as Error).message : null,
        refreshing: isRefetching,
        refresh: refetch
    };
};
