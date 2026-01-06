import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { emailTemplateService } from './emailTemplateService';
import { emailSendingService } from './emailSendingService';
import env from '../config/environment';

export interface PaymentAttempt extends RecordModel {
  tenant_id: string;
  stripe_payment_intent_id: string;
  attempt_number: number;
  status: 'pending' | 'success' | 'failed' | 'retry';
  error_code?: string;
  error_message?: string;
  next_retry_date?: string;
  attempted_at: string;
}

export interface Tenant extends RecordModel {
  name: string;
  admin_email: string;
  admin_name: string;
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  payment_grace_period_end?: string;
}

/**
 * Failed Payment Dunning Service
 * Progressive email workflow for payment recovery
 * - 1st failure: Friendly reminder
 * - 2nd failure: Urgent notice
 * - 3rd failure: Final warning + account suspension notice
 * - After 3 failures: Suspend account
 */
export const paymentDunningService = {
  /**
   * Record a failed payment attempt
   */
  async recordFailedPayment(
    tenantId: string,
    paymentIntentId: string,
    errorCode?: string,
    errorMessage?: string
  ): Promise<{ attemptNumber: number; nextRetryDate: string | null }> {
    try {
      // Get previous attempts
      const previousAttempts = await pb.collection('payment_attempts').getFullList<PaymentAttempt>({
        filter: `tenant_id = "${tenantId}" && stripe_payment_intent_id = "${paymentIntentId}"`,
        sort: '-attempt_number',
        requestKey: null,
      });

      const attemptNumber = previousAttempts.length + 1;

      // Calculate next retry date (2 days after each failure)
      const nextRetryDate = attemptNumber < 3 ? this.calculateNextRetryDate(attemptNumber) : null;

      // Create payment attempt record
      await pb.collection('payment_attempts').create({
        tenant_id: tenantId,
        stripe_payment_intent_id: paymentIntentId,
        attempt_number: attemptNumber,
        status: 'failed',
        error_code: errorCode,
        error_message: errorMessage,
        next_retry_date: nextRetryDate,
        attempted_at: new Date().toISOString(),
      });

      console.log(`💳 Failed payment recorded for tenant ${tenantId} (attempt ${attemptNumber}/3)`);

      return { attemptNumber, nextRetryDate };
    } catch (error) {
      console.error('Error recording failed payment:', error);
      throw error;
    }
  },

  /**
   * Calculate next retry date (2 days between retries)
   */
  calculateNextRetryDate(attemptNumber: number): string {
    const daysToAdd = attemptNumber * 2; // 2 days, 4 days, etc.
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate.toISOString();
  },

  /**
   * Send dunning email based on attempt number
   */
  async sendDunningEmail(
    tenantId: string,
    attemptNumber: number,
    nextRetryDate?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);

      // Determine failure reason based on error code
      const failureReason = this.getFailureReasonMessage(tenant);

      // Use built-in payment_failed template
      const variables = {
        tenantName: tenant.name,
        amount: await this.getPaymentAmount(tenantId),
        planName: await this.getTenantPlanName(tenantId),
        failureReason: failureReason || 'Payment method declined',
        updatePaymentUrl: `${env.get('frontendUrl')}/billing/payment-method?tenant=${tenantId}`,
        retryDays: '2',
        supportEmail: 'support@growyourneed.com'
      };

      const result = await emailTemplateService.sendTemplateEmail(
        'payment_failed',
        { email: tenant.admin_email, name: tenant.admin_name || tenant.name },
        variables
      );

      if (result.success) {
        // Log dunning email sent
        try {
          await pb.collection('tenant_activity_logs').create({
            tenant_id: tenantId,
            activity_type: 'dunning_email_sent',
            metadata: {
              attempt_number: attemptNumber,
              next_retry_date: nextRetryDate,
              sent_at: new Date().toISOString(),
            },
          });
        } catch (logError) {
          console.error('Failed to log dunning email:', logError);
        }
      }

      return result;
    } catch (error) {
      console.error('Error sending dunning email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Get user-friendly failure reason message
   */
  getFailureReasonMessage(tenant: Tenant): string {
    // Error code mapping to user-friendly messages
    const errorCodeMessages: Record<string, string> = {
      'card_declined': 'Your card was declined. Please try a different payment method.',
      'insufficient_funds': 'Insufficient funds. Please check your account balance.',
      'expired_card': 'Your card has expired. Please update your payment information.',
      'incorrect_cvc': 'Incorrect security code. Please check your card details.',
      'processing_error': 'Payment processing error. Please try again later.',
      'default': 'Payment failed. Please contact support if the issue persists.'
    };
    
    // Get error code from tenant metadata if available
    const errorCode = tenant.metadata?.lastPaymentError?.code || 'default';
    return errorCodeMessages[errorCode] || errorCodeMessages['default'];
  },

  /**
   * Process failed payment workflow
   * Called after payment failure detected
   */
  async processFailedPayment(
    tenantId: string,
    paymentIntentId: string,
    errorCode?: string,
    errorMessage?: string
  ): Promise<{ success: boolean; attemptNumber: number; action: string }> {
    try {
      // Record the failed payment
      const { attemptNumber, nextRetryDate } = await this.recordFailedPayment(
        tenantId,
        paymentIntentId,
        errorCode,
        errorMessage
      );

      // Send appropriate dunning email
      await this.sendDunningEmail(tenantId, attemptNumber, nextRetryDate);

      // Take action based on attempt number
      if (attemptNumber >= 3) {
        // Final failure - initiate grace period
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // 7-day grace period

        await pb.collection('tenants').update(tenantId, {
          subscription_status: 'past_due',
          payment_grace_period_end: gracePeriodEnd.toISOString(),
        });

        // Log grace period started
        await pb.collection('tenant_activity_logs').create({
          tenant_id: tenantId,
          activity_type: 'payment_grace_period_started',
          metadata: {
            grace_period_end: gracePeriodEnd.toISOString(),
            final_attempt: attemptNumber,
          },
        });

        console.log(`⚠️ Tenant ${tenantId} entered 7-day grace period after ${attemptNumber} failed attempts`);

        return { success: true, attemptNumber, action: 'grace_period_started' };
      }

      console.log(`📧 Dunning email sent to tenant ${tenantId} (attempt ${attemptNumber}/3)`);

      return { success: true, attemptNumber, action: 'dunning_email_sent' };
    } catch (error) {
      console.error('Error processing failed payment:', error);
      return {
        success: false,
        attemptNumber: 0,
        action: 'error',
      };
    }
  },

  /**
   * Suspend accounts with expired grace periods
   */
  async suspendExpiredGracePeriods(): Promise<{ processed: number; suspended: number }> {
    try {
      const today = new Date().toISOString();

      // Find tenants with expired grace periods
      const tenantsToSuspend = await pb.collection('tenants').getFullList<Tenant>({
        filter: `subscription_status = "past_due" && payment_grace_period_end < "${today}"`,
        requestKey: null,
      });

      let suspended = 0;

      for (const tenant of tenantsToSuspend) {
        try {
          // Update status to suspended
          await pb.collection('tenants').update(tenant.id, {
            subscription_status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspension_reason: 'payment_failure',
          });

          // Send suspension email
          await emailSendingService.sendTrialExpiredEmail(
            tenant.name,
            tenant.admin_email,
            tenant.id,
            tenant.admin_name || 'Admin'
          );

          // Log suspension
          await pb.collection('tenant_activity_logs').create({
            tenant_id: tenant.id,
            activity_type: 'account_suspended',
            metadata: {
              reason: 'payment_failure_grace_period_expired',
              suspended_at: new Date().toISOString(),
            },
          });

          suspended++;
          console.log(`🔒 Suspended tenant ${tenant.name} due to payment failure`);
        } catch (error) {
          console.error(`Failed to suspend tenant ${tenant.id}:`, error);
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return { processed: tenantsToSuspend.length, suspended };
    } catch (error) {
      console.error('Error suspending expired grace periods:', error);
      return { processed: 0, suspended: 0 };
    }
  },

  /**
   * Reactivate account after successful payment
   */
  async reactivateAccount(tenantId: string): Promise<{ success: boolean }> {
    try {
      const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);

      // Update status to active
      await pb.collection('tenants').update(tenantId, {
        subscription_status: 'active',
        payment_grace_period_end: null,
        suspended_at: null,
        suspension_reason: null,
      });

      // Clear failed payment attempts
      const failedAttempts = await pb.collection('payment_attempts').getFullList({
        filter: `tenant_id = "${tenantId}" && status = "failed"`,
        requestKey: null,
      });

      for (const attempt of failedAttempts) {
        await pb.collection('payment_attempts').update(attempt.id, { status: 'success' });
      }

      // Send reactivation email
      await emailSendingService.sendAccountReactivatedEmail(
        tenant.name,
        tenant.admin_email,
        tenant.id,
        tenant.admin_name || 'Admin'
      );

      // Log reactivation
      await pb.collection('tenant_activity_logs').create({
        tenant_id: tenantId,
        activity_type: 'account_reactivated',
        metadata: {
          reactivated_at: new Date().toISOString(),
          reason: 'payment_successful',
        },
      });

      console.log(`✅ Reactivated tenant ${tenant.name} after successful payment`);

      return { success: true };
    } catch (error) {
      console.error('Error reactivating account:', error);
      return { success: false };
    }
  },

  /**
   * Get payment failure metrics
   */
  async getFailureMetrics(): Promise<{
    totalFailed: number;
    inGracePeriod: number;
    suspended: number;
    recentFailures: number;
  }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();

      const [failedPayments, gracePeriodTenants, suspendedTenants, recentFailures] = await Promise.all([
        pb.collection('payment_attempts').getFullList({
          filter: 'status = "failed"',
          requestKey: null,
        }),
        pb.collection('tenants').getFullList({
          filter: 'subscription_status = "past_due"',
          requestKey: null,
        }),
        pb.collection('tenants').getFullList({
          filter: 'subscription_status = "suspended" && suspension_reason = "payment_failure"',
          requestKey: null,
        }),
        pb.collection('payment_attempts').getFullList({
          filter: `status = "failed" && attempted_at >= "${sevenDaysAgoStr}"`,
          requestKey: null,
        }),
      ]);

      return {
        totalFailed: failedPayments.length,
        inGracePeriod: gracePeriodTenants.length,
        suspended: suspendedTenants.length,
        recentFailures: recentFailures.length,
      };
    } catch (error) {
      console.error('Error fetching failure metrics:', error);
      return {
        totalFailed: 0,
        inGracePeriod: 0,
        suspended: 0,
        recentFailures: 0,
      };
    }
  },

  /**
   * Process all scheduled dunning tasks
   * Called by scheduler
   */
  async runDunningWorkflow(): Promise<{
    gracePeriods: { processed: number; suspended: number };
  }> {
    console.log('💳 Starting payment dunning workflow...');

    const gracePeriods = await this.suspendExpiredGracePeriods();
    console.log(`✓ Grace periods: ${gracePeriods.suspended}/${gracePeriods.processed} suspended`);

    return { gracePeriods };
  },

  /**
   * Get payment amount for tenant
   */
  async getPaymentAmount(tenantId: string): Promise<string> {
    try {
      const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);
      // Get plan pricing
      const planPrices: Record<string, number> = {
        'free': 0,
        'starter': 29,
        'pro': 99,
        'enterprise': 299
      };
      const amount = planPrices[tenant.plan.toLowerCase()] || 99;
      return `$${amount}.00`;
    } catch (error) {
      console.warn('Failed to get payment amount:', error);
      return '$99.00';
    }
  },

  /**
   * Get tenant plan name
   */
  async getTenantPlanName(tenantId: string): Promise<string> {
    try {
      const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);
      return tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1);
    } catch (error) {
      console.warn('Failed to get tenant plan name:', error);
      return 'Premium';
    }
  },
};
