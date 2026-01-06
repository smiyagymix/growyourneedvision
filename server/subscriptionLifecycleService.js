import Stripe from 'stripe';
import PocketBase from 'pocketbase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'demo-key');
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

/**
 * Get comprehensive subscription lifecycle dashboard
 * Includes status distribution, recent events, and workflow metrics
 */
export async function getLifecycleDashboard() {
    try {
        const subscriptions = await stripe.subscriptions.list({ limit: 100 });
        
        // Status distribution
        const statusCounts = {
            active: 0,
            trialing: 0,
            past_due: 0,
            canceled: 0,
            unpaid: 0,
            incomplete: 0,
            incomplete_expired: 0,
            paused: 0
        };

        subscriptions.data.forEach(sub => {
            statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
        });

        // Recent lifecycle events (last 30 days)
        const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        const recentEvents = await stripe.events.list({
            type: 'customer.subscription.*',
            created: { gte: thirtyDaysAgo },
            limit: 50
        });

        // Categorize events
        const eventCounts = {
            created: 0,
            updated: 0,
            deleted: 0,
            trial_will_end: 0,
            paused: 0,
            resumed: 0
        };

        recentEvents.data.forEach(event => {
            if (event.type === 'customer.subscription.created') eventCounts.created++;
            if (event.type === 'customer.subscription.updated') eventCounts.updated++;
            if (event.type === 'customer.subscription.deleted') eventCounts.deleted++;
            if (event.type === 'customer.subscription.trial_will_end') eventCounts.trial_will_end++;
            if (event.type === 'customer.subscription.paused') eventCounts.paused++;
            if (event.type === 'customer.subscription.resumed') eventCounts.resumed++;
        });

        // Upgrade/downgrade tracking
        const upgrades = await trackUpgrades(subscriptions.data);
        const downgrades = await trackDowngrades(subscriptions.data);

        // Renewal metrics
        const renewals = await trackRenewals(subscriptions.data);

        return {
            summary: {
                totalSubscriptions: subscriptions.data.length,
                activeSubscriptions: statusCounts.active,
                trialingSubscriptions: statusCounts.trialing,
                pastDueSubscriptions: statusCounts.past_due,
                canceledSubscriptions: statusCounts.canceled
            },
            statusDistribution: statusCounts,
            recentEvents: {
                counts: eventCounts,
                events: recentEvents.data.slice(0, 10).map(e => ({
                    id: e.id,
                    type: e.type,
                    created: new Date(e.created * 1000).toISOString(),
                    subscriptionId: e.data?.object?.id,
                    customerId: e.data?.object?.customer
                }))
            },
            workflows: {
                upgrades: upgrades.count,
                downgrades: downgrades.count,
                renewals: renewals.count,
                churnRate: calculateChurnRate(subscriptions.data)
            }
        };
    } catch (error) {
        console.error('Error fetching lifecycle dashboard:', error);
        throw error;
    }
}

/**
 * Track subscription upgrades (plan changes to higher value)
 */
async function trackUpgrades(subscriptions) {
    const upgrades = [];
    
    for (const sub of subscriptions) {
        try {
            // Get subscription history from events
            const events = await stripe.events.list({
                type: 'customer.subscription.updated',
                limit: 10
            });

            const subEvents = events.data.filter(e => e.data.object.id === sub.id);
            
            for (const event of subEvents) {
                const prev = event.data.previous_attributes;
                const curr = event.data.object;
                
                if (prev?.items?.data && curr.items?.data) {
                    const prevPrice = prev.items.data[0]?.price?.unit_amount || 0;
                    const currPrice = curr.items.data[0]?.price?.unit_amount || 0;
                    
                    if (currPrice > prevPrice) {
                        upgrades.push({
                            subscriptionId: sub.id,
                            customerId: sub.customer,
                            previousPlan: prev.items.data[0]?.price?.nickname || 'Unknown',
                            newPlan: curr.items.data[0]?.price?.nickname || 'Unknown',
                            priceIncrease: (currPrice - prevPrice) / 100,
                            date: new Date(event.created * 1000).toISOString()
                        });
                    }
                }
            }
        } catch (err) {
            // Skip if unable to fetch events
            continue;
        }
    }

    return { count: upgrades.length, upgrades: upgrades.slice(0, 10) };
}

/**
 * Track subscription downgrades (plan changes to lower value)
 */
