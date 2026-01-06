/**
 * Analytics Service
 * Frontend service for consuming analytics APIs and exporting reports
 */

import env from '../config/environment';
import { isMockEnv } from '../utils/mockData';

const API_URL = env.get('serverUrl') || 'http://localhost:3001';
const API_KEY = env.get('apiKey') || 'your-api-key-here';

// Mock data for testing
const MOCK_COHORT_DATA = {
    success: true,
    cohorts: [
        {
            cohort: '2024-12',
            cohortDate: '2024-12-01T00:00:00Z',
            size: 150,
            retention: [
                { period: 0, activeUsers: 150, retentionRate: 100 },
                { period: 1, activeUsers: 120, retentionRate: 80 },
                { period: 2, activeUsers: 105, retentionRate: 70 },
                { period: 3, activeUsers: 90, retentionRate: 60 }
            ],
            revenue: 7500,
            avgLifetimeValue: 50
        }
    ],
    summary: {
        totalCohorts: 12,
        totalUsers: 1800,
        avgRetentionRate: 65.5
    }
};

const MOCK_RETENTION_DATA = {
    success: true,
    totalUsers: 2000,
    curve: [
        { period: 0, periodLabel: 'Month 0', retentionRate: 100, retainedUsers: 2000, churnRate: 0 },
        { period: 1, periodLabel: 'Month 1', retentionRate: 85, retainedUsers: 1700, churnRate: 15 },
        { period: 3, periodLabel: 'Month 3', retentionRate: 65, retainedUsers: 1300, churnRate: 35 },
        { period: 6, periodLabel: 'Month 6', retentionRate: 50, retainedUsers: 1000, churnRate: 50 },
        { period: 12, periodLabel: 'Month 12', retentionRate: 40, retainedUsers: 800, churnRate: 60 }
    ],
    summary: {
        period1Retention: 85,
        period3Retention: 65,
        period6Retention: 50,
        period12Retention: 40
    }
};

const MOCK_MRR_DATA = {
    success: true,
    current: {
        mrr: 125000,
        arr: 1500000,
        activeSubscriptions: 2500,
        avgRevenuePerUser: 50
    },
    growth: {
        mrrGrowth: 5000,
        mrrGrowthRate: 4.17,
        previousMRR: 120000
    },
    churn: {
        churnedMRR: 3000,
        churnRate: 2.4,
        churnedSubscriptions: 60
    }
};

const MOCK_LTV_DATA = {
    success: true,
    overall: {
        avgLTV: 600,
        avgLifetimeMonths: 12,
        avgMonthlyValue: 50,
        totalCustomers: 2500
    },
    byPlan: [
        { plan: 'Basic', avgLTV: 360, avgLifetimeMonths: 12, customers: 1000 },
        { plan: 'Pro', avgLTV: 900, avgLifetimeMonths: 15, customers: 1200 },
        { plan: 'Enterprise', avgLTV: 2400, avgLifetimeMonths: 24, customers: 300 }
    ]
};

/**
 * Fetch cohort analysis
 */
export async function getCohortAnalysis(options = {}) {
    if (isMockEnv()) {
        console.log('[MOCK] Getting cohort analysis');
        return MOCK_COHORT_DATA;
    }

    try {
        const params = new URLSearchParams({
            cohortBy: options.cohortBy || 'month',
            metric: options.metric || 'retention',
            ...(options.startDate && { startDate: options.startDate }),
            ...(options.endDate && { endDate: options.endDate })
        });

        const response = await fetch(`${API_URL}/api/analytics/cohorts?${params}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch cohort analysis');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching cohort analysis:', error);
        throw error;
    }
}

/**
 * Fetch retention curve
 */
export async function getRetentionCurve(options = {}) {
    if (isMockEnv()) {
        console.log('[MOCK] Getting retention curve');
        return MOCK_RETENTION_DATA;
    }

    try {
        const params = new URLSearchParams({
            period: options.period || 'month',
            maxPeriods: options.maxPeriods || '12',
            ...(options.startDate && { startDate: options.startDate })
        });

        const response = await fetch(`${API_URL}/api/analytics/retention?${params}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch retention curve');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching retention curve:', error);
        throw error;
    }
}

/**
 * Fetch MRR metrics
 */
export async function getMRRMetrics(options = {}) {
    if (isMockEnv()) {
        console.log('[MOCK] Getting MRR metrics');
        return MOCK_MRR_DATA;
    }

    try {
        const params = new URLSearchParams({
            ...(options.startDate && { startDate: options.startDate }),
            ...(options.endDate && { endDate: options.endDate })
        });

        const response = await fetch(`${API_URL}/api/analytics/mrr?${params}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch MRR metrics');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching MRR metrics:', error);
        throw error;
    }
}

/**
 * Fetch LTV metrics
 */
export async function getLTVMetrics() {
    if (isMockEnv()) {
        console.log('[MOCK] Getting LTV metrics');
        return MOCK_LTV_DATA;
    }

    try {
        const response = await fetch(`${API_URL}/api/analytics/ltv`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch LTV metrics');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching LTV metrics:', error);
        throw error;
    }
}

/**
 * Fetch funnel analytics
 */
export async function getFunnelAnalytics(steps) {
    if (isMockEnv()) {
        console.log('[MOCK] Getting funnel analytics');
        return {
            success: true,
            funnel: [
                { step: 1, name: 'Visit', count: 10000, conversionRate: 100, dropoffRate: 0 },
                { step: 2, name: 'Sign Up', count: 2000, conversionRate: 20, dropoffRate: 80 },
                { step: 3, name: 'First Payment', count: 1200, conversionRate: 60, dropoffRate: 40 }
            ],
            summary: {
                totalSteps: 3,
                overallConversion: 12,
                biggestDropoff: { step: 'Sign Up', rate: 80 }
            }
        };
    }

    try {
        const response = await fetch(`${API_URL}/api/analytics/funnel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ steps })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch funnel analytics');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching funnel analytics:', error);
        throw error;
    }
}

