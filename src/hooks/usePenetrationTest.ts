/**
 * Penetration Test Tracking Hook
 * 
 * React Query hook for penetration test management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    penetrationTestTrackingService, 
    PenetrationTest,
    Vulnerability 
} from '../services/penetrationTestTrackingService';
import { useToast } from './useToast';

export const usePenetrationTests = (
    filters?: { status?: string; type?: string; tenantId?: string },
    page: number = 1,
    perPage: number = 20
) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    // Get all tests
    const {
        data: tests,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['penetrationTests', filters, page, perPage],
        queryFn: () => penetrationTestTrackingService.getTests(filters, page, perPage)
    });

    // Get statistics
    const {
        data: statistics,
        isLoading: isLoadingStats
    } = useQuery({
        queryKey: ['pentestStatistics', filters?.tenantId],
        queryFn: () => penetrationTestTrackingService.getStatistics(filters?.tenantId)
    });

    // Get open vulnerabilities
    const {
        data: openVulnerabilities,
        isLoading: isLoadingVulns
    } = useQuery({
        queryKey: ['openVulnerabilities', filters?.tenantId],
        queryFn: () => penetrationTestTrackingService.getAllOpenVulnerabilities(filters?.tenantId)
    });

    // Schedule test mutation
    const scheduleTest = useMutation({
        mutationFn: (test: Partial<PenetrationTest>) =>
            penetrationTestTrackingService.scheduleTest(test),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['penetrationTests'] });
            queryClient.invalidateQueries({ queryKey: ['pentestStatistics'] });
            addToast('Test scheduled successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to schedule test', 'error');
        }
    });

    // Update test status mutation
    const updateTestStatus = useMutation({
        mutationFn: ({
            testId,
            status,
            completedDate
        }: {
            testId: string;
            status: PenetrationTest['status'];
            completedDate?: Date;
        }) => penetrationTestTrackingService.updateTestStatus(testId, status, completedDate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['penetrationTests'] });
            queryClient.invalidateQueries({ queryKey: ['pentestStatistics'] });
            addToast('Test status updated', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to update test', 'error');
        }
    });

    // Add vulnerability mutation
    const addVulnerability = useMutation({
        mutationFn: (vulnerability: Partial<Vulnerability>) =>
            penetrationTestTrackingService.addVulnerability(vulnerability),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['penetrationTests'] });
            queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
            queryClient.invalidateQueries({ queryKey: ['openVulnerabilities'] });
            queryClient.invalidateQueries({ queryKey: ['pentestStatistics'] });
            addToast('Vulnerability added', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to add vulnerability', 'error');
        }
    });

    // Update vulnerability mutation
    const updateVulnerability = useMutation({
        mutationFn: ({
            vulnId,
            updates
        }: {
            vulnId: string;
            updates: Partial<Vulnerability>;
        }) => penetrationTestTrackingService.updateVulnerability(vulnId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
            queryClient.invalidateQueries({ queryKey: ['openVulnerabilities'] });
            queryClient.invalidateQueries({ queryKey: ['pentestStatistics'] });
            addToast('Vulnerability updated', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to update vulnerability', 'error');
        }
    });

    return {
        tests: tests?.items || [],
        totalPages: tests?.totalPages || 0,
        statistics,
        openVulnerabilities: openVulnerabilities || [],
        scheduleTest,
        updateTestStatus,
        addVulnerability,
        updateVulnerability,
        isLoading,
        isLoadingStats,
        isLoadingVulns,
        isScheduling: scheduleTest.isPending,
        isUpdating: updateTestStatus.isPending || updateVulnerability.isPending,
        refetch
    };
};

// Hook for single test with vulnerabilities
export const usePenetrationTest = (testId: string) => {
    const { addToast } = useToast();

    // Get vulnerabilities for test
    const {
        data: vulnerabilities,
        isLoading
    } = useQuery({
        queryKey: ['vulnerabilities', testId],
        queryFn: () => penetrationTestTrackingService.getVulnerabilities(testId),
        enabled: !!testId
    });

    // Generate report
    const { data: report, isLoading: isLoadingReport } = useQuery({
        queryKey: ['pentestReport', testId],
        queryFn: () => penetrationTestTrackingService.generateReport(testId),
        enabled: !!testId
    });

    return {
        vulnerabilities: vulnerabilities || [],
        report,
        isLoading,
        isLoadingReport
    };
};
