import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiPlaygroundService, PlaygroundParams } from '../services/aiPlaygroundService';

/**
 * Hook to fetch playground test history
 */
export function usePlaygroundHistory(limit: number = 50) {
    return useQuery({
        queryKey: ['playgroundHistory', limit],
        queryFn: () => aiPlaygroundService.getHistory(limit),
        staleTime: 60 * 1000, // 1 minute
    });
}

/**
 * Hook to fetch a specific test
 */
export function usePlaygroundTest(id: string) {
    return useQuery({
        queryKey: ['playgroundTest', id],
        queryFn: () => aiPlaygroundService.getTest(id),
        enabled: !!id,
    });
}

/**
 * Hook to test a prompt with models
 */
export function useTestPrompt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ prompt, models, params }: {
            prompt: string;
            models: string[];
            params: PlaygroundParams;
        }) => aiPlaygroundService.testPrompt(prompt, models, params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playgroundHistory'] });
        },
    });
}

/**
 * Hook to delete a test
 */
export function useDeletePlaygroundTest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => aiPlaygroundService.deleteTest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playgroundHistory'] });
        },
    });
}
