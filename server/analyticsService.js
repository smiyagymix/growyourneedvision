/**
 * Advanced Analytics Service
 * Provides cohort analysis, retention curves, funnel analytics, and business intelligence
 */

import { logAudit } from './auditLogger.js';

/**
 * Calculate cohort analysis by signup date
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Cohort analysis data
 */
export async function calculateCohortAnalysis(options = {}) {
    try {
        const {
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
            endDate = new Date().toISOString(),
            cohortBy = 'month', // 'day', 'week', 'month'
            metric = 'retention' // 'retention', 'revenue', 'activity'
        } = options;

        console.log(`Calculating cohort analysis from ${startDate} to ${endDate}`);

        // Fetch all tenants
        const tenants = await pbList('tenants', {
            filter: `created >= "${startDate}" && created <= "${endDate}"`,
            sort: 'created',
            perPage: 500
        });

        // Group tenants into cohorts
        const cohorts = groupByCohort(tenants, cohortBy);

        // Calculate retention for each cohort
        const cohortData = [];
        
        for (const [cohortLabel, cohortTenants] of Object.entries(cohorts)) {
            const cohortSize = cohortTenants.length;
            const cohortStartDate = new Date(cohortTenants[0].created);
            
            // Calculate retention for each period after cohort start
            const retentionData = await calculateRetentionByPeriod(cohortTenants, cohortStartDate, cohortBy);
            
            cohortData.push({
                cohort: cohortLabel,
                cohortDate: cohortStartDate.toISOString(),
                size: cohortSize,
                retention: retentionData,
                revenue: await calculateCohortRevenue(cohortTenants),
                avgLifetimeValue: await calculateAvgLTV(cohortTenants)
            });
        }

        // Log analytics query
        await logAudit({
            action: 'analytics.cohort_analysis',
            resourceType: 'analytics',
            resourceId: 'cohort_analysis',
            tenantId: 'platform',
            metadata: {
                start_date: startDate,
                end_date: endDate,
                cohort_by: cohortBy,
                metric,
                cohorts_count: cohortData.length
            },
            severity: 'low'
        });

        return {
            success: true,
            startDate,
            endDate,
            cohortBy,
            metric,
            cohorts: cohortData,
            summary: {
                totalCohorts: cohortData.length,
                totalUsers: cohortData.reduce((sum, c) => sum + c.size, 0),
                avgRetentionRate: calculateAvgRetention(cohortData)
            }
        };
    } catch (error) {
        console.error('Error calculating cohort analysis:', error);
        throw error;
    }
}

/**
 * Calculate retention curve
 * @param {Object} options - Retention options
 * @returns {Promise<Object>} Retention curve data
 */
export async function calculateRetentionCurve(options = {}) {
    try {
        const {
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
            period = 'month', // 'day', 'week', 'month'
            maxPeriods = 12
        } = options;

        console.log(`Calculating retention curve from ${startDate}`);

        // Fetch all tenants
        const tenants = await pbList('tenants', {
            filter: `created >= "${startDate}"`,
            sort: 'created',
            perPage: 500
        });

        // Calculate retention for each period
        const retentionCurve = [];
        
        for (let periodNum = 0; periodNum < maxPeriods; periodNum++) {
            const retainedCount = await calculateRetainedUsers(tenants, startDate, periodNum, period);
            const retentionRate = (retainedCount / tenants.length) * 100;
            
            retentionCurve.push({
                period: periodNum,
                periodLabel: getPeriodLabel(periodNum, period),
                retainedUsers: retainedCount,
                retentionRate: Math.round(retentionRate * 100) / 100,
                churnedUsers: tenants.length - retainedCount,
                churnRate: Math.round((1 - retentionRate / 100) * 10000) / 100
            });
        }

        // Log retention analysis
        await logAudit({
            action: 'analytics.retention_curve',
            resourceType: 'analytics',
            resourceId: 'retention_curve',
            tenantId: 'platform',
            metadata: {
                start_date: startDate,
                period,
                max_periods: maxPeriods,
                total_users: tenants.length
            },
            severity: 'low'
        });

        return {
            success: true,
            startDate,
            period,
            maxPeriods,
            totalUsers: tenants.length,
            curve: retentionCurve,
            summary: {
                period1Retention: retentionCurve[1]?.retentionRate || 0,
                period3Retention: retentionCurve[3]?.retentionRate || 0,
                period6Retention: retentionCurve[6]?.retentionRate || 0,
                period12Retention: retentionCurve[11]?.retentionRate || 0
            }
        };
    } catch (error) {
        console.error('Error calculating retention curve:', error);
        throw error;
    }
}

