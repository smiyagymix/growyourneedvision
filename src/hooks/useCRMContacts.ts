import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmContactsService, ContactFilters, CRMContact } from '../services/crmContactsService';

/**
 * Hook to fetch all contacts
 */
export function useContacts(filters?: ContactFilters) {
    return useQuery({
        queryKey: ['contacts', filters],
        queryFn: () => crmContactsService.getAllContacts(filters),
        staleTime: 30 * 1000,
    });
}

/**
 * Hook to fetch a single contact
 */
export function useContact(id: string) {
    return useQuery({
        queryKey: ['contact', id],
        queryFn: () => crmContactsService.getContactById(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a contact
 */
export function useCreateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<CRMContact>) => crmContactsService.createContact(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            queryClient.invalidateQueries({ queryKey: ['contactStats'] });
        },
    });
}

/**
 * Hook to update a contact
 */
export function useUpdateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CRMContact> }) =>
            crmContactsService.updateContact(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            queryClient.invalidateQueries({ queryKey: ['contact', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['contactStats'] });
        },
    });
}

/**
 * Hook to delete a contact
 */
export function useDeleteContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => crmContactsService.deleteContact(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            queryClient.invalidateQueries({ queryKey: ['contactStats'] });
        },
    });
}

/**
 * Hook to search contacts
 */
export function useSearchContacts(query: string) {
    return useQuery({
        queryKey: ['contacts', 'search', query],
        queryFn: () => crmContactsService.searchContacts(query),
        enabled: query.length > 0,
        staleTime: 10 * 1000,
    });
}

/**
 * Hook to get contact statistics
 */
export function useContactStats() {
    return useQuery({
        queryKey: ['contactStats'],
        queryFn: () => crmContactsService.getContactStats(),
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to add tag to contact
 */
export function useAddTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ contactId, tag }: { contactId: string; tag: string }) =>
            crmContactsService.addTag(contactId, tag),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });
}

/**
 * Hook to import contacts
 */
export function useImportContacts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ csvData, createdBy }: { csvData: string; createdBy: string }) => 
            crmContactsService.importContacts(csvData, createdBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            queryClient.invalidateQueries({ queryKey: ['contactStats'] });
        },
    });
}

/**
 * Hook to export contacts
 */
export function useExportContacts() {
    return useMutation({
        mutationFn: (filters?: ContactFilters) => crmContactsService.exportContacts(filters),
    });
}
