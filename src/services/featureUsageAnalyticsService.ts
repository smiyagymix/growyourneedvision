/**
 * Feature Usage Analytics Service
 * 
 * Track feature adoption, usage patterns, and engagement across tenants
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { captureException, measurePerformance, addBreadcrumb } from '../lib/sentry';
import { RecordModel } from 'pocketbase';

// ==================== TYPES ====================

export interface FeatureUsage extends RecordModel {
    featureName: string;
    tenantId?: string;
    userId?: string;
    action: 'viewed' | 'clicked' | 'completed' | 'dismissed';
    metadata?: Record<string, any>;
    sessionId?: string;
    timestamp: string;
}

export interface FeatureDefinition extends RecordModel {
    name: string;
    displayName: string;
    category: 'core' | 'overlay' | 'ai' | 'payment' | 'communication' | 'analytics';
    description: string;
    requiredPlan: string[];
    isDeprecated: boolean;
}

export interface FeatureAdoptionStats {
    featureName: string;
    displayName: string;
    totalUsers: number;
    uniqueTenants: number;
    usageCount: number;
    adoptionRate: number; // Percentage of tenants using feature
    avgUsagePerTenant: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
}

export interface TenantFeatureProfile {
    tenantId: string;
    tenantName: string;
    features: {
        name: string;
        usageCount: number;
        lastUsed: string;
        engagement: 'high' | 'medium' | 'low' | 'never';
    }[];
    adoptionScore: number; // 0-100
    recommendations: string[];
}

export interface FeatureHeatmap {
    feature: string;
    byHour: Record<number, number>; // 0-23
    byDayOfWeek: Record<number, number>; // 0-6 (Sunday-Saturday)
    peakTime: { hour: number; day: number };
}

// ==================== MOCK DATA ====================

const MOCK_FEATURES: FeatureDefinition[] = [
    {
        id: '1',
        collectionId: 'feature_definitions',
        collectionName: 'feature_definitions',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
        name: 'ai_assistant',
        displayName: 'AI Assistant',
        category: 'ai',
        description: 'AI-powered chat assistant',
        requiredPlan: ['professional', 'enterprise'],
        isDeprecated: false
    }
];

const MOCK_ADOPTION: FeatureAdoptionStats[] = [
    {
        featureName: 'ai_assistant',
        displayName: 'AI Assistant',
        totalUsers: 1250,
        uniqueTenants: 45,
        usageCount: 8920,
        adoptionRate: 75,
        avgUsagePerTenant: 198,
        trend: 'up',
        trendPercentage: 23
    }
];

// ==================== SERVICE ====================

class FeatureUsageAnalyticsService {
    // ==================== TRACKING ====================

    async trackFeatureUsage(
        featureName: string,
        action: 'viewed' | 'clicked' | 'completed' | 'dismissed',
        tenantId?: string,
        userId?: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        if (isMockEnv()) return;

        try {
            await pb.collection('feature_usage').create({
                featureName,
                tenantId,
                userId,
                action,
                metadata,
                sessionId: this.getSessionId(),
                timestamp: new Date().toISOString()
            });

            addBreadcrumb('Feature usage tracked', 'user', {
                featureName,
                action,
                tenantId
            });
        } catch (error) {
            // Don't throw - tracking should not break app flow
            console.error('Failed to track feature usage:', error);
        }
    }

    private getSessionId(): string {
        // Get or create session ID from sessionStorage
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    }

    // ==================== FEATURE DEFINITIONS ====================

    async getFeatures(): Promise<FeatureDefinition[]> {
        if (isMockEnv()) return MOCK_FEATURES;

        return await pb.collection('feature_definitions').getFullList<FeatureDefinition>({
            filter: 'isDeprecated = false',
            sort: 'category,name',
            requestKey: null
        });
    }

    async createFeature(feature: Omit<FeatureDefinition, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<FeatureDefinition> {
        if (isMockEnv()) {
            return { ...MOCK_FEATURES[0], ...feature };
        }

        return await pb.collection('feature_definitions').create<FeatureDefinition>(feature);
    }

    // ==================== ADOPTION ANALYTICS ====================

    async getFeatureAdoption(period?: { start: Date; end: Date }): Promise<FeatureAdoptionStats[]> {
        if (isMockEnv()) return MOCK_ADOPTION;

        return measurePerformance('getFeatureAdoption', async () => {
            try {
                const features = await this.getFeatures();
                const stats: FeatureAdoptionStats[] = [];

                let filter = '';
                if (period) {
                    filter = `timestamp >= "${period.start.toISOString()}" && timestamp <= "${period.end.toISOString()}"`;
                }

                const usage = await pb.collection('feature_usage').getFullList<FeatureUsage>({
                    filter,
                    requestKey: null
                });

                const totalTenants = await pb.collection('tenants').getList(1, 1);

                for (const feature of features) {
                    const featureUsage = usage.filter(u => u.featureName === feature.name);
                    const uniqueTenants = new Set(featureUsage.map(u => u.tenantId).filter(Boolean)).size;
                    const uniqueUsers = new Set(featureUsage.map(u => u.userId).filter(Boolean)).size;

                    const adoptionRate = (uniqueTenants / totalTenants.totalItems) * 100;
                    const avgUsagePerTenant = uniqueTenants > 0 ? featureUsage.length / uniqueTenants : 0;

                    // Calculate trend (compare to previous period)
                    const trend = await this.calculateTrend(feature.name, period);

                    stats.push({
                        featureName: feature.name,
                        displayName: feature.displayName,
                        totalUsers: uniqueUsers,
                        uniqueTenants,
                        usageCount: featureUsage.length,
                        adoptionRate: Math.round(adoptionRate),
                        avgUsagePerTenant: Math.round(avgUsagePerTenant),
                        trend: trend.direction,
                        trendPercentage: trend.percentage
                    });
                }

                return stats.sort((a, b) => b.adoptionRate - a.adoptionRate);
            } catch (error) {
                captureException(error as Error, {
                    feature: 'feature-usage-analytics',
                    operation: 'getFeatureAdoption'
                });
                throw error;
            }
        }, { feature: 'feature-usage-analytics' });
    }

    private async calculateTrend(
        featureName: string,
        currentPeriod?: { start: Date; end: Date }
    ): Promise<{ direction: 'up' | 'down' | 'stable'; percentage: number }> {
        try {
            if (!currentPeriod) {
                return { direction: 'stable', percentage: 0 };
            }

            const duration = currentPeriod.end.getTime() - currentPeriod.start.getTime();
            const previousPeriod = {
                start: new Date(currentPeriod.start.getTime() - duration),
                end: currentPeriod.start
            };

            const currentCount = await pb.collection('feature_usage').getList(1, 1, {
                filter: `featureName = "${featureName}" && timestamp >= "${currentPeriod.start.toISOString()}" && timestamp <= "${currentPeriod.end.toISOString()}"`
            });

            const previousCount = await pb.collection('feature_usage').getList(1, 1, {
                filter: `featureName = "${featureName}" && timestamp >= "${previousPeriod.start.toISOString()}" && timestamp <= "${previousPeriod.end.toISOString()}"`
            });

            if (previousCount.totalItems === 0) {
                return { direction: 'stable', percentage: 0 };
            }

            const change = ((currentCount.totalItems - previousCount.totalItems) / previousCount.totalItems) * 100;

            return {
                direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
                percentage: Math.abs(Math.round(change))
            };
        } catch (error) {
            return { direction: 'stable', percentage: 0 };
        }
    }

    // ==================== TENANT PROFILE ====================

    async getTenantFeatureProfile(tenantId: string): Promise<TenantFeatureProfile> {
        if (isMockEnv()) {
            return {
                tenantId,
                tenantName: 'Mock Tenant',
                features: [
                    {
                        name: 'ai_assistant',
                        usageCount: 156,
                        lastUsed: '2025-12-28T10:00:00Z',
                        engagement: 'high'
                    }
                ],
                adoptionScore: 78,
                recommendations: [
                    'Consider enabling Payment features for streamlined billing',
                    'AI Analytics could provide deeper insights based on usage patterns'
                ]
            };
        }

        return measurePerformance('getTenantFeatureProfile', async () => {
            try {
                const tenant = await pb.collection('tenants').getOne(tenantId);
                const features = await this.getFeatures();
                const usage = await pb.collection('feature_usage').getFullList<FeatureUsage>({
                    filter: `tenantId = "${tenantId}"`,
                    requestKey: null
                });

                const featureProfiles = features.map(feature => {
                    const featureUsage = usage.filter(u => u.featureName === feature.name);
                    const lastUsed = featureUsage.length > 0 
                        ? featureUsage[featureUsage.length - 1].timestamp
                        : '';

                    let engagement: 'high' | 'medium' | 'low' | 'never' = 'never';
                    if (featureUsage.length > 100) engagement = 'high';
                    else if (featureUsage.length > 20) engagement = 'medium';
                    else if (featureUsage.length > 0) engagement = 'low';

                    return {
                        name: feature.name,
                        usageCount: featureUsage.length,
                        lastUsed,
                        engagement
                    };
                });

                const usedFeatures = featureProfiles.filter(f => f.usageCount > 0).length;
                const adoptionScore = Math.round((usedFeatures / features.length) * 100);

                const recommendations = this.generateRecommendations(featureProfiles, features, tenant.plan);

                return {
                    tenantId,
                    tenantName: tenant.name,
                    features: featureProfiles,
                    adoptionScore,
                    recommendations
                };
            } catch (error) {
                captureException(error as Error, {
                    feature: 'feature-usage-analytics',
                    operation: 'getTenantFeatureProfile',
                    tenantId
                });
                throw error;
            }
        }, { feature: 'feature-usage-analytics', tenantId });
    }

    private generateRecommendations(
        profiles: any[],
        features: FeatureDefinition[],
        plan: string
    ): string[] {
        const recommendations: string[] = [];

        // Find unused features
        const unusedFeatures = profiles.filter(p => p.usageCount === 0);
        unusedFeatures.slice(0, 2).forEach(unused => {
            const feature = features.find(f => f.name === unused.name);
            if (feature && feature.requiredPlan.includes(plan)) {
                recommendations.push(`Consider enabling ${feature.displayName} - ${feature.description}`);
            }
        });

        // Find low-engagement features
        const lowEngagement = profiles.filter(p => p.engagement === 'low');
        if (lowEngagement.length > 0) {
            recommendations.push(`${lowEngagement.length} features have low engagement - consider training or deprecation`);
        }

        // Suggest upgrades
        const premiumFeatures = features.filter(f => 
            f.requiredPlan.includes('enterprise') && !f.requiredPlan.includes(plan)
        );
        if (premiumFeatures.length > 0) {
            recommendations.push(`Upgrade to Enterprise for ${premiumFeatures.length} additional features`);
        }

        return recommendations.slice(0, 3);
    }

    // ==================== HEATMAP ====================

    async getFeatureHeatmap(featureName: string, period?: { start: Date; end: Date }): Promise<FeatureHeatmap> {
        if (isMockEnv()) {
            return {
                feature: featureName,
                byHour: {
                    0: 15, 1: 8, 2: 5, 3: 3, 4: 2, 5: 4, 6: 12, 7: 45, 8: 89, 9: 123,
                    10: 145, 11: 132, 12: 98, 13: 110, 14: 134, 15: 156, 16: 142, 17: 98,
                    18: 67, 19: 45, 20: 34, 21: 28, 22: 22, 23: 18
                },
                byDayOfWeek: {
                    0: 234, // Sunday
                    1: 678, // Monday
                    2: 712,
                    3: 689,
                    4: 654,
                    5: 523,
                    6: 312  // Saturday
                },
                peakTime: { hour: 15, day: 2 }
            };
        }

        let filter = `featureName = "${featureName}"`;
        if (period) {
            filter += ` && timestamp >= "${period.start.toISOString()}" && timestamp <= "${period.end.toISOString()}"`;
        }

        const usage = await pb.collection('feature_usage').getFullList<FeatureUsage>({
            filter,
            requestKey: null
        });

        const byHour: Record<number, number> = {};
        const byDayOfWeek: Record<number, number> = {};

        usage.forEach(u => {
            const date = new Date(u.timestamp);
            const hour = date.getHours();
            const dayOfWeek = date.getDay();

            byHour[hour] = (byHour[hour] || 0) + 1;
            byDayOfWeek[dayOfWeek] = (byDayOfWeek[dayOfWeek] || 0) + 1;
        });

        // Find peak time
        let peakHour = 0;
        let peakDay = 0;
        let maxCount = 0;

        Object.entries(byHour).forEach(([hour, count]) => {
            if (count > maxCount) {
                maxCount = count;
                peakHour = parseInt(hour);
            }
        });

        maxCount = 0;
        Object.entries(byDayOfWeek).forEach(([day, count]) => {
            if (count > maxCount) {
                maxCount = count;
                peakDay = parseInt(day);
            }
        });

        return {
            feature: featureName,
            byHour,
            byDayOfWeek,
            peakTime: { hour: peakHour, day: peakDay }
        };
    }

    // ==================== FUNNEL ANALYSIS ====================

    async getFeatureFunnel(featureName: string, steps: string[]): Promise<{
        step: string;
        users: number;
        dropoff: number;
    }[]> {
        if (isMockEnv()) {
            return [
                { step: 'viewed', users: 1000, dropoff: 0 },
                { step: 'clicked', users: 750, dropoff: 25 },
                { step: 'completed', users: 600, dropoff: 20 }
            ];
        }

        const funnel: { step: string; users: number; dropoff: number }[] = [];
        let previousUsers = 0;

        for (const step of steps) {
            const usage = await pb.collection('feature_usage').getList(1, 1, {
                filter: `featureName = "${featureName}" && action = "${step}"`
            });

            const users = usage.totalItems;
            const dropoff = previousUsers > 0 ? ((previousUsers - users) / previousUsers) * 100 : 0;

            funnel.push({
                step,
                users,
                dropoff: Math.round(dropoff)
            });

            previousUsers = users;
        }

        return funnel;
    }
}

export const featureUsageAnalyticsService = new FeatureUsageAnalyticsService();