/**
 * Calculate funnel analytics
 * @param {Object} funnelSteps - Funnel step definitions
 * @returns {Promise<Object>} Funnel conversion data
 */
export async function calculateFunnelAnalytics(funnelSteps) {
    try {
        console.log('Calculating funnel analytics');

        const funnelData = [];
        let previousCount = null;

        for (const [index, step] of funnelSteps.entries()) {
            const count = await getStepCount(step);
            const conversionRate = previousCount 
                ? (count / previousCount) * 100 
                : 100;
            const dropoffRate = 100 - conversionRate;

            funnelData.push({
                step: index + 1,
                name: step.name,
                count,
                conversionRate: Math.round(conversionRate * 100) / 100,
                dropoffRate: Math.round(dropoffRate * 100) / 100,
                dropoffCount: previousCount ? previousCount - count : 0
            });

            previousCount = count;
        }

        // Calculate overall funnel metrics
        const overallConversion = funnelData.length > 0
            ? (funnelData[funnelData.length - 1].count / funnelData[0].count) * 100
            : 0;

        // Log funnel analysis
        await logAudit({
            action: 'analytics.funnel_calculated',
            resourceType: 'analytics',
            resourceId: 'funnel',
            tenantId: 'platform',
            metadata: {
                steps_count: funnelSteps.length,
                overall_conversion: overallConversion
            },
            severity: 'low'
        });

        return {
            success: true,
            funnel: funnelData,
            summary: {
                totalSteps: funnelData.length,
                topOfFunnel: funnelData[0]?.count || 0,
                bottomOfFunnel: funnelData[funnelData.length - 1]?.count || 0,
                overallConversion: Math.round(overallConversion * 100) / 100,
                biggestDropoff: findBiggestDropoff(funnelData)
            }
        };
    } catch (error) {
        console.error('Error calculating funnel analytics:', error);
        throw error;
    }
}

/**
 * Calculate Monthly Recurring Revenue (MRR) metrics
 * @param {Object} options - MRR options
 * @returns {Promise<Object>} MRR data
 */
export async function calculateMRRMetrics(options = {}) {
    try {
        const {
            startDate = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 12 months
            endDate = new Date().toISOString()
        } = options;

        console.log(`Calculating MRR metrics from ${startDate} to ${endDate}`);

        // Fetch active subscriptions
        const subscriptions = await pbList('subscriptions', {
            filter: `status = "active" || status = "trialing"`,
            perPage: 500
        });

        // Calculate MRR components
        const currentMRR = subscriptions.reduce((sum, sub) => sum + (sub.monthly_amount || 0), 0);
        
        // Get historical MRR data
        const mrrHistory = await getMRRHistory(startDate, endDate);
        
        // Calculate growth metrics
        const previousMRR = mrrHistory.length > 1 ? mrrHistory[mrrHistory.length - 2].mrr : currentMRR;
        const mrrGrowth = currentMRR - previousMRR;
        const mrrGrowthRate = previousMRR > 0 ? (mrrGrowth / previousMRR) * 100 : 0;

        // Calculate churn MRR
        const churnedSubs = await pbList('subscriptions', {
            filter: `status = "canceled" && canceled_at >= "${startDate}"`,
            perPage: 500
        });
        const churnedMRR = churnedSubs.reduce((sum, sub) => sum + (sub.monthly_amount || 0), 0);
        const churnRate = currentMRR > 0 ? (churnedMRR / (currentMRR + churnedMRR)) * 100 : 0;

        // Log MRR calculation
        await logAudit({
            action: 'analytics.mrr_calculated',
            resourceType: 'analytics',
            resourceId: 'mrr',
            tenantId: 'platform',
            metadata: {
                current_mrr: currentMRR,
                mrr_growth: mrrGrowth,
                churn_rate: churnRate
            },
            severity: 'low'
        });

        return {
            success: true,
            current: {
                mrr: currentMRR,
                arr: currentMRR * 12, // Annual Recurring Revenue
                activeSubscriptions: subscriptions.length,
                avgRevenuePerUser: subscriptions.length > 0 ? currentMRR / subscriptions.length : 0
            },
            growth: {
                mrrGrowth,
                mrrGrowthRate: Math.round(mrrGrowthRate * 100) / 100,
                previousMRR
            },
            churn: {
                churnedMRR,
                churnRate: Math.round(churnRate * 100) / 100,
                churnedSubscriptions: churnedSubs.length
            },
            history: mrrHistory
        };
    } catch (error) {
        console.error('Error calculating MRR metrics:', error);
        throw error;
    }
}

