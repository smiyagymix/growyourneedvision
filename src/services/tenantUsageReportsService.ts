/**
 * Tenant Usage Reports Service
 * 
 * Generate comprehensive usage reports for tenants
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';
import * as Sentry from '@sentry/react';

export interface UsageReport extends RecordModel {
    tenantId: string;
    tenantName: string;
    reportPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate: Date;
    metrics: UsageMetrics;
    costs: CostBreakdown;
    trends: TrendAnalysis;
    recommendations: string[];
    generatedAt: Date;
    generatedBy: string;
}

export interface UsageMetrics {
    activeUsers: number;
    totalUsers: number;
    storageUsed: number; // in MB
    apiCalls: number;
    bandwidth: number; // in MB
    features: {
        [featureName: string]: {
            usage: number;
            limit: number;
            percentage: number;
        };
    };
    peakUsage: {
        date: Date;
        metric: string;
        value: number;
    }[];
}

export interface CostBreakdown {
    baseSubscription: number;
    storage: number;
    bandwidth: number;
    apiCalls: number;
    additionalUsers: number;
    features: {
        [featureName: string]: number;
    };
    total: number;
    projected: number; // Next period projection
}

export interface TrendAnalysis {
    userGrowth: number; // percentage
    storageGrowth: number;
    apiGrowth: number;
    costTrend: 'increasing' | 'decreasing' | 'stable';
    comparison: {
        metric: string;
        currentPeriod: number;
        previousPeriod: number;
        change: number;
    }[];
}

export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    sections: ReportSection[];
    format: 'pdf' | 'excel' | 'html';
}

export interface ReportSection {
    type: 'summary' | 'metrics' | 'chart' | 'table' | 'text';
    title: string;
    content: any;
    order: number;
}

// Mock data
const MOCK_REPORT: UsageReport = {
    id: '1',
    tenantId: 'tenant1',
    tenantName: 'Example School',
    reportPeriod: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    metrics: {
        activeUsers: 450,
        totalUsers: 500,
        storageUsed: 15360, // 15 GB
        apiCalls: 125000,
        bandwidth: 2048, // 2 GB
        features: {
            'AI Assistant': { usage: 1200, limit: 2000, percentage: 60 },
            'Video Calls': { usage: 45, limit: 100, percentage: 45 },
            'Live Streaming': { usage: 8, limit: 20, percentage: 40 }
        },
        peakUsage: [
            { date: new Date('2024-01-15'), metric: 'API Calls', value: 5600 },
            { date: new Date('2024-01-22'), metric: 'Active Users', value: 475 }
        ]
    },
    costs: {
        baseSubscription: 299,
        storage: 45,
        bandwidth: 12,
        apiCalls: 35,
        additionalUsers: 0,
        features: {
            'AI Assistant': 50,
            'Advanced Analytics': 30
        },
        total: 471,
        projected: 485
    },
    trends: {
        userGrowth: 12.5,
        storageGrowth: 8.3,
        apiGrowth: 15.7,
        costTrend: 'increasing',
        comparison: [
            { metric: 'Active Users', currentPeriod: 450, previousPeriod: 400, change: 12.5 },
            { metric: 'Storage (GB)', currentPeriod: 15, previousPeriod: 14, change: 7.1 },
            { metric: 'API Calls', currentPeriod: 125000, previousPeriod: 108000, change: 15.7 }
        ]
    },
    recommendations: [
        'Storage usage is growing steadily. Consider upgrading to the next tier.',
        'API usage spiked on Jan 15th. Review integration logs for optimization.',
        'Active user growth is healthy. Plan capacity for next quarter.'
    ],
    generatedAt: new Date(),
    generatedBy: 'system',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    collectionId: 'usage_reports',
    collectionName: 'usage_reports'
};

class TenantUsageReportsService {
    /**
     * Generate usage report
     */
    async generateReport(
        tenantId: string,
        period: UsageReport['reportPeriod'],
        startDate: Date,
        endDate: Date
    ): Promise<UsageReport> {
        return await Sentry.startSpan(
            { name: 'Generate Usage Report', op: 'report.generate' },
            async () => {
                try {
                    if (isMockEnv()) {
                        return MOCK_REPORT;
                    }

                    // Get tenant info
                    const tenant = await pb.collection('tenants').getOne(tenantId);

                    // Collect metrics
                    const metrics = await this.collectMetrics(tenantId, startDate, endDate);
                    const costs = await this.calculateCosts(tenantId, metrics, startDate, endDate);
                    const trends = await this.analyzeTrends(tenantId, metrics, startDate, endDate);
                    const recommendations = await this.generateRecommendations(metrics, trends);

                    // Create report
                    const report = await pb.collection('usage_reports').create({
                        tenantId,
                        tenantName: tenant.name,
                        reportPeriod: period,
                        startDate,
                        endDate,
                        metrics,
                        costs,
                        trends,
                        recommendations,
                        generatedAt: new Date(),
                        generatedBy: pb.authStore.model?.id
                    }) as unknown as UsageReport;

                    return report;
                } catch (error) {
                    console.error('Failed to generate report:', error);
                    throw error;
                }
            }
        );
    }

    /**
     * Collect usage metrics
     */
    private async collectMetrics(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<UsageMetrics> {
        // Get user activity
        const users = await pb.collection('users').getFullList({
            filter: `tenantId = "${tenantId}"`,
            requestKey: null
        });

        const activeUsers = users.filter(u => {
            const lastActive = new Date(u.lastActive || u.created);
            return lastActive >= startDate && lastActive <= endDate;
        }).length;

        // Get API usage
        const apiLogs = await pb.collection('api_logs').getFullList({
            filter: `tenantId = "${tenantId}" && created >= "${startDate.toISOString()}" && created <= "${endDate.toISOString()}"`,
            requestKey: null
        });

        // Get storage usage
        const storageRecords = await pb.collection('tenant_storage').getFullList({
            filter: `tenantId = "${tenantId}" && created >= "${startDate.toISOString()}" && created <= "${endDate.toISOString()}"`,
            requestKey: null
        });

        const storageUsed = storageRecords.reduce((sum, r) => sum + (r.bytes || 0), 0) / (1024 * 1024); // Convert to MB

        // Get feature usage
        const featureUsage = await pb.collection('feature_usage').getFullList({
            filter: `tenantId = "${tenantId}" && created >= "${startDate.toISOString()}" && created <= "${endDate.toISOString()}"`,
            requestKey: null
        });

        const features: UsageMetrics['features'] = {};
        featureUsage.forEach(f => {
            features[f.featureName] = {
                usage: f.usageCount,
                limit: f.limit,
                percentage: (f.usageCount / f.limit) * 100
            };
        });

        // Calculate peak usage
        const dailyApiCalls = new Map<string, number>();
        apiLogs.forEach(log => {
            const date = new Date(log.created).toISOString().split('T')[0];
            dailyApiCalls.set(date, (dailyApiCalls.get(date) || 0) + 1);
        });

        const peakUsage = Array.from(dailyApiCalls.entries())
            .map(([date, count]) => ({
                date: new Date(date),
                metric: 'API Calls',
                value: count
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return {
            activeUsers,
            totalUsers: users.length,
            storageUsed,
            apiCalls: apiLogs.length,
            bandwidth: apiLogs.reduce((sum, log) => sum + (log.responseSize || 0), 0) / (1024 * 1024),
            features,
            peakUsage
        };
    }

    /**
     * Calculate costs
     */
    private async calculateCosts(
        tenantId: string,
        metrics: UsageMetrics,
        startDate: Date,
        endDate: Date
    ): Promise<CostBreakdown> {
        const tenant = await pb.collection('tenants').getOne(tenantId);
        const plan = tenant.plan || 'basic';

        // Base subscription cost
        const baseCosts: Record<string, number> = {
            basic: 99,
            professional: 299,
            enterprise: 999
        };

        // Calculate overages
        const storageCost = Math.max(0, (metrics.storageUsed - 10240) / 1024) * 5; // $5 per GB over 10GB
        const bandwidthCost = Math.max(0, (metrics.bandwidth - 100 * 1024) / 1024) * 2; // $2 per GB over 100GB
        const apiCost = Math.max(0, (metrics.apiCalls - 100000) / 1000) * 0.01; // $0.01 per 1000 calls over 100k
        const userCost = Math.max(0, metrics.totalUsers - 100) * 2; // $2 per user over 100

        // Feature costs
        const featureCosts: Record<string, number> = {};
        Object.entries(metrics.features).forEach(([name, data]) => {
            if (data.percentage > 80) {
                featureCosts[name] = 50; // Premium feature cost
            }
        });

        const total = 
            baseCosts[plan] +
            storageCost +
            bandwidthCost +
            apiCost +
            userCost +
            Object.values(featureCosts).reduce((sum, cost) => sum + cost, 0);

        // Project next period (assume 10% growth)
        const projected = total * 1.1;

        return {
            baseSubscription: baseCosts[plan],
            storage: storageCost,
            bandwidth: bandwidthCost,
            apiCalls: apiCost,
            additionalUsers: userCost,
            features: featureCosts,
            total,
            projected
        };
    }

    /**
     * Analyze trends
     */
    private async analyzeTrends(
        tenantId: string,
        currentMetrics: UsageMetrics,
        startDate: Date,
        endDate: Date
    ): Promise<TrendAnalysis> {
        // Get previous period data
        const periodLength = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - periodLength);
        const prevEndDate = new Date(startDate);

        const prevMetrics = await this.collectMetrics(tenantId, prevStartDate, prevEndDate);

        // Calculate growth rates
        const userGrowth = ((currentMetrics.activeUsers - prevMetrics.activeUsers) / prevMetrics.activeUsers) * 100;
        const storageGrowth = ((currentMetrics.storageUsed - prevMetrics.storageUsed) / prevMetrics.storageUsed) * 100;
        const apiGrowth = ((currentMetrics.apiCalls - prevMetrics.apiCalls) / prevMetrics.apiCalls) * 100;

        // Determine cost trend
        let costTrend: TrendAnalysis['costTrend'] = 'stable';
        const costChange = storageGrowth + apiGrowth;
        if (costChange > 10) costTrend = 'increasing';
        else if (costChange < -10) costTrend = 'decreasing';

        // Build comparison
        const comparison = [
            {
                metric: 'Active Users',
                currentPeriod: currentMetrics.activeUsers,
                previousPeriod: prevMetrics.activeUsers,
                change: userGrowth
            },
            {
                metric: 'Storage (MB)',
                currentPeriod: currentMetrics.storageUsed,
                previousPeriod: prevMetrics.storageUsed,
                change: storageGrowth
            },
            {
                metric: 'API Calls',
                currentPeriod: currentMetrics.apiCalls,
                previousPeriod: prevMetrics.apiCalls,
                change: apiGrowth
            }
        ];

        return {
            userGrowth,
            storageGrowth,
            apiGrowth,
            costTrend,
            comparison
        };
    }

    /**
     * Generate recommendations
     */
    private async generateRecommendations(
        metrics: UsageMetrics,
        trends: TrendAnalysis
    ): Promise<string[]> {
        const recommendations: string[] = [];

        // Storage recommendations
        if (trends.storageGrowth > 15) {
            recommendations.push('Storage usage is growing rapidly. Consider upgrading your plan or implementing data retention policies.');
        }

        // API recommendations
        if (trends.apiGrowth > 20) {
            recommendations.push('API usage is increasing significantly. Review integration patterns for optimization opportunities.');
        }

        // User growth recommendations
        if (trends.userGrowth > 30) {
            recommendations.push('User base is growing rapidly. Plan capacity and support scaling for next quarter.');
        } else if (trends.userGrowth < 0) {
            recommendations.push('User engagement is declining. Consider implementing retention strategies.');
        }

        // Feature usage recommendations
        Object.entries(metrics.features).forEach(([name, data]) => {
            if (data.percentage > 90) {
                recommendations.push(`${name} usage is near limit (${data.percentage.toFixed(1)}%). Consider upgrading to avoid service interruption.`);
            }
        });

        // Cost recommendations
        if (trends.costTrend === 'increasing') {
            recommendations.push('Costs are trending upward. Review usage patterns and consider optimization strategies.');
        }

        return recommendations;
    }

    /**
     * Get reports
     */
    async getReports(
        tenantId?: string,
        page: number = 1,
        perPage: number = 20
    ): Promise<{ items: UsageReport[]; totalPages: number }> {
        try {
            if (isMockEnv()) {
                return { items: [MOCK_REPORT], totalPages: 1 };
            }

            const filter = tenantId ? `tenantId = "${tenantId}"` : '';

            const result = await pb.collection('usage_reports').getList<UsageReport>(
                page,
                perPage,
                {
                    filter,
                    sort: '-generatedAt',
                    requestKey: null
                }
            );

            return result;
        } catch (error) {
            console.error('Failed to get reports:', error);
            throw error;
        }
    }

    /**
     * Export report to PDF
     */
    async exportToPDF(reportId: string): Promise<Blob> {
        try {
            if (isMockEnv()) {
                return new Blob(['Mock PDF content'], { type: 'application/pdf' });
            }

            const report = await pb.collection('usage_reports').getOne<UsageReport>(reportId);

            // Generate PDF using jsPDF
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Add title
            doc.setFontSize(20);
            doc.text('Usage Report', 20, 20);

            // Add tenant info
            doc.setFontSize(12);
            doc.text(`Tenant: ${report.tenantName}`, 20, 35);
            doc.text(`Period: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`, 20, 42);

            // Add metrics
            doc.setFontSize(16);
            doc.text('Metrics', 20, 55);
            doc.setFontSize(10);
            doc.text(`Active Users: ${report.metrics.activeUsers}`, 20, 65);
            doc.text(`Storage Used: ${report.metrics.storageUsed.toFixed(2)} MB`, 20, 72);
            doc.text(`API Calls: ${report.metrics.apiCalls}`, 20, 79);

            // Add costs
            doc.setFontSize(16);
            doc.text('Costs', 20, 95);
            doc.setFontSize(10);
            doc.text(`Total: $${report.costs.total.toFixed(2)}`, 20, 105);
            doc.text(`Projected: $${report.costs.projected.toFixed(2)}`, 20, 112);

            // Add recommendations
            doc.setFontSize(16);
            doc.text('Recommendations', 20, 128);
            doc.setFontSize(10);
            let y = 138;
            report.recommendations.forEach((rec, i) => {
                doc.text(`${i + 1}. ${rec}`, 20, y);
                y += 7;
            });

            return doc.output('blob');
        } catch (error) {
            console.error('Failed to export to PDF:', error);
            throw error;
        }
    }

    /**
     * Schedule automatic reports
     */
    async scheduleReport(
        tenantId: string,
        period: UsageReport['reportPeriod'],
        recipients: string[]
    ): Promise<{ id: string; nextRun: Date }> {
        try {
            if (isMockEnv()) {
                return {
                    id: 'schedule1',
                    nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                };
            }

            const schedule = await pb.collection('report_schedules').create({
                tenantId,
                reportType: 'usage',
                period,
                recipients,
                active: true,
                nextRun: this.calculateNextRun(period)
            });

            return {
                id: schedule.id,
                nextRun: new Date(schedule.nextRun)
            };
        } catch (error) {
            console.error('Failed to schedule report:', error);
            throw error;
        }
    }

    /**
     * Calculate next run date
     */
    private calculateNextRun(period: UsageReport['reportPeriod']): Date {
        const now = new Date();
        switch (period) {
            case 'daily':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case 'weekly':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case 'monthly':
                const nextMonth = new Date(now);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return nextMonth;
            case 'quarterly':
                const nextQuarter = new Date(now);
                nextQuarter.setMonth(nextQuarter.getMonth() + 3);
                return nextQuarter;
            case 'yearly':
                const nextYear = new Date(now);
                nextYear.setFullYear(nextYear.getFullYear() + 1);
                return nextYear;
        }
    }
}

export const tenantUsageReportsService = new TenantUsageReportsService();
