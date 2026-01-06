/**
 * Bulk User Operations Hook
 * 
 * React Query hook for bulk user operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkUserOperationsService, BulkOperationOptions } from '../services/bulkUserOperationsService';
import { useToast } from './useToast';

export const useBulkOperations = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    // Get all operations
    const {
        data: operations,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['bulkOperations'],
        queryFn: () => bulkUserOperationsService.getOperations(1, 20),
        refetchInterval: 5000 // Poll every 5 seconds for updates
    });

    // Get statistics
    const {
        data: statistics,
        isLoading: isLoadingStats
    } = useQuery({
        queryKey: ['bulkOperationsStats'],
        queryFn: () => bulkUserOperationsService.getStatistics(),
        refetchInterval: 60000 // Refresh every minute
    });

    // Start operation mutation
    const startOperation = useMutation({
        mutationFn: (options: BulkOperationOptions) =>
            bulkUserOperationsService.startBulkOperation(options),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bulkOperations'] });
            queryClient.invalidateQueries({ queryKey: ['bulkOperationsStats'] });
            addToast('Operation started', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to start operation', 'error');
        }
    });

    // Cancel operation mutation
    const cancelOperation = useMutation({
        mutationFn: (operationId: string) =>
            bulkUserOperationsService.cancelOperation(operationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bulkOperations'] });
            addToast('Operation cancelled', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to cancel operation', 'error');
        }
    });

    // Change roles mutation
    const changeUserRoles = useMutation({
        mutationFn: ({ userIds, newRole }: { userIds: string[]; newRole: string }) =>
            bulkUserOperationsService.changeUserRoles(userIds, newRole),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['bulkOperations'] });
            addToast(
                `Updated ${result.processed} users (${result.failed} failed)`,
                result.failed === 0 ? 'success' : 'warning'
            );
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to change roles', 'error');
        }
    });

    // Update status mutation
    const updateUserStatus = useMutation({
        mutationFn: ({ userIds, status }: { 
            userIds: string[]; 
            status: 'active' | 'suspended' | 'inactive' 
        }) =>
            bulkUserOperationsService.updateUserStatus(userIds, status),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['bulkOperations'] });
            addToast(
                `Updated ${result.processed} users (${result.failed} failed)`,
                result.failed === 0 ? 'success' : 'warning'
            );
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to update status', 'error');
        }
    });

    // Send bulk message mutation
    const sendBulkMessage = useMutation({
        mutationFn: ({ userIds, message }: { 
            userIds: string[]; 
            message: { subject: string; body: string } 
        }) =>
            bulkUserOperationsService.sendBulkMessage(userIds, message),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['bulkOperations'] });
            addToast(
                `Sent to ${result.processed} users (${result.failed} failed)`,
                result.failed === 0 ? 'success' : 'warning'
            );
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to send messages', 'error');
        }
    });

    // Bulk delete mutation
    const bulkDeleteUsers = useMutation({
        mutationFn: ({ userIds, permanent }: { userIds: string[]; permanent: boolean }) =>
            bulkUserOperationsService.bulkDeleteUsers(userIds, permanent),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['bulkOperations'] });
            addToast(
                `Deleted ${result.processed} users (${result.failed} failed)`,
                result.failed === 0 ? 'success' : 'warning'
            );
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to delete users', 'error');
        }
    });

    return {
        operations: operations?.items || [],
        totalPages: operations?.totalPages || 0,
        statistics,
        startOperation,
        cancelOperation,
        changeUserRoles,
        updateUserStatus,
        sendBulkMessage,
        bulkDeleteUsers,
        isLoading,
        isLoadingStats,
        isStarting: startOperation.isPending,
        isCancelling: cancelOperation.isPending,
        refetch
    };
};

// Hook for getting single operation with real-time updates
export const useBulkOperation = (operationId: string) => {
    return useQuery({
        queryKey: ['bulkOperation', operationId],
        queryFn: () => bulkUserOperationsService.getOperation(operationId),
        enabled: !!operationId,
        refetchInterval: 2000 // Poll every 2 seconds while processing
    });
};
