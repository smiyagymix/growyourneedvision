/**
 * useExportCenter Hook
 * 
 * React Query hook for managing export configurations and jobs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportCenterService, ExportConfig, ExportJob } from '../services/exportCenterService';
import { useToast } from './useToast';

export const useExportCenter = (tenantId?: string) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Get all export configurations
    const {
        data: configs = [],
        isLoading: configsLoading,
        refetch: refetchConfigs
    } = useQuery({
        queryKey: ['exportConfigs', tenantId],
        queryFn: () => exportCenterService.getExportConfigs(tenantId)
    });

    // Get export jobs
    const {
        data: jobs = [],
        isLoading: jobsLoading,
        refetch: refetchJobs
    } = useQuery({
        queryKey: ['exportJobs', tenantId],
        queryFn: () => exportCenterService.getExportJobs(undefined, tenantId)
    });

    // Get export stats
    const {
        data: stats,
        isLoading: statsLoading
    } = useQuery({
        queryKey: ['exportStats', tenantId],
        queryFn: () => exportCenterService.getExportStats(tenantId)
    });

    // Create new export config
    const createConfig = useMutation({
        mutationFn: (config: Omit<ExportConfig, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) =>
            exportCenterService.createExportConfig(config),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exportConfigs'] });
            addToast('Export configuration created successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to create configuration: ${error.message}`, 'error');
        }
    });

    // Update export config
    const updateConfig = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<ExportConfig> }) =>
            exportCenterService.updateExportConfig(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exportConfigs'] });
            addToast('Export configuration updated successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to update configuration: ${error.message}`, 'error');
        }
    });

    // Delete export config
    const deleteConfig = useMutation({
        mutationFn: (id: string) => exportCenterService.deleteExportConfig(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exportConfigs'] });
            addToast('Export configuration deleted successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to delete configuration: ${error.message}`, 'error');
        }
    });

    // Run export manually
    const runExport = useMutation({
        mutationFn: (configId: string) => exportCenterService.runExport(configId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exportJobs'] });
            queryClient.invalidateQueries({ queryKey: ['exportConfigs'] });
            addToast('Export started successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to start export: ${error.message}`, 'error');
        }
    });

    // Download export
    const downloadExport = useMutation({
        mutationFn: (jobId: string) => exportCenterService.downloadExport(jobId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exportJobs'] });
            addToast('Download started', 'info');
        },
        onError: (error: Error) => {
            addToast(`Failed to download export: ${error.message}`, 'error');
        }
    });

    return {
        // Data
        configs,
        jobs,
        stats,

        // Loading states
        configsLoading,
        jobsLoading,
        statsLoading,
        loading: configsLoading || jobsLoading || statsLoading,

        // Mutations
        createConfig: createConfig.mutate,
        updateConfig: updateConfig.mutate,
        deleteConfig: deleteConfig.mutate,
        runExport: runExport.mutate,
        downloadExport: downloadExport.mutate,

        // Mutation states
        isCreating: createConfig.isPending,
        isUpdating: updateConfig.isPending,
        isDeleting: deleteConfig.isPending,
        isRunning: runExport.isPending,
        isDownloading: downloadExport.isPending,

        // Refresh
        refetchConfigs,
        refetchJobs,
        refresh: () => {
            refetchConfigs();
            refetchJobs();
        }
    };
};
