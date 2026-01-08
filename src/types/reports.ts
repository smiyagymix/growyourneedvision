/**
 * Report Types
 * Proper types for report filters and configurations
 */

export interface ReportFilters {
    startDate?: string;
    endDate?: string;
    tenantId?: string;
    userId?: string;
    status?: string;
    type?: string;
    [key: string]: string | number | boolean | undefined;
}
