import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';

export interface EmailTemplate extends RecordModel {
    name: string;
    subject: string;
    content: string; // HTML content
    category: 'Marketing' | 'Transactional' | 'Notification' | 'Newsletter';
    variables: string[]; // e.g. ['{{name}}', '{{company}}']
    thumbnail?: string;
    is_active: boolean;
}

export interface EmailSendRequest {
    to: { email: string; name?: string };
    subject: string;
    html: string;
    text?: string;
    from?: { email: string; name?: string };
    templateId?: string;
    variables?: Record<string, string>;
}

export interface EmailSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export const emailTemplateService = {
    async getTemplates(category?: string) {
        try {
            const filter = category ? `category = "${category}"` : '';
            return await pb.collection('email_templates').getFullList<EmailTemplate>({
                filter,
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching templates:', error);
            // Mock data
            return [
                { id: '1', name: 'Welcome Email', subject: 'Welcome to Grow Your Need!', content: '<h1>Welcome {{name}}!</h1><p>Thanks for joining.</p>', category: 'Transactional', variables: ['{{name}}'], created: new Date().toISOString(), updated: new Date().toISOString(), collectionId: '', collectionName: '', is_active: true },
                { id: '2', name: 'Monthly Newsletter', subject: 'Your Monthly Update', content: '<h1>Updates for {{month}}</h1>', category: 'Newsletter', variables: ['{{month}}'], created: new Date().toISOString(), updated: new Date().toISOString(), collectionId: '', collectionName: '', is_active: true },
                { id: '3', name: 'Sale Announcement', subject: 'Big Sale!', content: '<h1>50% Off!</h1>', category: 'Marketing', variables: [], created: new Date().toISOString(), updated: new Date().toISOString(), collectionId: '', collectionName: '', is_active: true },
            ] as EmailTemplate[];
        }
    },

    async createTemplate(data: Partial<EmailTemplate>) {
        return await pb.collection('email_templates').create(data);
    },

    async updateTemplate(id: string, data: Partial<EmailTemplate>) {
        return await pb.collection('email_templates').update(id, data);
    },

    async deleteTemplate(id: string) {
        return await pb.collection('email_templates').delete(id);
    },

    // Render template with variables
    renderTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; html: string } {
        let subject = template.subject;
        let html = template.content;

        // Replace all variables
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            subject = subject.replace(new RegExp(placeholder, 'g'), value);
            html = html.replace(new RegExp(placeholder, 'g'), value);
        });

