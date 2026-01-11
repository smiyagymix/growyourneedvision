/**
 * Dashboard Builder Types
 * Proper types for dashboard widgets and layouts
 */

export interface WidgetConfigData {
    title?: string;
    dataSource?: string;
    chartType?: string;
    xAxis?: string;
    yAxis?: string;
    colorScheme?: string;
    refreshInterval?: number;
    period?: string;
    limit?: number;
    metric?: string;
    groupBy?: string;
    options?: string[];
    [key: string]: string | number | boolean | string[] | undefined;
}

export interface ChartData {
    labels: string[];
    datasets: Array<{
        label?: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
        [key: string]: any;
    }>;
    total?: number;
}

export interface TenantHealthData {
    id: string;
    name: string;
    score: number;
}

export interface UsageData {
    labels: string[];
    datasets: Array<{ data: number[] }>;
    metric: string;
}

export interface ChurnData {
    atRiskCount: number;
    predictions: Array<{ tenantId: string; riskScore: number;[key: string]: string | number | boolean | undefined }>;
}

export interface ActiveUsersData {
    count: number;
    trend: string;
}

export interface StorageData {
    total: number;
    used: number;
    byTenant: Array<{ tenantId: string; used: number;[key: string]: string | number | boolean | undefined }>;
}

export interface APICallsData {
    total: number;
    rate: number;
    limit: number;
}

export interface RecentSignupsData {
    id: string;
    name: string;
    created: string;
    [key: string]: string | number | boolean | undefined;
}

export interface TrialConversionsData {
    rate: number;
    count: number;
    total: number;
}

export interface SupportTicketsData {
    open: number;
    pending: number;
    resolved: number;
}

export interface SystemStatusData {
    services: Array<{
        name: string;
        status: string;
        uptime: number;
        [key: string]: string | number | boolean | undefined;
    }>;
}

export interface MRRTrendData {
    current: number;
    growth: number;
    history: Array<{ date: string; value: number;[key: string]: string | number | boolean | undefined }>;
}

export interface UserDistributionData {
    distribution: Array<{ group: string; count: number;[key: string]: string | number | boolean | undefined }>;
    groupBy: string;
}

export interface FeatureAdoptionData {
    features: Array<{ name: string; adoptionRate: number;[key: string]: string | number | boolean | undefined }>;
    period: string;
}

export interface AlertData {
    id: string;
    message: string;
    severity: string;
    [key: string]: string | number | boolean | undefined;
}

export type WidgetData =
    | ChartData
    | TenantHealthData[]
    | UsageData
    | ChurnData
    | ActiveUsersData
    | StorageData
    | APICallsData
    | RecentSignupsData[]
    | TrialConversionsData
    | SupportTicketsData
    | SystemStatusData
    | MRRTrendData
    | UserDistributionData
    | FeatureAdoptionData
    | AlertData[];
