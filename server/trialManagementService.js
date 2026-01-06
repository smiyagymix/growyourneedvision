/**
 * Trial Management Service
 * Handles trial periods, conversions, and automated notifications
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class TrialManagementService {
    /**
     * Create a trial subscription
     */
    async createTrialSubscription(customerId, priceId, trialDays = 14) {
        try {
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                trial_period_days: trialDays,
                trial_settings: {
                    end_behavior: {
                        missing_payment_method: 'cancel' // Auto-cancel if no payment method
                    }
                },
                metadata: {
                    trial_start: new Date().toISOString(),
                    trial_days: trialDays.toString()
                }
            });

            console.log(`✅ Trial subscription created: ${subscription.id} (${trialDays} days)`);
            
            // Send welcome email
            await this.sendTrialWelcomeEmail(customerId, subscription);

            return subscription;
        } catch (error) {
            console.error('❌ Error creating trial subscription:', error);
            throw error;
        }
    }

    /**
     * Get all active trials
     */
    async getActiveTrials() {
        try {
            const subscriptions = await stripe.subscriptions.list({
                status: 'trialing',
                limit: 100
            });

            const trials = subscriptions.data.map(sub => {
                const trialEnd = new Date(sub.trial_end * 1000);
                const daysRemaining = Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24));
                
                return {
                    subscriptionId: sub.id,
                    customerId: sub.customer,
                    status: sub.status,
                    trialStart: new Date(sub.trial_start * 1000),
                    trialEnd: trialEnd,
                    daysRemaining: daysRemaining,
                    plan: sub.items.data[0]?.price?.nickname || 'Unknown Plan',
                    amount: sub.items.data[0]?.price?.unit_amount / 100,
                    currency: sub.items.data[0]?.price?.currency?.toUpperCase(),
                    hasPaymentMethod: !!sub.default_payment_method
                };
            });

            return trials;
        } catch (error) {
            console.error('❌ Error fetching active trials:', error);
            throw error;
        }
    }

    /**
     * Get trials expiring soon (next 3 days)
     */
    async getExpiringTrials(daysThreshold = 3) {
        try {
            const allTrials = await this.getActiveTrials();
            
            const expiringTrials = allTrials.filter(trial => 
                trial.daysRemaining <= daysThreshold && trial.daysRemaining > 0
            );

            return expiringTrials;
        } catch (error) {
            console.error('❌ Error fetching expiring trials:', error);
            throw error;
        }
    }

    /**
     * Convert trial to paid subscription
     */
    async convertTrialToPaid(subscriptionId) {
        try {
            // End trial immediately and start billing
            const subscription = await stripe.subscriptions.update(subscriptionId, {
                trial_end: 'now',
                proration_behavior: 'none'
            });

            console.log(`✅ Trial converted to paid: ${subscriptionId}`);

            // Send conversion confirmation email
            await this.sendConversionConfirmationEmail(subscription.customer, subscription);

            return subscription;
        } catch (error) {
            console.error('❌ Error converting trial to paid:', error);
            throw error;
        }
    }

    /**
     * Extend trial period
     */
    async extendTrial(subscriptionId, additionalDays = 7) {
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            if (subscription.status !== 'trialing') {
                throw new Error('Subscription is not in trial period');
            }

            const currentTrialEnd = subscription.trial_end;
            const newTrialEnd = currentTrialEnd + (additionalDays * 24 * 60 * 60);

            const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
                trial_end: newTrialEnd,
                metadata: {
                    ...subscription.metadata,
                    trial_extended: 'true',
                    extension_days: additionalDays.toString(),
                    extended_at: new Date().toISOString()
                }
            });

            console.log(`✅ Trial extended: ${subscriptionId} (+${additionalDays} days)`);

            // Send extension notification email
            await this.sendTrialExtensionEmail(subscription.customer, updatedSubscription, additionalDays);

            return updatedSubscription;
        } catch (error) {
            console.error('❌ Error extending trial:', error);
            throw error;
        }
    }

    /**
     * Cancel trial subscription
     */
    async cancelTrial(subscriptionId, reason = 'customer_request') {
        try {
            const subscription = await stripe.subscriptions.cancel(subscriptionId, {
                prorate: false
            });

            console.log(`✅ Trial cancelled: ${subscriptionId} (${reason})`);

            // Send cancellation email
            await this.sendTrialCancellationEmail(subscription.customer, subscription, reason);

            return subscription;
        } catch (error) {
            console.error('❌ Error cancelling trial:', error);
            throw error;
        }
    }

    /**
     * Get trial conversion metrics
     */
    async getConversionMetrics(startDate, endDate) {
        try {
            const subscriptions = await stripe.subscriptions.list({
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                    lte: Math.floor(endDate.getTime() / 1000)
                },
                limit: 100
            });

            const totalTrials = subscriptions.data.filter(sub => 
                sub.metadata?.trial_start
            ).length;

            const convertedTrials = subscriptions.data.filter(sub => 
                sub.metadata?.trial_start && 
                sub.status === 'active' && 
                !sub.trial_end
            ).length;

            const canceledTrials = subscriptions.data.filter(sub => 
                sub.metadata?.trial_start && 
                sub.status === 'canceled' && 
                sub.canceled_at
            ).length;

            const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

            // Calculate average trial duration for converted subscriptions
            const convertedDurations = subscriptions.data
                .filter(sub => sub.metadata?.trial_start && sub.status === 'active')
                .map(sub => {
                    const trialStart = new Date(sub.metadata.trial_start);
                    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : new Date();
                    return Math.ceil((trialEnd - trialStart) / (1000 * 60 * 60 * 24));
                });

            const avgTrialDuration = convertedDurations.length > 0
                ? convertedDurations.reduce((a, b) => a + b, 0) / convertedDurations.length
                : 0;

            return {
                totalTrials,
                activeTrials: subscriptions.data.filter(sub => sub.status === 'trialing').length,
                convertedTrials,
                canceledTrials,
                conversionRate: Math.round(conversionRate * 100) / 100,
                avgTrialDuration: Math.round(avgTrialDuration * 10) / 10,
                revenue: convertedTrials * 79, // Estimate based on average plan price
                period: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString()
                }
            };
        } catch (error) {
            console.error('❌ Error calculating conversion metrics:', error);
            throw error;
        }
    }

    /**
     * Send automated trial reminders (7 days, 3 days, 1 day before expiration)
     */
    async sendTrialReminders() {
        try {
            const expiringTrials = await this.getExpiringTrials(7);
            
            let remindersSent = 0;

            for (const trial of expiringTrials) {
                const daysRemaining = trial.daysRemaining;
                
                // Send reminders at specific intervals
                if ([7, 3, 1].includes(daysRemaining)) {
                    const customer = await stripe.customers.retrieve(trial.customerId);
                    
                    if (customer.email) {
                        await this.sendTrialReminderEmail(
                            customer.email,
                            customer.name || 'Valued Customer',
                            trial,
                            daysRemaining
                        );
                        
                        remindersSent++;
                    }
                }
            }

            console.log(`✅ Trial reminders sent: ${remindersSent}`);
            return { remindersSent, trialsChecked: expiringTrials.length };
        } catch (error) {
            console.error('❌ Error sending trial reminders:', error);
            throw error;
        }
    }

    /**
     * Email: Trial welcome
     */
    async sendTrialWelcomeEmail(customerId, subscription) {
        try {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.email) return;

            const trialEnd = new Date(subscription.trial_end * 1000);
            const trialDays = Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24));

            console.log(`[EMAIL] Would send trial welcome to ${customer.email}: ${trialDays} day trial`);
            // TODO: Implement email service
            // await emailService.sendEmail({...});
        } catch (error) {
            console.error('Error sending trial welcome email:', error);
        }
    }

    /**
     * Email: Trial reminder
     */
    async sendTrialReminderEmail(email, name, trial, daysRemaining) {
        console.log(`[EMAIL] Would send trial reminder to ${email}: ${daysRemaining} days remaining`);
        // TODO: Implement email service
    }

    async sendTrialExtensionEmail(customerId, subscription, additionalDays) {
        console.log(`[EMAIL] Would send extension email for +${additionalDays} days`);
        // TODO: Implement email service
    }

    async sendConversionConfirmationEmail(customerId, subscription) {
        console.log(`[EMAIL] Would send conversion confirmation`);
        // TODO: Implement email service
    }

    async sendTrialCancellationEmail(customerId, subscription, reason) {
        console.log(`[EMAIL] Would send cancellation email (reason: ${reason})`);
        // TODO: Implement email service
    }

    /**
     * Automatically process trial expirations
     */
    async processTrialExpirations() {
        try {
            const expiredTrials = await stripe.subscriptions.list({
                status: 'trialing',
                trial_end: {
                    lte: Math.floor(Date.now() / 1000)
                },
                limit: 100
            });

            let processed = 0;

            for (const subscription of expiredTrials.data) {
                // Check if payment method exists
                if (subscription.default_payment_method) {
                    // Will auto-convert to active
                    console.log(`✅ Trial auto-converting: ${subscription.id}`);
                    processed++;
                } else {
                    // Will auto-cancel due to trial_settings
                    console.log(`⚠️ Trial auto-cancelling (no payment method): ${subscription.id}`);
                    processed++;
                }
            }

            return { processed, total: expiredTrials.data.length };
        } catch (error) {
            console.error('❌ Error processing trial expirations:', error);
            throw error;
        }
    }
}

export const trialManagementService = new TrialManagementService();
export default trialManagementService;