/**
 * Calculate Customer Lifetime Value (LTV)
 * @param {Object} options - LTV options
 * @returns {Promise<Object>} LTV metrics
 */
export async function calculateLTVMetrics(options = {}) {
    try {
        console.log('Calculating LTV metrics');

        // Fetch all customers with subscriptions
        const customers = await pbList('tenants', {
            filter: 'subscription != ""',
            perPage: 500
        });

        let totalRevenue = 0;
        let totalLifetimeMonths = 0;
        const ltvByPlan = {};

        for (const customer of customers) {
            const customerRevenue = await getCustomerTotalRevenue(customer.id);
            const lifetimeMonths = calculateLifetimeMonths(customer.created);
            
            totalRevenue += customerRevenue;
            totalLifetimeMonths += lifetimeMonths;

            // Group by plan
            const plan = customer.plan || 'unknown';
            if (!ltvByPlan[plan]) {
                ltvByPlan[plan] = { revenue: 0, customers: 0, months: 0 };
            }
            ltvByPlan[plan].revenue += customerRevenue;
            ltvByPlan[plan].customers += 1;
            ltvByPlan[plan].months += lifetimeMonths;
        }

        const avgLTV = customers.length > 0 ? totalRevenue / customers.length : 0;
        const avgLifetimeMonths = customers.length > 0 ? totalLifetimeMonths / customers.length : 0;
        const avgMonthlyValue = avgLifetimeMonths > 0 ? avgLTV / avgLifetimeMonths : 0;

        // Calculate LTV by plan
        const planMetrics = Object.entries(ltvByPlan).map(([plan, data]) => ({
            plan,
            avgLTV: data.customers > 0 ? data.revenue / data.customers : 0,
            avgLifetimeMonths: data.customers > 0 ? data.months / data.customers : 0,
            customers: data.customers
        }));

        // Log LTV calculation
        await logAudit({
            action: 'analytics.ltv_calculated',
            resourceType: 'analytics',
            resourceId: 'ltv',
            tenantId: 'platform',
            metadata: {
                avg_ltv: avgLTV,
                avg_lifetime_months: avgLifetimeMonths,
                total_customers: customers.length
            },
            severity: 'low'
        });

        return {
            success: true,
            overall: {
                avgLTV: Math.round(avgLTV * 100) / 100,
                avgLifetimeMonths: Math.round(avgLifetimeMonths * 10) / 10,
                avgMonthlyValue: Math.round(avgMonthlyValue * 100) / 100,
                totalCustomers: customers.length
            },
            byPlan: planMetrics
        };
    } catch (error) {
        console.error('Error calculating LTV metrics:', error);
        throw error;
    }
}

// ========== Helper Functions ==========

function groupByCohort(tenants, cohortBy) {
    const cohorts = {};
    
    for (const tenant of tenants) {
        const cohortLabel = getCohortLabel(new Date(tenant.created), cohortBy);
        if (!cohorts[cohortLabel]) {
            cohorts[cohortLabel] = [];
        }
        cohorts[cohortLabel].push(tenant);
    }
    
    return cohorts;
}

