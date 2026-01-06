import { useQuery } from '@tanstack/react-query';
import { crmAnalyticsService } from '../services/crmAnalyticsService';

export function useConversionRates() {
    return useQuery({
        queryKey: ['crmConversionRates'],
        queryFn: () => crmAnalyticsService.getConversionRates(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function usePipelineHealth() {
    return useQuery({
        queryKey: ['crmPipelineHealth'],
        queryFn: () => crmAnalyticsService.getPipelineHealth(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useWinLossAnalysis() {
    return useQuery({
        queryKey: ['crmWinLossAnalysis'],
        queryFn: () => crmAnalyticsService.getWinLossAnalysis(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useRevenueByPeriod(period: 'month' | 'quarter' | 'year') {
    return useQuery({
        queryKey: ['crmRevenue', period],
        queryFn: () => crmAnalyticsService.getRevenueByPeriod(period),
        staleTime: 5 * 60 * 1000,
    });
}
