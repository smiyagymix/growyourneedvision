/**
 * Tenant Usage Reports Hook
 * 
 * React Query hook for usage report generation and analysis
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantUsageReportsService, UsageReport } from '../services/tenantUsageReportsService';
import { useToast } from './useToast';

export const useTenantUsageReports = (
    tenantId?: string,
    page: number = 1,
    perPage: number = 20
) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    // Get reports
    const {
        data: reports,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['usageReports', tenantId, page, perPage],
        queryFn: () => tenantUsageReportsService.getReports(tenantId, page, perPage)
    });

    // Generate report mutation
    const generateReport = useMutation({
        mutationFn: ({
            tenantId,
            period,
            startDate,
            endDate
        }: {
            tenantId: string;
            period: UsageReport['reportPeriod'];
            startDate: Date;
            endDate: Date;
        }) => tenantUsageReportsService.generateReport(tenantId, period, startDate, endDate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usageReports'] });
            addToast('Report generated successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to generate report', 'error');
        }
    });

    // Export to PDF mutation
    const exportToPDF = useMutation({
        mutationFn: (reportId: string) => tenantUsageReportsService.exportToPDF(reportId),
        onSuccess: (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `usage-report-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Report exported to PDF', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to export report', 'error');
        }
    });

    // Schedule report mutation
    const scheduleReport = useMutation({
        mutationFn: ({
            tenantId,
            period,
            recipients
        }: {
            tenantId: string;
            period: UsageReport['reportPeriod'];
            recipients: string[];
        }) => tenantUsageReportsService.scheduleReport(tenantId, period, recipients),
        onSuccess: (result) => {
            addToast(`Report scheduled. Next run: ${result.nextRun.toLocaleDateString()}`, 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to schedule report', 'error');
        }
    });

    return {
        reports: reports?.items || [],
        totalPages: reports?.totalPages || 0,
        generateReport,
        exportToPDF,
        scheduleReport,
        isLoading,
        isGenerating: generateReport.isPending,
        isExporting: exportToPDF.isPending,
        isScheduling: scheduleReport.isPending,
        refetch
    };
};
