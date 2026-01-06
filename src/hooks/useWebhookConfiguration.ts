/**
 * Webhook Configuration Hook
 * 
 * React Query hook for webhook management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookConfigurationService, Webhook } from '../services/webhookConfigurationService';
import { useToast } from './useToast';
import { useState } from 'react';

export const useWebhookConfiguration = (
    tenantId?: string,
    page: number = 1,
    perPage: number = 20
) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [webhookSecret, setWebhookSecret] = useState<string | null>(null);

    // Get webhooks
    const {
        data: webhooks,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['webhooks', tenantId, page, perPage],
        queryFn: () => webhookConfigurationService.getWebhooks(tenantId, page, perPage)
    });

    // Create webhook mutation
    const createWebhook = useMutation({
        mutationFn: ({
            tenantId,
            name,
            url,
            events,
            options
        }: {
            tenantId: string;
            name: string;
            url: string;
            events: string[];
            options?: any;
        }) => webhookConfigurationService.createWebhook(tenantId, name, url, events, options),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setWebhookSecret(result.secret);
            addToast('Webhook created successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to create webhook', 'error');
        }
    });

    // Update webhook mutation
    const updateWebhook = useMutation({
        mutationFn: ({ webhookId, updates }: { webhookId: string; updates: Partial<Webhook> }) =>
            webhookConfigurationService.updateWebhook(webhookId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            addToast('Webhook updated', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to update webhook', 'error');
        }
    });

    // Delete webhook mutation
    const deleteWebhook = useMutation({
        mutationFn: (webhookId: string) => webhookConfigurationService.deleteWebhook(webhookId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            addToast('Webhook deleted', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to delete webhook', 'error');
        }
    });

    // Test webhook mutation
    const testWebhook = useMutation({
        mutationFn: (webhookId: string) => webhookConfigurationService.testWebhook(webhookId),
        onSuccess: (result) => {
            if (result.success) {
                addToast(`Test successful (${result.statusCode}, ${result.responseTime}ms)`, 'success');
            } else {
                addToast(`Test failed: ${result.error}`, 'error');
            }
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to test webhook', 'error');
        }
    });

    // Clear webhook secret
    const clearSecret = () => setWebhookSecret(null);

    return {
        webhooks: webhooks?.items || [],
        totalPages: webhooks?.totalPages || 0,
        webhookSecret,
        createWebhook,
        updateWebhook,
        deleteWebhook,
        testWebhook,
        clearSecret,
        isLoading,
        isCreating: createWebhook.isPending,
        isUpdating: updateWebhook.isPending,
        isDeleting: deleteWebhook.isPending,
        isTesting: testWebhook.isPending,
        refetch,
        availableEvents: webhookConfigurationService.getAvailableEvents()
    };
};

// Hook for webhook delivery history
export const useWebhookDeliveries = (webhookId: string, page: number = 1) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const {
        data: deliveries,
        isLoading
    } = useQuery({
        queryKey: ['webhookDeliveries', webhookId, page],
        queryFn: () => webhookConfigurationService.getDeliveryHistory(webhookId, page),
        enabled: !!webhookId
    });

    // Retry delivery mutation
    const retryDelivery = useMutation({
        mutationFn: (deliveryId: string) => webhookConfigurationService.retryDelivery(deliveryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhookDeliveries'] });
            queryClient.invalidateQueries({ queryKey: ['webhookStatistics'] });
            addToast('Delivery retried', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to retry delivery', 'error');
        }
    });

    return {
        deliveries: deliveries?.items || [],
        totalPages: deliveries?.totalPages || 0,
        retryDelivery,
        isLoading,
        isRetrying: retryDelivery.isPending
    };
};

// Hook for webhook statistics
export const useWebhookStatistics = (webhookId: string, days: number = 30) => {
    return useQuery({
        queryKey: ['webhookStatistics', webhookId, days],
        queryFn: () => webhookConfigurationService.getDeliveryStatistics(webhookId, days),
        enabled: !!webhookId
    });
};
