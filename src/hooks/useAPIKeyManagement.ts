/**
 * API Key Management Hook
 * 
 * React Query hook for API key operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeyManagementService, APIKey } from '../services/apiKeyManagementService';
import { useToast } from './useToast';
import { useState } from 'react';

export const useAPIKeyManagement = (
    tenantId?: string,
    page: number = 1,
    perPage: number = 20
) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const [newKeyPlainText, setNewKeyPlainText] = useState<string | null>(null);

    // Get API keys
    const {
        data: keys,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['apiKeys', tenantId, page, perPage],
        queryFn: () => apiKeyManagementService.getKeys(tenantId, page, perPage)
    });

    // Create key mutation
    const createKey = useMutation({
        mutationFn: ({
            tenantId,
            name,
            permissions,
            options
        }: {
            tenantId: string;
            name: string;
            permissions: string[];
            options?: any;
        }) => apiKeyManagementService.createKey(tenantId, name, permissions, options),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            setNewKeyPlainText(result.plainKey);
            addToast('API key created successfully. Save it now - you won\'t see it again!', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to create API key', 'error');
        }
    });

    // Update status mutation
    const updateKeyStatus = useMutation({
        mutationFn: ({ keyId, status }: { keyId: string; status: APIKey['status'] }) =>
            apiKeyManagementService.updateKeyStatus(keyId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            addToast('Key status updated', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to update key status', 'error');
        }
    });

    // Revoke key mutation
    const revokeKey = useMutation({
        mutationFn: (keyId: string) => apiKeyManagementService.revokeKey(keyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            addToast('API key revoked', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to revoke key', 'error');
        }
    });

    // Update permissions mutation
    const updatePermissions = useMutation({
        mutationFn: ({ keyId, permissions }: { keyId: string; permissions: string[] }) =>
            apiKeyManagementService.updatePermissions(keyId, permissions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            addToast('Permissions updated', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to update permissions', 'error');
        }
    });

    // Rotate key mutation
    const rotateKey = useMutation({
        mutationFn: (keyId: string) => apiKeyManagementService.rotateKey(keyId),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            setNewKeyPlainText(result.plainKey);
            addToast('Key rotated successfully. Save the new key now!', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to rotate key', 'error');
        }
    });

    // Clear new key text
    const clearNewKey = () => setNewKeyPlainText(null);

    return {
        keys: keys?.items || [],
        totalPages: keys?.totalPages || 0,
        newKeyPlainText,
        createKey,
        updateKeyStatus,
        revokeKey,
        updatePermissions,
        rotateKey,
        clearNewKey,
        isLoading,
        isCreating: createKey.isPending,
        isUpdating: updateKeyStatus.isPending || updatePermissions.isPending,
        isRevoking: revokeKey.isPending,
        isRotating: rotateKey.isPending,
        refetch,
        availablePermissions: apiKeyManagementService.getAvailablePermissions()
    };
};

// Hook for key usage statistics
export const useAPIKeyUsage = (keyId: string, days: number = 30) => {
    return useQuery({
        queryKey: ['apiKeyUsage', keyId, days],
        queryFn: () => apiKeyManagementService.getUsageStatistics(keyId, days),
        enabled: !!keyId
    });
};
