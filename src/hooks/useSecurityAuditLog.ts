/**
 * Security Audit Log Hook
 * 
 * React Query hook for security audit logging
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityAuditLogService, AuditLogFilters } from '../services/securityAuditLogService';
import { useToast } from './useToast';

export const useSecurityAuditLog = (
    filters: AuditLogFilters = {},
    page: number = 1,
    perPage: number = 50
) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    // Get audit logs
    const {
        data: logs,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['auditLogs', filters, page, perPage],
        queryFn: () => securityAuditLogService.getLogs(filters, page, perPage)
    });

    // Get analytics
    const {
        data: analytics,
        isLoading: isLoadingAnalytics
    } = useQuery({
        queryKey: ['auditAnalytics', filters.tenantId],
        queryFn: () => securityAuditLogService.getAnalytics(filters.tenantId, 30)
    });

    // Log event mutation
    const logEvent = useMutation({
        mutationFn: ({
            userId,
            action,
            resource,
            options
        }: {
            userId: string;
            action: string;
            resource: string;
            options?: any;
        }) => securityAuditLogService.logEvent(userId, action, resource, options),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
            queryClient.invalidateQueries({ queryKey: ['auditAnalytics'] });
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to log event', 'error');
        }
    });

    // Export logs mutation
    const exportLogs = useMutation({
        mutationFn: ({
            filters,
            format
        }: {
            filters?: AuditLogFilters;
            format: 'csv' | 'json';
        }) => securityAuditLogService.exportLogs(filters, format),
        onSuccess: (blob, variables) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs.${variables.format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Logs exported successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to export logs', 'error');
        }
    });

    // Delete old logs mutation
    const deleteOldLogs = useMutation({
        mutationFn: (daysToKeep: number) =>
            securityAuditLogService.deleteOldLogs(daysToKeep),
        onSuccess: (deletedCount) => {
            queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
            addToast(`Deleted ${deletedCount} old log entries`, 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to delete logs', 'error');
        }
    });

    return {
        logs: logs?.items || [],
        totalPages: logs?.totalPages || 0,
        totalItems: logs?.totalItems || 0,
        analytics,
        logEvent,
        exportLogs,
        deleteOldLogs,
        isLoading,
        isLoadingAnalytics,
        isExporting: exportLogs.isPending,
        isDeleting: deleteOldLogs.isPending,
        refetch
    };
};