async function trackDowngrades(subscriptions) {
    const downgrades = [];
    
    for (const sub of subscriptions) {
        try {
            const events = await stripe.events.list({
                type: 'customer.subscription.updated',
                limit: 10
            });

            const subEvents = events.data.filter(e => e.data.object.id === sub.id);
            
            for (const event of subEvents) {
                const prev = event.data.previous_attributes;
                const curr = event.data.object;
                
                if (prev?.items?.data && curr.items?.data) {
                    const prevPrice = prev.items.data[0]?.price?.unit_amount || 0;
                    const currPrice = curr.items.data[0]?.price?.unit_amount || 0;
                    
                    if (currPrice < prevPrice && currPrice > 0) {
                        downgrades.push({
                            subscriptionId: sub.id,
                            customerId: sub.customer,
                            previousPlan: prev.items.data[0]?.price?.nickname || 'Unknown',
                            newPlan: curr.items.data[0]?.price?.nickname || 'Unknown',
                            priceDecrease: (prevPrice - currPrice) / 100,
                            date: new Date(event.created * 1000).toISOString()
                        });
                    }
                }
            }
        } catch (err) {
            continue;
        }
    }

    return { count: downgrades.length, downgrades: downgrades.slice(0, 10) };
}

/**
 * Track subscription renewals
 */
async function trackRenewals(subscriptions) {
    const now = Date.now() / 1000;
    const upcomingRenewals = [];
    
    subscriptions.forEach(sub => {
        if (sub.status === 'active' && sub.current_period_end) {
            const daysUntilRenewal = Math.floor((sub.current_period_end - now) / (24 * 60 * 60));
            
            if (daysUntilRenewal <= 30 && daysUntilRenewal >= 0) {
                upcomingRenewals.push({
                    subscriptionId: sub.id,
                    customerId: sub.customer,
                    planName: sub.items.data[0]?.price?.nickname || 'Unknown',
                    renewalDate: new Date(sub.current_period_end * 1000).toISOString(),
                    daysUntilRenewal,
                    amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100
                });
            }
        }
    });

    upcomingRenewals.sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);

    return { count: upcomingRenewals.length, renewals: upcomingRenewals.slice(0, 10) };
}

/**
 * Calculate churn rate based on cancellations
 */
function calculateChurnRate(subscriptions) {
    const total = subscriptions.length;
    const canceled = subscriptions.filter(s => s.status === 'canceled').length;
    
    return total > 0 ? Math.round((canceled / total) * 100 * 100) / 100 : 0;
}

/**
 * Get detailed subscription status tracking
 */
export async function getSubscriptionStatuses(status = null) {
    try {
        const params = { limit: 100 };
        if (status) params.status = status;

        const subscriptions = await stripe.subscriptions.list(params);

        const detailedSubscriptions = await Promise.all(
            subscriptions.data.map(async (sub) => {
                try {
                    const customer = await stripe.customers.retrieve(sub.customer);
                    
                    return {
                        id: sub.id,
                        customerId: sub.customer,
                        customerEmail: customer.email,
                        customerName: customer.name || 'N/A',
                        status: sub.status,
                        planName: sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.id || 'Unknown',
                        amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
                        interval: sub.items.data[0]?.price?.recurring?.interval || 'N/A',
                        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
                        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
                        cancelAtPeriodEnd: sub.cancel_at_period_end,
                        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
                        created: new Date(sub.created * 1000).toISOString(),
                        metadata: sub.metadata
                    };
                } catch (err) {
                    return null;
                }
            })
        );

        return detailedSubscriptions.filter(s => s !== null);
    } catch (error) {
        console.error('Error fetching subscription statuses:', error);
        throw error;
    }
}

/**
 * Perform subscription upgrade
 */
export async function upgradeSubscription(subscriptionId, newPriceId) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const updated = await stripe.subscriptions.update(subscriptionId, {
            items: [{
                id: subscription.items.data[0].id,
                price: newPriceId,
            }],
            proration_behavior: 'always_invoice',
        });

        return {
            success: true,
            subscription: {
                id: updated.id,
                status: updated.status,
                newPlan: updated.items.data[0]?.price?.nickname || 'Unknown',
                amount: (updated.items.data[0]?.price?.unit_amount || 0) / 100
            }
        };
    } catch (error) {
        console.error('Error upgrading subscription:', error);
        throw error;
    }
}

/**
 * Perform subscription downgrade
 */
