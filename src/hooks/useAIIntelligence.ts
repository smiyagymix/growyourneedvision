import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiIntelligenceService } from '../services/aiIntelligenceService';

/**
 * Hook to fetch files for a specific intelligence level
 */
export function useIntelligenceFiles(level: 1 | 2 | 3 | 4 | 5) {
    return useQuery({
        queryKey: ['intelligenceFiles', level],
        queryFn: () => aiIntelligenceService.getFilesByLevel(level),
        staleTime: 30 * 1000, // 30 seconds
    });
}

/**
 * Hook to fetch all intelligence files
 */
export function useAllIntelligenceFiles() {
    return useQuery({
        queryKey: ['intelligenceFiles', 'all'],
        queryFn: () => aiIntelligenceService.getAllFiles(),
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to upload a file to an intelligence level
 */
export function useUploadIntelligenceFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ level, file }: { level: 1 | 2 | 3 | 4 | 5; file: File }) =>
            aiIntelligenceService.uploadFile(level, file),
        onSuccess: (data) => {
            // Invalidate queries for this level AND all files
            if (data.file) {
                queryClient.invalidateQueries({ queryKey: ['intelligenceFiles', data.file.level] });
            }
            queryClient.invalidateQueries({ queryKey: ['intelligenceFiles', 'all'] });
            queryClient.invalidateQueries({ queryKey: ['intelligenceStats'] });
        },
    });
}

/**
 * Hook to delete an intelligence file
 */
export function useDeleteIntelligenceFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (fileId: string) => aiIntelligenceService.deleteFile(fileId),
        onSuccess: () => {
            // Invalidate all intelligence queries
            queryClient.invalidateQueries({ queryKey: ['intelligenceFiles'] });
            queryClient.invalidateQueries({ queryKey: ['intelligenceStats'] });
        },
    });
}

/**
 * Hook to reprocess a file
 */
export function useReprocessIntelligenceFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (fileId: string) => aiIntelligenceService.reprocessFile(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['intelligenceFiles'] });
        },
    });
}

/**
 * Hook to get stats for a specific level
 */
export function useIntelligenceLevelStats(level: 1 | 2 | 3 | 4 | 5) {
    return useQuery({
        queryKey: ['intelligenceStats', level],
        queryFn: () => aiIntelligenceService.getLevelStats(level),
        staleTime: 60 * 1000, // 1 minute
    });
}

/**
 * Hook to get overall intelligence stats
 */
export function useOverallIntelligenceStats() {
    return useQuery({
        queryKey: ['intelligenceStats', 'overall'],
        queryFn: () => aiIntelligenceService.getOverallStats(),
        staleTime: 60 * 1000,
    });
}
