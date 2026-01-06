import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiFineTuningService, FineTuningJob } from '../services/aiFineTuningService';

export function useFineTuningJobs() {
    return useQuery({
        queryKey: ['fineTuningJobs'],
        queryFn: () => aiFineTuningService.getAllJobs(),
        refetchInterval: 5000, // Poll every 5 seconds for training progress
    });
}

export function useFineTuningJob(id: string) {
    return useQuery({
        queryKey: ['fineTuningJob', id],
        queryFn: () => aiFineTuningService.getJobById(id),
        enabled: !!id,
        refetchInterval: 2000, // Poll frequently for progress
    });
}

export function useCreateFineTuningJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<FineTuningJob>) => aiFineTuningService.createJob(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fineTuningJobs'] });
            queryClient.invalidateQueries({ queryKey: ['fineTuningStats'] });
        },
    });
}

export function useStartFineTuningJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => aiFineTuningService.startJob(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fineTuningJobs'] });
        },
    });
}

export function useCancelFineTuningJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => aiFineTuningService.cancelJob(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fineTuningJobs'] });
        },
    });
}

export function useDeleteFineTuningJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => aiFineTuningService.deleteJob(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fineTuningJobs'] });
            queryClient.invalidateQueries({ queryKey: ['fineTuningStats'] });
        },
    });
}

export function useFineTuningStats() {
    return useQuery({
        queryKey: ['fineTuningStats'],
        queryFn: () => aiFineTuningService.getJobStats(),
        staleTime: 30 * 1000,
    });
}
