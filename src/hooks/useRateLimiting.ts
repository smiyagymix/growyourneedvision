/**
 * API Rate Limiting Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRateLimitService, RateLimitConfig, RateLimitStats } from '../services/apiRateLimitService';
import { useToast } from './useToast';

export const useRateLimiting = (tenantId?: string) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const { data: configs = [], isLoading } = useQuery({
        queryKey: ['rate-limit-configs'],
        queryFn: () => apiRateLimitService.getAllConfigs()
    });

    const { data: stats } = useQuery({
        queryKey: ['rate-limit-stats', tenantId],
        queryFn: () => tenantId ? apiRateLimitService.getStats(tenantId) : null,
        enabled: !!tenantId
    });

    const { data: violations = [] } = useQuery({
        queryKey: ['rate-limit-violations', tenantId],
        queryFn: () => tenantId ? apiRateLimitService.getViolations(tenantId) : [],
        enabled: !!tenantId
    });

    const setConfig = useMutation({
        mutationFn: (config: Omit<RateLimitConfig, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) =>
            apiRateLimitService.setConfig(config),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rate-limit-configs'] });
            addToast('Rate limit configured', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to set rate limit: ${error.message}`, 'error');
        }
    });

    const updateConfig = useMutation({
        mutationFn: (params: { id: string; updates: Partial<RateLimitConfig> }) =>
            apiRateLimitService.updateConfig(params.id, params.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rate-limit-configs'] });
            addToast('Rate limit updated', 'success');
        }
    });

    const resetLimits = useMutation({
        mutationFn: (tenantId: string) => apiRateLimitService.resetLimits(tenantId),
        onSuccess: () => {
            addToast('Rate limits reset', 'success');
        }
    });

    return {
        configs,
        isLoading,
        stats,
        violations,
        setConfig,
        updateConfig,
        resetLimits
    };
};
