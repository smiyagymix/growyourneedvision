import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiModelRoutingService, RoutingRule } from '../services/aiModelRoutingService';

export function useRoutingRules() {
    return useQuery({
        queryKey: ['routingRules'],
        queryFn: () => aiModelRoutingService.getAllRules(),
        staleTime: 30 * 1000,
    });
}

export function useCreateRoutingRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<RoutingRule>) => aiModelRoutingService.createRule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routingRules'] });
        },
    });
}

export function useUpdateRoutingRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<RoutingRule> }) =>
            aiModelRoutingService.updateRule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routingRules'] });
        },
    });
}

export function useDeleteRoutingRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => aiModelRoutingService.deleteRule(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routingRules'] });
        },
    });
}
