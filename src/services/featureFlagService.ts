/**
 * Feature Flag Service
 * Manage platform feature flags with environment-based configuration
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { auditLogger } from './auditLogger';

export interface FeatureFlag {
    id: string;
    name: string;
    key: string;
    description: string;
    enabled: boolean;
    category: 'core' | 'ai' | 'payment' | 'communication' | 'analytics' | 'overlay' | 'experimental';
    rolloutPercentage: number;
    planRestriction?: 'free' | 'basic' | 'premium' | 'enterprise' | null;
    metadata?: Record<string, any>;
    created: string;
    updated: string;
    // Advanced rollout features
    userSegments?: string[];  // Target specific user segments
    abTestVariant?: 'A' | 'B' | null;  // A/B testing variant
    rolloutStrategy?: 'percentage' | 'whitelist' | 'segment';
    whitelist?: string[];  // Specific user IDs to enable
}

// Comprehensive mock feature flags
const MOCK_FLAGS: FeatureFlag[] = [
    {
        id: 'flag-1',
        name: 'AI Concierge',
        key: 'ai_concierge',
        description: 'Enable AI-powered assistant for all users',
        enabled: true,
        category: 'ai',
        rolloutPercentage: 100,
        planRestriction: null,
        created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'flag-2',
        name: 'Payment Processing',
        key: 'payments',
        description: 'Enable Stripe payment integration',
        enabled: true,
        category: 'payment',
        rolloutPercentage: 100,
        planRestriction: null,
        created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'flag-3',
        name: 'Real-time Collaboration',
        key: 'realtime_collab',
        description: 'Enable real-time document collaboration features',
        enabled: true,
        category: 'core',
        rolloutPercentage: 80,
        planRestriction: 'premium',
        created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'flag-4',
        name: 'Advanced Analytics',
        key: 'advanced_analytics',
        description: 'Enable detailed analytics and reporting',
        enabled: true,
        category: 'analytics',
        rolloutPercentage: 100,
        planRestriction: 'basic',
        created: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'flag-5',
        name: 'Video Conferencing',
        key: 'video_conference',
        description: 'Enable built-in video calling features',
        enabled: false,
        category: 'communication',
        rolloutPercentage: 0,
        planRestriction: 'enterprise',
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'flag-6',
        name: 'EduMultiverse Gamification',
        key: 'gamification',
        description: 'Enable gamified learning experience',
        enabled: true,
        category: 'overlay',
        rolloutPercentage: 100,
        planRestriction: null,
        created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'flag-7',
        name: 'Dark Mode',
        key: 'dark_mode',
        description: 'Enable dark theme support',
        enabled: true,
        category: 'core',
        rolloutPercentage: 100,
        planRestriction: null,
        created: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'flag-8',
        name: 'Beta Features',
        key: 'beta_features',
        description: 'Enable experimental beta features for testing',
        enabled: false,
        category: 'experimental',
        rolloutPercentage: 5,
        planRestriction: null,
        metadata: { warning: 'May be unstable' },
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'flag-9',
        name: 'SMS Notifications',
        key: 'sms_notifications',
        description: 'Enable SMS notifications via Twilio',
        enabled: false,
        category: 'communication',
        rolloutPercentage: 0,
        planRestriction: 'premium',
        created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'flag-10',
        name: 'Multi-language Support',
        key: 'i18n',
        description: 'Enable internationalization and multiple languages',
        enabled: true,
        category: 'core',
        rolloutPercentage: 50,
        planRestriction: null,
        metadata: { languages: ['en', 'es', 'fr', 'ar'] },
        created: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
];

class FeatureFlagService {
    private collection = 'feature_flags';

    async getAllFlags(): Promise<FeatureFlag[]> {
        if (isMockEnv()) {
            return [...MOCK_FLAGS];
        }

        try {
            const records = await pb.collection(this.collection).getFullList<FeatureFlag>({
                sort: 'category,name',
                requestKey: null
            });
            return records;
        } catch (error) {
            console.error('Error fetching feature flags:', error);
            return [...MOCK_FLAGS];
        }
    }

    async getFlagById(id: string): Promise<FeatureFlag | null> {
        if (isMockEnv()) {
            return MOCK_FLAGS.find(f => f.id === id) || null;
        }

        try {
            return await pb.collection(this.collection).getOne<FeatureFlag>(id);
        } catch (error) {
            console.error('Error fetching feature flag:', error);
            return MOCK_FLAGS.find(f => f.id === id) || null;
        }
    }

    async getFlagByKey(key: string): Promise<FeatureFlag | null> {
        if (isMockEnv()) {
            return MOCK_FLAGS.find(f => f.key === key) || null;
        }

        try {
            const records = await pb.collection(this.collection).getList<FeatureFlag>(1, 1, {
                filter: `key = "${key}"`,
                requestKey: null
            });
            return records.items[0] || null;
        } catch (error) {
            console.error('Error fetching feature flag by key:', error);
            return MOCK_FLAGS.find(f => f.key === key) || null;
        }
    }

    async createFlag(data: Omit<FeatureFlag, 'id' | 'created' | 'updated'>): Promise<FeatureFlag> {
        const flag: FeatureFlag = {
            ...data,
            id: `flag-${Date.now()}`,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        if (isMockEnv()) {
            MOCK_FLAGS.push(flag);
            return flag;
        }

        try {
            const created = await pb.collection(this.collection).create<FeatureFlag>(data);
            await auditLogger.log({
                action: 'createFeatureFlag',
                resource_type: 'feature_flag',
                resource_id: created.id,
                severity: 'info',
                metadata: { name: data.name, key: data.key }
            });
            return created;
        } catch (error) {
            console.error('Error creating feature flag:', error);
            throw error;
        }
    }

    async updateFlag(id: string, data: Partial<FeatureFlag>): Promise<FeatureFlag> {
        if (isMockEnv()) {
            const index = MOCK_FLAGS.findIndex(f => f.id === id);
            if (index > -1) {
                MOCK_FLAGS[index] = {
                    ...MOCK_FLAGS[index],
                    ...data,
                    updated: new Date().toISOString()
                };
                return MOCK_FLAGS[index];
            }
            throw new Error('Feature flag not found');
        }

        try {
            const updated = await pb.collection(this.collection).update<FeatureFlag>(id, data);
            await auditLogger.log({
                action: 'updateFeatureFlag',
                resource_type: 'feature_flag',
                resource_id: id,
                severity: 'info',
                metadata: { changes: Object.keys(data) }
            });
            return updated;
        } catch (error) {
            console.error('Error updating feature flag:', error);
            throw error;
        }
    }

    async toggleFlag(id: string, enabled: boolean): Promise<FeatureFlag> {
        return this.updateFlag(id, { enabled });
    }

    async updateRollout(id: string, percentage: number): Promise<FeatureFlag> {
        return this.updateFlag(id, { rolloutPercentage: Math.min(100, Math.max(0, percentage)) });
    }

    async deleteFlag(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_FLAGS.findIndex(f => f.id === id);
            if (index > -1) {
                MOCK_FLAGS.splice(index, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.collection).delete(id);
            await auditLogger.log({
                action: 'deleteFeatureFlag',
                resource_type: 'feature_flag',
                resource_id: id,
                severity: 'warning'
            });
            return true;
        } catch (error) {
            console.error('Error deleting feature flag:', error);
            throw error;
        }
    }

    async getFlagsByCategory(category: FeatureFlag['category']): Promise<FeatureFlag[]> {
        if (isMockEnv()) {
            return MOCK_FLAGS.filter(f => f.category === category);
        }

        try {
            return await pb.collection(this.collection).getFullList<FeatureFlag>({
                filter: `category = "${category}"`,
                sort: 'name',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching flags by category:', error);
            return MOCK_FLAGS.filter(f => f.category === category);
        }
    }

    async getEnabledFlags(): Promise<FeatureFlag[]> {
        if (isMockEnv()) {
            return MOCK_FLAGS.filter(f => f.enabled);
        }

        try {
            return await pb.collection(this.collection).getFullList<FeatureFlag>({
                filter: 'enabled = true',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching enabled flags:', error);
            return MOCK_FLAGS.filter(f => f.enabled);
        }
    }

    /**
     * Check if a feature is enabled for a specific user/tenant
     * Uses consistent hashing for stable rollout percentages
     */
    isFeatureEnabled(flag: FeatureFlag, userId?: string, userPlan?: string, userSegments?: string[]): boolean {
        if (!flag.enabled) return false;

        // Check plan restriction
        if (flag.planRestriction) {
            const planHierarchy = ['free', 'basic', 'premium', 'enterprise'];
            const requiredLevel = planHierarchy.indexOf(flag.planRestriction);
            const userLevel = planHierarchy.indexOf(userPlan || 'free');
            if (userLevel < requiredLevel) return false;
        }

        // Whitelist strategy: explicit user IDs
        if (flag.rolloutStrategy === 'whitelist' && flag.whitelist) {
            return userId ? flag.whitelist.includes(userId) : false;
        }

        // Segment strategy: user must be in at least one target segment
        if (flag.rolloutStrategy === 'segment' && flag.userSegments) {
            if (!userSegments || userSegments.length === 0) return false;
            return flag.userSegments.some(seg => userSegments.includes(seg));
        }

        // Percentage strategy with consistent hashing
        if (flag.rolloutPercentage < 100) {
            // Use consistent hashing for stable rollouts
            // Same user always gets same result for same flag
            if (!userId) return Math.random() * 100 < flag.rolloutPercentage;

            const hash = this.hashUserId(userId, flag.key);
            const userPercentile = hash % 100;
            return userPercentile < flag.rolloutPercentage;
        }

        return true;
    }

    /**
     * Consistent hash function for user rollout
     * Ensures same user gets same rollout result for a feature
     */
    private hashUserId(userId: string, flagKey: string): number {
        const str = `${userId}-${flagKey}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Get A/B test variant for a user
     */
    getABTestVariant(flag: FeatureFlag, userId: string): 'A' | 'B' | null {
        if (!flag.abTestVariant) return null;

        // Consistent hash to assign users to variant
        const hash = this.hashUserId(userId, `${flag.key}-ab`);
        return (hash % 2 === 0) ? 'A' : 'B';
    }

    /**
     *Enable feature for specific user segments
     */
    async setUserSegments(id: string, segments: string[]): Promise<FeatureFlag> {
        return this.updateFlag(id, {
            userSegments: segments,
            rolloutStrategy: 'segment'
        });
    }

    /**
     * Add users to whitelist
     */
    async addToWhitelist(id: string, userIds: string[]): Promise<FeatureFlag> {
        const flag = await this.getFlagById(id);
        if (!flag) throw new Error('Feature flag not found');

        const existingWhitelist = flag.whitelist || [];
        const newWhitelist = [...new Set([...existingWhitelist, ...userIds])];

        return this.updateFlag(id, {
            whitelist: newWhitelist,
            rolloutStrategy: 'whitelist'
        });
    }

    /**
     * Remove users from whitelist
     */
    async removeFromWhitelist(id: string, userIds: string[]): Promise<FeatureFlag> {
        const flag = await this.getFlagById(id);
        if (!flag) throw new Error('Feature flag not found');

        const whitelist = (flag.whitelist || []).filter(uid => !userIds.includes(uid));

        return this.updateFlag(id, { whitelist });
    }

    /**
     * Enable A/B testing for a feature
     */
    async enableABTest(id: string, variantName: 'A' | 'B'): Promise<FeatureFlag> {
        return this.updateFlag(id, {
            abTestVariant: variantName,
            rolloutPercentage: 50  // Split 50/50 by default
        });
    }

    /**
     * Get rollout analytics
     */
    async getRolloutAnalytics(flagId: string): Promise<{
        totalEligible: number;
        enabled: number;
        disabled: number;
        bySegment?: Record<string, number>;
        byVariant?: Record<string, number>;
    }> {
        // This would query actual usage data in production
        // For now, return mock analytics
        return {
            totalEligible: 1000,
            enabled: 500,
            disabled: 500,
            bySegment: {
                'beta_users': 200,
                'enterprise': 300
            },
            byVariant: {
                'A': 250,
                'B': 250
            }
        };
    }

    /**
     * Gradually increase rollout percentage
     */
    async gradualRollout(id: string, targetPercentage: number, incrementBy: number = 10, intervalMinutes: number = 60): Promise<void> {
        const flag = await this.getFlagById(id);
        if (!flag) throw new Error('Feature flag not found');

        const currentPercentage = flag.rolloutPercentage;

        if (currentPercentage >= targetPercentage) {
            console.log(`Flag ${flag.key} already at ${currentPercentage}%, target is ${targetPercentage}%`);
            return;
        }

        const newPercentage = Math.min(currentPercentage + incrementBy, targetPercentage);
        await this.updateRollout(id, newPercentage);

        await auditLogger.log({
            action: 'gradualRollout',
            resource_type: 'feature_flag',
            resource_id: id,
            severity: 'info',
            metadata: {
                from: currentPercentage,
                to: newPercentage,
                target: targetPercentage,
                increment: incrementBy
            }
        });

        console.log(`Rolled out ${flag.key} from ${currentPercentage}% to ${newPercentage}%`);

        // If not at target yet, schedule next increment
        if (newPercentage < targetPercentage) {
            console.log(`Next rollout scheduled in ${intervalMinutes} minutes`);
            // In production, this would be handled by a scheduler/cron job
        }
    }

    /**
     * Get statistics about feature flags
     */
    async getStats(): Promise<{
        total: number;
        enabled: number;
        disabled: number;
        byCategory: Record<string, number>;
    }> {
        const flags = await this.getAllFlags();
        const enabled = flags.filter(f => f.enabled).length;

        const byCategory: Record<string, number> = {};
        flags.forEach(f => {
            byCategory[f.category] = (byCategory[f.category] || 0) + 1;
        });

        return {
            total: flags.length,
            enabled,
            disabled: flags.length - enabled,
            byCategory
        };
    }
}

export const featureFlagService = new FeatureFlagService();
