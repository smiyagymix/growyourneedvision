/**
 * Revenue Analysis Service
 * Provides comprehensive revenue metrics, forecasting, and analysis
 */

import cacheService, { CacheKeys, CacheTTL } from './cacheService.js';

import { getStripe } from './stripeClient.js';

const stripe = getStripe();

/**
 * Calculate Monthly Recurring Revenue (MRR)
 */
export async function calculateMRR() {
  return cacheService.getOrCompute(
    CacheKeys.mrr(),
    async () => {
      try {
        const subscriptions = await stripe.subscriptions.list({
          status: 'active',
          limit: 100,
        });

        let totalMRR = 0;
        const breakdown = {
          byPlan: {},
          byInterval: { monthly: 0, yearly: 0, other: 0 },
        };

        for (const sub of subscriptions.data) {
          for (const item of sub.items.data) {
            const price = item.price;
            const amount = price.unit_amount / 100; // Convert cents to dollars
            const quantity = item.quantity || 1;

            let monthlyAmount = 0;
            if (price.recurring.interval === 'month') {
              monthlyAmount = amount * quantity;
              breakdown.byInterval.monthly += monthlyAmount;
            } else if (price.recurring.interval === 'year') {
              monthlyAmount = (amount * quantity) / 12;
              breakdown.byInterval.yearly += monthlyAmount;
            } else {
              // Handle other intervals (week, day)
              const intervalCount = price.recurring.interval_count || 1;
              if (price.recurring.interval === 'week') {
                monthlyAmount = (amount * quantity * 4.33) / intervalCount;
              } else if (price.recurring.interval === 'day') {
                monthlyAmount = (amount * quantity * 30) / intervalCount;
              }
              breakdown.byInterval.other += monthlyAmount;
            }

            totalMRR += monthlyAmount;

            // Track by plan
            const planName = price.nickname || price.id;
            breakdown.byPlan[planName] = (breakdown.byPlan[planName] || 0) + monthlyAmount;
          }
        }

        return {
          totalMRR: Math.round(totalMRR * 100) / 100,
          arr: Math.round(totalMRR * 12 * 100) / 100,
          subscriptionCount: subscriptions.data.length,
          breakdown,
          averageRevenuePerAccount: subscriptions.data.length > 0 
            ? Math.round((totalMRR / subscriptions.data.length) * 100) / 100 
            : 0,
        };
      } catch (error) {
        console.error('Error calculating MRR:', error);
        throw error;
      }
    },
    CacheTTL.MRR
  );
}

/**
 * Get revenue growth over time periods
 */
export async function getRevenueGrowth(months = 12) {
  return cacheService.getOrCompute(
    CacheKeys.revenue(months),
    async () => {
      try {
        const now = new Date();
        const monthlyData = [];

        for (let i = months - 1; i >= 0; i--) {
          const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);

          const charges = await stripe.charges.list({
            created: {
              gte: Math.floor(periodStart.getTime() / 1000),
              lte: Math.floor(periodEnd.getTime() / 1000),
            },
            limit: 100,
          });

          const totalRevenue = charges.data
            .filter(charge => charge.status === 'succeeded' && !charge.refunded)
            .reduce((sum, charge) => sum + charge.amount, 0) / 100;

          const subscriptionRevenue = charges.data
            .filter(charge => charge.status === 'succeeded' && !charge.refunded && charge.invoice)
            .reduce((sum, charge) => sum + charge.amount, 0) / 100;

          const oneTimeRevenue = totalRevenue - subscriptionRevenue;

          monthlyData.push({
            month: periodStart.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
            date: periodStart.toISOString(),
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
            oneTimeRevenue: Math.round(oneTimeRevenue * 100) / 100,
            transactionCount: charges.data.length,
          });
        }

        // Calculate growth rates
        for (let i = 1; i < monthlyData.length; i++) {
          const current = monthlyData[i].totalRevenue;
          const previous = monthlyData[i - 1].totalRevenue;
          monthlyData[i].growthRate = previous > 0 
            ? Math.round(((current - previous) / previous) * 10000) / 100 
            : 0;
        }

        return monthlyData;
      } catch (error) {
        console.error('Error getting revenue growth:', error);
        throw error;
      }
    },
    CacheTTL.REVENUE
  );
}

/**
 * Analyze revenue by customer cohort
 */
export async function getCohortAnalysis() {
  try {
    const customers = await stripe.customers.list({
      limit: 100,
    });

    const cohorts = {};

    for (const customer of customers.data) {
      const created = new Date(customer.created * 1000);
      const cohortKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;

      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = {
          month: cohortKey,
          customerCount: 0,
          totalRevenue: 0,
          activeSubscriptions: 0,
        };
      }

      cohorts[cohortKey].customerCount++;

      // Get customer's subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
      });

      cohorts[cohortKey].activeSubscriptions += subscriptions.data.length;

      // Calculate revenue from this customer
      for (const sub of subscriptions.data) {
        for (const item of sub.items.data) {
          const amount = (item.price.unit_amount / 100) * (item.quantity || 1);
          cohorts[cohortKey].totalRevenue += amount;
        }
      }
    }

    return Object.values(cohorts)
      .sort((a, b) => b.month.localeCompare(a.month))
      .map(cohort => ({
        ...cohort,
        totalRevenue: Math.round(cohort.totalRevenue * 100) / 100,
        averageRevenuePerCustomer: cohort.customerCount > 0 
          ? Math.round((cohort.totalRevenue / cohort.customerCount) * 100) / 100 
          : 0,
      }));
  } catch (error) {
    console.error('Error analyzing cohorts:', error);
    throw error;
  }
}

