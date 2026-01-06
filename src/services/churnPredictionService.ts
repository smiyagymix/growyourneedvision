/**
 * Churn Prediction Service
 * AI-powered tenant churn prediction and risk analysis
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import env from '../config/environment';

export interface ChurnPrediction {
    tenantId: string;
    tenantName: string;
    churnRisk: 'low' | 'medium' | 'high' | 'critical';
    churnProbability: number; // 0-100
    factors: Array<{
        factor: string;
        impact: 'positive' | 'negative';
        weight: number;
        value: number;
        description: string;
    }>;
    recommendations: string[];
    lastAnalyzed: string;
}

export interface ChurnAnalysis {
    atRiskTenants: ChurnPrediction[];
    totalAnalyzed: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    averageRisk: number;
    trendDirection: 'improving' | 'stable' | 'worsening';
}

const MOCK_PREDICTIONS: ChurnPrediction[] = [
    {
        tenantId: 't1',
        tenantName: 'Tech Academy',
        churnRisk: 'critical',
        churnProbability: 87,
        factors: [
            { factor: 'Login Frequency', impact: 'negative', weight: 0.25, value: 15, description: 'Daily logins decreased by 60% in last 30 days' },
            { factor: 'Support Tickets', impact: 'negative', weight: 0.20, value: 8, description: '8 unresolved support tickets' },
            { factor: 'Payment Status', impact: 'negative', weight: 0.30, value: 2, description: '2 failed payment attempts' },
            { factor: 'Feature Usage', impact: 'negative', weight: 0.15, value: 35, description: 'Only 35% of features used' },
            { factor: 'User Growth', impact: 'negative', weight: 0.10, value: -12, description: '12% decrease in active users' }
        ],
        recommendations: [
            'Immediate outreach: Schedule call with account manager',
            'Review and resolve open support tickets within 24h',
            'Offer payment plan or discount to prevent cancellation',
            'Provide onboarding session for underutilized features',
            'Consider downgrade offer before full churn'
        ],
        lastAnalyzed: new Date().toISOString()
    },
    {
        tenantId: 't2',
        tenantName: 'Global School District',
        churnRisk: 'high',
        churnProbability: 72,
        factors: [
            { factor: 'Engagement Score', impact: 'negative', weight: 0.30, value: 42, description: 'Engagement dropped to 42% (target: 70%)' },
            { factor: 'API Usage', impact: 'negative', weight: 0.15, value: 28, description: 'API usage down 28% month-over-month' },
            { factor: 'Storage Usage', impact: 'positive', weight: 0.10, value: 85, description: 'High storage utilization (good investment)' },
            { factor: 'NPS Score', impact: 'negative', weight: 0.25, value: 4, description: 'NPS: 4 (Detractor)' },
            { factor: 'Contract Renewal', impact: 'negative', weight: 0.20, value: 45, description: '45 days until renewal' }
        ],
        recommendations: [
            'Send satisfaction survey to understand concerns',
            'Offer feature training webinar',
            'Review competitive offers in market',
            'Highlight ROI and success metrics'
        ],
        lastAnalyzed: new Date().toISOString()
    },
    {
        tenantId: 't3',
        tenantName: 'Innovation Academy',
        churnRisk: 'medium',
        churnProbability: 48,
        factors: [
            { factor: 'Activity Level', impact: 'negative', weight: 0.25, value: 55, description: 'Activity at 55% of baseline' },
            { factor: 'Payment History', impact: 'positive', weight: 0.30, value: 100, description: 'Perfect payment history' },
            { factor: 'Support Interactions', impact: 'negative', weight: 0.15, value: 3, description: '3 recent support requests' },
            { factor: 'User Satisfaction', impact: 'positive', weight: 0.20, value: 8, description: 'NPS: 8 (Promoter)' },
            { factor: 'Feature Adoption', impact: 'negative', weight: 0.10, value: 62, description: '62% feature adoption' }
        ],
        recommendations: [
            'Check in call to address support issues',
            'Share new feature announcements',
            'Request testimonial (high NPS)'
        ],
        lastAnalyzed: new Date().toISOString()
    }
];

/**
 * Predict churn risk for all tenants using AI service
 */
export async function predictChurnForAllTenants(): Promise<ChurnAnalysis> {
    if (isMockEnv()) {
        return {
            atRiskTenants: MOCK_PREDICTIONS,
            totalAnalyzed: 47,
            criticalCount: 1,
            highCount: 1,
            mediumCount: 1,
            lowCount: 44,
            averageRisk: 28,
            trendDirection: 'stable'
        };
    }

    try {
        // Get all active tenants
        const tenants = await pb.collection('tenants').getFullList({
            filter: 'status = "active" || status = "trial"',
            requestKey: null
        });

        const predictions: ChurnPrediction[] = [];

        for (const tenant of tenants) {
            const prediction = await predictChurnForTenant(tenant.id);
            if (prediction) {
                predictions.push(prediction);
            }
        }

        // Calculate summary stats
        const criticalCount = predictions.filter(p => p.churnRisk === 'critical').length;
        const highCount = predictions.filter(p => p.churnRisk === 'high').length;
        const mediumCount = predictions.filter(p => p.churnRisk === 'medium').length;
        const lowCount = predictions.filter(p => p.churnRisk === 'low').length;
        const averageRisk = predictions.reduce((sum, p) => sum + p.churnProbability, 0) / predictions.length;

        return {
            atRiskTenants: predictions.filter(p => p.churnRisk === 'critical' || p.churnRisk === 'high'),
            totalAnalyzed: predictions.length,
            criticalCount,
            highCount,
            mediumCount,
            lowCount,
            averageRisk: Math.round(averageRisk),
            trendDirection: 'stable' // Would compare with previous analysis
        };
    } catch (error) {
        console.error('Failed to predict churn:', error);
        throw error;
    }
}