function getCohortLabel(date, cohortBy) {
    if (cohortBy === 'day') {
        return date.toISOString().split('T')[0];
    } else if (cohortBy === 'week') {
        const weekNum = getWeekNumber(date);
        return `${date.getFullYear()}-W${weekNum}`;
    } else if (cohortBy === 'month') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    return date.toISOString();
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

async function calculateRetentionByPeriod(cohortTenants, cohortStartDate, period) {
    // Calculate retention for periods 0-12
    const retentionData = [];
    
    for (let periodNum = 0; periodNum <= 12; periodNum++) {
        const periodDate = addPeriods(cohortStartDate, periodNum, period);
        const activeCount = await countActiveTenants(cohortTenants, periodDate);
        const retentionRate = (activeCount / cohortTenants.length) * 100;
        
        retentionData.push({
            period: periodNum,
            activeUsers: activeCount,
            retentionRate: Math.round(retentionRate * 100) / 100
        });
    }
    
    return retentionData;
}

function addPeriods(date, count, period) {
    const newDate = new Date(date);
    if (period === 'day') {
        newDate.setDate(newDate.getDate() + count);
    } else if (period === 'week') {
        newDate.setDate(newDate.getDate() + count * 7);
    } else if (period === 'month') {
        newDate.setMonth(newDate.getMonth() + count);
    }
    return newDate;
}

async function countActiveTenants(tenants, checkDate) {
    // Check if tenants were active at checkDate
    // For simplicity, checking if subscription was active
    let activeCount = 0;
    
    for (const tenant of tenants) {
        const wasActive = await isTenantActive(tenant.id, checkDate);
        if (wasActive) activeCount++;
    }
    
    return activeCount;
}

async function isTenantActive(tenantId, checkDate) {
    try {
        // Check if tenant had active subscription at checkDate
        const subs = await pbList('subscriptions', {
            filter: `tenantId = "${tenantId}" && created <= "${checkDate.toISOString()}"`,
            perPage: 1
        });
        return subs.length > 0;
    } catch {
        return false;
    }
}

async function calculateCohortRevenue(cohortTenants) {
    let totalRevenue = 0;
    for (const tenant of cohortTenants) {
        totalRevenue += await getCustomerTotalRevenue(tenant.id);
    }
    return Math.round(totalRevenue * 100) / 100;
}

async function calculateAvgLTV(cohortTenants) {
    if (cohortTenants.length === 0) return 0;
    const totalRevenue = await calculateCohortRevenue(cohortTenants);
    return Math.round((totalRevenue / cohortTenants.length) * 100) / 100;
}

function calculateAvgRetention(cohortData) {
    if (cohortData.length === 0) return 0;
    const totalRetention = cohortData.reduce((sum, c) => {
        const period3 = c.retention.find(r => r.period === 3);
        return sum + (period3?.retentionRate || 0);
    }, 0);
    return Math.round((totalRetention / cohortData.length) * 100) / 100;
}

async function calculateRetainedUsers(tenants, startDate, periodNum, period) {
    const checkDate = addPeriods(new Date(startDate), periodNum, period);
    return countActiveTenants(tenants, checkDate);
}

function getPeriodLabel(periodNum, period) {
    if (period === 'day') return `Day ${periodNum}`;
    if (period === 'week') return `Week ${periodNum}`;
    if (period === 'month') return `Month ${periodNum}`;
    return `Period ${periodNum}`;
}

async function getStepCount(step) {
    try {
        const results = await pbList(step.collection, {
            filter: step.filter || '',
            perPage: 1
        });
        return results.totalItems || 0;
    } catch {
        return 0;
    }
}

function findBiggestDropoff(funnelData) {
    let maxDropoff = { step: null, rate: 0 };
    
    for (const step of funnelData) {
        if (step.dropoffRate > maxDropoff.rate) {
            maxDropoff = { step: step.name, rate: step.dropoffRate };
        }
    }
    
    return maxDropoff;
}

async function getMRRHistory(startDate, endDate) {
    // Placeholder - would fetch from time-series data
    // For now, return mock data structure
    return [];
}

async function getCustomerTotalRevenue(customerId) {
    try {
        // Sum all successful payments for customer
        const payments = await pbList('payment_intents', {
            filter: `tenantId = "${customerId}" && status = "succeeded"`,
            perPage: 500
        });
        return payments.reduce((sum, payment) => sum + (payment.amount_received || 0), 0) / 100; // Convert cents to dollars
    } catch {
        return 0;
    }
}

function calculateLifetimeMonths(createdDate) {
    const created = new Date(createdDate);
    const now = new Date();
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    return Math.max(1, months); // Minimum 1 month
}

export default {
    calculateCohortAnalysis,
    calculateRetentionCurve,
    calculateFunnelAnalytics,
    calculateMRRMetrics,
    calculateLTVMetrics
};
