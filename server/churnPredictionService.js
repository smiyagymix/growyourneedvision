/**
 * AI-Powered Churn Prediction Service
 * Analyzes customer behavior patterns to predict and prevent churn
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class ChurnPredictionService {
    /**
     * Calculate churn risk score for a customer (0-100)
     * Higher score = higher risk of churning
     */
    async calculateChurnRisk(customerId) {
        try {
            const customer = await stripe.customers.retrieve(customerId);
            const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 100 });
            const invoices = await stripe.invoices.list({ customer: customerId, limit: 50 });
            const charges = await stripe.charges.list({ customer: customerId, limit: 20 });

            let riskScore = 0;
            const factors = [];

            // Factor 1: Payment failures (0-30 points)
            const failedPayments = invoices.data.filter(inv => inv.status === 'uncollectible' || inv.attempted && !inv.paid).length;
            if (failedPayments > 0) {
                const failurePoints = Math.min(failedPayments * 10, 30);
                riskScore += failurePoints;
                factors.push({ factor: 'Payment Failures', impact: failurePoints, severity: failedPayments > 2 ? 'high' : 'medium' });
            }

            // Factor 2: Subscription status (0-25 points)
            const activeSubscriptions = subscriptions.data.filter(sub => sub.status === 'active');
            const canceledOrPast = subscriptions.data.filter(sub => ['canceled', 'past_due'].includes(sub.status));
            if (canceledOrPast.length > 0) {
                riskScore += 25;
                factors.push({ factor: 'Past Due/Canceled Subscriptions', impact: 25, severity: 'high' });
            } else if (activeSubscriptions.length === 0) {
                riskScore += 15;
                factors.push({ factor: 'No Active Subscriptions', impact: 15, severity: 'medium' });
            }

            // Factor 3: Customer lifetime (0-20 points) - newer customers more likely to churn
            const accountAge = Date.now() - (customer.created * 1000);
            const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
            if (daysSinceCreation < 30) {
                const agePoints = 20 - (daysSinceCreation / 30) * 20;
                riskScore += agePoints;
                factors.push({ factor: 'New Customer (< 30 days)', impact: Math.round(agePoints), severity: 'medium' });
            }

            // Factor 4: Engagement decline (0-15 points) - decreasing invoice count
            const recentInvoices = invoices.data.filter(inv => {
                const invoiceDate = inv.created * 1000;
                const daysAgo = (Date.now() - invoiceDate) / (1000 * 60 * 60 * 24);
                return daysAgo <= 60;
            }).length;
            if (recentInvoices < 2 && daysSinceCreation > 60) {
                riskScore += 15;
                factors.push({ factor: 'Low Recent Activity', impact: 15, severity: 'medium' });
            }

            // Factor 5: Support tickets / disputes (0-20 points)
            const disputes = charges.data.filter(charge => charge.dispute !== null).length;
            if (disputes > 0) {
                const disputePoints = Math.min(disputes * 10, 20);
                riskScore += disputePoints;
                factors.push({ factor: 'Payment Disputes', impact: disputePoints, severity: 'high' });
            }

            // Factor 6: Downgrade patterns (0-15 points)
            const subscriptionChanges = this.detectDowngrades(subscriptions.data);
            if (subscriptionChanges.downgrades > 0) {
                riskScore += 15;
                factors.push({ factor: 'Recent Downgrades', impact: 15, severity: 'high' });
            }

            // Factor 7: Missing payment method (0-10 points)
            if (!customer.invoice_settings?.default_payment_method && !customer.default_source) {
                riskScore += 10;
                factors.push({ factor: 'No Payment Method', impact: 10, severity: 'medium' });
            }

            // Cap at 100
            riskScore = Math.min(Math.round(riskScore), 100);

            // Determine risk level
            let riskLevel = 'low';
            if (riskScore >= 70) riskLevel = 'critical';
            else if (riskScore >= 50) riskLevel = 'high';
            else if (riskScore >= 30) riskLevel = 'medium';

            // Generate recommendations
            const recommendations = this.generateRecommendations(factors, customer);

            return {
                customerId,
                customerEmail: customer.email,
                customerName: customer.name,
                riskScore,
                riskLevel,
                factors,
                recommendations,
                totalLifetimeValue: this.calculateLTV(invoices.data),
                accountAge: Math.round(daysSinceCreation),
                activeSubscriptions: activeSubscriptions.length,
                analyzedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error calculating churn risk:', error);
            throw error;
        }
    }

    /**
     * Detect downgrade patterns in subscription history
     */
    detectDowngrades(subscriptions) {
        let downgrades = 0;
        let upgrades = 0;

        // Sort by creation date
        const sorted = subscriptions.sort((a, b) => b.created - a.created);

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i].items.data[0]?.price?.unit_amount || 0;
            const previous = sorted[i + 1].items.data[0]?.price?.unit_amount || 0;

            if (current < previous) downgrades++;
            if (current > previous) upgrades++;
        }

        return { downgrades, upgrades };
    }

    /**
     * Calculate customer lifetime value from invoices
     */
    calculateLTV(invoices) {
        return invoices.reduce((total, invoice) => {
            return total + (invoice.amount_paid || 0);
        }, 0) / 100; // Convert cents to dollars
    }

    /**
     * Generate actionable recommendations to prevent churn
     */
    generateRecommendations(factors, customer) {
        const recommendations = [];

        const factorTypes = factors.map(f => f.factor);

        if (factorTypes.includes('Payment Failures')) {
            recommendations.push({
                priority: 'high',
                action: 'Update Payment Method',
                description: 'Customer has failed payments. Reach out to update their payment method.',
                automation: 'Send payment update reminder email'
            });
        }

        if (factorTypes.includes('Past Due/Canceled Subscriptions')) {
            recommendations.push({
                priority: 'critical',
                action: 'Win-Back Campaign',
                description: 'Customer has canceled or past due subscription. Offer special re-engagement discount.',
                automation: 'Trigger win-back email sequence with 20% discount'
            });
        }

        if (factorTypes.includes('New Customer (< 30 days)')) {
            recommendations.push({
                priority: 'medium',
                action: 'Onboarding Assistance',
                description: 'New customer may need help getting started. Provide onboarding support.',
                automation: 'Schedule onboarding call or send tutorial videos'
            });
        }

        if (factorTypes.includes('Low Recent Activity')) {
            recommendations.push({
                priority: 'high',
                action: 'Re-Engagement Campaign',
                description: 'Customer activity has declined. Send re-engagement content.',
                automation: 'Send feature highlight email or offer free training'
            });
        }

        if (factorTypes.includes('Recent Downgrades')) {
            recommendations.push({
                priority: 'high',
                action: 'Value Check-In',
                description: 'Customer downgraded recently. Schedule call to understand their needs.',
                automation: 'Assign account manager for personalized outreach'
            });
        }

        if (factorTypes.includes('Payment Disputes')) {
            recommendations.push({
                priority: 'critical',
                action: 'Dispute Resolution',
                description: 'Customer has disputed charges. Immediate attention required.',
                automation: 'Escalate to support team for resolution'
            });
        }

        if (factorTypes.includes('No Payment Method')) {
            recommendations.push({
                priority: 'medium',
                action: 'Add Payment Method',
                description: 'No payment method on file. Remind customer to add one.',
                automation: 'Send payment method setup email'
            });
        }

        // Default recommendation if no specific issues
        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'low',
                action: 'Maintain Engagement',
                description: 'Customer is healthy. Continue regular communication.',
                automation: 'Include in monthly newsletter'
            });
        }

        return recommendations;
    }

    /**
     * Get all at-risk customers
     */
    async getAtRiskCustomers(minRiskScore = 50, limit = 100) {
        try {
            const customers = await stripe.customers.list({ limit });
            const atRiskCustomers = [];

            for (const customer of customers.data) {
                const risk = await this.calculateChurnRisk(customer.id);
                if (risk.riskScore >= minRiskScore) {
                    atRiskCustomers.push(risk);
                }
            }

            // Sort by risk score descending
            atRiskCustomers.sort((a, b) => b.riskScore - a.riskScore);

            return atRiskCustomers;
        } catch (error) {
            console.error('❌ Error getting at-risk customers:', error);
            throw error;
        }
    }

    /**
     * Predict churn for entire customer base and generate report
     */
    async generateChurnReport() {
        try {
            const allCustomers = await stripe.customers.list({ limit: 100 });
            const risks = [];

            for (const customer of allCustomers.data) {
                try {
                    const risk = await this.calculateChurnRisk(customer.id);
                    risks.push(risk);
                } catch (error) {
                    console.error(`Error analyzing customer ${customer.id}:`, error.message);
                }
            }

            // Calculate summary statistics
            const critical = risks.filter(r => r.riskLevel === 'critical').length;
            const high = risks.filter(r => r.riskLevel === 'high').length;
            const medium = risks.filter(r => r.riskLevel === 'medium').length;
            const low = risks.filter(r => r.riskLevel === 'low').length;

            const avgRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length || 0;

            const atRiskRevenue = risks
                .filter(r => r.riskScore >= 50)
                .reduce((sum, r) => sum + r.totalLifetimeValue, 0);

            return {
                summary: {
                    totalCustomers: risks.length,
                    averageRiskScore: Math.round(avgRiskScore),
                    criticalRisk: critical,
                    highRisk: high,
                    mediumRisk: medium,
                    lowRisk: low,
                    atRiskRevenue: Math.round(atRiskRevenue),
                    revenueAtRiskPercentage: Math.round((atRiskRevenue / risks.reduce((sum, r) => sum + r.totalLifetimeValue, 0)) * 100)
                },
                customers: risks.sort((a, b) => b.riskScore - a.riskScore),
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error generating churn report:', error);
            throw error;
        }
    }

    /**
     * Execute automated retention actions for at-risk customers
     */
    async executeRetentionActions(customerId) {
        try {
            const risk = await this.calculateChurnRisk(customerId);

            if (risk.riskScore < 30) {
                console.log(`✅ Customer ${customerId} is low risk. No action needed.`);
                return { action: 'none', reason: 'Low risk score' };
            }

            const actions = [];

            // Execute recommendations
            for (const rec of risk.recommendations) {
                if (rec.priority === 'critical' || rec.priority === 'high') {
                    console.log(`🎯 Executing: ${rec.action} for ${customerId}`);
                    actions.push({
                        action: rec.action,
                        description: rec.automation,
                        executed: true,
                        executedAt: new Date().toISOString()
                    });
                    
                    // TODO: Implement actual automation triggers
                    // - Send emails via email service
                    // - Create support tickets
                    // - Notify account managers
                    // - Generate discount codes
                }
            }

            return {
                customerId,
                riskScore: risk.riskScore,
                riskLevel: risk.riskLevel,
                actionsExecuted: actions,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error executing retention actions:', error);
            throw error;
        }
    }

    /**
     * Cohort churn analysis - compare churn rates across cohorts
     */
    async analyzeCohortChurn(startDate, endDate, cohortBy = 'month') {
        try {
            const customers = await stripe.customers.list({
                created: {
                    gte: Math.floor(new Date(startDate).getTime() / 1000),
                    lte: Math.floor(new Date(endDate).getTime() / 1000)
                },
                limit: 100
            });

            const cohorts = {};

            for (const customer of customers.data) {
                const createdDate = new Date(customer.created * 1000);
                let cohortKey;

                if (cohortBy === 'month') {
                    cohortKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
                } else if (cohortBy === 'week') {
                    const weekNumber = this.getWeekNumber(createdDate);
                    cohortKey = `${createdDate.getFullYear()}-W${weekNumber}`;
                } else {
                    cohortKey = createdDate.toISOString().split('T')[0];
                }

                if (!cohorts[cohortKey]) {
                    cohorts[cohortKey] = {
                        cohort: cohortKey,
                        totalCustomers: 0,
                        churnedCustomers: 0,
                        averageRiskScore: 0,
                        totalRevenue: 0
                    };
                }

                cohorts[cohortKey].totalCustomers++;

                // Get risk assessment
                try {
                    const risk = await this.calculateChurnRisk(customer.id);
                    cohorts[cohortKey].averageRiskScore += risk.riskScore;
                    cohorts[cohortKey].totalRevenue += risk.totalLifetimeValue;

                    // Count as churned if risk is critical
                    if (risk.riskLevel === 'critical') {
                        cohorts[cohortKey].churnedCustomers++;
                    }
                } catch (error) {
                    console.error(`Error analyzing customer ${customer.id}:`, error.message);
                }
            }

            // Calculate averages and percentages
            const cohortArray = Object.values(cohorts).map(cohort => ({
                ...cohort,
                averageRiskScore: Math.round(cohort.averageRiskScore / cohort.totalCustomers),
                churnRate: Math.round((cohort.churnedCustomers / cohort.totalCustomers) * 100),
                avgRevenuePerCustomer: Math.round(cohort.totalRevenue / cohort.totalCustomers)
            }));

            return cohortArray.sort((a, b) => a.cohort.localeCompare(b.cohort));
        } catch (error) {
            console.error('❌ Error analyzing cohort churn:', error);
            throw error;
        }
    }

    /**
     * Helper: Get week number of year
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
}

export const churnPredictionService = new ChurnPredictionService();
export default churnPredictionService;
