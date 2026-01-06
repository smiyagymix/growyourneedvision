/**
 * Proration Service
 * Handles proration calculations for subscription plan changes,
 * upgrades, downgrades, and mid-cycle adjustments
 */

import Stripe from 'stripe';
import { logAudit } from './auditLogger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Calculate proration amount for plan change
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} newPriceId - New price ID to switch to
 * @param {Object} options - Proration options
 * @returns {Promise<Object>} Proration details
 */
export async function calculateProration(subscriptionId, newPriceId, options = {}) {
    try {
        const {
            prorationDate = Math.floor(Date.now() / 1000), // Current time in Unix timestamp
            billingCycleAnchor = undefined // Optional: reset billing cycle
        } = options;

        console.log(`Calculating proration for subscription ${subscriptionId} to price ${newPriceId}`);

        // Retrieve current subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPriceId = subscription.items.data[0].price.id;

        if (currentPriceId === newPriceId) {
            return {
                success: true,
                message: 'No change - already on this plan',
                proratedAmount: 0,
                immediateCharge: 0
            };
        }

        // Retrieve upcoming invoice with proration preview
        const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
            customer: subscription.customer,
            subscription: subscriptionId,
            subscription_items: [
                {
                    id: subscription.items.data[0].id,
                    price: newPriceId
                }
            ],
            subscription_proration_date: prorationDate,
            subscription_billing_cycle_anchor: billingCycleAnchor
        });

        // Calculate proration details
        const proratedAmount = upcomingInvoice.amount_due;
        const currentPeriodStart = subscription.current_period_start;
        const currentPeriodEnd = subscription.current_period_end;
        const daysRemaining = Math.ceil((currentPeriodEnd - prorationDate) / (24 * 60 * 60));
        const totalDays = Math.ceil((currentPeriodEnd - currentPeriodStart) / (24 * 60 * 60));

        // Get price details
        const currentPrice = await stripe.prices.retrieve(currentPriceId);
        const newPrice = await stripe.prices.retrieve(newPriceId);

        const isUpgrade = newPrice.unit_amount > currentPrice.unit_amount;
        const isDowngrade = newPrice.unit_amount < currentPrice.unit_amount;

        // Calculate refund/charge amounts
        const unusedAmount = (currentPrice.unit_amount / totalDays) * daysRemaining;
        const newPlanAmount = (newPrice.unit_amount / totalDays) * daysRemaining;
        const difference = newPlanAmount - unusedAmount;

        const result = {
            success: true,
            subscriptionId,
            currentPlan: {
                priceId: currentPriceId,
                amount: currentPrice.unit_amount,
                currency: currentPrice.currency,
                interval: currentPrice.recurring.interval
            },
            newPlan: {
                priceId: newPriceId,
                amount: newPrice.unit_amount,
                currency: newPrice.currency,
                interval: newPrice.recurring.interval
            },
            timing: {
                currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
                currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
                prorationDate: new Date(prorationDate * 1000).toISOString(),
                daysRemaining,
                totalDays
            },
            proration: {
                proratedAmount: Math.abs(proratedAmount),
                unusedAmount: Math.round(unusedAmount),
                newPlanAmount: Math.round(newPlanAmount),
                difference: Math.round(difference),
                isUpgrade,
                isDowngrade,
                immediateCharge: isUpgrade ? Math.round(difference) : 0,
                creditApplied: isDowngrade ? Math.round(Math.abs(difference)) : 0
            },
            invoicePreview: {
                total: upcomingInvoice.total,
                subtotal: upcomingInvoice.subtotal,
                lines: upcomingInvoice.lines.data.map(line => ({
                    description: line.description,
                    amount: line.amount,
                    proration: line.proration
                }))
            }
        };

        // Log proration calculation
        await logAudit({
            action: 'billing.proration_calculated',
            resourceType: 'subscription',
            resourceId: subscriptionId,
            tenantId: subscription.metadata?.tenantId || 'unknown',
            metadata: {
                from_plan: currentPriceId,
                to_plan: newPriceId,
                type: isUpgrade ? 'upgrade' : 'downgrade',
                prorated_amount: proratedAmount,
                days_remaining: daysRemaining
            },
            severity: 'low'
        });

        return result;
    } catch (error) {
        console.error('Error calculating proration:', error);

        await logAudit({
            action: 'billing.proration_calculation_failed',
            resourceType: 'subscription',
            resourceId: subscriptionId,
            tenantId: 'unknown',
            metadata: {
                error: error.message,
                new_price: newPriceId
            },
            severity: 'medium'
        });

        throw error;
    }
}

/**
 * Apply plan change with proration
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} newPriceId - New price ID
 * @param {Object} options - Change options
 * @returns {Promise<Object>} Updated subscription
 */