/**
 * Predict churn risk for a single tenant
 */
export async function predictChurnForTenant(tenantId: string): Promise<ChurnPrediction | null> {
    if (isMockEnv()) {
        return MOCK_PREDICTIONS[0];
    }

    try {
        // Gather tenant metrics
        const tenant = await pb.collection('tenants').getOne(tenantId);
        const users = await pb.collection('users').getFullList({
            filter: `tenantId = "${tenantId}"`,
            requestKey: null
        });

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const activeUsers = users.filter(u => u.lastLogin && new Date(u.lastLogin) > thirtyDaysAgo);

        // Calculate basic metrics
        const activityScore = activeUsers.length / users.length * 100;
        const paymentScore = tenant.subscription_status === 'active' ? 100 : 0;
        
        // Call AI service for advanced prediction
        const aiServiceUrl = env.get('aiServiceUrl');
        if (aiServiceUrl) {
            try {
                const response = await fetch(`${aiServiceUrl}/predict-churn`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tenantId,
                        metrics: {
                            totalUsers: users.length,
                            activeUsers: activeUsers.length,
                            activityScore,
                            paymentScore,
                            plan: tenant.plan,
                            tenure: Math.floor((Date.now() - new Date(tenant.created).getTime()) / (1000 * 60 * 60 * 24))
                        }
                    })
                });

                if (response.ok) {
                    const aiPrediction = await response.json();
                    return aiPrediction;
                }
            } catch (aiError) {
                console.warn('AI service unavailable, falling back to heuristic:', aiError);
            }
        }

        // Fallback: Rule-based prediction
        const churnScore = calculateHeuristicChurnScore({
            activityScore,
            paymentScore,
            userGrowth: users.length > 0 ? (activeUsers.length / users.length - 0.5) * 100 : 0,
            supportTickets: 0 // Would query support system
        });

        return {
            tenantId,
            tenantName: tenant.name,
            churnRisk: getChurnRiskLevel(churnScore),
            churnProbability: churnScore,
            factors: [
                {
                    factor: 'Activity Score',
                    impact: activityScore > 60 ? 'positive' : 'negative',
                    weight: 0.4,
                    value: activityScore,
                    description: `${Math.round(activityScore)}% of users active in last 30 days`
                },
                {
                    factor: 'Payment Status',
                    impact: paymentScore > 0 ? 'positive' : 'negative',
                    weight: 0.4,
                    value: paymentScore,
                    description: tenant.subscription_status === 'active' ? 'Active subscription' : 'Payment issue'
                },
                {
                    factor: 'User Base',
                    impact: users.length > 10 ? 'positive' : 'negative',
                    weight: 0.2,
                    value: users.length,
                    description: `${users.length} total users`
                }
            ],
            recommendations: generateRecommendations(churnScore, activityScore, paymentScore),
            lastAnalyzed: new Date().toISOString()
        };
    } catch (error) {
        console.error(`Failed to predict churn for tenant ${tenantId}:`, error);
        return null;
    }
}

/**
 * Calculate heuristic churn score (0-100)
 */
function calculateHeuristicChurnScore(metrics: {
    activityScore: number;
    paymentScore: number;
    userGrowth: number;
    supportTickets: number;
}): number {
    const weights = {
        activity: 0.35,
        payment: 0.35,
        growth: 0.20,
        support: 0.10
    };

    // Invert activity and payment (higher = lower churn)
    const activityRisk = 100 - metrics.activityScore;
    const paymentRisk = 100 - metrics.paymentScore;
    const growthRisk = metrics.userGrowth < 0 ? Math.abs(metrics.userGrowth) * 2 : 0;
    const supportRisk = Math.min(metrics.supportTickets * 10, 100);

    const churnScore = 
        activityRisk * weights.activity +
        paymentRisk * weights.payment +
        growthRisk * weights.growth +
        supportRisk * weights.support;

    return Math.min(100, Math.max(0, Math.round(churnScore)));
}

/**
 * Get churn risk level from score
 */
function getChurnRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

/**
 * Generate recommendations based on risk factors
 */
function generateRecommendations(churnScore: number, activityScore: number, paymentScore: number): string[] {
    const recommendations: string[] = [];

    if (churnScore >= 80) {
        recommendations.push('🚨 URGENT: Immediate executive outreach required');
        recommendations.push('Schedule emergency call within 24 hours');
    }

    if (activityScore < 50) {
        recommendations.push('Low activity detected: Offer personalized onboarding session');
        recommendations.push('Send re-engagement email campaign');
    }

    if (paymentScore < 100) {
        recommendations.push('Payment issue: Contact billing department immediately');
        recommendations.push('Offer flexible payment terms');
    }

    if (churnScore >= 60) {
        recommendations.push('Assign dedicated success manager');
        recommendations.push('Review contract terms and consider incentives');
    }

    if (recommendations.length === 0) {
        recommendations.push('Continue monitoring tenant health');
        recommendations.push('Schedule quarterly business review');
    }

    return recommendations;
}

/**
 * Get churn trend analysis (compare with historical data)
 */
export async function getChurnTrend(days: number = 30): Promise<{
    labels: string[];
    churnRates: number[];
    atRiskCounts: number[];
}> {
    if (isMockEnv()) {
        return {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            churnRates: [12, 15, 18, 14],
            atRiskCounts: [5, 7, 9, 6]
        };
    }

    // Would query historical churn_predictions collection
    return {
        labels: [],
        churnRates: [],
        atRiskCounts: []
    };
}
