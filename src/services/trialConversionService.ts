import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { emailSendingService } from './emailSendingService';

export interface Tenant extends RecordModel {
  name: string;
  subdomain: string;
  admin_email: string;
  admin_name: string;
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';
  trial_end_date?: string;
  subscription_plan?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
}

export interface TrialConversionMetrics {
  trialsActive: number;
  trialsEndingIn7Days: number;
  trialsEndingToday: number;
  trialsExpired: number;
  conversionRate: number;
  totalConverted: number;
}

/**
 * Trial Conversion Automation Service
 * Handles automated trial lifecycle management
 * - Reminder emails (7 days before expiry)
 * - Final notice emails (day of expiry)
 * - Account suspension on expiry
 * - Conversion tracking
 */
export const trialConversionService = {
  /**
   * Get all tenants with active trials
   */
  async getActiveTrials(): Promise<Tenant[]> {
    try {
      return await pb.collection('tenants').getFullList<Tenant>({
        filter: 'subscription_status = "trial"',
        sort: 'trial_end_date',
        requestKey: null,
      });
    } catch (error) {
      console.error('Error fetching active trials:', error);
      return [];
    }
  },

  /**
   * Get trials ending in N days
   */
  async getTrialsEndingIn(days: number): Promise<Tenant[]> {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      const trials = await this.getActiveTrials();

      return trials.filter((tenant) => {
        if (!tenant.trial_end_date) return false;
        const trialEndDate = tenant.trial_end_date.split('T')[0];
        return trialEndDate === targetDateStr;
      });
    } catch (error) {
      console.error(`Error fetching trials ending in ${days} days:`, error);
      return [];
    }
  },

  /**
   * Get expired trials that need suspension
   */
  async getExpiredTrials(): Promise<Tenant[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const trials = await this.getActiveTrials();

      return trials.filter((tenant) => {
        if (!tenant.trial_end_date) return false;
        const trialEndDate = tenant.trial_end_date.split('T')[0];
        return trialEndDate < today;
      });
    } catch (error) {
      console.error('Error fetching expired trials:', error);
      return [];
    }
  },

  /**
   * Send reminder email to trial ending in 7 days
   */
  async sendTrialReminder(tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);

      if (!tenant.trial_end_date) {
        return { success: false, error: 'No trial end date found' };
      }

      const daysRemaining = Math.ceil(
        (new Date(tenant.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const result = await emailSendingService.sendTrialReminderEmail(
        tenant.name,
        tenant.admin_email,
        tenant.id,
        tenant.admin_name || 'Admin',
        daysRemaining
      );

      if (result.success) {
        // Log reminder sent
        try {
          await pb.collection('tenant_activity_logs').create({
            tenant_id: tenantId,
            activity_type: 'trial_reminder_sent',
            metadata: {
              days_remaining: daysRemaining,
              sent_at: new Date().toISOString(),
            },
          });
        } catch (logError) {
          console.warn('Failed to log trial reminder:', logError);
        }
      }

      return result;
    } catch (error) {
      console.error('Error sending trial reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Send final notice email (trial expires today)
   */
  async sendFinalNotice(tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);

      const result = await emailSendingService.sendTrialReminderEmail(
        tenant.name,
        tenant.admin_email,
        tenant.id,
        tenant.admin_name || 'Admin',
        0 // 0 days remaining
      );

      if (result.success) {
        await pb.collection('tenant_activity_logs').create({
          tenant_id: tenantId,
          activity_type: 'trial_final_notice_sent',
          metadata: {
            sent_at: new Date().toISOString(),
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Error sending final notice:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Suspend expired trial tenant
   */
  async suspendExpiredTrial(tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);

      // Update tenant status
      await pb.collection('tenants').update(tenantId, {
        subscription_status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: 'trial_expired',
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
        tenant_id: tenantId,
        activity_type: 'trial_suspended',
        metadata: {
          suspended_at: new Date().toISOString(),
          reason: 'trial_expired',
        },
      });

      console.log(`✓ Suspended expired trial for tenant: ${tenant.name}`);
      return { success: true };
    } catch (error) {
      console.error('Error suspending tenant:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Process trial reminder workflow
   * Called by scheduler job
   */
  async processTrialReminders(): Promise<{ processed: number; successful: number; failed: number }> {
    try {
      const trialsEndingIn7Days = await this.getTrialsEndingIn(7);
      let successful = 0;
      let failed = 0;

      console.log(`Processing ${trialsEndingIn7Days.length} trial reminders (7 days)...`);

      for (const tenant of trialsEndingIn7Days) {
        // Check if reminder already sent today
        const today = new Date().toISOString().split('T')[0];
        try {
          const existingReminders = await pb.collection('tenant_activity_logs').getFullList({
            filter: `tenant_id = "${tenant.id}" && activity_type = "trial_reminder_sent" && created >= "${today}"`,
            requestKey: null,
          });

          if (existingReminders.length > 0) {
            console.log(`Skipping ${tenant.name} - reminder already sent today`);
            continue;
          }
        } catch (checkError) {
          console.warn('Failed to check existing reminders:', checkError);
        }

        const result = await this.sendTrialReminder(tenant.id);
        if (result.success) {
          successful++;
        } else {
          failed++;
          console.error(`Failed to send reminder to ${tenant.name}:`, result.error);
        }

        // Rate limiting - wait 1 second between emails
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return { processed: trialsEndingIn7Days.length, successful, failed };
    } catch (error) {
      console.error('Error processing trial reminders:', error);
      return { processed: 0, successful: 0, failed: 0 };
    }
  },

  /**
   * Process final notices for trials expiring today
   * Called by scheduler job
   */
  async processFinalNotices(): Promise<{ processed: number; successful: number; failed: number }> {
    try {
      const trialsEndingToday = await this.getTrialsEndingIn(0);
      let successful = 0;
      let failed = 0;

      console.log(`Processing ${trialsEndingToday.length} final notices...`);

      for (const tenant of trialsEndingToday) {
        const result = await this.sendFinalNotice(tenant.id);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return { processed: trialsEndingToday.length, successful, failed };
    } catch (error) {
      console.error('Error processing final notices:', error);
      return { processed: 0, successful: 0, failed: 0 };
    }
  },

  /**
   * Process trial expirations and suspend accounts
   * Called by scheduler job
   */
  async processTrialExpirations(): Promise<{ processed: number; successful: number; failed: number }> {
    try {
      const expiredTrials = await this.getExpiredTrials();
      let successful = 0;
      let failed = 0;

      console.log(`Processing ${expiredTrials.length} trial expirations...`);

      for (const tenant of expiredTrials) {
        const result = await this.suspendExpiredTrial(tenant.id);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      return { processed: expiredTrials.length, successful, failed };
    } catch (error) {
      console.error('Error processing trial expirations:', error);
      return { processed: 0, successful: 0, failed: 0 };
    }
  },

  /**
   * Get trial conversion metrics
   */
  async getTrialMetrics(): Promise<TrialConversionMetrics> {
    try {
      const activeTrials = await this.getActiveTrials();
      const trialsEndingIn7Days = await this.getTrialsEndingIn(7);
      const trialsEndingToday = await this.getTrialsEndingIn(0);
      const expiredTrials = await this.getExpiredTrials();

      // Calculate conversion rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      const recentlyConverted = await pb.collection('tenants').getFullList({
        filter: `subscription_status = "active" && trial_end_date != "" && updated >= "${thirtyDaysAgoStr}"`,
        requestKey: null,
      });

      const recentTrials = await pb.collection('tenants').getFullList({
        filter: `trial_end_date != "" && created >= "${thirtyDaysAgoStr}"`,
        requestKey: null,
      });

      const conversionRate = recentTrials.length > 0 ? (recentlyConverted.length / recentTrials.length) * 100 : 0;

      return {
        trialsActive: activeTrials.length,
        trialsEndingIn7Days: trialsEndingIn7Days.length,
        trialsEndingToday: trialsEndingToday.length,
        trialsExpired: expiredTrials.length,
        conversionRate: Math.round(conversionRate * 10) / 10,
        totalConverted: recentlyConverted.length,
      };
    } catch (error) {
      console.error('Error fetching trial metrics:', error);
      return {
        trialsActive: 0,
        trialsEndingIn7Days: 0,
        trialsEndingToday: 0,
        trialsExpired: 0,
        conversionRate: 0,
        totalConverted: 0,
      };
    }
  },

  /**
   * Manual trigger for trial conversion workflow
   * Used for testing or manual processing
   */
  async runFullWorkflow(): Promise<{
    reminders: { processed: number; successful: number; failed: number };
    finalNotices: { processed: number; successful: number; failed: number };
    expirations: { processed: number; successful: number; failed: number };
  }> {
    console.log('🔄 Starting trial conversion workflow...');

    const reminders = await this.processTrialReminders();
    console.log(`✓ Reminders: ${reminders.successful}/${reminders.processed} sent successfully`);

    const finalNotices = await this.processFinalNotices();
    console.log(`✓ Final notices: ${finalNotices.successful}/${finalNotices.processed} sent successfully`);

    const expirations = await this.processTrialExpirations();
    console.log(`✓ Expirations: ${expirations.successful}/${expirations.processed} processed successfully`);

    return { reminders, finalNotices, expirations };
  },
};
