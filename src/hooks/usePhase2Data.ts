import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legalDocsService, LegalDocument } from '../services/legalDocsService';
import { emailTemplateService } from '../services/emailTemplateService';
import { webhookService, Webhook, CreateWebhookData } from '../services/webhookService';
import { reportSchedulerService, ScheduledReport } from '../services/reportSchedulerService';
import { backupService, Backup } from '../services/backupService';
import { systemHealthService, HealthMetric } from '../services/systemHealthService';
import { broadcastService, BroadcastMessage, CreateBroadcastData } from '../services/broadcastService';

// Legal Documents Hooks
export function useLegalDocuments() {
    return useQuery({
        queryKey: ['legalDocuments'],
        queryFn: () => legalDocsService.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function usePublishLegalDoc() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, version }: { id: string; version: string }) =>
            legalDocsService.publish(id, version),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['legalDocuments'] });
        },
    });
}

// Webhooks Hooks
export function useWebhooks() {
    return useQuery({
        queryKey: ['webhooks'],
        queryFn: () => webhookService.getAll(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateWebhook() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateWebhookData) =>
            webhookService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        },
    });
}

export function useTestWebhook() {
    return useMutation({
        mutationFn: (id: string) => webhookService.test(id),
    });
}

// Reports Hooks
export function useScheduledReports() {
    return useQuery({
        queryKey: ['scheduledReports'],
        queryFn: () => reportSchedulerService.getAll(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useRunReport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => reportSchedulerService.runNow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
        },
    });
}

export function useCreateScheduledReport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof reportSchedulerService.create>[0]) => reportSchedulerService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduledReports'] });
        },
    });
}

// Backups Hooks
export function useBackups() {
    return useQuery({
        queryKey: ['backups'],
        queryFn: () => backupService.getAll(),
        staleTime: 2 * 60 * 1000,
    });
}

export function useBackupStats() {
    return useQuery({
        queryKey: ['backupStats'],
        queryFn: () => backupService.getStatistics(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useInitiateBackup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (type: Backup['type']) => backupService.initiateBackup(type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            queryClient.invalidateQueries({ queryKey: ['backupStats'] });
        },
    });
}

export function useRestoreBackup() {
    return useMutation({
        mutationFn: (id: string) => backupService.restore(id),
    });
}

// System Health Hooks
export function useSystemHealth() {
    return useQuery({
        queryKey: ['systemHealth'],
        queryFn: () => systemHealthService.getLatestMetrics(),
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refresh every minute
    });
}

export function useOverallHealth() {
    return useQuery({
        queryKey: ['overallHealth'],
        queryFn: () => systemHealthService.getOverallHealth(),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
    });
}

// Broadcast Hooks
export function useSendBroadcast() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBroadcastData) =>
            broadcastService.send(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
        },
    });
}

export function useBroadcastHistory() {
    return useQuery({
        queryKey: ['broadcasts'],
        queryFn: () => broadcastService.getSentMessages(),
        staleTime: 5 * 60 * 1000,
    });
}
