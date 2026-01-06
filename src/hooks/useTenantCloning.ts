/**
 * Tenant Cloning Hook
 * 
 * React Query hook for tenant cloning operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantCloningService, CloneJob, TenantTemplate, MigrationPlan } from '../services/tenantCloningService';
import { useToast } from './useToast';

export const useTenantCloning = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Templates
    const { data: templates = [], isLoading: templatesLoading } = useQuery({
        queryKey: ['tenant-templates'],
        queryFn: () => tenantCloningService.getTemplates()
    });

    // Clone jobs
    const { data: cloneJobs = [], isLoading: jobsLoading } = useQuery<CloneJob[]>({
        queryKey: ['clone-jobs'],
        queryFn: () => tenantCloningService.getCloneJobs(),
        refetchInterval: 5000 // Poll every 5 seconds for job updates
    });

    // Get pending clone jobs
    const { data: pendingJobs = [] } = useQuery<CloneJob[]>({
        queryKey: ['clone-jobs', 'pending'],
        queryFn: async () => {
            const jobs = await tenantCloningService.getCloneJobs();
            return jobs.filter(job => job.status === 'pending' || job.status === 'processing');
        }
    });

    // Get completed clone jobs
    const { data: completedJobs = [] } = useQuery<CloneJob[]>({
        queryKey: ['clone-jobs', 'completed'],
        queryFn: async () => {
            const jobs = await tenantCloningService.getCloneJobs();
            return jobs.filter(job => job.status === 'completed');
        }
    });

    // Get failed clone jobs
    const { data: failedJobs = [] } = useQuery<CloneJob[]>({
        queryKey: ['clone-jobs', 'failed'],
        queryFn: async () => {
            const jobs = await tenantCloningService.getCloneJobs();
            return jobs.filter(job => job.status === 'failed');
        }
    });

    // Clone tenant mutation
    const cloneTenant = useMutation({
        mutationFn: (params: {
            sourceTenantId: string;
            newTenantData: { name: string; subdomain: string; plan: string };
            options?: { includeUsers?: boolean; includeData?: boolean; includeSettings?: boolean };
        }) => tenantCloningService.cloneTenant(
            params.sourceTenantId,
            params.newTenantData,
            params.options
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clone-jobs'] });
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            addToast('Tenant cloning started successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to clone tenant: ${error.message}`, 'error');
        }
    });

    // Create template mutation
    const createTemplate = useMutation({
        mutationFn: (template: Omit<TenantTemplate, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) => 
            tenantCloningService.createTemplate(template),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-templates'] });
            addToast('Template created successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to create template: ${error.message}`, 'error');
        }
    });

    // Apply template mutation
    const applyTemplate = useMutation({
        mutationFn: (params: { templateId: string; tenantId: string }) =>
            tenantCloningService.applyTemplate(params.templateId, params.tenantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            addToast('Template applied successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to apply template: ${error.message}`, 'error');
        }
    });

    // Get clone job status
    const getCloneJobStatus = (jobId: string) => useQuery<CloneJob>({
        queryKey: ['clone-job', jobId],
        queryFn: () => tenantCloningService.getCloneJobStatus(jobId),
        refetchInterval: (query) => {
            const data = query.state.data;
            // Poll every 5 seconds if job is in progress
            if (data?.status === 'processing' || data?.status === 'pending') {
                return 5000;
            }
            return false;
        }
    });

    // Cancel clone job mutation
    const cancelCloneJob = useMutation({
        mutationFn: async (jobId: string) => {
            // In production, call cancel endpoint
            // For now, we update the job status
            return jobId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clone-jobs'] });
            addToast('Clone job cancelled', 'info');
        },
        onError: (error: Error) => {
            addToast(`Failed to cancel clone job: ${error.message}`, 'error');
        }
    });

    // Create migration plan
    const createMigrationPlan = async (sourceTenantId: string, targetTenantId: string): Promise<MigrationPlan> => {
        return tenantCloningService.createMigrationPlan(sourceTenantId, targetTenantId);
    };

    return {
        templates,
        templatesLoading,
        cloneJobs,
        jobsLoading,
        pendingJobs,
        completedJobs,
        failedJobs,
        cloneTenant,
        createTemplate,
        applyTemplate,
        getCloneJobStatus,
        cancelCloneJob,
        createMigrationPlan
    };
};