export async function downgradeSubscription(subscriptionId, newPriceId) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const updated = await stripe.subscriptions.update(subscriptionId, {
            items: [{
                id: subscription.items.data[0].id,
                price: newPriceId,
            }],
            proration_behavior: 'create_prorations',
        });

        return {
            success: true,
            subscription: {
                id: updated.id,
                status: updated.status,
                newPlan: updated.items.data[0]?.price?.nickname || 'Unknown',
                amount: (updated.items.data[0]?.price?.unit_amount || 0) / 100
            }
        };
    } catch (error) {
        console.error('Error downgrading subscription:', error);
        throw error;
    }
}

/**
 * Cancel subscription with retention options
 */
export async function cancelSubscription(subscriptionId, options = {}) {
    try {
        const {
            immediately = false,
            reason = null,
            feedback = null
        } = options;

        const cancelParams = {};
        
        if (immediately) {
            cancelParams.prorate = true;
        } else {
            cancelParams.cancel_at_period_end = true;
        }

        if (reason || feedback) {
            cancelParams.cancellation_details = {
                comment: feedback || undefined,
                feedback: reason || undefined
            };
        }

        const subscription = await stripe.subscriptions.update(subscriptionId, cancelParams);

        return {
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
            }
        };
    } catch (error) {
        console.error('Error canceling subscription:', error);
        throw error;
    }
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(subscriptionId) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (!subscription.cancel_at_period_end) {
            return {
                success: false,
                error: 'Subscription is not scheduled for cancellation'
            };
        }

        const updated = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false
        });

        return {
            success: true,
            subscription: {
                id: updated.id,
                status: updated.status,
                cancelAtPeriodEnd: updated.cancel_at_period_end
            }
        };
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        throw error;
    }
}

/**
 * Pause subscription
 */
export async function pauseSubscription(subscriptionId, resumeAt = null) {
    try {
        const pauseParams = {
            pause_collection: {
                behavior: 'mark_uncollectible'
            }
        };

        if (resumeAt) {
            pauseParams.pause_collection.resumes_at = Math.floor(new Date(resumeAt).getTime() / 1000);
        }

        const subscription = await stripe.subscriptions.update(subscriptionId, pauseParams);

        return {
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                pauseCollection: subscription.pause_collection
            }
        };
    } catch (error) {
        console.error('Error pausing subscription:', error);
        throw error;
    }
}

/**
 * Resume paused subscription
 */
export async function resumeSubscription(subscriptionId) {
    try {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            pause_collection: null
        });

        return {
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                pauseCollection: subscription.pause_collection
            }
        };
    } catch (error) {
        console.error('Error resuming subscription:', error);
        throw error;
    }
}

/**
 * Get lifecycle events for a specific subscription
 */
export async function getSubscriptionHistory(subscriptionId) {
    try {
        const events = await stripe.events.list({
            limit: 50
        });

        const subscriptionEvents = events.data.filter(e => 
            e.type.startsWith('customer.subscription.') && 
            e.data?.object?.id === subscriptionId
        );

        return subscriptionEvents.map(e => ({
            id: e.id,
            type: e.type,
            created: new Date(e.created * 1000).toISOString(),
            data: {
                status: e.data.object.status,
                plan: e.data.object.items?.data[0]?.price?.nickname || 'Unknown',
                previousAttributes: e.data.previous_attributes
            }
        }));
    } catch (error) {
        console.error('Error fetching subscription history:', error);
        throw error;
    }
}

/**
 * Get available plans for upgrade/downgrade
 */
export async function getAvailablePlans() {
    try {
        const prices = await stripe.prices.list({
            active: true,
            limit: 50
        });

        const plans = prices.data.map(price => ({
            id: price.id,
            name: price.nickname || price.id,
            amount: (price.unit_amount || 0) / 100,
            currency: price.currency.toUpperCase(),
            interval: price.recurring?.interval || 'one-time',
            intervalCount: price.recurring?.interval_count || 1,
            trialPeriodDays: price.recurring?.trial_period_days || 0
        }));

        return plans.sort((a, b) => a.amount - b.amount);
    } catch (error) {
        console.error('Error fetching available plans:', error);
        throw error;
    }
}

export default {
    getLifecycleDashboard,
    getSubscriptionStatuses,
    upgradeSubscription,
    downgradeSubscription,
    cancelSubscription,
    reactivateSubscription,
    pauseSubscription,
    resumeSubscription,
    getSubscriptionHistory,
    getAvailablePlans
};
