/**
 * Owner Services Hooks
 * 
 * React hooks for Owner-specific backend services
 * Provides data fetching with loading/error states for analytics, tenant management, and compliance
 */

import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:3002/api/owner';

interface UseOwnerAnalyticsReturn {
    getKPIs: () => Promise<any>;
    getChurnRisk: () => Promise<any>;
    getForecast: (months?: number) => Promise<any>;
    getUsageTrends: (period?: string) => Promise<any>;
    getCostAnalysis: () => Promise<any>;
    loading: boolean;
    error: string | null;
}

export const useOwnerAnalytics = (): UseOwnerAnalyticsReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (endpoint: string, options?: RequestInit) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMsg);
            console.error('Owner Analytics API Error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getKPIs = useCallback(async () => {
        return fetchData('/analytics/kpis');
    }, [fetchData]);

    const getChurnRisk = useCallback(async () => {
        return fetchData('/analytics/churn-risk');
    }, [fetchData]);

    const getForecast = useCallback(async (months = 12) => {
        return fetchData(`/analytics/forecast?months=${months}`);
    }, [fetchData]);

    const getUsageTrends = useCallback(async (period = '30d') => {
        return fetchData(`/analytics/usage-trends?period=${period}`);
    }, [fetchData]);

    const getCostAnalysis = useCallback(async () => {
        return fetchData('/analytics/cost-analysis');
    }, [fetchData]);

    return {
        getKPIs,
        getChurnRisk,
        getForecast,
        getUsageTrends,
        getCostAnalysis,
        loading,
        error
    };
};

interface BulkSuspendParams {
    tenantIds: string[];
    reason: string;
    details: string;
    userId: string;
}

interface CloneTenantParams {
    sourceId: string;
    newName: string;
    options: {
        dataTypes?: string[];
        adminEmail?: string;
        userId: string;
    };
}

interface MigrateTenantParams {
    fromId: string;
    toId: string;
    dataTypes: string[];
    userId: string;
}

interface AssignDomainParams {
    domain: string;
    userId: string;
}

interface UseOwnerTenantsReturn {
    bulkSuspend: (params: BulkSuspendParams) => Promise<any>;
    bulkResume: (tenantIds: string[], userId: string) => Promise<any>;
    cloneTenant: (params: CloneTenantParams) => Promise<any>;
    migrateTenantData: (params: MigrateTenantParams) => Promise<any>;
    getTenantHealth: (tenantId: string) => Promise<any>;
    assignCustomDomain: (tenantId: string, params: AssignDomainParams) => Promise<any>;
    loading: boolean;
    error: string | null;
}

export const useOwnerTenants = (): UseOwnerTenantsReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (endpoint: string, options?: RequestInit) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMsg);
            console.error('Owner Tenants API Error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const bulkSuspend = useCallback(async (params: BulkSuspendParams) => {
        return fetchData('/tenants/bulk-suspend', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }, [fetchData]);

    const bulkResume = useCallback(async (tenantIds: string[], userId: string) => {
        // Note: This endpoint needs to be added to the backend
        return fetchData('/tenants/bulk-resume', {
            method: 'POST',
            body: JSON.stringify({ tenantIds, userId })
        });
    }, [fetchData]);

    const cloneTenant = useCallback(async (params: CloneTenantParams) => {
        return fetchData('/tenants/clone', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }, [fetchData]);

    const migrateTenantData = useCallback(async (params: MigrateTenantParams) => {
        return fetchData('/tenants/migrate', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }, [fetchData]);

    const getTenantHealth = useCallback(async (tenantId: string) => {
        return fetchData(`/tenants/${tenantId}/health`);
    }, [fetchData]);

    const assignCustomDomain = useCallback(async (tenantId: string, params: AssignDomainParams) => {
        return fetchData(`/tenants/${tenantId}/custom-domain`, {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }, [fetchData]);

    return {
        bulkSuspend,
        bulkResume,
        cloneTenant,
        migrateTenantData,
        getTenantHealth,
        assignCustomDomain,
        loading,
        error
    };
};

interface UseOwnerComplianceReturn {
    exportUserData: (userId: string) => Promise<void>;
    deleteUserData: (userId: string, reason?: string) => Promise<any>;
    generateComplianceReport: (standard: string, tenantId?: string) => Promise<any>;
    getRetentionStatus: (tenantId?: string) => Promise<any>;
    loading: boolean;
    error: string | null;
}

export const useOwnerCompliance = (): UseOwnerComplianceReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (endpoint: string, options?: RequestInit) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMsg);
            console.error('Owner Compliance API Error:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const exportUserData = useCallback(async (userId: string) => {
        try {
            const response = await fetchData(`/compliance/export-user/${userId}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-data-${userId}-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export user data error:', err);
            throw err;
        }
    }, [fetchData]);

    const deleteUserData = useCallback(async (userId: string, reason = 'user_request') => {
        const response = await fetchData(`/compliance/delete-user/${userId}`, {
            method: 'DELETE',
            body: JSON.stringify({ reason })
        });
        return response.json();
    }, [fetchData]);

    const generateComplianceReport = useCallback(async (standard: string, tenantId?: string) => {
        const response = await fetchData('/compliance/report', {
            method: 'POST',
            body: JSON.stringify({ standard, tenantId })
        });
        return response.json();
    }, [fetchData]);

    const getRetentionStatus = useCallback(async (tenantId?: string) => {
        const query = tenantId ? `?tenantId=${tenantId}` : '';
        const response = await fetchData(`/compliance/retention-status${query}`);
        return response.json();
    }, [fetchData]);

    return {
        exportUserData,
        deleteUserData,
        generateComplianceReport,
        getRetentionStatus,
        loading,
        error
    };
};

// Combined hook for convenience
export const useOwnerServices = () => {
    const analytics = useOwnerAnalytics();
    const tenants = useOwnerTenants();
    const compliance = useOwnerCompliance();

    return {
        analytics,
        tenants,
        compliance
    };
};
