import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmDealService, Deal } from '../services/crmDealService';

export function useDeals() {
    return useQuery({
        queryKey: ['deals'],
        queryFn: () => crmDealService.getAllDeals(),
        staleTime: 30 * 1000,
    });
}

export function useDeal(id: string) {
    return useQuery({
        queryKey: ['deal', id],
        queryFn: () => crmDealService.getDealById(id),
        enabled: !!id,
    });
}

export function useCreateDeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Deal>) => crmDealService.createDeal(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
        },
    });
}

export function useUpdateDealValue() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, value, currency }: { id: string; value: number; currency?: string }) =>
            crmDealService.updateDealValue(id, value, currency),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
            queryClient.invalidateQueries({ queryKey: ['deal', variables.id] });
        },
    });
}

export function useUpdateProbability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, probability }: { id: string; probability: number }) =>
            crmDealService.updateProbability(id, probability),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
            queryClient.invalidateQueries({ queryKey: ['deal', variables.id] });
        },
    });
}

export function useUpdateCloseDate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, date }: { id: string; date: string }) =>
            crmDealService.updateCloseDate(id, date),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
            queryClient.invalidateQueries({ queryKey: ['deal', variables.id] });
        },
    });
}

export function useMarkDealWon() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => crmDealService.markDealWon(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
        },
    });
}

export function useMarkDealLost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => crmDealService.markDealLost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
        },
    });
}

export function useDeleteDeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => crmDealService.deleteDeal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
        },
    });
}

export function useForecastedRevenue(month: number, year: number) {
    return useQuery({
        queryKey: ['forecastedRevenue', month, year],
        queryFn: () => crmDealService.getForecastedRevenue(month, year),
        staleTime: 60 * 1000,
    });
}
