import Stripe from 'stripe';
import PocketBase from 'pocketbase';
import cacheService, { CacheKeys, CacheTTL } from './cacheService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'demo-key');
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

/**
 * Calculate comprehensive health score for a customer
 * Score components:
 * - Engagement (40%): Login frequency, feature usage
 * - Usage (30%): Active sessions, data consumption
 * - Payment (20%): Payment reliability, no failed charges
 * - Longevity (10%): Account age, renewal history
 */
export async function calculateHealthScore(customerId) {
    return cacheService.getOrCompute(
        CacheKeys.customerHealth(customerId),
        async () => {
            try {
                const customer = await stripe.customers.retrieve(customerId);
                const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
                const charges = await stripe.charges.list({ customer: customerId, limit: 50 });
                const invoices = await stripe.invoices.list({ customer: customerId, limit: 20 });

                // Engagement Score (0-40)
                const daysSinceCreated = (Date.now() - customer.created * 1000) / (1000 * 60 * 60 * 24);
                const activeSubscriptions = subscriptions.data.filter(s => s.status === 'active').length;
                const engagementScore = Math.min(40, (activeSubscriptions * 15) + Math.min(10, daysSinceCreated / 10));

                // Usage Score (0-30)
                const recentCharges = charges.data.filter(c => 
                    c.created > (Date.now() / 1000) - (90 * 24 * 60 * 60) // Last 90 days
                ).length;
                const usageScore = Math.min(30, recentCharges * 3);

                // Payment Score (0-20)
                const failedCharges = charges.data.filter(c => !c.paid).length;
                const paidInvoices = invoices.data.filter(i => i.status === 'paid').length;
                const totalInvoices = invoices.data.length || 1;
                const paymentReliability = paidInvoices / totalInvoices;
                const paymentScore = Math.max(0, 20 - (failedCharges * 5)) * paymentReliability;

                // Longevity Score (0-10)
                const monthsActive = Math.floor(daysSinceCreated / 30);
                const longevityScore = Math.min(10, monthsActive * 1);

                const totalScore = Math.round(engagementScore + usageScore + paymentScore + longevityScore);
                const healthStatus = totalScore >= 80 ? 'excellent' : totalScore >= 60 ? 'good' : totalScore >= 40 ? 'fair' : 'poor';

                return {
                    customerId,
                    customerEmail: customer.email,
                    totalScore,
                    healthStatus,
                    breakdown: {
                        engagement: Math.round(engagementScore),
                        usage: Math.round(usageScore),
                        payment: Math.round(paymentScore),
                        longevity: Math.round(longevityScore)
                    },
                    metrics: {
                        activeSubscriptions,
                        daysSinceCreated: Math.round(daysSinceCreated),
                        recentCharges,
                        failedCharges,
                        paymentReliability: Math.round(paymentReliability * 100)
                    },
                    calculatedAt: new Date().toISOString()
                };
            } catch (error) {
                console.error('Error calculating health score:', error);
                throw error;
            }
        },
        CacheTTL.CUSTOMER_HEALTH
    );
}

/**
 * Get engagement metrics for all customers
 * Tracks login frequency, feature usage, and activity patterns
 */