        return { subject, html };
    },

    // Send email via server endpoint
    async sendEmail(request: EmailSendRequest): Promise<EmailSendResult> {
        try {
            const serverUrl = 'http://localhost:3002'; // Payment server endpoint
            
            const response = await fetch(`${serverUrl}/api/email/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.error || 'Failed to send email' };
            }

            const result = await response.json();
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Email send error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    },

    // Send email using template
    async sendTemplateEmail(
        templateId: string,
        to: { email: string; name?: string },
        variables: Record<string, string>,
        from?: { email: string; name?: string }
    ): Promise<EmailSendResult> {
        try {
            // Try to get template from database
            let template: EmailTemplate;
            try {
                template = await pb.collection('email_templates').getOne<EmailTemplate>(templateId);
            } catch {
                // Fall back to built-in templates
                const builtInTemplates = this.getBuiltInTemplates();
                template = builtInTemplates[templateId];
                if (!template) {
                    throw new Error(`Template ${templateId} not found`);
                }
            }

            const { subject, html } = this.renderTemplate(template, variables);

            return await this.sendEmail({
                to,
                subject,
                html,
                from,
                templateId,
                variables
            });
        } catch (error) {
            console.error('Template email error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to send template email' };
        }
    },

    // Built-in templates for trial automation
    getBuiltInTemplates(): Record<string, EmailTemplate> {
        return {
            trial_welcome: {
                id: 'trial_welcome',
                name: 'Trial Welcome',
                subject: 'Welcome to Your {{planName}} Trial!',
                content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #2563eb;">Welcome {{tenantName}}! 🎉</h1>
                        <p>Your {{planName}} trial has been activated and will run until {{trialEndDate}}.</p>
                        <p><strong>What's included:</strong></p>
                        <ul>
                            <li>Full access to all {{planName}} features</li>
                            <li>{{userLimit}} user accounts</li>
                            <li>{{storageLimit}} storage</li>
                            <li>Priority support</li>
                        </ul>
                        <p>Get started by logging into your dashboard:</p>
                        <a href="{{dashboardUrl}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Go to Dashboard</a>
                        <p style="color: #6b7280; font-size: 14px;">Need help? Reply to this email or visit our <a href="{{supportUrl}}">support center</a>.</p>
                    </div>
                `,
                category: 'Transactional',
                variables: ['{{tenantName}}', '{{planName}}', '{{trialEndDate}}', '{{userLimit}}', '{{storageLimit}}', '{{dashboardUrl}}', '{{supportUrl}}'],
                is_active: true,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                collectionId: '',
                collectionName: ''
            },
            trial_7day_reminder: {
                id: 'trial_7day_reminder',
                name: 'Trial 7-Day Reminder',
                subject: '{{tenantName}} - Your trial ends in 7 days',
                content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #f59e0b;">Your Trial Ends Soon ⏰</h1>
                        <p>Hi {{tenantName}},</p>
                        <p>Your {{planName}} trial will expire on <strong>{{trialEndDate}}</strong> (7 days from now).</p>
                        <p><strong>Don't lose access to:</strong></p>
                        <ul>
                            <li>Your {{userCount}} active users</li>
                            <li>{{courseCount}} courses and materials</li>
                            <li>All student data and progress</li>
                        </ul>
                        <p>Upgrade now to keep everything running smoothly:</p>
                        <a href="{{upgradeUrl}}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Upgrade to {{planName}}</a>
                        <p style="color: #6b7280; font-size: 14px;">Questions? Contact us at {{supportEmail}}</p>
                    </div>
                `,
                category: 'Transactional',
                variables: ['{{tenantName}}', '{{planName}}', '{{trialEndDate}}', '{{userCount}}', '{{courseCount}}', '{{upgradeUrl}}', '{{supportEmail}}'],
                is_active: true,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                collectionId: '',
                collectionName: ''
            },
            trial_last_day: {
                id: 'trial_last_day',
                name: 'Trial Last Day',
                subject: '⚠️ {{tenantName}} - Final day of your trial',
                content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #dc2626;">Last Chance! ⚠️</h1>
                        <p>Hi {{tenantName}},</p>
                        <p>Your {{planName}} trial expires <strong>today at midnight</strong>.</p>
                        <p><strong>After expiration:</strong></p>
                        <ul style="color: #dc2626;">
                            <li>Your account will be suspended</li>
                            <li>Users won't be able to log in</li>
                            <li>Access to courses and materials will be blocked</li>
                        </ul>
                        <p>Upgrade now to avoid any interruption:</p>
                        <a href="{{upgradeUrl}}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">Upgrade Now</a>
                        <p>Or contact us for a custom plan: {{supportEmail}}</p>
                    </div>
                `,
                category: 'Transactional',
                variables: ['{{tenantName}}', '{{planName}}', '{{upgradeUrl}}', '{{supportEmail}}'],
                is_active: true,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                collectionId: '',
                collectionName: ''
            },
            trial_expired: {
                id: 'trial_expired',
                name: 'Trial Expired - Account Suspended',
                subject: '{{tenantName}} - Trial expired, account suspended',
                content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #991b1b;">Trial Expired</h1>
                        <p>Hi {{tenantName}},</p>
                        <p>Your {{planName}} trial has expired and your account has been suspended.</p>
                        <p><strong>Your data is safe!</strong> We'll keep it for {{gracePeriodDays}} days.</p>
                        <p>Reactivate anytime by upgrading:</p>
                        <a href="{{upgradeUrl}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reactivate Account</a>
                        <p style="color: #6b7280; font-size: 14px;">Need more time? Contact {{supportEmail}} for an extension.</p>
                    </div>
                `,
                category: 'Transactional',
                variables: ['{{tenantName}}', '{{planName}}', '{{gracePeriodDays}}', '{{upgradeUrl}}', '{{supportEmail}}'],
                is_active: true,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                collectionId: '',
                collectionName: ''
            },
            tenant_suspension: {
                id: 'tenant_suspension',
                name: 'Tenant Account Suspended',
                subject: '⚠️ {{tenantName}} - Account Suspended',
                content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #dc2626;">Account Suspended</h1>
                        <p>Hi {{tenantName}},</p>
                        <p>Your account has been suspended due to: <strong>{{suspensionReason}}</strong></p>
                        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 16px 0;">
                            <p style="margin: 0;"><strong>Reason Details:</strong></p>
                            <p style="margin: 8px 0 0 0;">{{reasonDetails}}</p>
                        </div>
                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>Review our Terms of Service</li>
                            <li>Contact support to resolve this issue</li>
                            <li>Provide any requested information</li>
                        </ul>
                        <a href="{{supportUrl}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Contact Support</a>
                        <p style="color: #6b7280; font-size: 14px;">Support Email: {{supportEmail}} | Support Hours: 24/7</p>
                    </div>
                `,
                category: 'Transactional',
                variables: ['{{tenantName}}', '{{suspensionReason}}', '{{reasonDetails}}', '{{supportUrl}}', '{{supportEmail}}'],
                is_active: true,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                collectionId: '',
                collectionName: ''
            },
            payment_failed: {
                id: 'payment_failed',
                name: 'Payment Failed - Action Required',
                subject: '⚠️ {{tenantName}} - Payment Failed',
                content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #f59e0b;">Payment Failed</h1>
                        <p>Hi {{tenantName}},</p>
                        <p>We couldn't process your payment for <strong>{{planName}}</strong>.</p>
                        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0;">
                            <p style="margin: 0;"><strong>Payment Details:</strong></p>
                            <p style="margin: 4px 0;">Amount: {{amount}} {{currency}}</p>
                            <p style="margin: 4px 0;">Payment Method: {{paymentMethod}}</p>
                            <p style="margin: 4px 0;">Error: {{errorMessage}}</p>
                        </div>
                        <p><strong>What happens next:</strong></p>
                        <ul>
                            <li>We'll retry in {{retryDays}} days</li>
                            <li>Update your payment method to avoid suspension</li>
                            <li>Contact us if you need help</li>
                        </ul>
                        <a href="{{updatePaymentUrl}}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Update Payment Method</a>
                        <p style="color: #6b7280; font-size: 14px;">Questions? Email {{supportEmail}}</p>
                    </div>
                `,
                category: 'Transactional',
                variables: ['{{tenantName}}', '{{planName}}', '{{amount}}', '{{currency}}', '{{paymentMethod}}', '{{errorMessage}}', '{{retryDays}}', '{{updatePaymentUrl}}', '{{supportEmail}}'],
                is_active: true,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                collectionId: '',
                collectionName: ''
            }
        };
    },

    // ========== AUTOMATED EMAIL FUNCTIONS ==========

    /**
     * Send welcome email to new tenant
     */
    async sendTenantWelcome(tenant: {
        name: string;
        admin_email: string;
        plan: string;
        trial_ends_at?: string;
        subdomain?: string;
    }): Promise<EmailSendResult> {
        const variables = {
            tenantName: tenant.name,
            planName: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1),
            trialEndDate: tenant.trial_ends_at 
                ? new Date(tenant.trial_ends_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })
                : 'N/A',
            userLimit: tenant.plan === 'enterprise' ? 'Unlimited' : tenant.plan === 'pro' ? '100' : '50',
            storageLimit: tenant.plan === 'enterprise' ? 'Unlimited' : tenant.plan === 'pro' ? '500GB' : '100GB',
            dashboardUrl: tenant.subdomain 
                ? `https://${tenant.subdomain}.growyourneed.com` 
                : 'https://app.growyourneed.com',
            supportUrl: 'https://support.growyourneed.com',
        };

        return await this.sendTemplateEmail(
            'trial_welcome',
            { email: tenant.admin_email, name: tenant.name },
            variables
        );
    },

    /**
     * Send trial expiration reminder (7 days before)
     */
    async sendTrialReminder(
        tenant: {
            id: string;
            name: string;
            admin_email: string;
            plan: string;
            trial_ends_at: string;
        },
        daysUntilExpiry: number
    ): Promise<EmailSendResult> {
        const templateId = daysUntilExpiry <= 1 ? 'trial_last_day' : 'trial_7day_reminder';

        // Get tenant stats from PocketBase
        let userCount = 25;
        let courseCount = 12;
        try {
            const [users, courses] = await Promise.all([
                pb.collection('users').getList(1, 1, { filter: `tenantId = "${tenant.id}"` }),
                pb.collection('courses').getList(1, 1, { filter: `tenantId = "${tenant.id}"` })
            ]);
            userCount = users.totalItems;
            courseCount = courses.totalItems;
        } catch (error) {
            console.warn('Failed to fetch tenant stats, using defaults:', error);
        }

        const variables = {
            tenantName: tenant.name,
            planName: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1),
            trialEndDate: new Date(tenant.trial_ends_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            userCount: String(userCount),
            courseCount: String(courseCount),
            upgradeUrl: `https://app.growyourneed.com/billing/upgrade?tenant=${tenant.id}`,
            supportEmail: 'support@growyourneed.com',
        };

        return await this.sendTemplateEmail(
            templateId,
            { email: tenant.admin_email, name: tenant.name },
            variables
        );
    },

    /**
     * Send trial expired notification
     */
    async sendTrialExpiredNotice(tenant: {
        name: string;
        admin_email: string;
        plan: string;
        id: string;
    }): Promise<EmailSendResult> {
        const variables = {
            tenantName: tenant.name,
            planName: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1),
            gracePeriodDays: '30',
            upgradeUrl: `https://app.growyourneed.com/billing/upgrade?tenant=${tenant.id}`,
            supportEmail: 'support@growyourneed.com',
        };

        return await this.sendTemplateEmail(
            'trial_expired',
            { email: tenant.admin_email, name: tenant.name },
            variables
        );
    },

    /**
     * Send suspension notification
     */
    async sendSuspensionNotice(
        tenant: {
            name: string;
            admin_email: string;
        },
        reason: string,
        details: string
    ): Promise<EmailSendResult> {
        const variables = {
            tenantName: tenant.name,
            suspensionReason: reason,
            reasonDetails: details,
            supportUrl: 'https://support.growyourneed.com/contact',
            supportEmail: 'support@growyourneed.com',
        };

        return await this.sendTemplateEmail(
            'tenant_suspension',
            { email: tenant.admin_email, name: tenant.name },
            variables
        );
    },

    /**
     * Send payment failure notification
     */
    async sendPaymentFailureNotice(
        tenant: {
            name: string;
            admin_email: string;
            plan: string;
            id: string;
        },
        failureDetails: {
            amount: number;
            currency: string;
            paymentMethod: string;
            errorMessage: string;
            retryDate: string;
        }
    ): Promise<EmailSendResult> {
        const variables = {
            tenantName: tenant.name,
            planName: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1),
            amount: (failureDetails.amount / 100).toFixed(2),
            currency: failureDetails.currency.toUpperCase(),
            paymentMethod: failureDetails.paymentMethod,
            errorMessage: failureDetails.errorMessage,
            retryDays: String(Math.ceil((new Date(failureDetails.retryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
            updatePaymentUrl: `https://app.growyourneed.com/billing/payment-methods?tenant=${tenant.id}`,
            supportEmail: 'support@growyourneed.com',
        };

        return await this.sendTemplateEmail(
            'payment_failed',
            { email: tenant.admin_email, name: tenant.name },
            variables
        );    }
};