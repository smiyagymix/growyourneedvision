/**
 * Billing Retry Service
 * Handles automatic retry logic for failed subscription payments
 * with configurable retry schedules and dunning management
 */

import Stripe from 'stripe';
import { logAudit } from './auditLogger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Retry configuration with exponential backoff
 */
const RETRY_CONFIG = {
    maxAttempts: 4, // Total attempts: initial + 3 retries
    schedule: [
        { days: 3, gracePeriod: true },   // Retry 1: 3 days, keep service active
        { days: 5, gracePeriod: true },   // Retry 2: 5 days, keep service active
        { days: 7, gracePeriod: false },  // Retry 3: 7 days, suspend service
        { days: 14, gracePeriod: false }  // Retry 4: 14 days, final attempt
    ],
    notificationSchedule: [
        { beforeRetry: 1, message: 'Payment failed - retry in 3 days' },
        { beforeRetry: 2, message: 'Second payment attempt failed - retry in 5 days' },
        { beforeRetry: 3, message: 'Service suspended - retry in 7 days' },
        { beforeRetry: 4, message: 'Final payment attempt - subscription will cancel in 14 days' }
    ]
};

/**
 * Process failed payment and schedule next retry
 * @param {Object} invoice - Stripe invoice object
 * @returns {Promise<Object>} Retry schedule information
 */
export async function schedulePaymentRetry(invoice) {
    try {
        const attemptCount = invoice.attempt_count || 0;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        console.log(`Processing failed payment for invoice ${invoice.id}, attempt ${attemptCount}`);

        // Check if max retries exceeded
        if (attemptCount >= RETRY_CONFIG.maxAttempts) {
            console.error(`Max retry attempts reached for invoice ${invoice.id}`);
            
            // Cancel subscription
            if (subscriptionId) {
                await cancelSubscriptionDueToPaymentFailure(subscriptionId, invoice.id);
            }

            // Send final notification
            await sendDunningEmail(customerId, 'cancellation', {
                invoiceId: invoice.id,
                amount: invoice.amount_due,
                currency: invoice.currency,
                attemptCount
            });

            return {
                success: false,
                reason: 'max_retries_exceeded',
                action: 'subscription_cancelled'
            };
        }

        // Get next retry schedule
        const retrySchedule = RETRY_CONFIG.schedule[attemptCount];
        const nextRetryDate = new Date();
        nextRetryDate.setDate(nextRetryDate.getDate() + retrySchedule.days);

        // Update subscription metadata with retry info
        if (subscriptionId) {
            await stripe.subscriptions.update(subscriptionId, {
                metadata: {
                    retry_count: String(attemptCount + 1),
                    next_retry_date: nextRetryDate.toISOString(),
                    grace_period: String(retrySchedule.gracePeriod),
                    last_failed_invoice: invoice.id
                }
            });

            // Suspend service if grace period expired
            if (!retrySchedule.gracePeriod) {
                await suspendSubscriptionService(subscriptionId);
            }
        }

        // Send dunning email
        const notificationConfig = RETRY_CONFIG.notificationSchedule[attemptCount];
        await sendDunningEmail(customerId, 'retry', {
            invoiceId: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            attemptCount: attemptCount + 1,
            nextRetryDate,
            message: notificationConfig.message,
            gracePeriod: retrySchedule.gracePeriod
        });

        // Log retry schedule
        await logAudit({
            action: 'billing.retry_scheduled',
            resourceType: 'invoice',
            resourceId: invoice.id,
            tenantId: invoice.metadata?.tenantId || 'unknown',
            metadata: {
                attempt: attemptCount + 1,
                max_attempts: RETRY_CONFIG.maxAttempts,
                next_retry: nextRetryDate.toISOString(),
                grace_period: retrySchedule.gracePeriod,
                customer: customerId,
                subscription: subscriptionId,
                amount: invoice.amount_due
            },
            severity: attemptCount >= 2 ? 'high' : 'medium'
        });

        return {
            success: true,
            nextRetryDate,
            attemptCount: attemptCount + 1,
            gracePeriod: retrySchedule.gracePeriod,
            daysUntilRetry: retrySchedule.days
        };
    } catch (error) {
        console.error('Error scheduling payment retry:', error);
        
        await logAudit({
            action: 'billing.retry_schedule_failed',
            resourceType: 'invoice',
            resourceId: invoice.id,
            tenantId: invoice.metadata?.tenantId || 'unknown',
            metadata: {
                error: error.message,
                attempt: invoice.attempt_count
            },
            severity: 'critical'
        });

        throw error;
    }
}