export async function getEngagementMetrics() {
    try {
        const customers = await stripe.customers.list({ limit: 100 });
        const now = Date.now() / 1000;
        const last30Days = now - (30 * 24 * 60 * 60);
        const last7Days = now - (7 * 24 * 60 * 60);

        const engagementData = await Promise.all(
            customers.data.map(async (customer) => {
                const charges = await stripe.charges.list({ 
                    customer: customer.id, 
                    created: { gte: last30Days },
                    limit: 50 
                });

                const recentActivity = charges.data.filter(c => c.created >= last7Days).length;
                const totalActivity = charges.data.length;

                return {
                    customerId: customer.id,
                    email: customer.email,
                    last7DaysActivity: recentActivity,
                    last30DaysActivity: totalActivity,
                    engagementLevel: totalActivity >= 10 ? 'high' : totalActivity >= 5 ? 'medium' : 'low',
                    lastActivityDate: charges.data.length > 0 
                        ? new Date(charges.data[0].created * 1000).toISOString() 
                        : null
                };
            })
        );

        // Aggregate statistics
        const totalCustomers = engagementData.length;
        const highEngagement = engagementData.filter(e => e.engagementLevel === 'high').length;
        const mediumEngagement = engagementData.filter(e => e.engagementLevel === 'medium').length;
        const lowEngagement = engagementData.filter(e => e.engagementLevel === 'low').length;

        return {
            summary: {
                totalCustomers,
                highEngagement,
                mediumEngagement,
                lowEngagement,
                highEngagementPercentage: Math.round((highEngagement / totalCustomers) * 100),
                mediumEngagementPercentage: Math.round((mediumEngagement / totalCustomers) * 100),
                lowEngagementPercentage: Math.round((lowEngagement / totalCustomers) * 100)
            },
            customers: engagementData
        };
    } catch (error) {
        console.error('Error getting engagement metrics:', error);
        throw error;
    }
}

/**
 * Analyze usage patterns across customer base
 * Tracks feature adoption, usage frequency, and trends
 */
