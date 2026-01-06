import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmAssignmentService, DealAssignment } from '../services/crmAssignmentService';

export function useAssignedDeals(userId: string) {
    return useQuery({
        queryKey: ['assignedDeals', userId],
        queryFn: () => crmAssignmentService.getAssignedDeals(userId),
        enabled: !!userId,
    });
}

export function useDealTeam(dealId: string) {
    return useQuery({
        queryKey: ['dealTeam', dealId],
        queryFn: () => crmAssignmentService.getDealTeam(dealId),
        enabled: !!dealId,
    });
}

export function useAssignDeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ dealId, userId, role, assignedBy, notes }: { dealId: string; userId: string; role: 'owner' | 'collaborator' | 'viewer'; assignedBy: string; notes?: string }) =>
            crmAssignmentService.assignDeal(dealId, userId, role, assignedBy, notes),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dealTeam', variables.dealId] });
            queryClient.invalidateQueries({ queryKey: ['assignedDeals', variables.userId] });
        },
    });
}

export function useReassignDeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ dealId, newUserId, assignedBy }: { dealId: string; newUserId: string; assignedBy: string }) =>
            crmAssignmentService.reassignDeal(dealId, newUserId, assignedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dealTeam', variables.dealId] });
            // Invalidate potentially both old and new owner queries if we knew the old owner ID,
            // but invalidating key queries by dealId is often enough if lists update on navigate.
            // For safety we might want to invalidate all 'assignedDeals' queries if possible or acceptable,
            // but here we just invalidate the specific ones we know.
            queryClient.invalidateQueries({ queryKey: ['assignedDeals'] });
        },
    });
}

export function useUpdateAssignmentRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ assignmentId, newRole }: { assignmentId: string; newRole: 'owner' | 'collaborator' | 'viewer' }) =>
            crmAssignmentService.updateAssignmentRole(assignmentId, newRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dealTeam'] });
        },
    });
}

export function useRemoveAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (assignmentId: string) => crmAssignmentService.removeAssignment(assignmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dealTeam'] });
            queryClient.invalidateQueries({ queryKey: ['assignedDeals'] });
        },
    });
}
