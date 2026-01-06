import env from '../config/environment';
import { RecordModel } from 'pocketbase';
import pb from '../lib/pocketbase';

export interface EmailRecipient {
  name?: string;
  email: string;
}

export interface EmailSender {
  name: string;
  email: string;
}

export interface SendEmailParams {
  to: EmailRecipient;
  from?: EmailSender;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, string>;
  tenantId?: string;
  userId?: string;
}

export interface EmailLog extends RecordModel {
  recipient: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  template_id?: string;
  tenant_id?: string;
  user_id?: string;
  sent_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

/**
 * Email Sending Service
 * Connects frontend to server SMTP endpoint
 * Provides template rendering with variable substitution
 */
export const emailSendingService = {
  /**
   * Send email via server SMTP endpoint
   */
  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const serverUrl = env.get('serverUrl') || 'http://localhost:3001';

      // Create email log entry first
      let emailLog: EmailLog | null = null;
      try {
        emailLog = await pb.collection('email_logs').create<EmailLog>({
          recipient: params.to.email,
          subject: params.subject,
          status: 'pending',
          template_id: params.templateId,
          tenant_id: params.tenantId,
          user_id: params.userId,
        });
      } catch (logError) {
        console.warn('Failed to create email log:', logError);
      }

      // Send email via server
      const response = await fetch(`${serverUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: params.to,
          from: params.from,
          subject: params.subject,
          html: params.html,
          text: params.text,
          logId: emailLog?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      const result = await response.json();
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Send email using template with variable substitution
   */
  async sendTemplateEmail(
    templateId: string,
    to: EmailRecipient,
    variables: Record<string, string>,
    options?: {
      from?: EmailSender;
      tenantId?: string;
      userId?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Fetch template
      const template = await pb.collection('email_templates').getOne(templateId);

      // Substitute variables in subject and content
      let subject = template.subject;
      let html = template.content;

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        html = html.replace(new RegExp(placeholder, 'g'), value);
      });

      // Generate text version (strip HTML tags)
      const text = html.replace(/<[^>]*>/g, '');

      return await this.sendEmail({
        to,
        from: options?.from,
        subject,
        html,
        text,
        templateId,
        tenantId: options?.tenantId,
        userId: options?.userId,
        variables,
      });
    } catch (error) {
      console.error('Template email sending error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Template not found' };
    }
  },

  /**
   * Send welcome email to new tenant
   */
  async sendWelcomeEmail(
    tenantName: string,
    tenantEmail: string,
    tenantId: string,
    adminName: string
  ): Promise<{ success: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Grow Your Need! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hi ${adminName},</h2>
            <p>Thank you for choosing Grow Your Need for <strong>${tenantName}</strong>! We're excited to have you on board.</p>
            
            <p>Your account is now active and ready to use. Here's what you can do next:</p>
            <ul>
              <li>Set up your organization profile</li>
              <li>Invite team members</li>
              <li>Explore our features</li>
              <li>Customize your dashboard</li>
            </ul>
            
            <a href="https://app.growyourneed.com/school-admin" class="button">Get Started</a>
            
            <p>If you have any questions, our support team is here to help at support@growyourneed.com</p>
            
            <p>Best regards,<br>The Grow Your Need Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grow Your Need. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: { name: adminName, email: tenantEmail },
      subject: `Welcome to Grow Your Need - ${tenantName}!`,
      html,
      tenantId,
    });
  },

  /**
   * Send trial reminder email (7 days before expiry)
   */
  async sendTrialReminderEmail(
    tenantName: string,
    tenantEmail: string,
    tenantId: string,
    adminName: string,
    daysRemaining: number
  ): Promise<{ success: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Your Trial is Ending Soon</h1>
          </div>
          <div class="content">
            <h2>Hi ${adminName},</h2>
            <p>Your free trial for <strong>${tenantName}</strong> will expire in <strong>${daysRemaining} days</strong>.</p>
            
            <div class="warning">
              <p><strong>Don't lose access to your data!</strong></p>
              <p>Upgrade now to continue using all features without interruption.</p>
            </div>
            
            <p>Here's what you'll keep with a paid plan:</p>
            <ul>
              <li>Unlimited users and data</li>
              <li>Advanced analytics and reporting</li>
              <li>Priority support</li>
              <li>Custom integrations</li>
            </ul>
            
            <a href="https://app.growyourneed.com/school-admin/billing" class="button">Upgrade Now</a>
            
            <p>Questions? Contact us at billing@growyourneed.com</p>
            
            <p>Best regards,<br>The Grow Your Need Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grow Your Need. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: { name: adminName, email: tenantEmail },
      subject: `⏰ Trial Ending in ${daysRemaining} Days - ${tenantName}`,
      html,
      tenantId,
    });
  },

  /**
   * Send trial expired email (account suspended)
   */
  async sendTrialExpiredEmail(
    tenantName: string,
    tenantEmail: string,
    tenantId: string,
    adminName: string
  ): Promise<{ success: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Trial Expired - Account Suspended</h1>
          </div>
          <div class="content">
            <h2>Hi ${adminName},</h2>
            <p>Your free trial for <strong>${tenantName}</strong> has expired and your account has been temporarily suspended.</p>
            
            <div class="alert">
              <p><strong>Your data is safe!</strong></p>
              <p>All your data is securely stored and will be restored immediately when you upgrade.</p>
            </div>
            
            <p>To reactivate your account and regain access:</p>
            <ol>
              <li>Choose a subscription plan that fits your needs</li>
              <li>Add your payment information</li>
              <li>Your account will be instantly reactivated</li>
            </ol>
            
            <a href="https://app.growyourneed.com/school-admin/billing" class="button">Reactivate Account</a>
            
            <p>Need help? Contact our support team at support@growyourneed.com</p>
            
            <p>Best regards,<br>The Grow Your Need Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grow Your Need. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: { name: adminName, email: tenantEmail },
      subject: `🔒 Trial Expired - Reactivate ${tenantName} Account`,
      html,
      tenantId,
    });
  },

  /**
   * Send payment failed email
   */
  async sendPaymentFailedEmail(
    tenantName: string,
    tenantEmail: string,
    tenantId: string,
    adminName: string,
    attemptNumber: number,
    nextRetryDate?: string
  ): Promise<{ success: boolean }> {
    const isLastAttempt = attemptNumber >= 3;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Payment Failed</h1>
          </div>
          <div class="content">
            <h2>Hi ${adminName},</h2>
            <p>We were unable to process your payment for <strong>${tenantName}</strong> (Attempt ${attemptNumber}/3).</p>
            
            <div class="alert">
              ${
                isLastAttempt
                  ? '<p><strong>Final Notice!</strong> Your account will be suspended if payment is not received.</p>'
                  : `<p><strong>Action Required!</strong> ${nextRetryDate ? `We'll retry on ${nextRetryDate}.` : ''}</p>`
              }
            </div>
            
            <p>Common reasons for payment failure:</p>
            <ul>
              <li>Insufficient funds</li>
              <li>Expired credit card</li>
              <li>Incorrect billing information</li>
              <li>Card declined by bank</li>
            </ul>
            
            <a href="https://app.growyourneed.com/school-admin/billing" class="button">Update Payment Method</a>
            
            <p>Need assistance? Contact us at billing@growyourneed.com or call +1 (555) 123-4567</p>
            
            <p>Best regards,<br>The Grow Your Need Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grow Your Need. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: { name: adminName, email: tenantEmail },
      subject: `⚠️ Payment Failed (Attempt ${attemptNumber}/3) - ${tenantName}`,
      html,
      tenantId,
    });
  },

  /**
   * Send account reactivated email
   */
  async sendAccountReactivatedEmail(
    tenantName: string,
    tenantEmail: string,
    tenantId: string,
    adminName: string
  ): Promise<{ success: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Account Reactivated!</h1>
          </div>
          <div class="content">
            <h2>Hi ${adminName},</h2>
            <p>Great news! Your account for <strong>${tenantName}</strong> has been successfully reactivated.</p>
            
            <div class="success">
              <p><strong>Welcome back!</strong></p>
              <p>All your data has been restored and your team can resume work immediately.</p>
            </div>
            
            <p>Your subscription is now active with full access to:</p>
            <ul>
              <li>All premium features</li>
              <li>Unlimited users and storage</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
            </ul>
            
            <a href="https://app.growyourneed.com/school-admin" class="button">Access Dashboard</a>
            
            <p>Thank you for your continued trust in Grow Your Need!</p>
            
            <p>Best regards,<br>The Grow Your Need Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Grow Your Need. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: { name: adminName, email: tenantEmail },
      subject: `✅ Account Reactivated - ${tenantName}`,
      html,
      tenantId,
    });
  },

  /**
   * Get email sending stats
   */
  async getEmailStats(tenantId?: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    bounced: number;
  }> {
    try {
      const filter = tenantId ? `tenant_id = "${tenantId}"` : '';
      const logs = await pb.collection('email_logs').getFullList<EmailLog>({
        filter,
        requestKey: null,
      });

      return {
        total: logs.length,
        sent: logs.filter((l) => l.status === 'sent').length,
        failed: logs.filter((l) => l.status === 'failed').length,
        pending: logs.filter((l) => l.status === 'pending').length,
        bounced: logs.filter((l) => l.status === 'bounced').length,
      };
    } catch (error) {
      console.error('Error fetching email stats:', error);
      return { total: 0, sent: 0, failed: 0, pending: 0, bounced: 0 };
    }
  },
};
