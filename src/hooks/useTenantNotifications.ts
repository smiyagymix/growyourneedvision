/**
 * Tenant Notifications Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantNotificationService, TenantNotification, NotificationTemplate } from '../services/tenantNotificationService';
import { useToast } from './useToast';

export const useTenantNotifications = (tenantId?: string) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['tenant-notifications', tenantId],
        queryFn: () => tenantNotificationService.getNotifications(tenantId),
        refetchInterval: 30000
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['notification-templates'],
        queryFn: () => tenantNotificationService.getTemplates()
    });

    const { data: stats } = useQuery({
        queryKey: ['notification-stats', tenantId],
        queryFn: () => tenantNotificationService.getNotificationStats(tenantId)
    });

    const sendNotification = useMutation({
        mutationFn: (notification: Omit<TenantNotification, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) =>
            tenantNotificationService.sendNotification(notification),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] });
            addToast('Notification sent successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to send notification: ${error.message}`, 'error');
        }
    });

    const broadcast = useMutation({
        mutationFn: (params: {
            title: string;
            message: string;
            type: 'info' | 'warning' | 'error' | 'success';
            channels: any[];
        }) => tenantNotificationService.broadcastToAllTenants(
            params.title,
            params.message,
            params.type,
            params.channels
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] });
            addToast('Broadcast sent successfully', 'success');
        }
    });

    const createTemplate = useMutation({
        mutationFn: (template: Omit<NotificationTemplate, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) =>
            tenantNotificationService.createTemplate(template),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
            addToast('Template created', 'success');
        }
    });

    return {
        notifications,
        isLoading,
        templates,
        stats,
        sendNotification,
        broadcast,
        createTemplate
    };
};
