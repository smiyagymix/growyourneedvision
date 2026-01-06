/**
 * Tenant Health Monitoring Service
 * 
 * Monitor and score tenant health across multiple dimensions
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { captureException, measurePerformance } from '../lib/sentry';
import { RecordModel } from 'pocketbase';

// ==================== TYPES ====================

export interface TenantHealthScore extends RecordModel {
    tenantId: string;
    overallScore: number; // 0-100
    metrics: {
        engagement: number;
        financial: number;
        technical: number;
        support: number;
        growth: number;
    };
    status: 'healthy' | 'at-risk' | 'critical' | 'churned';
    alerts: HealthAlert[];
    recommendations: string[];
    lastCalculated: string;
}

export interface HealthAlert {
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    message: string;
    actionRequired: boolean;
}

export interface HealthMetric {
    name: string;
    value: number;
    threshold: number;
    weight: number; // Importance weight for overall score
}

export interface TenantHealthHistory extends RecordModel {
    tenantId: string;
    score: number;
    metrics: Record<string, number>;
    timestamp: string;
}

// ==================== MOCK DATA ====================

const MOCK_HEALTH: TenantHealthScore = {
    id: '1',
    collectionId: 'tenant_health_scores',
    collectionName: 'tenant_health_scores',
    created: '2025-12-28T00:00:00Z',
    updated: '2025-12-28T00:00:00Z',
    tenantId: 'tenant1',
    overallScore: 78,
    metrics: {
        engagement: 85,
        financial: 92,
        technical: 70,
        support: 65,
        growth: 88
    },
    status: 'healthy',
    alerts: [
        {
            severity: 'medium',
            category: 'support',
            message: 'Support ticket volume increased by 45% this week',
            actionRequired: true
        }
    ],
    recommendations: [
        'Increase user engagement with targeted feature training',
        'Review recent support tickets for common issues',
        'Consider upgrading storage plan - 85% utilized'
    ],
    lastCalculated: '2025-12-28T10:00:00Z'
};

// ==================== SERVICE ====================

class TenantHealthMonitoringService {
    // ==================== HEALTH CALCULATION ====================

    async calculateHealth(tenantId: string): Promise<TenantHealthScore> {
        if (isMockEnv()) return MOCK_HEALTH;

        return measurePerformance('calculateTenantHealth', async () => {
            try {
                const tenant = await pb.collection('tenants').getOne(tenantId);

                // Calculate individual metrics
                const engagement = await this.calculateEngagementScore(tenantId);
                const financial = await this.calculateFinancialScore(tenantId);
                const technical = await this.calculateTechnicalScore(tenantId);
                const support = await this.calculateSupportScore(tenantId);
                const growth = await this.calculateGrowthScore(tenantId);

                // Weighted average for overall score
                const metrics = {
                    engagement,
                    financial,
                    technical,
                    support,
                    growth
                };

                const weights = {
                    engagement: 0.25,
                    financial: 0.30,
                    technical: 0.15,
                    support: 0.15,
                    growth: 0.15
                };

                const overallScore = Math.round(
                    engagement * weights.engagement +
                    financial * weights.financial +
                    technical * weights.technical +
                    support * weights.support +
                    growth * weights.growth
                );

                // Determine status
                const status = this.determineStatus(overallScore, metrics);

                // Generate alerts
                const alerts = this.generateAlerts(metrics, tenant);

                // Generate recommendations
                const recommendations = this.generateRecommendations(metrics, tenant);

                // Save to database
                const healthScore = await pb.collection('tenant_health_scores').create<TenantHealthScore>({
                    tenantId,
                    overallScore,
                    metrics,
                    status,
                    alerts,
                    recommendations,
                    lastCalculated: new Date().toISOString()
                });

                // Save history
                await this.saveHistory(tenantId, overallScore, metrics);

                return healthScore;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'tenant-health',
                    operation: 'calculateHealth',
                    tenantId
                });
                throw error;
            }
        }, { feature: 'tenant-health', tenantId });
    }

    private async calculateEngagementScore(tenantId: string): Promise<number> {
        try {
            // Active users in last 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const activeUsers = await pb.collection('users').getList(1, 1, {
                filter: `tenantId = "${tenantId}" && last_active >= "${thirtyDaysAgo.toISOString()}"`
            });

            const totalUsers = await pb.collection('users').getList(1, 1, {
                filter: `tenantId = "${tenantId}"`
            });

            const activeRate = totalUsers.totalItems > 0
                ? (activeUsers.totalItems / totalUsers.totalItems) * 100
                : 0;

            // Feature usage
            const featureUsage = await pb.collection('feature_usage').getList(1, 1, {
                filter: `tenantId = "${tenantId}" && timestamp >= "${thirtyDaysAgo.toISOString()}"`
            });

            const usageScore = Math.min(100, (featureUsage.totalItems / totalUsers.totalItems) * 10);

            return Math.round((activeRate + usageScore) / 2);
        } catch {
            return 50; // Default
        }
    }

    private async calculateFinancialScore(tenantId: string): Promise<number> {
        try {
            const tenant = await pb.collection('tenants').getOne(tenantId);

            // Payment history
            const hasPaymentMethod = !!tenant.stripe_customer_id;
            const isPayingCustomer = tenant.plan !== 'free';
            const isPastDue = tenant.status === 'past_due';

            let score = 50;
            if (hasPaymentMethod) score += 20;
            if (isPayingCustomer) score += 30;
            if (isPastDue) score -= 40;

            return Math.max(0, Math.min(100, score));
        } catch {
            return 50;
        }
    }

    private async calculateTechnicalScore(tenantId: string): Promise<number> {
        try {
            // API errors
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            // Storage usage
            const tenant = await pb.collection('tenants').getOne(tenantId);
            const storageUsed = tenant.storage_used_gb || 0;
            const storageMax = tenant.max_storage_gb || 10;
            const storagePercent = (storageUsed / storageMax) * 100;

            // API performance (mock)
            const avgResponseTime = Math.random() * 500; // Mock
            const performanceScore = avgResponseTime < 200 ? 100 : avgResponseTime < 500 ? 70 : 40;

            // Combined score
            let score = performanceScore;
            if (storagePercent > 90) score -= 20;
            if (storagePercent > 75) score -= 10;

            return Math.max(0, Math.min(100, score));
        } catch {
            return 70;
        }
    }

    private async calculateSupportScore(tenantId: string): Promise<number> {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const tickets = await pb.collection('support_tickets').getList(1, 1, {
                filter: `tenantId = "${tenantId}" && created >= "${thirtyDaysAgo.toISOString()}"`
            });

            const openTickets = await pb.collection('support_tickets').getList(1, 1, {
                filter: `tenantId = "${tenantId}" && status != "closed"`
            });

            // Fewer tickets = better score
            let score = 100;
            if (tickets.totalItems > 10) score -= 20;
            if (tickets.totalItems > 20) score -= 20;
            if (openTickets.totalItems > 5) score -= 30;

            return Math.max(0, score);
        } catch {
            return 80;
        }
    }

    private async calculateGrowthScore(tenantId: string): Promise<number> {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

            const recentUsers = await pb.collection('users').getList(1, 1, {
                filter: `tenantId = "${tenantId}" && created >= "${thirtyDaysAgo.toISOString()}"`
            });

            const previousUsers = await pb.collection('users').getList(1, 1, {
                filter: `tenantId = "${tenantId}" && created >= "${sixtyDaysAgo.toISOString()}" && created < "${thirtyDaysAgo.toISOString()}"`
            });

            const growth = previousUsers.totalItems > 0
                ? ((recentUsers.totalItems - previousUsers.totalItems) / previousUsers.totalItems) * 100
                : 0;

            // Score based on growth
            if (growth > 20) return 100;
            if (growth > 10) return 85;
            if (growth > 0) return 70;
            if (growth > -10) return 50;
            return 30;
        } catch {
            return 60;
        }
    }

    private determineStatus(
        overallScore: number,
        metrics: Record<string, number>
    ): 'healthy' | 'at-risk' | 'critical' | 'churned' {
        if (overallScore >= 75) return 'healthy';
        if (overallScore >= 50) return 'at-risk';
        if (overallScore >= 25) return 'critical';
        return 'churned';
    }

    private generateAlerts(metrics: Record<string, number>, tenant: any): HealthAlert[] {
        const alerts: HealthAlert[] = [];

        if (metrics.engagement < 40) {
            alerts.push({
                severity: 'high',
                category: 'engagement',
                message: 'Low user engagement detected - less than 40% active users',
                actionRequired: true
            });
        }

        if (metrics.financial < 50) {
            alerts.push({
                severity: 'critical',
                category: 'financial',
                message: 'Payment issues or past due status',
                actionRequired: true
            });
        }

        if (metrics.technical < 50) {
            alerts.push({
                severity: 'high',
                category: 'technical',
                message: 'Technical issues detected - high error rate or slow performance',
                actionRequired: true
            });
        }

        if (metrics.support < 60) {
            alerts.push({
                severity: 'medium',
                category: 'support',
                message: 'High support ticket volume',
                actionRequired: false
            });
        }

        if (metrics.growth < 40) {
            alerts.push({
                severity: 'medium',
                category: 'growth',
                message: 'Negative or stagnant growth trend',
                actionRequired: false
            });
        }

        return alerts;
    }

    private generateRecommendations(metrics: Record<string, number>, tenant: any): string[] {
        const recommendations: string[] = [];

        if (metrics.engagement < 70) {
            recommendations.push('Schedule user training sessions to improve feature adoption');
            recommendations.push('Send personalized onboarding emails to inactive users');
        }

        if (metrics.financial < 80) {
            recommendations.push('Review payment status and update billing information');
            recommendations.push('Consider offering flexible payment plans');
        }

        if (metrics.technical < 70) {
            recommendations.push('Review system performance and optimize slow endpoints');
            recommendations.push('Monitor error logs and address recurring issues');
        }

        if (metrics.support < 70) {
            recommendations.push('Analyze support tickets for common pain points');
            recommendations.push('Create self-service documentation for frequent issues');
        }

        if (metrics.growth < 60) {
            recommendations.push('Launch targeted marketing campaign to existing users');
            recommendations.push('Implement referral program to encourage growth');
        }

        return recommendations.slice(0, 5); // Top 5
    }

    private async saveHistory(tenantId: string, score: number, metrics: Record<string, number>): Promise<void> {
        try {
            await pb.collection('tenant_health_history').create({
                tenantId,
                score,
                metrics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to save health history:', error);
        }
    }

    // ==================== QUERIES ====================

    async getHealth(tenantId: string): Promise<TenantHealthScore | null> {
        if (isMockEnv()) return MOCK_HEALTH;

        try {
            const health = await pb.collection('tenant_health_scores').getFirstListItem<TenantHealthScore>(
                `tenantId = "${tenantId}"`,
                { sort: '-created' }
            );
            return health;
        } catch {
            return null;
        }
    }

    async getHealthHistory(tenantId: string, days = 30): Promise<TenantHealthHistory[]> {
        if (isMockEnv()) return [];

        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        return await pb.collection('tenant_health_history').getFullList<TenantHealthHistory>({
            filter: `tenantId = "${tenantId}" && timestamp >= "${startDate.toISOString()}"`,
            sort: 'timestamp',
            requestKey: null
        });
    }

    async getAllHealthScores(): Promise<TenantHealthScore[]> {
        if (isMockEnv()) return [MOCK_HEALTH];

        return await pb.collection('tenant_health_scores').getFullList<TenantHealthScore>({
            sort: '-overallScore',
            requestKey: null
        });
    }

    async getUnhealthyTenants(threshold = 50): Promise<TenantHealthScore[]> {
        if (isMockEnv()) return [];

        return await pb.collection('tenant_health_scores').getFullList<TenantHealthScore>({
            filter: `overallScore < ${threshold}`,
            sort: 'overallScore',
            requestKey: null
        });
    }

    // ==================== BULK OPERATIONS ====================

    async recalculateAllHealth(): Promise<void> {
        if (isMockEnv()) return;

        const tenants = await pb.collection('tenants').getFullList({ requestKey: null });

        for (const tenant of tenants) {
            try {
                await this.calculateHealth(tenant.id);
            } catch (error) {
                console.error(`Failed to calculate health for tenant ${tenant.id}:`, error);
            }
        }
    }
}

export const tenantHealthMonitoringService = new TenantHealthMonitoringService();
