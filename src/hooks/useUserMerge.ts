/**
 * User Merge/Deduplication Hook
 * 
 * React Query hook for user merging and duplicate detection
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userMergeDeduplicationService, MergeOptions } from '../services/userMergeDeduplicationService';
import { useToast } from './useToast';

export const useUserMerge = (tenantId?: string, threshold: number = 80) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    // Detect duplicates
    const {
        data: duplicates,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['userDuplicates', tenantId, threshold],
        queryFn: () => userMergeDeduplicationService.detectDuplicates(tenantId, threshold)
    });

    // Get merge history
    const {
        data: mergeHistory,
        isLoading: isLoadingHistory
    } = useQuery({
        queryKey: ['mergeHistory'],
        queryFn: () => userMergeDeduplicationService.getMergeHistory(50)
    });

    // Merge users mutation
    const mergeUsers = useMutation({
        mutationFn: (options: MergeOptions) =>
            userMergeDeduplicationService.mergeUsers(options),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['userDuplicates'] });
            queryClient.invalidateQueries({ queryKey: ['mergeHistory'] });
            
            if (result.success) {
                if (result.errors.length > 0) {
                    addToast(
                        `Merged successfully with ${result.errors.length} warnings`,
                        'warning'
                    );
                } else {
                    addToast('Users merged successfully', 'success');
                }
            } else {
                addToast('Merge failed', 'error');
            }
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to merge users', 'error');
        }
    });

    // Preview merge mutation
    const previewMerge = useMutation({
        mutationFn: (options: MergeOptions) =>
            userMergeDeduplicationService.previewMerge(options),
        onError: (error: any) => {
            addToast(error.message || 'Preview failed', 'error');
        }
    });

    // Undo merge mutation
    const undoMerge = useMutation({
        mutationFn: (mergeId: string) =>
            userMergeDeduplicationService.undoMerge(mergeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userDuplicates'] });
            queryClient.invalidateQueries({ queryKey: ['mergeHistory'] });
            addToast('Merge undone successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to undo merge', 'error');
        }
    });

    return {
        duplicates,
        mergeHistory,
        mergeUsers,
        previewMerge,
        undoMerge,
        isLoading,
        isLoadingHistory,
        isMerging: mergeUsers.isPending,
        isPreviewing: previewMerge.isPending,
        isUndoing: undoMerge.isPending,
        refetch
    };
};
