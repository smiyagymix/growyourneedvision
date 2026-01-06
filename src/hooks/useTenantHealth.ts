/**
 * Tenant Health Monitoring Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantHealthMonitoringService, TenantHealthScore } from '../services/tenantHealthMonitoringService';
import { useToast } from './useToast';

export const useTenantHealth = (tenantId?: string) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const { data: health, isLoading } = useQuery({
        queryKey: ['tenant-health', tenantId],
        queryFn: () => tenantId ? tenantHealthMonitoringService.getHealth(tenantId) : null,
        enabled: !!tenantId
    });

    const { data: history = [] } = useQuery({
        queryKey: ['tenant-health-history', tenantId],
        queryFn: () => tenantId ? tenantHealthMonitoringService.getHealthHistory(tenantId) : [],
        enabled: !!tenantId
    });

    const { data: allScores = [] } = useQuery({
        queryKey: ['all-tenant-health'],
        queryFn: () => tenantHealthMonitoringService.getAllHealthScores()
    });

    const { data: unhealthyTenants = [] } = useQuery({
        queryKey: ['unhealthy-tenants'],
        queryFn: () => tenantHealthMonitoringService.getUnhealthyTenants()
    });

    const calculateHealth = useMutation({
        mutationFn: (tenantId: string) => tenantHealthMonitoringService.calculateHealth(tenantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-health'] });
            queryClient.invalidateQueries({ queryKey: ['all-tenant-health'] });
            addToast('Health calculated successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to calculate health: ${error.message}`, 'error');
        }
    });

    const recalculateAll = useMutation({
        mutationFn: () => tenantHealthMonitoringService.recalculateAllHealth(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-health'] });
            queryClient.invalidateQueries({ queryKey: ['all-tenant-health'] });
            addToast('All health scores recalculated', 'success');
        }
    });

    return {
        health,
        isLoading,
        history,
        allScores,
        unhealthyTenants,
        calculateHealth,
        recalculateAll
    };
};
