import { useQuery } from '@tanstack/react-query';
import { aiUsageAnalyticsService } from '../services/aiUsageAnalyticsService';

/**
 * Hook to get usage metrics
 */
export function useUsageMetrics(startDate: Date, endDate: Date) {
    return useQuery({
        queryKey: ['usageMetrics', startDate.toISOString(), endDate.toISOString()],
        queryFn: () => aiUsageAnalyticsService.getUsageMetrics(startDate, endDate),
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to get usage trend
 */
export function useUsageTrend(days: number = 30) {
    return useQuery({
        queryKey: ['usageTrend', days],
        queryFn: () => aiUsageAnalyticsService.getUsageTrend(days),
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to get peak usage hours
 */
export function usePeakHours(days: number = 7) {
    return useQuery({
        queryKey: ['peakHours', days],
        queryFn: () => aiUsageAnalyticsService.getPeakHours(days),
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to get model performance
 */
export function useModelPerformance() {
    return useQuery({
        queryKey: ['modelPerformance'],
        queryFn: () => aiUsageAnalyticsService.getModelPerformance(),
        staleTime: 60 * 1000,
    });
}
