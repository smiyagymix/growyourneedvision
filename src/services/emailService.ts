// Email Service
// Supports SMTP, SendGrid, AWS SES, and Mock mode for testing

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

const SMTP_HOST = import.meta.env.VITE_SMTP_HOST || 'pro.eu.turbo-smtp.com';
const SMTP_PORT = parseInt(import.meta.env.VITE_SMTP_PORT || '465'); // 465 for SSL, 587 for TLS
const SMTP_USERNAME = import.meta.env.VITE_SMTP_USERNAME || ''; // Consumer Key
const SMTP_PASSWORD = import.meta.env.VITE_SMTP_PASSWORD || ''; // Consumer Secret
const SMTP_FROM_EMAIL = import.meta.env.VITE_SMTP_FROM_EMAIL || 'noreply@growyourneed.com';
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY || '';
const EMAIL_PROVIDER = import.meta.env.VITE_EMAIL_PROVIDER || 'smtp'; // 'smtp' | 'sendgrid' | 'ses' | 'mock'

export interface EmailMessage {
    to: string[];
    cc?: string[];
    bcc?: string[];
    from?: string;
    subject: string;
    html_body?: string;
    plain_body?: string;
    reply_to?: string;
    tag?: string;
}

export const emailService = {
    /**
     * Send an email via configured provider
     */
    async send(message: EmailMessage) {
        if (isMockEnv()) {
            console.log('[MOCK] Email would be sent:', {
                to: message.to,
                subject: message.subject,
                provider: EMAIL_PROVIDER
            });
            await this.logEmail(message, true, `mock-${Date.now()}`);
            return { success: true, messageId: `mock-${Date.now()}` };
        }

        try {
            let result;

            if (EMAIL_PROVIDER === 'sendgrid' && SENDGRID_API_KEY) {
                result = await this.sendViaSendGrid(message);
            } else if (EMAIL_PROVIDER === 'smtp' && SMTP_USERNAME && SMTP_PASSWORD) {
                result = await this.sendViaSMTP(message);
            } else {
                throw new Error('Email service not configured');
            }

            await this.logEmail(message, result.success, result.messageId, result.error);
            return result;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await this.logEmail(message, false, undefined, errorMsg);
            throw error;
        }
    },

    /**
     * Send via SendGrid
     */
    async sendViaSendGrid(message: EmailMessage) {
        if (!SENDGRID_API_KEY) {
            throw new Error('SendGrid API key not configured');
        }

        const payload = {
            personalizations: [{
                to: message.to.map(email => ({ email })),
                cc: message.cc?.map(email => ({ email })),
                bcc: message.bcc?.map(email => ({ email }))
            }],
            from: {
                email: message.from || SMTP_FROM_EMAIL,
                name: 'Grow Your Need'
            },
            subject: message.subject,
            content: [
                message.html_body ? { type: 'text/html', value: message.html_body } : null,
                message.plain_body ? { type: 'text/plain', value: message.plain_body } : null
            ].filter(Boolean),
            reply_to: message.reply_to ? { email: message.reply_to } : undefined
        };

        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
                return { success: true, messageId };
            } else {
                const errorData = await response.json();
                const errorMsg = errorData.errors?.[0]?.message || 'SendGrid API error';
                return { success: false, error: errorMsg };
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Network error';
            return { success: false, error: errorMsg };
        }
    },

    /**
     * Send via SMTP (works with Turbo-SMTP, Gmail, etc.)
     * This creates a backend API call since SMTP can't be done from browser
     */
    async sendViaSMTP(message: EmailMessage) {
        try {
            const emailData = {
                from: message.from || SMTP_FROM_EMAIL,
                to: message.to.join(', '),
                cc: message.cc?.join(', '),
                bcc: message.bcc?.join(', '),
                subject: message.subject,
                text: message.plain_body || '',
                html: message.html_body || message.plain_body || '',
                replyTo: message.reply_to
            };

            // Call backend API endpoint (server/index.js should have this endpoint)
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                const error = await response.json();
                const errorMsg = error.message || 'Failed to send email';
                return { success: false, error: errorMsg };
            }

            const result = await response.json();
            return { success: true, messageId: result.messageId || `smtp-${Date.now()}` };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'SMTP error';
            return { success: false, error: errorMsg };
        }
    },

    /**
     * Send bulk emails (broadcast)
     */
    async sendBulkEmail(recipients: string[], subject: string, html_body: string, plain_body?: string) {
        if (isMockEnv()) {
            console.log(`[MOCK] Bulk email to ${recipients.length} recipients`);
            return {
                success: true,
                sent: recipients.length,
                failed: 0
            };
        }

        let sent = 0;
        let failed = 0;

        // Send in batches to avoid rate limits
        const batchSize = 10;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            
            const results = await Promise.allSettled(
                batch.map(to => this.send({
                    to: [to],
                    subject,
                    html_body,
                    plain_body: plain_body || html_body
                }))
            );

            sent += results.filter(r => r.status === 'fulfilled').length;
            failed += results.filter(r => r.status === 'rejected').length;

            // Wait 1 second between batches
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return { success: failed === 0, sent, failed };
    },

    /**
     * Log email delivery to database
     */
    async logEmail(message: EmailMessage, success: boolean, messageId?: string, error?: string) {
        if (isMockEnv()) return;

        try {
            for (const recipient of message.to) {
                await pb.collection('email_logs').create({
                    to_email: recipient,
                    from_email: message.from || SMTP_FROM_EMAIL,
                    subject: message.subject,
                    status: success ? 'sent' : 'failed',
                    provider: EMAIL_PROVIDER,
                    provider_message_id: messageId || null,
                    template_name: message.tag || null,
                    error_message: error || null,
                    sent_at: success ? new Date().toISOString() : null,
                    metadata: {
                        has_html: !!message.html_body,
                        has_plain: !!message.plain_body,
                        cc_count: message.cc?.length || 0,
                        bcc_count: message.bcc?.length || 0
                    }
                });
            }
        } catch (err) {
            console.error('Error logging email:', err);
        }
    },

    /**
     * Update email status (for webhooks)
     */
    async updateEmailStatus(messageId: string, status: 'delivered' | 'bounced' | 'opened' | 'clicked') {
        if (isMockEnv()) return;

        try {
            const logs = await pb.collection('email_logs').getList(1, 1, {
                filter: `provider_message_id = "${messageId}"`,
                requestKey: null
            });

            if (logs.items.length > 0) {
                const updates: Record<string, any> = { status };
                
                if (status === 'delivered') {
                    updates.delivered_at = new Date().toISOString();
                } else if (status === 'opened') {
                    updates.opened_at = new Date().toISOString();
                }

                await pb.collection('email_logs').update(logs.items[0].id, updates);
            }
        } catch (err) {
            console.error('Error updating email status:', err);
        }
    },

    /**
     * Get delivery statistics
     */
    async getDeliveryStats(startDate?: Date, endDate?: Date) {
        if (isMockEnv()) {
            return {
                sent: 1523,
                delivered: 1498,
                failed: 25,
                bounced: 15,
                opened: 892,
                clicked: 423,
                deliveryRate: 98.4,
                openRate: 59.5
            };
        }

        try {
            let filter = '';
            if (startDate) filter += `created >= "${startDate.toISOString()}"`;
            if (endDate) filter += `${filter ? ' && ' : ''}created <= "${endDate.toISOString()}"`;

            const logs = await pb.collection('email_logs').getFullList({
                filter: filter || undefined,
                requestKey: null
            });

            const stats = {
                sent: 0,
                delivered: 0,
                failed: 0,
                bounced: 0,
                opened: 0,
                clicked: 0,
                deliveryRate: 0,
                openRate: 0
            };

            logs.forEach(log => {
                if (log.status === 'sent' || log.status === 'delivered') stats.sent++;
                if (log.status === 'delivered') stats.delivered++;
                if (log.status === 'failed') stats.failed++;
                if (log.status === 'bounced') stats.bounced++;
                if (log.status === 'opened') stats.opened++;
                if (log.status === 'clicked') stats.clicked++;
            });

            stats.deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
            stats.openRate = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0;

            return stats;
        } catch (error) {
            console.error('Error fetching delivery stats:', error);
            return {
                sent: 0,
                delivered: 0,
                failed: 0,
                bounced: 0,
                opened: 0,
                clicked: 0,
                deliveryRate: 0,
                openRate: 0
            };
        }
    },

    /**
     * Send a welcome email template
     */
    async sendWelcome(to: string, name: string) {
        return this.send({
            to: [to],
            from: 'hello@growyourneed.com',
            subject: 'Welcome to Grow Your Need!',
            html_body: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #3b82f6;">Welcome, ${name}!</h1>
                    <p>We are thrilled to have you on board. Grow Your Need is your all-in-one platform for growth.</p>
                    <p>Get started by exploring your dashboard.</p>
                    <a href="${window.location.origin}/dashboard" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
                </div>
            `,
            plain_body: `Welcome, ${name}! We are thrilled to have you on board. Go to your dashboard: ${window.location.origin}/dashboard`
        });
    },

    /**
     * Send password reset email
     */
    async sendPasswordReset(to: string, resetToken: string) {
        const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
        return this.send({
            to: [to],
            from: 'security@growyourneed.com',
            subject: 'Reset Your Password',
            html_body: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Click the link below to proceed:</p>
                    <a href="${resetUrl}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `,
            plain_body: `Reset your password here: ${resetUrl}`
        });
    }
};
