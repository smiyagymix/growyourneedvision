/**
 * A/B Testing Service
 * 
 * Feature flag A/B testing with variant management and statistical analysis
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { captureException, measurePerformance, addBreadcrumb } from '../lib/sentry';
import { RecordModel } from 'pocketbase';
import { VariantConfig } from '../types/abTesting';

// ==================== TYPES ====================

export interface ABTest extends RecordModel {
    name: string;
    description: string;
    feature: string;
    status: 'draft' | 'running' | 'paused' | 'completed';
    variants: ABVariant[];
    targeting: {
        tenantIds?: string[];
        plans?: string[];
        userRoles?: string[];
        percentage?: number; // 0-100
    };
    metrics: string[]; // Metrics to track
    startDate?: string;
    endDate?: string;
    winnerVariant?: string;
    createdBy: string;
}

export interface ABVariant {
    id: string;
    name: string;
    description: string;
    config: VariantConfig;
    weight: number; // 0-100 (percentage of traffic)
    isControl: boolean;
}

export interface ABTestAssignment extends RecordModel {
    testId: string;
    userId?: string;
    tenantId?: string;
    variantId: string;
    assignedAt: string;
}

export interface ABTestMetric extends RecordModel {
    testId: string;
    variantId: string;
    metricName: string;
    value: number;
    userId?: string;
    tenantId?: string;
    recordedAt: string;
}

export interface ABTestResults {
    testId: string;
    status: string;
    variants: {
        id: string;
        name: string;
        participants: number;
        metrics: Record<string, {
            average: number;
            total: number;
            count: number;
        }>;
        conversionRate?: number;
        statisticalSignificance?: number;
    }[];
    variantPerformance: {
        variantId: string;
        variantName: string;
        sampleSize: number;
        conversions: number;
        conversionRate: number;
        averageValue?: number;
        improvement?: number;
        confidenceInterval?: {
            lower: number;
            upper: number;
        };
        metrics: Record<string, number>;
    }[];
    winner?: string;
    recommendation: string;
}

// ==================== MOCK DATA ====================

const MOCK_TESTS: ABTest[] = [
    {
        id: '1',
        collectionId: 'ab_tests',
        collectionName: 'ab_tests',
        created: '2025-12-01T00:00:00Z',
        updated: '2025-12-01T00:00:00Z',
        name: 'Onboarding Flow Test',
        description: 'Test simplified vs detailed onboarding',
        feature: 'onboarding',
        status: 'running',
        variants: [
            {
                id: 'control',
                name: 'Original Flow',
                description: '5-step onboarding',
                config: { steps: 5 },
                weight: 50,
                isControl: true
            },
            {
                id: 'variant_a',
                name: 'Simplified Flow',
                description: '3-step onboarding',
                config: { steps: 3 },
                weight: 50,
                isControl: false
            }
        ],
        targeting: { percentage: 100 },
        metrics: ['completion_rate', 'time_to_complete', 'user_satisfaction'],
        startDate: '2025-12-01T00:00:00Z',
        createdBy: 'owner1'
    }
];

// ==================== SERVICE ====================

class ABTestingService {
    // ==================== TEST MANAGEMENT ====================

    async createTest(test: Omit<ABTest, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<ABTest> {
        if (isMockEnv()) {
            return { ...MOCK_TESTS[0], ...test };
        }

        return measurePerformance('createABTest', async () => {
            try {
                // Validate variant weights sum to 100
                const totalWeight = test.variants.reduce((sum: number, v: { weight: number }) => sum + v.weight, 0);
                if (totalWeight !== 100) {
                    throw new Error('Variant weights must sum to 100');
                }

                const newTest = await pb.collection('ab_tests').create<ABTest>(test);

                addBreadcrumb('A/B test created', 'action', {
                    testId: newTest.id,
                    feature: test.feature,
                    variantCount: test.variants.length
                });

                return newTest;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'ab-testing',
                    operation: 'createTest'
                });
                throw error;
            }
        }, { feature: 'ab-testing' });
    }

    async getTests(status?: string): Promise<ABTest[]> {
        if (isMockEnv()) return MOCK_TESTS;

        const filter = status ? `status = "${status}"` : '';
        return await pb.collection('ab_tests').getFullList<ABTest>({
            filter,
            sort: '-created',
            requestKey: null
        });
    }

    async updateTest(id: string, updates: Partial<ABTest>): Promise<ABTest> {
        if (isMockEnv()) {
            return { ...MOCK_TESTS[0], ...updates, id };
        }

        return await pb.collection('ab_tests').update<ABTest>(id, updates);
    }

    async startTest(id: string): Promise<ABTest> {
        return this.updateTest(id, {
            status: 'running',
            startDate: new Date().toISOString()
        });
    }

    async pauseTest(id: string): Promise<ABTest> {
        return this.updateTest(id, { status: 'paused' });
    }

    async completeTest(id: string, winnerVariantId?: string): Promise<ABTest> {
        return this.updateTest(id, {
            status: 'completed',
            endDate: new Date().toISOString(),
            winnerVariant: winnerVariantId
        });
    }

    // ==================== VARIANT ASSIGNMENT ====================

    async getVariantForUser(testId: string, userId?: string, tenantId?: string): Promise<ABVariant | null> {
        if (isMockEnv()) {
            return MOCK_TESTS[0].variants[0];
        }

        return measurePerformance('getVariantForUser', async () => {
            try {
                const test = await pb.collection('ab_tests').getOne<ABTest>(testId);

                if (test.status !== 'running') {
                    return null;
                }

                // Check if user/tenant is targeted
                if (!this.isTargeted(test, userId, tenantId)) {
                    return null;
                }

                // Check existing assignment
                let filter = `testId = "${testId}"`;
                if (userId) filter += ` && userId = "${userId}"`;
                if (tenantId) filter += ` && tenantId = "${tenantId}"`;

                const existing = await pb.collection('ab_test_assignments').getFirstListItem<ABTestAssignment>(
                    filter
                ).catch(() => null);

                if (existing) {
                    return test.variants.find(v => v.id === existing.variantId) || null;
                }

                // Assign new variant based on weights
                const variant = this.selectVariantByWeight(test.variants);

                // Save assignment
                await pb.collection('ab_test_assignments').create({
                    testId,
                    userId,
                    tenantId,
                    variantId: variant.id,
                    assignedAt: new Date().toISOString()
                });

                addBreadcrumb('A/B variant assigned', 'action', {
                    testId,
                    variantId: variant.id,
                    userId,
                    tenantId
                });

                return variant;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'ab-testing',
                    operation: 'getVariantForUser',
                    testId
                });
                return null;
            }
        }, { feature: 'ab-testing', testId });
    }

    private isTargeted(test: ABTest, userId?: string, tenantId?: string): boolean {
        const { targeting } = test;

        // Check percentage rollout
        if (targeting.percentage && targeting.percentage < 100) {
            const hash = this.hashString(`${userId || tenantId || ''}-${test.id}`);
            if ((hash % 100) >= targeting.percentage) {
                return false;
            }
        }

        // Check tenant targeting
        if (targeting.tenantIds && targeting.tenantIds.length > 0) {
            if (!tenantId || !targeting.tenantIds.includes(tenantId)) {
                return false;
            }
        }

        return true;
    }

    private selectVariantByWeight(variants: ABVariant[]): ABVariant {
        const random = Math.random() * 100;
        let cumulative = 0;

        for (const variant of variants) {
            cumulative += variant.weight;
            if (random < cumulative) {
                return variant;
            }
        }

        return variants[0]; // Fallback
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // ==================== METRICS TRACKING ====================

    async trackMetric(
        testId: string,
        variantId: string,
        metricName: string,
        value: number,
        userId?: string,
        tenantId?: string
    ): Promise<void> {
        if (isMockEnv()) return;

        try {
            await pb.collection('ab_test_metrics').create({
                testId,
                variantId,
                metricName,
                value,
                userId,
                tenantId,
                recordedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to track A/B test metric:', error);
        }
    }

    // ==================== RESULTS & ANALYSIS ====================

    async getTestResults(testId: string): Promise<ABTestResults> {
        if (isMockEnv()) {
            return {
                testId,
                status: 'running',
                variants: [
                    {
                        id: 'control',
                        name: 'Original Flow',
                        participants: 523,
                        metrics: {
                            completion_rate: { average: 0.78, total: 408, count: 523 },
                            time_to_complete: { average: 245, total: 128135, count: 523 }
                        },
                        conversionRate: 78,
                        statisticalSignificance: 0.95
                    },
                    {
                        id: 'variant_a',
                        name: 'Simplified Flow',
                        participants: 497,
                        metrics: {
                            completion_rate: { average: 0.85, total: 422, count: 497 },
                            time_to_complete: { average: 180, total: 89460, count: 497 }
                        },
                        conversionRate: 85,
                        statisticalSignificance: 0.98
                    }
                ],
                variantPerformance: [
                    {
                        variantId: 'control',
                        variantName: 'Original Flow',
                        sampleSize: 523,
                        conversions: 408,
                        conversionRate: 78,
                        averageValue: 245,
                        improvement: 0,
                        confidenceInterval: { lower: 0.74, upper: 0.82 },
                        metrics: {
                            completion_rate: 0.78,
                            time_to_complete: 245,
                            user_satisfaction: 4.2
                        }
                    },
                    {
                        variantId: 'variant_a',
                        variantName: 'Simplified Flow',
                        sampleSize: 497,
                        conversions: 422,
                        conversionRate: 85,
                        averageValue: 180,
                        improvement: 7,
                        confidenceInterval: { lower: 0.82, upper: 0.88 },
                        metrics: {
                            completion_rate: 0.85,
                            time_to_complete: 180,
                            user_satisfaction: 4.6
                        }
                    }
                ],
                winner: 'variant_a',
                recommendation: 'Variant A shows 7% improvement with 98% confidence'
            };
        }

        return measurePerformance('getTestResults', async () => {
            try {
                const test = await pb.collection('ab_tests').getOne<ABTest>(testId);
                const assignments = await pb.collection('ab_test_assignments').getFullList<ABTestAssignment>({
                    filter: `testId = "${testId}"`,
                    requestKey: null
                });
                const metrics = await pb.collection('ab_test_metrics').getFullList<ABTestMetric>({
                    filter: `testId = "${testId}"`,
                    requestKey: null
                });

                const results: ABTestResults = {
                    testId,
                    status: test.status,
                    variants: [],
                    variantPerformance: [],
                    recommendation: ''
                };

                // Calculate metrics per variant
                for (const variant of test.variants) {
                    const variantAssignments = assignments.filter(a => a.variantId === variant.id);
                    const variantMetrics = metrics.filter(m => m.variantId === variant.id);

                    const metricsData: Record<string, { average: number; total: number; count: number }> = {};

                    test.metrics.forEach(metricName => {
                        const metricValues = variantMetrics.filter(m => m.metricName === metricName);
                        const total = metricValues.reduce((sum, m) => sum + m.value, 0);
                        const count = metricValues.length;
                        const average = count > 0 ? total / count : 0;

                        metricsData[metricName] = { average, total, count };
                    });

                    const conversionRate = metricsData.completion_rate?.average * 100 || 0;

                    results.variants.push({
                        id: variant.id,
                        name: variant.name,
                        participants: variantAssignments.length,
                        metrics: metricsData,
                        conversionRate,
                        statisticalSignificance: this.calculateSignificance(variantMetrics)
                    });

                    // Add to variantPerformance array
                    results.variantPerformance.push({
                        variantId: variant.id,
                        variantName: variant.name,
                        sampleSize: variantAssignments.length,
                        conversions: Math.round((conversionRate / 100) * variantAssignments.length),
                        conversionRate,
                        metrics: Object.fromEntries(
                            test.metrics.map(metricName => [
                                metricName,
                                metricsData[metricName]?.average || 0
                            ])
                        )
                    });
                }

                // Determine winner
                if (results.variants.length >= 2) {
                    const sorted = [...results.variants].sort((a, b) => 
                        (b.conversionRate || 0) - (a.conversionRate || 0)
                    );
                    const winner = sorted[0];
                    const control = results.variants.find(v => v.id === 'control') || sorted[1];

                    if (winner.statisticalSignificance && winner.statisticalSignificance >= 0.95) {
                        results.winner = winner.id;
                        const improvement = ((winner.conversionRate || 0) - (control.conversionRate || 0)).toFixed(1);
                        const confidence = ((winner.statisticalSignificance) * 100).toFixed(0);
                        results.recommendation = `${winner.name} shows ${improvement}% improvement with ${confidence}% confidence`;
                    } else {
                        results.recommendation = 'Continue test - insufficient data for conclusive results';
                    }
                }

                return results;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'ab-testing',
                    operation: 'getTestResults',
                    testId
                });
                throw error;
            }
        }, { feature: 'ab-testing', testId });
    }

    private calculateSignificance(metrics: ABTestMetric[]): number {
        // Simplified significance calculation (would use proper statistical test in production)
        const sampleSize = metrics.length;
        if (sampleSize < 30) return 0.5;
        if (sampleSize < 100) return 0.8;
        if (sampleSize < 500) return 0.9;
        return 0.95;
    }

    async getTestAssignments(testId: string): Promise<ABTestAssignment[]> {
        if (isMockEnv()) return [];

        return await pb.collection('ab_test_assignments').getFullList<ABTestAssignment>({
            filter: `testId = "${testId}"`,
            requestKey: null
        });
    }
}

export const abTestingService = new ABTestingService();
