/**
 * Initialize Email Templates Collection
 * Creates email_templates and email_logs collections for automated messaging
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initEmailTemplates() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');

        console.log('✓ Authenticated as superuser');

        const collections = await pb.collections.getFullList();

        // Create email_templates collection
        const emailTemplatesExists = collections.find(c => c.name === 'email_templates');
        if (!emailTemplatesExists) {
            await pb.collections.create({
                name: 'email_templates',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'code',
                        type: 'text',
                        required: true,
                        options: { max: 50 }
                    },
                    {
                        name: 'category',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['tenant', 'user', 'billing', 'notification', 'system']
                        }
                    },
                    {
                        name: 'subject',
                        type: 'text',
                        required: true,
                        options: { max: 200 }
                    },
                    {
                        name: 'body_html',
                        type: 'editor',
                        required: true
                    },
                    {
                        name: 'body_text',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'variables',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'is_active',
                        type: 'bool',
                        required: false
                    },
                    {
                        name: 'from_name',
                        type: 'text',
                        required: false,
                        options: { max: 100 }
                    },
                    {
                        name: 'from_email',
                        type: 'text',
                        required: false,
                        options: { max: 100 }
                    },
                    {
                        name: 'language',
                        type: 'select',
                        required: false,
                        options: {
                            values: ['en', 'es', 'fr', 'de', 'ar']
                        }
                    }
                ],
                indexes: ['CREATE UNIQUE INDEX idx_template_code ON email_templates (code)']
            });
            console.log('✓ Created email_templates collection');
        } else {
            console.log('✓ email_templates collection already exists');
        }

        // Create email_logs collection
        const emailLogsExists = collections.find(c => c.name === 'email_logs');
        if (!emailLogsExists) {
            await pb.collections.create({
                name: 'email_logs',
                type: 'base',
                schema: [
                    {
                        name: 'template_code',
                        type: 'text',
                        required: true,
                        options: { max: 50 }
                    },
                    {
                        name: 'recipient_email',
                        type: 'text',
                        required: true,
                        options: { max: 255 }
                    },
                    {
                        name: 'recipient_name',
                        type: 'text',
                        required: false,
                        options: { max: 255 }
                    },
                    {
                        name: 'subject',
                        type: 'text',
                        required: true,
                        options: { max: 500 }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['pending', 'sent', 'failed', 'bounced', 'opened', 'clicked']
                        }
                    },
                    {
                        name: 'sent_at',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'error_message',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'tenant_id',
                        type: 'text',
                        required: false,
                        options: { max: 15 }
                    },
                    {
                        name: 'user_id',
                        type: 'text',
                        required: false,
                        options: { max: 15 }
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        required: false
                    }
                ],
                indexes: [
                    'CREATE INDEX idx_email_logs_status ON email_logs (status)',
                    'CREATE INDEX idx_email_logs_tenant ON email_logs (tenant_id)',
                    'CREATE INDEX idx_email_logs_template ON email_logs (template_code)'
                ]
            });
            console.log('✓ Created email_logs collection');
        } else {
            console.log('✓ email_logs collection already exists');
        }

        // Seed default templates
        await seedDefaultTemplates();

        console.log('\n✅ Email templates initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing email templates:', error);
        process.exit(1);
    }
}

async function seedDefaultTemplates() {
    const templates = [
        {
            name: 'Tenant Welcome Email',
            code: 'tenant_welcome',
            category: 'tenant',
            subject: 'Welcome to {{platformName}} - Your Account is Ready!',
            from_name: 'Grow Your Need Team',
            from_email: 'welcome@growyourneed.com',
            is_active: true,
            language: 'en',
            variables: JSON.stringify(['tenantName', 'adminName', 'platformName', 'dashboardUrl', 'supportEmail']),
            body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to {{platformName}}! 🎉</h1>
    </div>
    <div style="padding: 40px; background: #f9fafb;">
        <p style="font-size: 16px; color: #374151;">Hi {{adminName}},</p>
        <p style="font-size: 16px; color: #374151;">
            We're thrilled to have <strong>{{tenantName}}</strong> join our platform! Your account is now active and ready to use.
        </p>
        <div style="background: white; border-radius: 8px; padding: 30px; margin: 30px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Getting Started</h2>
            <ul style="color: #4b5563; line-height: 1.8;">
                <li>Access your dashboard at <a href="{{dashboardUrl}}" style="color: #667eea;">{{dashboardUrl}}</a></li>
                <li>Invite team members to collaborate</li>
                <li>Customize your settings and preferences</li>
                <li>Explore our comprehensive features</li>
            </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Go to Dashboard
            </a>
        </div>
        <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color: #667eea;">{{supportEmail}}</a>
        </p>
    </div>
</div>`,
            body_text: `Welcome to {{platformName}}, {{adminName}}!\n\nYour account for {{tenantName}} is now active.\n\nGet started:\n- Dashboard: {{dashboardUrl}}\n- Support: {{supportEmail}}\n\nThank you for choosing us!`
        },
        {
            name: 'Trial Reminder - 7 Days Left',
            code: 'trial_reminder_7d',
            category: 'billing',
            subject: '⏰ Your Trial Ends in 7 Days - {{tenantName}}',
            from_name: 'Grow Your Need Billing',
            from_email: 'billing@growyourneed.com',
            is_active: true,
            language: 'en',
            variables: JSON.stringify(['tenantName', 'adminName', 'trialEndDate', 'upgradeUrl', 'featuresUsed']),
            body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #fbbf24; padding: 30px; text-align: center;">
        <h1 style="color: #78350f; margin: 0;">⏰ Trial Ending Soon</h1>
    </div>
    <div style="padding: 40px; background: #fffbeb;">
        <p style="font-size: 16px; color: #374151;">Hi {{adminName}},</p>
        <p style="font-size: 16px; color: #374151;">
            Your trial for <strong>{{tenantName}}</strong> will end on <strong>{{trialEndDate}}</strong>.
        </p>
        <div style="background: white; border-radius: 8px; padding: 30px; margin: 30px 0; border-left: 4px solid #fbbf24;">
            <h3 style="color: #92400e; margin-top: 0;">What You've Accomplished:</h3>
            <p style="color: #78350f;">{{featuresUsed}}</p>
        </div>
        <p style="font-size: 16px; color: #374151;">
            Don't lose access to your data and features! Upgrade now to continue your journey.
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{upgradeUrl}}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Upgrade Now
            </a>
        </div>
    </div>
</div>`,
            body_text: `Hi {{adminName}},\n\nYour trial ends on {{trialEndDate}}.\n\nUpgrade now: {{upgradeUrl}}\n\nThank you!`
        },
        {
            name: 'Account Suspended Notice',
            code: 'account_suspended',
            category: 'system',
            subject: '⚠️ Account Suspended - {{tenantName}}',
            from_name: 'Grow Your Need Support',
            from_email: 'support@growyourneed.com',
            is_active: true,
            language: 'en',
            variables: JSON.stringify(['tenantName', 'adminName', 'reason', 'contactUrl', 'supportEmail']),
            body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #ef4444; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">⚠️ Account Suspended</h1>
    </div>
    <div style="padding: 40px; background: #fef2f2;">
        <p style="font-size: 16px; color: #374151;">Hi {{adminName}},</p>
        <p style="font-size: 16px; color: #374151;">
            Your account <strong>{{tenantName}}</strong> has been temporarily suspended.
        </p>
        <div style="background: white; border-radius: 8px; padding: 30px; margin: 30px 0; border-left: 4px solid #ef4444;">
            <h3 style="color: #991b1b; margin-top: 0;">Reason for Suspension:</h3>
            <p style="color: #7f1d1d;">{{reason}}</p>
        </div>
        <p style="font-size: 16px; color: #374151;">
            Please contact our support team immediately to resolve this issue.
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{contactUrl}}" style="display: inline-block; background: #ef4444; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Contact Support
            </a>
        </div>
        <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            Email: <a href="mailto:{{supportEmail}}" style="color: #ef4444;">{{supportEmail}}</a>
        </p>
    </div>
</div>`,
            body_text: `Account Suspended\n\nHi {{adminName}},\n\nYour account {{tenantName}} has been suspended.\n\nReason: {{reason}}\n\nContact us: {{supportEmail}}`
        },
        {
            name: 'Password Reset Request',
            code: 'password_reset',
            category: 'user',
            subject: 'Reset Your Password - {{platformName}}',
            from_name: 'Grow Your Need Security',
            from_email: 'security@growyourneed.com',
            is_active: true,
            language: 'en',
            variables: JSON.stringify(['userName', 'resetUrl', 'expiryMinutes', 'platformName']),
            body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #3b82f6; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">🔐 Password Reset Request</h1>
    </div>
    <div style="padding: 40px; background: #eff6ff;">
        <p style="font-size: 16px; color: #374151;">Hi {{userName}},</p>
        <p style="font-size: 16px; color: #374151;">
            We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 40px 0;">
            <a href="{{resetUrl}}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Reset Password
            </a>
        </div>
        <p style="font-size: 14px; color: #6b7280; text-align: center;">
            This link will expire in {{expiryMinutes}} minutes.
        </p>
        <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> If you didn't request this, please ignore this email. Your password won't change.
            </p>
        </div>
    </div>
</div>`,
            body_text: `Password Reset Request\n\nHi {{userName}},\n\nReset your password: {{resetUrl}}\n\nExpires in {{expiryMinutes}} minutes.\n\nDidn't request this? Ignore this email.`
        },
        {
            name: 'Payment Failed Notification',
            code: 'payment_failed',
            category: 'billing',
            subject: '❌ Payment Failed - {{tenantName}}',
            from_name: 'Grow Your Need Billing',
            from_email: 'billing@growyourneed.com',
            is_active: true,
            language: 'en',
            variables: JSON.stringify(['tenantName', 'adminName', 'amount', 'retryDate', 'updatePaymentUrl']),
            body_html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #dc2626; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">❌ Payment Failed</h1>
    </div>
    <div style="padding: 40px; background: #fef2f2;">
        <p style="font-size: 16px; color: #374151;">Hi {{adminName}},</p>
        <p style="font-size: 16px; color: #374151;">
            We were unable to process your payment of <strong>{{amount}}</strong> for <strong>{{tenantName}}</strong>.
        </p>
        <div style="background: white; border-radius: 8px; padding: 30px; margin: 30px 0;">
            <h3 style="color: #991b1b; margin-top: 0;">What Happens Next:</h3>
            <ul style="color: #7f1d1d; line-height: 1.8;">
                <li>We'll automatically retry on {{retryDate}}</li>
                <li>Update your payment method to avoid service interruption</li>
                <li>Your account remains active for now</li>
            </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{updatePaymentUrl}}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Update Payment Method
            </a>
        </div>
    </div>
</div>`,
            body_text: `Payment Failed\n\nHi {{adminName}},\n\nPayment of {{amount}} failed for {{tenantName}}.\n\nRetry: {{retryDate}}\n\nUpdate payment: {{updatePaymentUrl}}`
        }
    ];

    for (const template of templates) {
        try {
            const existing = await pb.collection('email_templates').getFirstListItem(`code = "${template.code}"`).catch(() => null);
            if (!existing) {
                await pb.collection('email_templates').create(template);
                console.log(`  ✓ Created template: ${template.name}`);
            } else {
                console.log(`  ✓ Template exists: ${template.name}`);
            }
        } catch (error) {
            console.error(`  ✗ Failed to create template ${template.name}:`, error.message);
        }
    }
}

initEmailTemplates();