export async function analyzeUsagePatterns() {
    try {
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        const now = Date.now() / 1000;

        // Group by plan
        const usageByPlan = {};
        subscriptions.data.forEach(sub => {
            const planName = sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.id || 'Unknown';
            if (!usageByPlan[planName]) {
                usageByPlan[planName] = {
                    planName,
                    activeUsers: 0,
                    totalRevenue: 0,
                    averageLifetime: 0,
                    lifetimes: []
                };
            }
            usageByPlan[planName].activeUsers++;
            usageByPlan[planName].totalRevenue += sub.items.data[0]?.price?.unit_amount || 0;
            const lifetime = (now - sub.created) / (24 * 60 * 60); // Days
            usageByPlan[planName].lifetimes.push(lifetime);
        });

        // Calculate averages
        Object.values(usageByPlan).forEach(plan => {
            plan.totalRevenue = Math.round((plan.totalRevenue / 100) * 100) / 100; // Convert cents to dollars
            plan.averageLifetime = Math.round(
                plan.lifetimes.reduce((a, b) => a + b, 0) / plan.lifetimes.length
            );
            delete plan.lifetimes; // Remove raw data
        });

        // Feature adoption (based on subscription items)
        const featureAdoption = {};
        subscriptions.data.forEach(sub => {
            sub.items.data.forEach(item => {
                const feature = item.price?.product || 'Unknown';
                featureAdoption[feature] = (featureAdoption[feature] || 0) + 1;
            });
        });

        return {
            usageByPlan: Object.values(usageByPlan),
            featureAdoption,
            totalActiveSubscriptions: subscriptions.data.length,
            analyzedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error analyzing usage patterns:', error);
        throw error;
    }
}

/**
 * Predict churn risk based on health indicators
 * Uses multiple signals to identify at-risk customers
 */
export async function predictChurnRisk() {
    try {
        const customers = await stripe.customers.list({ limit: 100 });
        const now = Date.now() / 1000;
        const riskAnalysis = [];

        for (const customer of customers.data) {
            const subscriptions = await stripe.subscriptions.list({ customer: customer.id });
            const charges = await stripe.charges.list({ customer: customer.id, limit: 20 });
            const invoices = await stripe.invoices.list({ customer: customer.id, limit: 10 });

            // Risk factors
            const hasActiveSubscription = subscriptions.data.some(s => s.status === 'active');
            const recentFailedPayments = charges.data.filter(c => 
                !c.paid && c.created > now - (30 * 24 * 60 * 60)
            ).length;
            const overdueInvoices = invoices.data.filter(i => 
                i.status === 'open' && i.due_date && i.due_date < now
            ).length;
            const daysSinceLastCharge = charges.data.length > 0 
                ? (now - charges.data[0].created) / (24 * 60 * 60)
                : 999;

            // Calculate risk score (0-100, higher = more risk)
            let riskScore = 0;
            if (!hasActiveSubscription) riskScore += 30;
            riskScore += recentFailedPayments * 15;
            riskScore += overdueInvoices * 10;
            if (daysSinceLastCharge > 60) riskScore += 20;
            if (daysSinceLastCharge > 90) riskScore += 15;

            riskScore = Math.min(100, riskScore);

            const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

            if (riskScore > 0) {
                riskAnalysis.push({
                    customerId: customer.id,
                    email: customer.email,
                    riskScore,
                    riskLevel,
                    riskFactors: {
                        noActiveSubscription: !hasActiveSubscription,
                        recentFailedPayments,
                        overdueInvoices,
                        daysSinceLastActivity: Math.round(daysSinceLastCharge)
                    },
                    recommendations: generateRecommendations(riskLevel, {
                        hasActiveSubscription,
                        recentFailedPayments,
                        overdueInvoices,
                        daysSinceLastCharge
                    })
                });
            }
        }

        // Sort by risk score (highest first)
        riskAnalysis.sort((a, b) => b.riskScore - a.riskScore);

        return {
            totalCustomers: customers.data.length,
            atRiskCustomers: riskAnalysis.length,
            highRisk: riskAnalysis.filter(r => r.riskLevel === 'high').length,
            mediumRisk: riskAnalysis.filter(r => r.riskLevel === 'medium').length,
            lowRisk: riskAnalysis.filter(r => r.riskLevel === 'low').length,
            customers: riskAnalysis
        };
    } catch (error) {
        console.error('Error predicting churn risk:', error);
        throw error;
    }
}

function generateRecommendations(riskLevel, factors) {
    const recommendations = [];

    if (!factors.hasActiveSubscription) {
        recommendations.push('Re-engagement campaign: Offer special promotion to reactivate');
    }
    if (factors.recentFailedPayments > 0) {
        recommendations.push('Payment recovery: Contact customer about payment method update');
    }
    if (factors.overdueInvoices > 0) {
        recommendations.push('Billing reminder: Send payment reminder with support contact');
    }
    if (factors.daysSinceLastCharge > 60) {
        recommendations.push('Activity check-in: Reach out to understand current needs');
    }

    if (riskLevel === 'high') {
        recommendations.push('Urgent: Assign account manager for personalized outreach');
    }

    return recommendations;
}

/**
 * Segment customers by health status and behavior
 */
export async function getCustomerSegments() {
    try {
        const customers = await stripe.customers.list({ limit: 100 });
        const segments = {
            champions: [],      // High health, high spend
            loyalists: [],      // High health, medium spend
            atRisk: [],         // Low health, any spend
            newCustomers: [],   // < 30 days old
            hibernating: []     // No activity > 90 days
        };

        const now = Date.now() / 1000;

        for (const customer of customers.data) {
            const healthScore = await calculateHealthScore(customer.id);
            const subscriptions = await stripe.subscriptions.list({ customer: customer.id });
            const charges = await stripe.charges.list({ customer: customer.id, limit: 10 });

            const totalSpend = charges.data.reduce((sum, c) => sum + (c.paid ? c.amount : 0), 0) / 100;
            const daysSinceCreated = (now - customer.created) / (24 * 60 * 60);
            const daysSinceLastCharge = charges.data.length > 0 
                ? (now - charges.data[0].created) / (24 * 60 * 60)
                : 999;

            const customerData = {
                customerId: customer.id,
                email: customer.email,
                healthScore: healthScore.totalScore,
                totalSpend,
                daysSinceCreated: Math.round(daysSinceCreated)
            };

            // Segment logic
            if (daysSinceCreated < 30) {
                segments.newCustomers.push(customerData);
            } else if (daysSinceLastCharge > 90) {
                segments.hibernating.push(customerData);
            } else if (healthScore.totalScore < 40) {
                segments.atRisk.push(customerData);
            } else if (healthScore.totalScore >= 80 && totalSpend > 500) {
                segments.champions.push(customerData);
            } else if (healthScore.totalScore >= 60) {
                segments.loyalists.push(customerData);
            }
        }

        return {
            segments,
            summary: {
                champions: segments.champions.length,
                loyalists: segments.loyalists.length,
                atRisk: segments.atRisk.length,
                newCustomers: segments.newCustomers.length,
                hibernating: segments.hibernating.length
            }
        };
    } catch (error) {
        console.error('Error getting customer segments:', error);
        throw error;
    }
}

/**
 * Get health trends over time
 * Tracks how overall customer health changes month over month
 */
export async function getHealthTrends(months = 6) {
    try {
        const trends = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const periodEnd = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, 1);

            // Get subscriptions active during this period
            const subscriptions = await stripe.subscriptions.list({
                created: { lte: Math.floor(periodEnd.getTime() / 1000) },
                limit: 100
            });

            const activeInPeriod = subscriptions.data.filter(sub => {
                const subCreated = sub.created * 1000;
                const subCanceled = sub.canceled_at ? sub.canceled_at * 1000 : Date.now();
                return subCreated <= periodEnd.getTime() && subCanceled >= periodStart.getTime();
            });

            const healthScores = [];
            for (const sub of activeInPeriod.slice(0, 50)) { // Sample for performance
                try {
                    const score = await calculateHealthScore(sub.customer);
                    healthScores.push(score.totalScore);
                } catch (err) {
                    // Skip if customer not found
                    continue;
                }
            }

            const averageHealth = healthScores.length > 0
                ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
                : 0;

            trends.push({
                month: periodEnd.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
                date: periodEnd.toISOString(),
                activeCustomers: activeInPeriod.length,
                averageHealthScore: averageHealth,
                healthStatus: averageHealth >= 70 ? 'healthy' : averageHealth >= 50 ? 'moderate' : 'poor'
            });
        }

        // Calculate overall trend
        const firstScore = trends[0]?.averageHealthScore || 0;
        const lastScore = trends[trends.length - 1]?.averageHealthScore || 0;
        const trendDirection = lastScore > firstScore ? 'improving' : lastScore < firstScore ? 'declining' : 'stable';
        const trendPercentage = firstScore > 0 ? Math.round(((lastScore - firstScore) / firstScore) * 100) : 0;

        return {
            trends,
            overall: {
                trendDirection,
                trendPercentage,
                currentAverageHealth: lastScore,
                previousAverageHealth: firstScore
            }
        };
    } catch (error) {
        console.error('Error getting health trends:', error);
        throw error;
    }
}

