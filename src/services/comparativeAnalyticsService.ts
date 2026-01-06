/**
 * Comparative Analytics Service
 * 
 * Compare tenant performance metrics side-by-side
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { captureException, measurePerformance } from '../lib/sentry';
import { RecordModel } from 'pocketbase';

// ==================== TYPES ====================

export interface ComparisonMetric {
    name: string;
    label: string;
    type: 'number' | 'percentage' | 'currency' | 'duration';
    category: 'revenue' | 'usage' | 'engagement' | 'performance' | 'support';
}

export interface TenantComparison {
    tenantId: string;
    tenantName: string;
    metrics: Record<string, number>;
    rank: number;
    percentile: number;
}

export interface ComparisonReport extends RecordModel {
    name: string;
    description: string;
    tenantIds: string[];
    metrics: string[];
    period: {
        start: string;
        end: string;
    };
    results: TenantComparison[];
    insights: string[];
    createdBy: string;
}

// ==================== MOCK DATA ====================

const AVAILABLE_METRICS: ComparisonMetric[] = [
    { name: 'mrr', label: 'Monthly Recurring Revenue', type: 'currency', category: 'revenue' },
    { name: 'totalUsers', label: 'Total Users', type: 'number', category: 'usage' },
    { name: 'activeUsers', label: 'Active Users (30d)', type: 'number', category: 'engagement' },
    { name: 'storageUsedGB', label: 'Storage Used', type: 'number', category: 'usage' },
    { name: 'apiCalls', label: 'API Calls (30d)', type: 'number', category: 'usage' },
    { name: 'avgResponseTime', label: 'Avg Response Time', type: 'duration', category: 'performance' },
    { name: 'churnRisk', label: 'Churn Risk Score', type: 'percentage', category: 'engagement' },
    { name: 'supportTickets', label: 'Support Tickets (30d)', type: 'number', category: 'support' },
    { name: 'nps', label: 'Net Promoter Score', type: 'number', category: 'engagement' }
];

const MOCK_COMPARISON: ComparisonReport = {
    id: '1',
    collectionId: 'comparison_reports',
    collectionName: 'comparison_reports',
    created: '2025-12-28T00:00:00Z',
    updated: '2025-12-28T00:00:00Z',
    name: 'Top 5 Tenants Comparison',
    description: 'Compare revenue and engagement metrics',
    tenantIds: ['tenant1', 'tenant2', 'tenant3'],
    metrics: ['mrr', 'activeUsers', 'churnRisk'],
    period: {
        start: '2025-11-01T00:00:00Z',
        end: '2025-11-30T23:59:59Z'
    },
    results: [
        {
            tenantId: 'tenant1',
            tenantName: 'Sunrise Academy',
            metrics: { mrr: 2500, activeUsers: 523, churnRisk: 12 },
            rank: 1,
            percentile: 95
        },
        {
            tenantId: 'tenant2',
            tenantName: 'Valley High School',
            metrics: { mrr: 1800, activeUsers: 412, churnRisk: 8 },
            rank: 2,
            percentile: 85
        },
        {
            tenantId: 'tenant3',
            tenantName: 'Mountain View College',
            metrics: { mrr: 1200, activeUsers: 298, churnRisk: 15 },
            rank: 3,
            percentile: 70
        }
    ],
    insights: [
        'Sunrise Academy leads in MRR with 39% higher revenue than average',
        'Valley High School has the lowest churn risk at 8%',
        'Mountain View College shows 50% lower API usage than peers'
    ],
    createdBy: 'owner1'
};

// ==================== SERVICE ====================

class ComparativeAnalyticsService {
    // ==================== METRICS ====================

    getAvailableMetrics(): ComparisonMetric[] {
        return AVAILABLE_METRICS;
    }

    getMetricsByCategory(category: string): ComparisonMetric[] {
        return AVAILABLE_METRICS.filter(m => m.category === category);
    }

    // ==================== COMPARISON ====================

    async compareTenants(
        tenantIds: string[],
        metrics: string[],
        period?: { start: Date; end: Date }
    ): Promise<TenantComparison[]> {
        if (isMockEnv()) {
            return MOCK_COMPARISON.results;
        }

        return measurePerformance('compareTenants', async () => {
            try {
                const comparisons: TenantComparison[] = [];

                for (const tenantId of tenantIds) {
                    const tenant = await pb.collection('tenants').getOne(tenantId);
                    const metricValues: Record<string, number> = {};

                    for (const metricName of metrics) {
                        metricValues[metricName] = await this.calculateMetric(
                            tenantId,
                            metricName,
                            period
                        );
                    }

                    comparisons.push({
                        tenantId,
                        tenantName: tenant.name,
                        metrics: metricValues,
                        rank: 0, // Will be calculated later
                        percentile: 0
                    });
                }

                // Calculate ranks based on first metric
                if (metrics.length > 0 && comparisons.length > 0) {
                    const primaryMetric = metrics[0];
                    comparisons.sort((a, b) => b.metrics[primaryMetric] - a.metrics[primaryMetric]);
                    comparisons.forEach((c, index) => {
                        c.rank = index + 1;
                        c.percentile = Math.round(((comparisons.length - index) / comparisons.length) * 100);
                    });
                }

                return comparisons;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'comparative-analytics',
                    operation: 'compareTenants',
                    tenantCount: tenantIds.length
                });
                throw error;
            }
        }, { feature: 'comparative-analytics', tenantCount: tenantIds.length });
    }

    private async calculateMetric(
        tenantId: string,
        metricName: string,
        period?: { start: Date; end: Date }
    ): Promise<number> {
        try {
            switch (metricName) {
                case 'mrr':
                    return await this.calculateMRR(tenantId);
                
                case 'totalUsers': {
                    const users = await pb.collection('users').getList(1, 1, {
                        filter: `tenantId = "${tenantId}"`
                    });
                    return users.totalItems;
                }
                
                case 'activeUsers': {
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    const activeUsers = await pb.collection('users').getList(1, 1, {
                        filter: `tenantId = "${tenantId}" && last_active >= "${thirtyDaysAgo.toISOString()}"`
                    });
                    return activeUsers.totalItems;
                }
                
                case 'storageUsedGB':
                    return await this.calculateStorageUsed(tenantId);
                
                case 'apiCalls':
                    return await this.calculateAPIUsage(tenantId, period);
                
                case 'avgResponseTime':
                    return await this.calculateAvgResponseTime(tenantId, period);
                
                case 'churnRisk':
                    return await this.calculateChurnRisk(tenantId);
                
                case 'supportTickets':
                    return await this.calculateSupportTickets(tenantId, period);
                
                case 'nps':
                    return await this.calculateNPS(tenantId);
                
                default:
                    return 0;
            }
        } catch (error) {
            console.error(`Failed to calculate metric ${metricName}:`, error);
            return 0;
        }
    }

    private async calculateMRR(tenantId: string): Promise<number> {
        try {
            const tenant = await pb.collection('tenants').getOne(tenantId);
            // In production, fetch from Stripe or billing service
            const planPrices: Record<string, number> = {
                'free': 0,
                'basic': 29,
                'professional': 99,
                'enterprise': 299
            };
            return planPrices[tenant.plan] || 0;
        } catch {
            return 0;
        }
    }

    private async calculateStorageUsed(tenantId: string): Promise<number> {
        // In production, query file storage service
        return Math.random() * 10; // Mock: 0-10 GB
    }

    private async calculateAPIUsage(_tenantId: string, _period?: { start: Date; end: Date }): Promise<number> {
        // In production, query API usage logs
        return Math.floor(Math.random() * 100000); // Mock
    }

    private async calculateAvgResponseTime(_tenantId: string, _period?: { start: Date; end: Date }): Promise<number> {
        // In production, query performance metrics
        return Math.floor(Math.random() * 500); // Mock: 0-500ms
    }

    private async calculateChurnRisk(_tenantId: string): Promise<number> {
        // In production, use ML churn prediction service
        return Math.floor(Math.random() * 100); // Mock: 0-100%
    }

    private async calculateSupportTickets(_tenantId: string, _period?: { start: Date; end: Date }): Promise<number> {
        try {
            let filter = `tenantId = "${_tenantId}"`;
            if (_period) {
                filter += ` && created >= "${_period.start.toISOString()}" && created <= "${_period.end.toISOString()}"`;
            }
            const tickets = await pb.collection('support_tickets').getList(1, 1, { filter });
            return tickets.totalItems;
        } catch {
            return 0;
        }
    }

    private async calculateNPS(tenantId: string): Promise<number> {
        // In production, calculate from feedback surveys
        return Math.floor(Math.random() * 100) - 50; // Mock: -50 to 50
    }

    // ==================== INSIGHTS ====================

    generateInsights(comparisons: TenantComparison[], metrics: string[]): string[] {
        const insights: string[] = [];

        if (comparisons.length === 0) return insights;

        // Find leaders in each metric
        metrics.forEach(metric => {
            const sorted = [...comparisons].sort((a, b) => b.metrics[metric] - a.metrics[metric]);
            const leader = sorted[0];
            const average = comparisons.reduce((sum, c) => sum + c.metrics[metric], 0) / comparisons.length;
            
            if (leader.metrics[metric] > average * 1.2) {
                const improvement = Math.round(((leader.metrics[metric] - average) / average) * 100);
                const metricInfo = AVAILABLE_METRICS.find(m => m.name === metric);
                insights.push(`${leader.tenantName} leads in ${metricInfo?.label} with ${improvement}% higher than average`);
            }
        });

        // Identify outliers
        comparisons.forEach(comparison => {
            if (comparison.percentile >= 90) {
                insights.push(`${comparison.tenantName} is in the top 10% of tenants`);
            } else if (comparison.percentile <= 10) {
                insights.push(`${comparison.tenantName} may need attention - bottom 10% performance`);
            }
        });

        return insights.slice(0, 5); // Return top 5 insights
    }

    // ==================== REPORTS ====================

    async createComparisonReport(
        name: string,
        description: string,
        tenantIds: string[],
        metrics: string[],
        period?: { start: Date; end: Date }
    ): Promise<ComparisonReport> {
        if (isMockEnv()) {
            return MOCK_COMPARISON;
        }

        return measurePerformance('createComparisonReport', async () => {
            try {
                const results = await this.compareTenants(tenantIds, metrics, period);
                const insights = this.generateInsights(results, metrics);

                const report = await pb.collection('comparison_reports').create<ComparisonReport>({
                    name,
                    description,
                    tenantIds,
                    metrics,
                    period: period ? {
                        start: period.start.toISOString(),
                        end: period.end.toISOString()
                    } : {
                        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        end: new Date().toISOString()
                    },
                    results,
                    insights,
                    createdBy: 'current_user'
                });

                return report;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'comparative-analytics',
                    operation: 'createComparisonReport'
                });
                throw error;
            }
        }, { feature: 'comparative-analytics' });
    }

    async getComparisonReports(): Promise<ComparisonReport[]> {
        if (isMockEnv()) return [MOCK_COMPARISON];

        return await pb.collection('comparison_reports').getFullList<ComparisonReport>({
            sort: '-created',
            requestKey: null
        });
    }

    async getComparisonReport(id: string): Promise<ComparisonReport> {
        if (isMockEnv()) return MOCK_COMPARISON;
        return await pb.collection('comparison_reports').getOne<ComparisonReport>(id);
    }

    async updateComparisonReport(id: string, updates: Partial<ComparisonReport>): Promise<ComparisonReport> {
        if (isMockEnv()) {
            return { ...MOCK_COMPARISON, ...updates, id, updated: new Date().toISOString() };
        }

        return measurePerformance('updateComparisonReport', async () => {
            try {
                const report = await pb.collection('comparison_reports').update<ComparisonReport>(id, updates);
                return report;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'comparative-analytics',
                    operation: 'updateComparisonReport'
                });
                throw error;
            }
        }, { feature: 'comparative-analytics' });
    }

    async deleteComparisonReport(id: string): Promise<boolean> {
        if (isMockEnv()) {
            return true;
        }

        return measurePerformance('deleteComparisonReport', async () => {
            try {
                await pb.collection('comparison_reports').delete(id);
                return true;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'comparative-analytics',
                    operation: 'deleteComparisonReport'
                });
                throw error;
            }
        }, { feature: 'comparative-analytics' });
    }

    async exportComparisonReport(id: string, format: 'pdf' | 'csv' | 'excel'): Promise<Blob> {
        if (isMockEnv()) {
            const mockData = JSON.stringify(MOCK_COMPARISON, null, 2);
            return new Blob([mockData], { type: 'application/json' });
        }

        return measurePerformance('exportComparisonReport', async () => {
            try {
                const report = await this.getComparisonReport(id);

                // Generate export based on format
                if (format === 'csv') {
                    const csvData = this.generateCSV(report);
                    return new Blob([csvData], { type: 'text/csv' });
                } else if (format === 'excel') {
                    // In production, use xlsx library
                    const csvData = this.generateCSV(report);
                    return new Blob([csvData], { type: 'application/vnd.ms-excel' });
                } else {
                    // PDF format - in production, use jsPDF
                    const jsonData = JSON.stringify(report, null, 2);
                    return new Blob([jsonData], { type: 'application/pdf' });
                }
            } catch (error) {
                captureException(error as Error, {
                    feature: 'comparative-analytics',
                    operation: 'exportComparisonReport'
                });
                throw error;
            }
        }, { feature: 'comparative-analytics' });
    }

    private generateCSV(report: ComparisonReport): string {
        let csv = 'Tenant,Rank,Percentile';
        
        // Add metric headers
        report.metrics.forEach(metric => {
            csv += `,${metric}`;
        });
        csv += '\n';

        // Add data rows
        report.results.forEach(result => {
            csv += `${result.tenantName},${result.rank},${result.percentile}`;
            report.metrics.forEach(metric => {
                csv += `,${result.metrics[metric] || 0}`;
            });
            csv += '\n';
        });

        return csv;
    }

    // ==================== BENCHMARKING ====================

    async getBenchmarks(tenantId: string): Promise<Record<string, { value: number; average: number; percentile: number }>> {
        if (isMockEnv()) {
            return {
                mrr: { value: 2500, average: 1800, percentile: 75 },
                activeUsers: { value: 523, average: 400, percentile: 80 },
                churnRisk: { value: 12, average: 15, percentile: 65 }
            };
        }

        const benchmarks: Record<string, { value: number; average: number; percentile: number }> = {};

        try {
            const allTenants = await pb.collection('tenants').getFullList({ requestKey: null });

            for (const metric of AVAILABLE_METRICS.slice(0, 5)) {
                const tenantValue = await this.calculateMetric(tenantId, metric.name);
                
                const allValues = await Promise.all(
                    allTenants.map(t => this.calculateMetric(t.id, metric.name))
                );
                
                const average = allValues.reduce((a, b) => a + b, 0) / allValues.length;
                const sorted = [...allValues].sort((a, b) => b - a);
                const rank = sorted.indexOf(tenantValue) + 1;
                const percentile = Math.round(((sorted.length - rank + 1) / sorted.length) * 100);

                benchmarks[metric.name] = { value: tenantValue, average, percentile };
            }

            return benchmarks;
        } catch (error) {
            console.error('Failed to calculate benchmarks:', error);
            return {};
        }
    }
}

export const comparativeAnalyticsService = new ComparativeAnalyticsService();
