import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { emailTemplateService } from './emailTemplateService';
import env from '../config/environment';

export interface TenantTrial extends RecordModel {
    tenantId: string;
    tenantName: string;
    adminEmail: string;
    planName: string;
    trialStartDate: string;
    trialEndDate: string;
    status: 'active' | 'expiring_soon' | 'expired' | 'converted' | 'cancelled';
    remindersSent: string[]; // Array of reminder types sent: ['7day', '1day']
    conversionDate?: string;
    subscriptionId?: string;
}

export interface TrialAutomationStats {
    activeTrials: number;
    expiringSoon: number; // Within 7 days
    expiringToday: number;
    converted: number;
    conversionRate: number;
    averageConversionTime: number; // days
}

export interface TrialAutomationJob {
    id: string;
    type: '7day_reminder' | '1day_reminder' | 'expiration_check' | 'suspension' | 'conversion_check';
    status: 'pending' | 'running' | 'completed' | 'failed';
    scheduledFor: string;
    executedAt?: string;
    error?: string;
    tenantsProcessed: number;
    emailsSent: number;
}

export const trialAutomationService = {
    /**
     * Get all active trials
     */
    async getActiveTrials(): Promise<TenantTrial[]> {
        try {
            return await pb.collection('tenant_trials').getFullList<TenantTrial>({
                filter: 'status = "active" || status = "expiring_soon"',
                sort: 'trialEndDate',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching active trials:', error);
            return [];
        }
    },

    /**
     * Get trials ending in N days
     */
    async getTrialsEndingIn(days: number): Promise<TenantTrial[]> {
        try {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + days);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            const trials = await this.getActiveTrials();
            return trials.filter(trial => {
                const endDate = new Date(trial.trialEndDate).toISOString().split('T')[0];
                return endDate === targetDateStr;
            });
        } catch (error) {
            console.error(`Error fetching trials ending in ${days} days:`, error);
            return [];
        }
    },

    /**
     * Get trial statistics
     */
    async getTrialStats(): Promise<TrialAutomationStats> {
        try {
            const allTrials = await pb.collection('tenant_trials').getFullList<TenantTrial>({
                requestKey: null
            });

            const now = new Date();
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

            const activeTrials = allTrials.filter(t => t.status === 'active' || t.status === 'expiring_soon');
            const converted = allTrials.filter(t => t.status === 'converted');
            
            const expiringSoon = activeTrials.filter(t => {
                const endDate = new Date(t.trialEndDate);
                return endDate <= sevenDaysFromNow && endDate > now;
            });

            const expiringToday = activeTrials.filter(t => {
                const endDate = new Date(t.trialEndDate);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return endDate <= today && endDate > now;
            });

            // Calculate conversion rate
            const totalTrials = allTrials.length;
            const conversionRate = totalTrials > 0 ? (converted.length / totalTrials) * 100 : 0;

            // Calculate average conversion time
            let totalConversionDays = 0;
            converted.forEach(trial => {
                if (trial.conversionDate) {
                    const startDate = new Date(trial.trialStartDate);
                    const convDate = new Date(trial.conversionDate);
                    const daysDiff = Math.floor((convDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    totalConversionDays += daysDiff;
                }
            });
            const averageConversionTime = converted.length > 0 ? totalConversionDays / converted.length : 0;

            return {
                activeTrials: activeTrials.length,
                expiringSoon: expiringSoon.length,
                expiringToday: expiringToday.length,
                converted: converted.length,
                conversionRate: Math.round(conversionRate * 10) / 10,
                averageConversionTime: Math.round(averageConversionTime)
            };
        } catch (error) {
            console.error('Error calculating trial stats:', error);
            return {
                activeTrials: 0,
                expiringSoon: 0,
                expiringToday: 0,
                converted: 0,
                conversionRate: 0,
                averageConversionTime: 0
            };
        }
    },

    /**
     * Send 7-day trial reminder
     */
    async send7DayReminder(trial: TenantTrial): Promise<boolean> {
        try {
            // Check if reminder already sent
            if (trial.remindersSent.includes('7day')) {
                console.log(`7-day reminder already sent for ${trial.tenantName}`);
                return false;
            }

            const variables = {
                tenantName: trial.tenantName,
                planName: trial.planName,
                trialEndDate: new Date(trial.trialEndDate).toLocaleDateString(),
                userCount: String(await this.getTenantUserCount(trial.tenantId)),
                courseCount: String(await this.getTenantCourseCount(trial.tenantId)),
                upgradeUrl: `${env.get('appUrl')}/billing/upgrade?tenant=${trial.tenantId}`,
                supportEmail: 'support@growyourneed.com'
            };

            const result = await emailTemplateService.sendTemplateEmail(
                'trial_7day_reminder',
                { email: trial.adminEmail, name: trial.tenantName },
                variables
            );

            if (result.success) {
                // Update trial with reminder sent
                await pb.collection('tenant_trials').update(trial.id, {
                    remindersSent: [...trial.remindersSent, '7day'],
                    status: 'expiring_soon'
                });
                console.log(`✓ Sent 7-day reminder to ${trial.tenantName}`);
                return true;
            } else {
                console.error(`Failed to send 7-day reminder to ${trial.tenantName}:`, result.error);
                return false;
            }
        } catch (error) {
            console.error('Error sending 7-day reminder:', error);
            return false;
        }
    },

    /**
     * Send 1-day trial reminder (last chance)
     */
    async send1DayReminder(trial: TenantTrial): Promise<boolean> {
        try {
            // Check if reminder already sent
            if (trial.remindersSent.includes('1day')) {
                console.log(`1-day reminder already sent for ${trial.tenantName}`);
                return false;
            }

            const variables = {
                tenantName: trial.tenantName,
                planName: trial.planName,
                upgradeUrl: `${env.get('appUrl')}/billing/upgrade?tenant=${trial.tenantId}`,
                supportEmail: 'support@growyourneed.com'
            };

            const result = await emailTemplateService.sendTemplateEmail(
                'trial_last_day',
                { email: trial.adminEmail, name: trial.tenantName },
                variables
            );

            if (result.success) {
                // Update trial with reminder sent
                await pb.collection('tenant_trials').update(trial.id, {
                    remindersSent: [...trial.remindersSent, '1day']
                });
                console.log(`✓ Sent 1-day reminder to ${trial.tenantName}`);
                return true;
            } else {
                console.error(`Failed to send 1-day reminder to ${trial.tenantName}:`, result.error);
                return false;
            }
        } catch (error) {
            console.error('Error sending 1-day reminder:', error);
            return false;
        }
    },

    /**
     * Suspend expired trial
     */
    async suspendExpiredTrial(trial: TenantTrial): Promise<boolean> {
        try {
            // Update tenant status to suspended
            await pb.collection('tenants').update(trial.tenantId, {
                status: 'suspended',
                suspendedAt: new Date().toISOString(),
                suspensionReason: 'Trial expired'
            });

            // Update trial status
            await pb.collection('tenant_trials').update(trial.id, {
                status: 'expired'
            });

            // Send suspension email
            const variables = {
                tenantName: trial.tenantName,
                planName: trial.planName,
                gracePeriodDays: '30',
                upgradeUrl: `${env.get('appUrl')}/billing/upgrade?tenant=${trial.tenantId}`,
                supportEmail: 'support@growyourneed.com'
            };

            await emailTemplateService.sendTemplateEmail(
                'trial_expired',
                { email: trial.adminEmail, name: trial.tenantName },
                variables
            );

            console.log(`✓ Suspended expired trial for ${trial.tenantName}`);
            return true;
        } catch (error) {
            console.error('Error suspending expired trial:', error);
            return false;
        }
    },

    /**
     * Check for trial conversions (trial with active subscription)
     */
    async checkTrialConversion(trial: TenantTrial): Promise<boolean> {
        try {
            // Check if tenant has active subscription
            const tenant = await pb.collection('tenants').getOne(trial.tenantId);
            
            if (tenant.subscriptionStatus === 'active' && tenant.subscriptionId) {
                // Mark trial as converted
                await pb.collection('tenant_trials').update(trial.id, {
                    status: 'converted',
                    conversionDate: new Date().toISOString(),
                    subscriptionId: tenant.subscriptionId
                });

                console.log(`✓ Trial converted to paid subscription: ${trial.tenantName}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking trial conversion:', error);
            return false;
        }
    },

    /**
     * Run automated trial reminder job
     */
    async runTrialReminderJob(reminderType: '7day' | '1day'): Promise<TrialAutomationJob> {
        const jobId = `${reminderType}_${Date.now()}`;
        const job: TrialAutomationJob = {
            id: jobId,
            type: reminderType === '7day' ? '7day_reminder' : '1day_reminder',
            status: 'running',
            scheduledFor: new Date().toISOString(),
            tenantsProcessed: 0,
            emailsSent: 0
        };

        try {
            const daysUntilExpiry = reminderType === '7day' ? 7 : 1;
            const trials = await this.getTrialsEndingIn(daysUntilExpiry);

            console.log(`Running ${reminderType} reminder job for ${trials.length} trials`);

            for (const trial of trials) {
                job.tenantsProcessed++;
                
                const sent = reminderType === '7day' 
                    ? await this.send7DayReminder(trial)
                    : await this.send1DayReminder(trial);
                
                if (sent) {
                    job.emailsSent++;
                }
            }

            job.status = 'completed';
            job.executedAt = new Date().toISOString();
            
            console.log(`✓ ${reminderType} job completed: ${job.emailsSent}/${job.tenantsProcessed} emails sent`);
            
            return job;
        } catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            job.executedAt = new Date().toISOString();
            console.error(`${reminderType} job failed:`, error);
            return job;
        }
    },

    /**
     * Run trial expiration check job
     */
    async runTrialExpirationJob(): Promise<TrialAutomationJob> {
        const jobId = `expiration_${Date.now()}`;
        const job: TrialAutomationJob = {
            id: jobId,
            type: 'expiration_check',
            status: 'running',
            scheduledFor: new Date().toISOString(),
            tenantsProcessed: 0,
            emailsSent: 0
        };

        try {
            const activeTrials = await this.getActiveTrials();
            const now = new Date();

            const expiredTrials = activeTrials.filter(trial => {
                return new Date(trial.trialEndDate) <= now;
            });

            console.log(`Running expiration check for ${expiredTrials.length} expired trials`);

            for (const trial of expiredTrials) {
                job.tenantsProcessed++;
                const suspended = await this.suspendExpiredTrial(trial);
                if (suspended) {
                    job.emailsSent++;
                }
            }

            job.status = 'completed';
            job.executedAt = new Date().toISOString();
            
            console.log(`✓ Expiration job completed: ${job.tenantsProcessed} trials processed`);
            
            return job;
        } catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            job.executedAt = new Date().toISOString();
            console.error('Expiration job failed:', error);
            return job;
        }
    },

    /**
     * Run trial conversion check job
     */
    async runConversionCheckJob(): Promise<TrialAutomationJob> {
        const jobId = `conversion_${Date.now()}`;
        const job: TrialAutomationJob = {
            id: jobId,
            type: 'conversion_check',
            status: 'running',
            scheduledFor: new Date().toISOString(),
            tenantsProcessed: 0,
            emailsSent: 0
        };

        try {
            const activeTrials = await this.getActiveTrials();

            console.log(`Running conversion check for ${activeTrials.length} trials`);

            let conversions = 0;
            for (const trial of activeTrials) {
                job.tenantsProcessed++;
                const converted = await this.checkTrialConversion(trial);
                if (converted) {
                    conversions++;
                }
            }

            job.status = 'completed';
            job.executedAt = new Date().toISOString();
            
            console.log(`✓ Conversion check completed: ${conversions} trials converted`);
            
            return job;
        } catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            job.executedAt = new Date().toISOString();
            console.error('Conversion check job failed:', error);
            return job;
        }
    },

    /**
     * Get tenant user count
     */
    async getTenantUserCount(tenantId: string): Promise<number> {
        try {
            const result = await pb.collection('users').getList(1, 1, {
                filter: `tenantId = "${tenantId}"`
            });
            return result.totalItems;
        } catch (error) {
            console.warn('Failed to get tenant user count:', error);
            return 0;
        }
    },

    /**
     * Get tenant course count
     */
    async getTenantCourseCount(tenantId: string): Promise<number> {
        try {
            const result = await pb.collection('courses').getList(1, 1, {
                filter: `tenantId = "${tenantId}"`
            });
            return result.totalItems;
        } catch (error) {
            console.warn('Failed to get tenant course count:', error);
            return 0;
        }
    }
};