/**
 * Export analytics report
 */
export async function exportAnalytics(type, format, options = {}) {
    if (isMockEnv()) {
        console.log(`[MOCK] Exporting ${type} as ${format}`);
        return {
            success: true,
            message: 'Export completed (mock)',
            filename: `${type}-report-${new Date().toISOString().split('T')[0]}.${format}`
        };
    }

    try {
        const response = await fetch(`${API_URL}/api/analytics/export`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                format,
                options
            })
        });

        if (!response.ok) {
            throw new Error('Failed to export analytics');
        }

        if (format === 'pdf') {
            // Download PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return {
                success: true,
                message: 'PDF downloaded successfully'
            };
        } else {
            // Return Excel data for frontend conversion
            return await response.json();
        }
    } catch (error) {
        console.error('Error exporting analytics:', error);
        throw error;
    }
}

/**
 * Export to Excel using SheetJS (XLSX)
 */
export async function exportToExcel(data, filename) {
    try {
        // Dynamically import xlsx
        const XLSX = await import('xlsx');

        let worksheet;
        let workbook = XLSX.utils.book_new();

        // Convert data based on type
        if (data.cohorts) {
            // Cohort data
            const cohortData = data.cohorts.map(c => ({
                'Cohort': c.cohort,
                'Size': c.size,
                'Revenue': c.revenue,
                'Avg LTV': c.avgLifetimeValue,
                'Month 1 Retention': c.retention.find(r => r.period === 1)?.retentionRate || 0,
                'Month 3 Retention': c.retention.find(r => r.period === 3)?.retentionRate || 0
            }));
            worksheet = XLSX.utils.json_to_sheet(cohortData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Cohorts');
        } else if (data.curve) {
            // Retention curve
            const retentionData = data.curve.map(c => ({
                'Period': c.periodLabel,
                'Retention Rate': `${c.retentionRate.toFixed(1)}%`,
                'Retained Users': c.retainedUsers,
                'Churn Rate': `${c.churnRate.toFixed(1)}%`,
                'Churned Users': c.churnedUsers
            }));
            worksheet = XLSX.utils.json_to_sheet(retentionData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Retention');
        } else if (data.current) {
            // MRR data
            const mrrData = [
                { Metric: 'MRR', Value: `$${data.current.mrr.toLocaleString()}` },
                { Metric: 'ARR', Value: `$${data.current.arr.toLocaleString()}` },
                { Metric: 'Active Subscriptions', Value: data.current.activeSubscriptions },
                { Metric: 'ARPU', Value: `$${data.current.avgRevenuePerUser.toFixed(2)}` },
                { Metric: 'MRR Growth', Value: `$${data.growth.mrrGrowth.toLocaleString()}` },
                { Metric: 'Growth Rate', Value: `${data.growth.mrrGrowthRate.toFixed(2)}%` },
                { Metric: 'Churn Rate', Value: `${data.churn.churnRate.toFixed(2)}%` }
            ];
            worksheet = XLSX.utils.json_to_sheet(mrrData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'MRR');
        } else if (data.overall) {
            // LTV data
            const ltvData = [
                { Metric: 'Avg LTV', Value: `$${data.overall.avgLTV.toFixed(2)}` },
                { Metric: 'Avg Lifetime (months)', Value: data.overall.avgLifetimeMonths.toFixed(1) },
                { Metric: 'Avg Monthly Value', Value: `$${data.overall.avgMonthlyValue.toFixed(2)}` },
                { Metric: 'Total Customers', Value: data.overall.totalCustomers }
            ];
            worksheet = XLSX.utils.json_to_sheet(ltvData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'LTV Overall');

            if (data.byPlan) {
                const planData = data.byPlan.map(p => ({
                    'Plan': p.plan,
                    'Avg LTV': `$${p.avgLTV.toFixed(2)}`,
                    'Avg Lifetime': `${p.avgLifetimeMonths.toFixed(1)} months`,
                    'Customers': p.customers
                }));
                const planSheet = XLSX.utils.json_to_sheet(planData);
                XLSX.utils.book_append_sheet(workbook, planSheet, 'LTV by Plan');
            }
        }

        // Write file
        XLSX.writeFile(workbook, filename);

        return {
            success: true,
            message: 'Excel file downloaded successfully'
        };
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw error;
    }
}

export const analyticsService = {
    getCohortAnalysis,
    getRetentionCurve,
    getMRRMetrics,
    getLTVMetrics,
    getFunnelAnalytics,
    exportAnalytics,
    exportToExcel
};

export default analyticsService;
