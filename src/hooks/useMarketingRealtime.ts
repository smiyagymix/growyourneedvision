/**
 * useMarketingRealtime Hook
 * 
 * Provides real-time data synchronization for marketing collections
 * Uses PocketBase real-time subscriptions for live updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

type CollectionName = 
    | 'campaigns'
    | 'marketing_assets'
    | 'email_templates'
    | 'marketing_segments'
    | 'audiences'
    | 'ab_tests'
    | 'customer_profiles'
    | 'personalization_rules'
    | 'journeys'
    | 'lead_scores'
    | 'social_posts'
    | 'social_accounts'
    | 'creative_projects'
    | 'attribution'
    | 'experiments';

interface RealtimeOptions<T> {
    /** Initial data to populate before fetch */
    initialData?: T[];
    /** Filter for the subscription */
    filter?: string;
    /** Sort order */
    sort?: string;
    /** Whether to auto-fetch on mount */
    autoFetch?: boolean;
    /** Callback when data is created */
    onCreate?: (record: T) => void;
    /** Callback when data is updated */
    onUpdate?: (record: T) => void;
    /** Callback when data is deleted */
    onDelete?: (record: T) => void;
}

interface RealtimeResult<T> {
    items: T[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    subscribe: () => void;
    unsubscribe: () => void;
    isSubscribed: boolean;
    totalItems: number;
    page: number;
    totalPages: number;
    setPage: (page: number) => void;
}

export function useMarketingRealtime<T extends { id: string }>(
    collection: CollectionName,
    options: RealtimeOptions<T> = {}
): RealtimeResult<T> {
    const {
        initialData = [],
        filter,
        sort = '-created',
        autoFetch = true,
        onCreate,
        onUpdate,
        onDelete,
    } = options;

    const [items, setItems] = useState<T[]>(initialData);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<string | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const perPage = 20;

    const subscriptionRef = useRef<(() => void) | null>(null);

    const fetchData = useCallback(async () => {
        if (isMockEnv()) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await pb.collection(collection).getList<T>(page, perPage, {
                filter,
                sort,
                requestKey: null, // Prevent auto-cancellation
            });

            setItems(result.items);
            setTotalItems(result.totalItems);
            setTotalPages(result.totalPages);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch data';
            setError(message);
            console.error(`[useMarketingRealtime] Fetch error for ${collection}:`, err);
        } finally {
            setLoading(false);
        }
    }, [collection, page, filter, sort]);

    const subscribe = useCallback(() => {
        if (isMockEnv() || isSubscribed) return;

        try {
            pb.collection(collection).subscribe<T>('*', (e) => {
                switch (e.action) {
                    case 'create':
                        setItems((prev) => [e.record, ...prev]);
                        setTotalItems((prev) => prev + 1);
                        onCreate?.(e.record);
                        break;

                    case 'update':
                        setItems((prev) =>
                            prev.map((item) => (item.id === e.record.id ? e.record : item))
                        );
                        onUpdate?.(e.record);
                        break;

                    case 'delete':
                        setItems((prev) => prev.filter((item) => item.id !== e.record.id));
                        setTotalItems((prev) => Math.max(0, prev - 1));
                        onDelete?.(e.record);
                        break;
                }
            });

            setIsSubscribed(true);
            subscriptionRef.current = () => {
                pb.collection(collection).unsubscribe('*');
                setIsSubscribed(false);
            };

            console.log(`[useMarketingRealtime] Subscribed to ${collection}`);
        } catch (err) {
            console.error(`[useMarketingRealtime] Subscribe error for ${collection}:`, err);
        }
    }, [collection, isSubscribed, onCreate, onUpdate, onDelete]);

    const unsubscribe = useCallback(() => {
        if (subscriptionRef.current) {
            subscriptionRef.current();
            subscriptionRef.current = null;
        }
    }, []);

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch, fetchData]);

    // Cleanup subscription on unmount
    useEffect(() => {
        return () => {
            unsubscribe();
        };
    }, [unsubscribe]);

    return {
        items,
        loading,
        error,
        refresh: fetchData,
        subscribe,
        unsubscribe,
        isSubscribed,
        totalItems,
        page,
        totalPages,
        setPage,
    };
}

/**
 * Specialized hook for campaign real-time updates
 */
export function useCampaignsRealtime(options?: Omit<RealtimeOptions<import('../services/marketingService').Campaign>, 'initialData'>) {
    return useMarketingRealtime<import('../services/marketingService').Campaign>('campaigns', options);
}

/**
 * Specialized hook for A/B tests real-time updates
 */
export function useABTestsRealtime(options?: Omit<RealtimeOptions<import('../services/marketingService').ABTest>, 'initialData'>) {
    return useMarketingRealtime<import('../services/marketingService').ABTest>('ab_tests', options);
}

/**
 * Specialized hook for audiences real-time updates
 */
export function useAudiencesRealtime(options?: Omit<RealtimeOptions<import('../services/marketingService').Audience>, 'initialData'>) {
    return useMarketingRealtime<import('../services/marketingService').Audience>('audiences', options);
}

/**
 * Specialized hook for customer profiles real-time updates
 */
export function useCustomerProfilesRealtime(options?: Omit<RealtimeOptions<import('../services/marketingService').CustomerProfile>, 'initialData'>) {
    return useMarketingRealtime<import('../services/marketingService').CustomerProfile>('customer_profiles', options);
}

/**
 * Specialized hook for journeys real-time updates
 */
export function useJourneysRealtime(options?: Omit<RealtimeOptions<import('../services/marketingService').Journey>, 'initialData'>) {
    return useMarketingRealtime<import('../services/marketingService').Journey>('journeys', options);
}

/**
 * Specialized hook for social posts real-time updates
 */
export function useSocialPostsRealtime(options?: Omit<RealtimeOptions<import('../services/marketingService').SocialPost>, 'initialData'>) {
    return useMarketingRealtime<import('../services/marketingService').SocialPost>('social_posts', options);
}

/**
 * Specialized hook for lead scores real-time updates  
 */
export function useLeadScoresRealtime(options?: Omit<RealtimeOptions<import('../services/marketingService').LeadScore>, 'initialData'>) {
    return useMarketingRealtime<import('../services/marketingService').LeadScore>('lead_scores', options);
}

/**
 * Specialized hook for experiments real-time updates
 */
export function useExperimentsRealtime(options?: Omit<RealtimeOptions<import('../services/marketingService').Experiment>, 'initialData'>) {
    return useMarketingRealtime<import('../services/marketingService').Experiment>('experiments', options);
}

export default useMarketingRealtime;