/**
 * Manually retry failed payment
 * @param {string} invoiceId - Stripe invoice ID
 * @returns {Promise<Object>} Payment result
 */
export async function retryInvoicePayment(invoiceId) {
    try {
        console.log(`Manually retrying payment for invoice ${invoiceId}`);

        // Retrieve invoice
        const invoice = await stripe.invoices.retrieve(invoiceId);

        if (invoice.status === 'paid') {
            return {
                success: true,
                message: 'Invoice already paid',
                invoice
            };
        }

        // Attempt to pay invoice
        const paidInvoice = await stripe.invoices.pay(invoiceId, {
            paid_out_of_band: false
        });

        // Log successful retry
        await logAudit({
            action: 'billing.manual_retry_succeeded',
            resourceType: 'invoice',
            resourceId: invoiceId,
            tenantId: invoice.metadata?.tenantId || 'unknown',
            metadata: {
                amount: paidInvoice.amount_paid,
                currency: paidInvoice.currency,
                customer: paidInvoice.customer
            },
            severity: 'low'
        });

        return {
            success: true,
            message: 'Payment succeeded',
            invoice: paidInvoice
        };
    } catch (error) {
        console.error(`Manual retry failed for invoice ${invoiceId}:`, error);

        await logAudit({
            action: 'billing.manual_retry_failed',
            resourceType: 'invoice',
            resourceId: invoiceId,
            tenantId: 'unknown',
            metadata: {
                error: error.message
            },
            severity: 'high'
        });

        return {
            success: false,
            message: error.message,
            error: error.code
        };
    }
}

/**
 * Update payment method and retry failed payments
 * @param {string} customerId - Stripe customer ID
 * @param {string} paymentMethodId - New payment method ID
 * @returns {Promise<Object>} Update result with retry status
 */
export async function updatePaymentMethodAndRetry(customerId, paymentMethodId) {
    try {
        console.log(`Updating payment method for customer ${customerId}`);

        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId
        });

        // Set as default payment method
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });

        // Retrieve failed invoices
        const failedInvoices = await stripe.invoices.list({
            customer: customerId,
            status: 'open',
            limit: 10
        });

        console.log(`Found ${failedInvoices.data.length} failed invoices for customer ${customerId}`);

        // Retry each failed invoice
        const retryResults = [];
        for (const invoice of failedInvoices.data) {
            const result = await retryInvoicePayment(invoice.id);
            retryResults.push({
                invoiceId: invoice.id,
                ...result
            });
        }

        // Log payment method update
        await logAudit({
            action: 'billing.payment_method_updated',
            resourceType: 'customer',
            resourceId: customerId,
            tenantId: 'unknown',
            metadata: {
                payment_method: paymentMethodId,
                failed_invoices_count: failedInvoices.data.length,
                retry_results: retryResults
            },
            severity: 'low'
        });

        return {
            success: true,
            message: 'Payment method updated',
            retriedInvoices: retryResults.length,
            successfulRetries: retryResults.filter(r => r.success).length,
            results: retryResults
        };
    } catch (error) {
        console.error('Error updating payment method:', error);

        await logAudit({
            action: 'billing.payment_method_update_failed',
            resourceType: 'customer',
            resourceId: customerId,
            tenantId: 'unknown',
            metadata: {
                error: error.message
            },
            severity: 'high'
        });

        throw error;
    }
}

/**
 * Cancel subscription due to payment failure
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} invoiceId - Failed invoice ID
 */
