/**
 * Feature Usage Analytics Hook
 * 
 * React Query hook for feature usage tracking and analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featureUsageAnalyticsService, FeatureDefinition, FeatureAdoptionStats, TenantFeatureProfile, FeatureHeatmap } from '../services/featureUsageAnalyticsService';
import { useToast } from './useToast';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export const useFeatureUsage = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const { user } = useAuth();

    // Get features
    const { data: features = [], isLoading: featuresLoading } = useQuery({
        queryKey: ['feature-definitions'],
        queryFn: () => featureUsageAnalyticsService.getFeatures()
    });

    // Get feature adoption stats
    const { data: adoption = [], isLoading: adoptionLoading } = useQuery<FeatureAdoptionStats[]>({
        queryKey: ['feature-adoption'],
        queryFn: () => featureUsageAnalyticsService.getFeatureAdoption(),
        refetchInterval: 60000 // Refresh every minute
    });

    // Get adoption stats for specific feature
    const useFeatureAdoption = (featureName: string) => useQuery<FeatureAdoptionStats>({
        queryKey: ['feature-adoption', featureName],
        queryFn: async () => {
            const stats = await featureUsageAnalyticsService.getFeatureAdoption();
            const featureStats = stats.find(s => s.featureName === featureName);
            if (!featureStats) {
                throw new Error(`No adoption stats found for feature: ${featureName}`);
            }
            return featureStats;
        },
        enabled: !!featureName
    });

    // Get top adopted features
    const { data: topFeatures = [] } = useQuery<FeatureAdoptionStats[]>({
        queryKey: ['feature-adoption', 'top'],
        queryFn: async () => {
            const stats = await featureUsageAnalyticsService.getFeatureAdoption();
            return stats.sort((a, b) => b.adoptionRate - a.adoptionRate).slice(0, 10);
        }
    });

    // Get least adopted features
    const { data: lowAdoptionFeatures = [] } = useQuery<FeatureAdoptionStats[]>({
        queryKey: ['feature-adoption', 'low'],
        queryFn: async () => {
            const stats = await featureUsageAnalyticsService.getFeatureAdoption();
            return stats.sort((a, b) => a.adoptionRate - b.adoptionRate).slice(0, 10);
        }
    });

    // Track feature usage
    const trackUsage = async (
        featureName: string,
        action: 'viewed' | 'clicked' | 'completed' | 'dismissed',
        metadata?: Record<string, any>
    ): Promise<void> => {
        return featureUsageAnalyticsService.trackFeatureUsage(
            featureName,
            action,
            user?.tenantId,
            user?.id,
            metadata
        );
    };

    // Create feature definition mutation
    const createFeature = useMutation({
        mutationFn: (feature: Omit<FeatureDefinition, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) =>
            featureUsageAnalyticsService.createFeature(feature),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-definitions'] });
            addToast('Feature definition created', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to create feature: ${error.message}`, 'error');
        }
    });

    // Get tenant feature profile
    const useTenantProfile = (tenantId: string) => useQuery<TenantFeatureProfile>({
        queryKey: ['tenant-feature-profile', tenantId],
        queryFn: () => featureUsageAnalyticsService.getTenantFeatureProfile(tenantId),
        enabled: !!tenantId,
        staleTime: 300000 // Cache for 5 minutes
    });

    // Get current user's tenant profile
    const { data: myTenantProfile } = useQuery<TenantFeatureProfile>({
        queryKey: ['tenant-feature-profile', user?.tenantId],
        queryFn: () => featureUsageAnalyticsService.getTenantFeatureProfile(user?.tenantId || ''),
        enabled: !!user?.tenantId
    });

    // Refresh tenant profile mutation
    const refreshTenantProfile = useMutation({
        mutationFn: (tenantId: string) => featureUsageAnalyticsService.getTenantFeatureProfile(tenantId),
        onSuccess: (data, tenantId) => {
            queryClient.setQueryData(['tenant-feature-profile', tenantId], data);
            addToast('Tenant profile refreshed', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to refresh profile: ${error.message}`, 'error');
        }
    });

    // Get feature heatmap
    const useFeatureHeatmap = (featureName: string, period?: { start: Date; end: Date }) => useQuery<FeatureHeatmap>({
        queryKey: ['feature-heatmap', featureName, period],
        queryFn: () => featureUsageAnalyticsService.getFeatureHeatmap(featureName, period),
        enabled: !!featureName
    });

    // Export feature heatmap mutation
    const exportHeatmap = useMutation({
        mutationFn: (params: { featureName: string; format: 'png' | 'svg' | 'csv' }) => {
            // In production, this would call a backend service to generate the export
            return featureUsageAnalyticsService.getFeatureHeatmap(params.featureName).then(heatmap => {
                // Create downloadable file
                const data = JSON.stringify(heatmap, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${params.featureName}-heatmap.json`;
                a.click();
                URL.revokeObjectURL(url);
                return heatmap;
            });
        },
        onSuccess: () => {
            addToast('Heatmap exported successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to export heatmap: ${error.message}`, 'error');
        }
    });

    // Get feature funnel
    const useFeatureFunnel = (featureName: string, steps: string[]) => useQuery({
        queryKey: ['feature-funnel', featureName, steps],
        queryFn: () => featureUsageAnalyticsService.getFeatureFunnel(featureName, steps),
        enabled: !!featureName && steps.length > 0
    });

    return {
        features,
        featuresLoading,
        adoption,
        adoptionLoading,
        topFeatures,
        lowAdoptionFeatures,
        myTenantProfile,
        trackUsage,
        createFeature,
        useFeatureAdoption,
        useTenantProfile,
        refreshTenantProfile,
        useFeatureHeatmap,
        exportHeatmap,
        useFeatureFunnel
    };
};

/**
 * Auto-track feature usage for a component
 * 
 * @example
 * useAutoTrackFeature('ai_assistant', 'viewed');
 */
export const useAutoTrackFeature = (
    featureName: string,
    action: 'viewed' | 'clicked' | 'completed' | 'dismissed' = 'viewed',
    metadata?: Record<string, any>
) => {
    const { trackUsage } = useFeatureUsage();

    useEffect(() => {
        trackUsage(featureName, action, metadata);
    }, []); // Only track on mount
};
