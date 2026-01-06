import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmEmailService, Email, EmailTemplate } from '../services/crmEmailService';

export function useEmailHistory(contactId: string) {
    return useQuery({
        queryKey: ['emailHistory', contactId],
        queryFn: () => crmEmailService.getEmailHistory(contactId),
        enabled: !!contactId,
    });
}

export function useEmailTemplates() {
    return useQuery({
        queryKey: ['emailTemplates'],
        queryFn: () => crmEmailService.getEmailTemplates(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useSendEmail() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ to, subject, body, options }: { to: string; subject: string; body: string; options?: any }) =>
            crmEmailService.sendEmail(to, subject, body, options),
        onSuccess: (_, variables) => {
            if (variables.options?.contactId) {
                queryClient.invalidateQueries({ queryKey: ['emailHistory', variables.options.contactId] });
            }
        },
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (template: Partial<EmailTemplate>) => crmEmailService.createTemplate(template),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
        },
    });
}

export function useDeleteDraft() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => crmEmailService.deleteDraft(id),
        onSuccess: () => {
            // Invalidate relevant queries if drafts are listed somewhere specific, 
            // but here we mainly invalidate history if we were showing drafts there.
        }
    });
}
