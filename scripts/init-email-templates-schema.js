/**
 * Initialize Email Templates Schema
 * Creates email_templates collection for reusable email templates
 * Run: node scripts/init-email-templates-schema.js
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function authenticate() {
    try {
        await pb.collection('_superusers').authWithPassword(
            'owner@growyourneed.com',
            'Darnag123456789@'
        );
        console.log('✅ Authenticated as superuser');
    } catch (err) {
        console.error('❌ Authentication failed:', err.message);
        process.exit(1);
    }
}

async function createEmailTemplatesCollection() {
    const collectionData = {
        name: 'email_templates',
        type: 'base',
        schema: [
            {
                name: 'name',
                type: 'text',
                required: true,
                options: {
                    min: 1,
                    max: 100
                }
            },
            {
                name: 'subject',
                type: 'text',
                required: true,
                options: {
                    min: 1,
                    max: 200
                }
            },
            {
                name: 'html',
                type: 'text',
                required: true,
                options: {
                    min: 1,
                    max: 50000
                }
            },
            {
                name: 'variables',
                type: 'json',
                required: false
            },
            {
                name: 'category',
                type: 'select',
                required: false,
                options: {
                    maxSelect: 1,
                    values: ['transactional', 'marketing', 'system', 'notification']
                }
            },
            {
                name: 'is_active',
                type: 'bool',
                required: false
            }
        ],
        indexes: [
            'CREATE INDEX idx_email_templates_name ON email_templates(name)',
            'CREATE INDEX idx_email_templates_category ON email_templates(category)',
            'CREATE UNIQUE INDEX idx_email_templates_name_unique ON email_templates(name)'
        ],
        listRule: '@request.auth.role = "Owner"',
        viewRule: '@request.auth.role = "Owner"',
        createRule: '@request.auth.role = "Owner"',
        updateRule: '@request.auth.role = "Owner"',
        deleteRule: '@request.auth.role = "Owner"'
    };

    try {
        let collection;
        try {
            collection = await pb.collections.getOne('email_templates');
            console.log('⚠️  Collection email_templates already exists, updating...');
            await pb.collections.update(collection.id, {
                schema: collectionData.schema,
                listRule: collectionData.listRule,
                viewRule: collectionData.viewRule,
                createRule: collectionData.createRule,
                updateRule: collectionData.updateRule,
                deleteRule: collectionData.deleteRule
            });
            console.log('✅ Updated collection: email_templates');
        } catch (err) {
            await pb.collections.create(collectionData);
            console.log('✅ Created collection: email_templates');
        }
    } catch (err) {
        console.error('❌ Error with email_templates collection:', err.message);
    }
}

async function seedEmailTemplates() {
    console.log('\n📧 Seeding email templates...');

    const templates = [
        {
            name: 'welcome',
            subject: 'Welcome to {{app_name}}!',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(to right, #3b82f6, #8b5cf6); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0;">{{app_name}}</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                        <h2 style="color: #1f2937;">Welcome, {{user_name}}!</h2>
                        <p style="color: #4b5563; line-height: 1.6;">We're thrilled to have you on board. Get started by exploring your dashboard.</p>
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="{{dashboard_url}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
                        </div>
                    </div>
                </div>
            `,
            variables: ['app_name', 'user_name', 'dashboard_url'],
            category: 'transactional',
            is_active: true
        },
        {
            name: 'password_reset',
            subject: 'Reset Your Password - {{app_name}}',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #ef4444; padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0;">Password Reset Request</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                        <p style="color: #4b5563;">Hi {{user_name}},</p>
                        <p style="color: #4b5563; line-height: 1.6;">You requested a password reset. Click the button below to proceed:</p>
                        <div style="margin: 20px 0; text-align: center;">
                            <a href="{{reset_url}}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">This link expires in {{expiry_hours}} hours.</p>
                        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                    </div>
                </div>
            `,
            variables: ['app_name', 'user_name', 'reset_url', 'expiry_hours'],
            category: 'transactional',
            is_active: true
        },
        {
            name: 'invoice',
            subject: 'Invoice #{{invoice_number}} - {{app_name}}',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #10b981; padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0;">Invoice</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                        <p style="color: #4b5563;">Hi {{customer_name}},</p>
                        <p style="color: #4b5563;">Thank you for your payment of <strong>{{amount}}</strong>.</p>
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; color: #6b7280;">Invoice Number:</td>
                                    <td style="padding: 8px; text-align: right; font-weight: 600;">{{invoice_number}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; color: #6b7280;">Date:</td>
                                    <td style="padding: 8px; text-align: right; font-weight: 600;">{{invoice_date}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; color: #6b7280;">Amount:</td>
                                    <td style="padding: 8px; text-align: right; font-weight: 600; color: #10b981;">{{amount}}</td>
                                </tr>
                            </table>
                        </div>
                        <div style="text-align: center;">
                            <a href="{{invoice_url}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Invoice</a>
                        </div>
                    </div>
                </div>
            `,
            variables: ['app_name', 'customer_name', 'invoice_number', 'invoice_date', 'amount', 'invoice_url'],
            category: 'transactional',
            is_active: true
        },
        {
            name: 'subscription_renewal',
            subject: 'Your Subscription Will Renew Soon - {{app_name}}',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #8b5cf6; padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0;">Subscription Renewal</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                        <p style="color: #4b5563;">Hi {{customer_name}},</p>
                        <p style="color: #4b5563;">Your {{plan_name}} subscription will automatically renew on <strong>{{renewal_date}}</strong>.</p>
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <div style="font-size: 32px; font-weight: bold; color: #8b5cf6;">{{amount}}</div>
                            <div style="color: #6b7280; margin-top: 5px;">{{billing_frequency}}</div>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">You can manage your subscription anytime from your dashboard.</p>
                        <div style="text-align: center;">
                            <a href="{{billing_url}}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Manage Subscription</a>
                        </div>
                    </div>
                </div>
            `,
            variables: ['app_name', 'customer_name', 'plan_name', 'renewal_date', 'amount', 'billing_frequency', 'billing_url'],
            category: 'notification',
            is_active: true
        },
        {
            name: 'broadcast',
            subject: '{{subject}}',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(to right, #3b82f6, #8b5cf6); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0;">{{app_name}}</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Platform Announcement</p>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                        <div style="background: white; padding: 20px; border-radius: 8px;">
                            <h2 style="color: #1f2937; margin-top: 0;">{{subject}}</h2>
                            <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">{{message}}</div>
                        </div>
                    </div>
                </div>
            `,
            variables: ['app_name', 'subject', 'message'],
            category: 'marketing',
            is_active: true
        }
    ];

    for (const template of templates) {
        try {
            // Check if template already exists
            const existing = await pb.collection('email_templates').getList(1, 1, {
                filter: `name = "${template.name}"`,
                requestKey: null
            });

            if (existing.items.length > 0) {
                // Update existing
                await pb.collection('email_templates').update(existing.items[0].id, template);
                console.log(`✅ Updated template: ${template.name}`);
            } else {
                // Create new
                await pb.collection('email_templates').create(template);
                console.log(`✅ Created template: ${template.name}`);
            }
        } catch (err) {
            console.error(`❌ Error with template '${template.name}':`, err.message);
        }
    }
}

async function main() {
    console.log('🚀 Starting Email Templates Schema Initialization...\n');
    
    await authenticate();
    await createEmailTemplatesCollection();
    await seedEmailTemplates();
    
    console.log('\n✅ Email templates initialization complete!');
    console.log('\n📋 Created Templates:');
    console.log('   - welcome - Welcome new users');
    console.log('   - password_reset - Password reset emails');
    console.log('   - invoice - Payment invoices');
    console.log('   - subscription_renewal - Renewal reminders');
    console.log('   - broadcast - Platform announcements');
}

main().catch(console.error);