export async function applyPlanChange(subscriptionId, newPriceId, options = {}) {
    try {
        const {
            prorationBehavior = 'create_prorations', // or 'none', 'always_invoice'
            prorationDate = Math.floor(Date.now() / 1000),
            billingCycleAnchor = undefined,
            paymentBehavior = 'allow_incomplete' // or 'error_if_incomplete', 'pending_if_incomplete'
        } = options;

        console.log(`Applying plan change for subscription ${subscriptionId} to price ${newPriceId}`);

        // Calculate proration first
        const prorationCalc = await calculateProration(subscriptionId, newPriceId, {
            prorationDate,
            billingCycleAnchor
        });

        // Retrieve subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Update subscription with new price
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            items: [
                {
                    id: subscription.items.data[0].id,
                    price: newPriceId
                }
            ],
            proration_behavior: prorationBehavior,
            proration_date: prorationDate,
            billing_cycle_anchor: billingCycleAnchor,
            payment_behavior: paymentBehavior,
            metadata: {
                ...subscription.metadata,
                previous_plan: subscription.items.data[0].price.id,
                plan_changed_at: new Date().toISOString(),
                change_type: prorationCalc.proration.isUpgrade ? 'upgrade' : 'downgrade'
            }
        });

        // Log plan change
        await logAudit({
            action: 'billing.plan_changed',
            resourceType: 'subscription',
            resourceId: subscriptionId,
            tenantId: subscription.metadata?.tenantId || 'unknown',
            metadata: {
                from_plan: subscription.items.data[0].price.id,
                to_plan: newPriceId,
                proration_amount: prorationCalc.proration.proratedAmount,
                change_type: prorationCalc.proration.isUpgrade ? 'upgrade' : 'downgrade',
                immediate_charge: prorationCalc.proration.immediateCharge,
                credit_applied: prorationCalc.proration.creditApplied
            },
            severity: 'medium'
        });

        return {
            success: true,
            subscription: updatedSubscription,
            proration: prorationCalc.proration,
            message: `Successfully changed plan from ${prorationCalc.currentPlan.priceId} to ${prorationCalc.newPlan.priceId}`
        };
    } catch (error) {
        console.error('Error applying plan change:', error);

        await logAudit({
            action: 'billing.plan_change_failed',
            resourceType: 'subscription',
            resourceId: subscriptionId,
            tenantId: 'unknown',
            metadata: {
                error: error.message,
                new_price: newPriceId
            },
            severity: 'high'
        });

        throw error;
    }
}

/**
 * Schedule plan change at period end (no proration)
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} newPriceId - New price ID
 * @returns {Promise<Object>} Scheduled change details
 */
export async function schedulePlanChangeAtPeriodEnd(subscriptionId, newPriceId) {
    try {
        console.log(`Scheduling plan change at period end for subscription ${subscriptionId}`);

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Create subscription schedule for plan change at period end
        const schedule = await stripe.subscriptionSchedules.create({
            from_subscription: subscriptionId,
            end_behavior: 'release',
            phases: [
                {
                    // Current phase - until period end
                    items: [
                        {
                            price: subscription.items.data[0].price.id,
                            quantity: 1
                        }
                    ],
                    start_date: subscription.current_period_start,
                    end_date: subscription.current_period_end
                },
                {
                    // New phase - starting next period
                    items: [
                        {
                            price: newPriceId,
                            quantity: 1
                        }
                    ],
                    start_date: subscription.current_period_end
                }
            ]
        });

        // Log scheduled change
        await logAudit({
            action: 'billing.plan_change_scheduled',
            resourceType: 'subscription',
            resourceId: subscriptionId,
            tenantId: subscription.metadata?.tenantId || 'unknown',
            metadata: {
                from_plan: subscription.items.data[0].price.id,
                to_plan: newPriceId,
                effective_date: new Date(subscription.current_period_end * 1000).toISOString(),
                schedule_id: schedule.id
            },
            severity: 'low'
        });

        return {
            success: true,
            schedule,
            effectiveDate: new Date(subscription.current_period_end * 1000).toISOString(),
            message: 'Plan change scheduled for next billing period'
        };
    } catch (error) {
        console.error('Error scheduling plan change:', error);

        await logAudit({
            action: 'billing.plan_schedule_failed',
            resourceType: 'subscription',
            resourceId: subscriptionId,
            tenantId: 'unknown',
            metadata: {
                error: error.message,
                new_price: newPriceId
            },
            severity: 'medium'
        });

        throw error;
    }
}

/**
 * Add proration credit to customer balance
 * @param {string} customerId - Stripe customer ID
 * @param {number} amount - Credit amount (positive integer in cents)
 * @param {string} description - Credit description
 * @returns {Promise<Object>} Customer balance transaction
 */
export async function addProrationCredit(customerId, amount, description) {
    try {
        console.log(`Adding proration credit of ${amount} to customer ${customerId}`);

        const balanceTransaction = await stripe.customers.createBalanceTransaction(customerId, {
            amount: -amount, // Negative for credit
            currency: 'usd',
            description: description || 'Proration credit for plan downgrade'
        });

        await logAudit({
            action: 'billing.proration_credit_added',
            resourceType: 'customer',
            resourceId: customerId,
            tenantId: 'unknown',
            metadata: {
                amount,
                description,
                transaction_id: balanceTransaction.id
            },
            severity: 'low'
        });

        return {
            success: true,
            balanceTransaction,
            newBalance: balanceTransaction.ending_balance
        };
    } catch (error) {
        console.error('Error adding proration credit:', error);
        throw error;
    }
}

/**
 * Get proration preview without making changes
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} newPriceId - New price ID
 * @returns {Promise<Object>} Proration preview
 */
export async function getProrationPreview(subscriptionId, newPriceId) {
    // Just calculate, don't apply
    return calculateProration(subscriptionId, newPriceId);
}

export default {
    calculateProration,
    applyPlanChange,
    schedulePlanChangeAtPeriodEnd,
    addProrationCredit,
    getProrationPreview
};
