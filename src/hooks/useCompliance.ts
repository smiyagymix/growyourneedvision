/**
 * useCompliance Hook
 * 
 * React Query hook for compliance reports and violation tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    complianceService, 
    ComplianceStandard, 
    ComplianceReport,
    ComplianceViolation 
} from '../services/complianceService';
import { useToast } from './useToast';

export const useCompliance = (standard?: ComplianceStandard, tenantId?: string) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Get compliance metrics
    const {
        data: metrics,
        isLoading: metricsLoading
    } = useQuery({
        queryKey: ['complianceMetrics', standard, tenantId],
        queryFn: () => standard ? complianceService.getComplianceMetrics(standard, tenantId) : null,
        enabled: !!standard
    });

    // Get compliance reports
    const {
        data: reports = [],
        isLoading: reportsLoading,
        refetch: refetchReports
    } = useQuery({
        queryKey: ['complianceReports', standard, tenantId],
        queryFn: () => complianceService.getReports(standard, tenantId)
    });

    // Get violations
    const {
        data: violations = [],
        isLoading: violationsLoading,
        refetch: refetchViolations
    } = useQuery({
        queryKey: ['complianceViolations', standard, tenantId],
        queryFn: () => standard ? complianceService.getViolations(standard, tenantId) : [],
        enabled: !!standard
    });

    // Generate compliance report
    const generateReport = useMutation({
        mutationFn: ({ 
            standard, 
            tenantId, 
            period 
        }: { 
            standard: ComplianceStandard; 
            tenantId?: string; 
            period?: { start: Date; end: Date } 
        }) => complianceService.generateComplianceReport(standard, tenantId, period),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complianceReports'] });
            queryClient.invalidateQueries({ queryKey: ['complianceMetrics'] });
            addToast('Compliance report generated successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to generate report: ${error.message}`, 'error');
        }
    });

    // Create violation
    const createViolation = useMutation({
        mutationFn: (violation: Omit<ComplianceViolation, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) =>
            complianceService.createViolation(violation),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complianceViolations'] });
            queryClient.invalidateQueries({ queryKey: ['complianceMetrics'] });
            addToast('Violation recorded successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to record violation: ${error.message}`, 'error');
        }
    });

    // Resolve violation
    const resolveViolation = useMutation({
        mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
            complianceService.resolveViolation(id, resolution),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complianceViolations'] });
            queryClient.invalidateQueries({ queryKey: ['complianceMetrics'] });
            addToast('Violation resolved successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to resolve violation: ${error.message}`, 'error');
        }
    });

    return {
        // Data
        metrics,
        reports,
        violations,

        // Loading states
        metricsLoading,
        reportsLoading,
        violationsLoading,
        loading: metricsLoading || reportsLoading || violationsLoading,

        // Mutations
        generateReport: generateReport.mutate,
        createViolation: createViolation.mutate,
        resolveViolation: resolveViolation.mutate,

        // Mutation states
        isGenerating: generateReport.isPending,
        isCreatingViolation: createViolation.isPending,
        isResolvingViolation: resolveViolation.isPending,

        // Refresh
        refetchReports,
        refetchViolations,
        refresh: () => {
            refetchReports();
            refetchViolations();
        }
    };
};