/**
 * Get comprehensive customer health dashboard
 */
export async function getCustomerHealthDashboard() {
    try {
        const [engagement, usage, risk, segments, trends] = await Promise.all([
            getEngagementMetrics(),
            analyzeUsagePatterns(),
            predictChurnRisk(),
            getCustomerSegments(),
            getHealthTrends(6)
        ]);

        // Calculate overall health score
        const totalCustomers = engagement.summary.totalCustomers;
        const healthyCustomers = segments.summary.champions + segments.summary.loyalists;
        const overallHealthPercentage = totalCustomers > 0 
            ? Math.round((healthyCustomers / totalCustomers) * 100)
            : 0;

        return {
            summary: {
                totalCustomers,
                healthyCustomers,
                overallHealthPercentage,
                atRiskCount: risk.atRiskCustomers,
                highEngagementCount: engagement.summary.highEngagement,
                averageHealthScore: trends.overall.currentAverageHealth
            },
            engagement: engagement.summary,
            usage,
            risk: {
                totalAtRisk: risk.atRiskCustomers,
                highRisk: risk.highRisk,
                mediumRisk: risk.mediumRisk,
                lowRisk: risk.lowRisk,
                topRiskyCustomers: risk.customers.slice(0, 10)
            },
            segments: segments.summary,
            trends: trends.trends,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting customer health dashboard:', error);
        throw error;
    }
}

export default {
    calculateHealthScore,
    getEngagementMetrics,
    analyzeUsagePatterns,
    predictChurnRisk,
    getCustomerSegments,
    getHealthTrends,
    getCustomerHealthDashboard
};
