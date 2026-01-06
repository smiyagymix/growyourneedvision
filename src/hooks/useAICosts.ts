import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiCostService } from '../services/aiCostService';

/**
 * Hook to get current month cost summary
 */
export function useCurrentMonthCosts() {
    return useQuery({
        queryKey: ['aiCosts', 'currentMonth'],
        queryFn: () => aiCostService.getCurrentMonthSummary(),
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute
    });
}

/**
 * Hook to get cost summary for date range
 */
export function useCostSummary(startDate?: Date, endDate?: Date) {
    return useQuery({
        queryKey: ['aiCosts', 'summary', startDate?.toISOString(), endDate?.toISOString()],
        queryFn: () => aiCostService.getCostSummary(startDate, endDate),
        enabled: !!(startDate && endDate),
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to get budget alerts
 */
export function useBudgetAlerts() {
    return useQuery({
        queryKey: ['aiCosts', 'alerts'],
        queryFn: () => aiCostService.getBudgetAlerts(),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
    });
}

/**
 * Hook to get monthly forecast
 */
export function useMonthlyCostForecast() {
    return useQuery({
        queryKey: ['aiCosts', 'forecast'],
        queryFn: () => aiCostService.forecastMonthlyCost(),
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to get top spending tenants
 */
export function useTopTenants(limit: number = 10) {
    return useQuery({
        queryKey: ['aiCosts', 'topTenants', limit],
        queryFn: () => aiCostService.getTopTenants(limit),
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to set budget
 */
export function useSetBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (amount: number) => aiCostService.setBudget(amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aiCosts'] });
        },
    });
}
