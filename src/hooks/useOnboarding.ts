/**
 * Automated Onboarding Hook
 * 
 * React Query hook for onboarding workflow management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automatedOnboardingService, OnboardingWorkflow } from '../services/automatedOnboardingService';
import { useToast } from './useToast';

export const useOnboarding = (filters?: { isActive?: boolean }) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    // Get all workflows
    const {
        data: workflows,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['onboardingWorkflows', filters],
        queryFn: () => automatedOnboardingService.getWorkflows(filters)
    });

    // Get analytics
    const {
        data: analytics,
        isLoading: isLoadingAnalytics
    } = useQuery({
        queryKey: ['onboardingAnalytics'],
        queryFn: () => automatedOnboardingService.getAnalytics(),
        refetchInterval: 60000 // Refresh every minute
    });

    // Create workflow mutation
    const createWorkflow = useMutation({
        mutationFn: (workflow: Omit<OnboardingWorkflow, 'id' | 'created' | 'updated'>) =>
            automatedOnboardingService.createWorkflow(workflow),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboardingWorkflows'] });
            addToast('Workflow created successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to create workflow', 'error');
        }
    });

    // Update workflow mutation
    const updateWorkflow = useMutation({
        mutationFn: ({ workflowId, updates }: { 
            workflowId: string; 
            updates: Partial<OnboardingWorkflow> 
        }) =>
            automatedOnboardingService.updateWorkflow(workflowId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboardingWorkflows'] });
            addToast('Workflow updated successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to update workflow', 'error');
        }
    });

    // Start onboarding mutation
    const startOnboarding = useMutation({
        mutationFn: ({ tenantId, workflowId }: { tenantId: string; workflowId?: string }) =>
            automatedOnboardingService.startOnboarding(tenantId, workflowId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
            queryClient.invalidateQueries({ queryKey: ['onboardingAnalytics'] });
            addToast('Onboarding started', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to start onboarding', 'error');
        }
    });

    // Complete step mutation
    const completeStep = useMutation({
        mutationFn: ({ progressId, stepId }: { progressId: string; stepId: string }) =>
            automatedOnboardingService.completeStep(progressId, stepId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
            queryClient.invalidateQueries({ queryKey: ['onboardingAnalytics'] });
            addToast('Step completed', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to complete step', 'error');
        }
    });

    // Skip step mutation
    const skipStep = useMutation({
        mutationFn: ({ progressId, stepId, reason }: { 
            progressId: string; 
            stepId: string; 
            reason?: string 
        }) =>
            automatedOnboardingService.skipStep(progressId, stepId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
            addToast('Step skipped', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to skip step', 'error');
        }
    });

    // Pause onboarding mutation
    const pauseOnboarding = useMutation({
        mutationFn: (progressId: string) =>
            automatedOnboardingService.pauseOnboarding(progressId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
            addToast('Onboarding paused', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to pause onboarding', 'error');
        }
    });

    // Resume onboarding mutation
    const resumeOnboarding = useMutation({
        mutationFn: (progressId: string) =>
            automatedOnboardingService.resumeOnboarding(progressId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboardingProgress'] });
            addToast('Onboarding resumed', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to resume onboarding', 'error');
        }
    });

    return {
        workflows,
        analytics,
        createWorkflow,
        updateWorkflow,
        startOnboarding,
        completeStep,
        skipStep,
        pauseOnboarding,
        resumeOnboarding,
        isLoading,
        isLoadingAnalytics,
        isCreating: createWorkflow.isPending,
        isUpdating: updateWorkflow.isPending,
        isStarting: startOnboarding.isPending,
        isCompletingStep: completeStep.isPending,
        isSkipping: skipStep.isPending,
        isPausing: pauseOnboarding.isPending,
        isResuming: resumeOnboarding.isPending,
        refetch
    };
};

// Hook for getting progress for specific tenant
export const useOnboardingProgress = (tenantId: string) => {
    return useQuery({
        queryKey: ['onboardingProgress', tenantId],
        queryFn: () => automatedOnboardingService.getProgress(tenantId),
        enabled: !!tenantId,
        refetchInterval: 30000 // Refresh every 30 seconds
    });
};
