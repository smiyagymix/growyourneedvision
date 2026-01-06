/**
 * Comparative Analytics Hook
 * 
 * React Query hook for tenant comparison analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comparativeAnalyticsService, TenantComparison, ComparisonReport, ComparisonMetric } from '../services/comparativeAnalyticsService';
import { useToast } from './useToast';

export const useComparativeAnalytics = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Get available metrics
    const metrics = comparativeAnalyticsService.getAvailableMetrics();

    // Get metrics by category
    const getMetricsByCategory = (category: string): ComparisonMetric[] => {
        return comparativeAnalyticsService.getMetricsByCategory(category);
    };

    // Compare tenants
    const compareTenants = async (
        tenantIds: string[],
        metrics: string[],
        period?: { start: Date; end: Date }
    ): Promise<TenantComparison[]> => {
        return comparativeAnalyticsService.compareTenants(tenantIds, metrics, period);
    };

    // Get comparison reports
    const { data: reports = [], isLoading: reportsLoading } = useQuery({
        queryKey: ['comparison-reports'],
        queryFn: () => comparativeAnalyticsService.getComparisonReports()
    });

    // Create comparison report mutation
    const createReport = useMutation({
        mutationFn: (params: {
            name: string;
            description: string;
            tenantIds: string[];
            metrics: string[];
            period?: { start: Date; end: Date };
        }) =>
            comparativeAnalyticsService.createComparisonReport(
                params.name,
                params.description,
                params.tenantIds,
                params.metrics,
                params.period
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comparison-reports'] });
            addToast('Comparison report created successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to create report: ${error.message}`, 'error');
        }
    });

    // Get single report
    const useReport = (reportId: string) => useQuery<ComparisonReport>({
        queryKey: ['comparison-report', reportId],
        queryFn: () => comparativeAnalyticsService.getComparisonReport(reportId),
        enabled: !!reportId
    });

    // Update comparison report mutation
    const updateReport = useMutation({
        mutationFn: (params: { reportId: string; updates: Partial<ComparisonReport> }) =>
            comparativeAnalyticsService.updateComparisonReport(params.reportId, params.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comparison-reports'] });
            addToast('Comparison report updated successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to update report: ${error.message}`, 'error');
        }
    });

    // Delete comparison report mutation
    const deleteReport = useMutation({
        mutationFn: (reportId: string) =>
            comparativeAnalyticsService.deleteComparisonReport(reportId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comparison-reports'] });
            addToast('Comparison report deleted successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to delete report: ${error.message}`, 'error');
        }
    });

    // Export comparison report mutation
    const exportReport = useMutation({
        mutationFn: (params: { reportId: string; format: 'pdf' | 'csv' | 'excel' }) =>
            comparativeAnalyticsService.exportComparisonReport(params.reportId, params.format),
        onSuccess: () => {
            addToast('Report exported successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to export report: ${error.message}`, 'error');
        }
    });

    // Get tenant benchmarks
    const useBenchmarks = (tenantId: string) => useQuery({
        queryKey: ['tenant-benchmarks', tenantId],
        queryFn: () => comparativeAnalyticsService.getBenchmarks(tenantId),
        enabled: !!tenantId
    });

    return {
        metrics,
        getMetricsByCategory,
        compareTenants,
        reports,
        reportsLoading,
        createReport,
        updateReport,
        deleteReport,
        exportReport,
        useReport,
        useBenchmarks
    };
};