async function cancelSubscriptionDueToPaymentFailure(subscriptionId, invoiceId) {
    try {
        console.log(`Cancelling subscription ${subscriptionId} due to payment failure`);

        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
            metadata: {
                cancellation_reason: 'payment_failed_max_retries',
                failed_invoice: invoiceId,
                cancelled_at: new Date().toISOString()
            }
        });

        // Cancel immediately
        await stripe.subscriptions.cancel(subscriptionId, {
            prorate: false
        });

        await logAudit({
            action: 'billing.subscription_cancelled_payment_failure',
            resourceType: 'subscription',
            resourceId: subscriptionId,
            tenantId: subscription.metadata?.tenantId || 'unknown',
            metadata: {
                reason: 'payment_failed_max_retries',
                failed_invoice: invoiceId,
                customer: subscription.customer
            },
            severity: 'critical'
        });

        return subscription;
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw error;
    }
}

/**
 * Suspend subscription service (soft cancel)
 * @param {string} subscriptionId - Stripe subscription ID
 */
async function suspendSubscriptionService(subscriptionId) {
    try {
        console.log(`Suspending service for subscription ${subscriptionId}`);

        await stripe.subscriptions.update(subscriptionId, {
            metadata: {
                service_status: 'suspended',
                suspended_at: new Date().toISOString(),
                suspension_reason: 'payment_grace_period_expired'
            }
        });

        await logAudit({
            action: 'billing.service_suspended',
            resourceType: 'subscription',
            resourceId: subscriptionId,
            tenantId: 'unknown',
            metadata: {
                reason: 'payment_grace_period_expired',
                suspended_at: new Date().toISOString()
            },
            severity: 'high'
        });
    } catch (error) {
        console.error('Error suspending subscription:', error);
        throw error;
    }
}

/**
 * Send dunning email notification
 * @param {string} customerId - Stripe customer ID
 * @param {string} type - 'retry' or 'cancellation'
 * @param {Object} data - Email context data
 */
async function sendDunningEmail(customerId, type, data) {
    try {
        const customer = await stripe.customers.retrieve(customerId);
        
        console.log(`Sending ${type} dunning email to ${customer.email}`);

        // TODO: Integrate with email service
        // For now, just log the notification
        await logAudit({
            action: `billing.dunning_email_${type}`,
            resourceType: 'customer',
            resourceId: customerId,
            tenantId: data.tenantId || 'unknown',
            metadata: {
                email: customer.email,
                type,
                ...data
            },
            severity: type === 'cancellation' ? 'critical' : 'medium'
        });

        // Placeholder for email service integration
        // await emailService.sendDunningEmail(customer.email, type, data);
    } catch (error) {
        console.error('Error sending dunning email:', error);
        // Don't throw - email failure shouldn't block retry logic
    }
}

/**
 * Get retry status for a subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} Retry status information
 */
export async function getRetryStatus(subscriptionId) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        return {
            subscriptionId,
            retryCount: parseInt(subscription.metadata?.retry_count || '0'),
            nextRetryDate: subscription.metadata?.next_retry_date || null,
            gracePeriod: subscription.metadata?.grace_period === 'true',
            serviceStatus: subscription.metadata?.service_status || 'active',
            lastFailedInvoice: subscription.metadata?.last_failed_invoice || null
        };
    } catch (error) {
        console.error('Error getting retry status:', error);
        throw error;
    }
}

/**
 * Reset retry counter after successful payment
 * @param {string} subscriptionId - Stripe subscription ID
 */
export async function resetRetryCounter(subscriptionId) {
    try {
        await stripe.subscriptions.update(subscriptionId, {
            metadata: {
                retry_count: '0',
                next_retry_date: '',
                grace_period: 'true',
                service_status: 'active',
                last_failed_invoice: '',
                last_successful_payment: new Date().toISOString()
            }
        });

        await logAudit({
            action: 'billing.retry_counter_reset',
            resourceType: 'subscription',
            resourceId: subscriptionId,
            tenantId: 'unknown',
            metadata: {
                reset_at: new Date().toISOString()
            },
            severity: 'low'
        });

        console.log(`Retry counter reset for subscription ${subscriptionId}`);
    } catch (error) {
        console.error('Error resetting retry counter:', error);
        throw error;
    }
}

export default {
    schedulePaymentRetry,
    retryInvoicePayment,
    updatePaymentMethodAndRetry,
    getRetryStatus,
    resetRetryCounter,
    RETRY_CONFIG
};