/**
 * Forecast future revenue based on current trends
 */
export async function forecastRevenue(monthsAhead = 6) {
  try {
    const historicalData = await getRevenueGrowth(6); // Last 6 months
    
    if (historicalData.length < 2) {
      return { error: 'Insufficient historical data for forecasting' };
    }

    // Calculate average growth rate
    const growthRates = historicalData
      .filter(d => d.growthRate !== undefined)
      .map(d => d.growthRate);
    
    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const latestRevenue = historicalData[historicalData.length - 1].totalRevenue;

    const forecast = [];
    let projectedRevenue = latestRevenue;

    for (let i = 1; i <= monthsAhead; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      
      projectedRevenue = projectedRevenue * (1 + avgGrowthRate / 100);
      
      forecast.push({
        month: futureDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        date: futureDate.toISOString(),
        projectedRevenue: Math.round(projectedRevenue * 100) / 100,
        confidence: Math.max(30, 95 - (i * 10)), // Confidence decreases over time
      });
    }

    return {
      historical: historicalData,
      forecast,
      avgGrowthRate: Math.round(avgGrowthRate * 100) / 100,
      methodology: 'Linear trend extrapolation based on recent growth rates',
    };
  } catch (error) {
    console.error('Error forecasting revenue:', error);
    throw error;
  }
}

/**
 * Analyze churn impact on revenue
 */
export async function analyzeChurnImpact() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

    // Get cancelled subscriptions
    const cancelledSubs = await stripe.subscriptions.list({
      status: 'canceled',
      limit: 100,
    });

    let lostMRR = 0;
    let recoveredRevenue = 0;
    const reasons = {};

    for (const sub of cancelledSubs.data) {
      if (sub.canceled_at && sub.canceled_at >= thirtyDaysAgo) {
        // Calculate lost MRR
        for (const item of sub.items.data) {
          const amount = item.price.unit_amount / 100;
          const quantity = item.quantity || 1;
          
          let monthlyLoss = 0;
          if (item.price.recurring.interval === 'month') {
            monthlyLoss = amount * quantity;
          } else if (item.price.recurring.interval === 'year') {
            monthlyLoss = (amount * quantity) / 12;
          }
          
          lostMRR += monthlyLoss;
        }

        // Track cancellation reason
        const reason = sub.cancellation_details?.reason || 'unknown';
        reasons[reason] = (reasons[reason] || 0) + 1;
      }

      // Check if customer came back
      if (sub.customer) {
        const activeSubs = await stripe.subscriptions.list({
          customer: sub.customer.id || sub.customer,
          status: 'active',
        });
        if (activeSubs.data.length > 0) {
          recoveredRevenue += lostMRR;
        }
      }
    }

    return {
      lostMRR: Math.round(lostMRR * 100) / 100,
      lostARR: Math.round(lostMRR * 12 * 100) / 100,
      churnedSubscriptions: cancelledSubs.data.filter(s => s.canceled_at >= thirtyDaysAgo).length,
      recoveredRevenue: Math.round(recoveredRevenue * 100) / 100,
      cancellationReasons: reasons,
      averageLossPerChurn: cancelledSubs.data.length > 0 
        ? Math.round((lostMRR / cancelledSubs.data.length) * 100) / 100 
        : 0,
    };
  } catch (error) {
    console.error('Error analyzing churn impact:', error);
    throw error;
  }
}

/**
 * Get comprehensive revenue dashboard data
 */
export async function getRevenueDashboard() {
  try {
    const [mrr, growth, cohorts, churnImpact] = await Promise.all([
      calculateMRR(),
      getRevenueGrowth(12),
      getCohortAnalysis(),
      analyzeChurnImpact(),
    ]);

    // Calculate key metrics
    const currentMonth = growth[growth.length - 1];
    const previousMonth = growth[growth.length - 2];
    const monthOverMonthGrowth = previousMonth 
      ? ((currentMonth.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100 
      : 0;

    const totalRevenueLast12Months = growth.reduce((sum, month) => sum + month.totalRevenue, 0);

    return {
      summary: {
        mrr: mrr.totalMRR,
        arr: mrr.arr,
        averageRevenuePerAccount: mrr.averageRevenuePerAccount,
        monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 100) / 100,
        totalRevenueLast12Months: Math.round(totalRevenueLast12Months * 100) / 100,
        activeSubscriptions: mrr.subscriptionCount,
      },
      breakdown: mrr.breakdown,
      growth,
      cohorts: cohorts.slice(0, 10), // Top 10 cohorts
      churnImpact,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating revenue dashboard:', error);
    throw error;
  }
}

/**
 * Get revenue metrics for a specific date range
 */
export async function getRevenueByDateRange(startDate, endDate) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(start.getTime() / 1000),
        lte: Math.floor(end.getTime() / 1000),
      },
      limit: 100,
    });

    const successfulCharges = charges.data.filter(
      charge => charge.status === 'succeeded' && !charge.refunded
    );

    const totalRevenue = successfulCharges.reduce((sum, charge) => sum + charge.amount, 0) / 100;
    const averageTransactionValue = successfulCharges.length > 0 
      ? totalRevenue / successfulCharges.length 
      : 0;

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      transactionCount: successfulCharges.length,
      averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
      refundedAmount: charges.data
        .filter(charge => charge.refunded)
        .reduce((sum, charge) => sum + charge.amount_refunded, 0) / 100,
    };
  } catch (error) {
    console.error('Error getting revenue by date range:', error);
    throw error;
  }
}
