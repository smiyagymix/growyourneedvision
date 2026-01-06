/**
 * Seed data for Platform Owner collections
 * Run: node scripts/seed-platform-owner-data.js
 */

const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Webhook seed data
const WEBHOOKS = [
    {
        name: 'Slack Notifications',
        url: 'https://hooks.slack.com/services/EXAMPLE/WEBHOOK/URL',
        events: ['user.created', 'payment.completed', 'tenant.created'],
        status: 'active',
        secret_key: 'whsec_demo_slack_webhook_secret_key',
        success_rate: 98.5,
        headers: JSON.stringify({ 'Content-Type': 'application/json' }),
        retry_count: 3,
        timeout_ms: 5000,
        last_triggered: new Date().toISOString()
    },
    {
        name: 'Analytics Pipeline',
        url: 'https://api.analytics.example.com/ingest',
        events: ['tenant.subscription_changed', 'payment.completed', 'payment.failed'],
        status: 'active',
        secret_key: 'whsec_demo_analytics_webhook_secret',
        success_rate: 99.2,
        headers: JSON.stringify({ 'Authorization': 'Bearer demo_token' }),
        retry_count: 5,
        timeout_ms: 10000
    },
    {
        name: 'CRM Sync (HubSpot)',
        url: 'https://api.hubspot.com/webhook/demo',
        events: ['user.created', 'user.updated', 'tenant.created'],
        status: 'paused',
        secret_key: 'whsec_demo_hubspot_webhook_secret',
        success_rate: 85.0,
        headers: JSON.stringify({}),
        retry_count: 3,
        timeout_ms: 8000
    }
];

// Broadcast message seed data
const BROADCASTS = [
    {
        subject: 'Platform Maintenance Notice',
        message: 'We will be performing scheduled maintenance on Saturday, December 14th from 2:00 AM to 4:00 AM EST. During this time, the platform will be unavailable. We apologize for any inconvenience.',
        target_audience: 'all',
        priority: 'high',
        channels: JSON.stringify({ email: true, inApp: true, sms: false }),
        sent_by: 'system',
        status: 'sent',
        sent_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        recipient_count: 1250
    },
    {
        subject: 'New Feature: AI-Powered Grading Assistant',
        message: 'We are excited to announce our new AI-powered grading assistant! Teachers can now use AI to help grade assignments faster and provide more detailed feedback to students. Check it out in the Teacher Dashboard.',
        target_audience: 'schools',
        priority: 'normal',
        channels: JSON.stringify({ email: true, inApp: true, sms: false }),
        sent_by: 'system',
        status: 'sent',
        sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        recipient_count: 850
    },
    {
        subject: 'End of Year Subscription Renewal',
        message: 'Your annual subscription will be renewing soon. Please review your payment method and plan details in your account settings. Contact support if you have any questions.',
        target_audience: 'active',
        priority: 'high',
        channels: JSON.stringify({ email: true, inApp: false, sms: false }),
        sent_by: 'system',
        status: 'draft'
    },
    {
        subject: 'Holiday Schedule Update',
        message: 'Happy Holidays! Our support team will have limited availability from December 23rd to January 2nd. For urgent issues, please email emergency@growyourneed.com.',
        target_audience: 'all',
        priority: 'normal',
        channels: JSON.stringify({ email: true, inApp: true, sms: false }),
        sent_by: 'system',
        status: 'scheduled',
        scheduled_for: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    }
];

// System health metrics seed data
const HEALTH_METRICS = [
    {
        service_name: 'pocketbase',
        status: 'healthy',
        uptime_percentage: 99.95,
        response_time_ms: 42,
        last_check: new Date().toISOString()
    },
    {
        service_name: 'ai_service',
        status: 'healthy',
        uptime_percentage: 99.2,
        response_time_ms: 156,
        last_check: new Date().toISOString()
    },
    {
        service_name: 'payment_server',
        status: 'healthy',
        uptime_percentage: 99.99,
        response_time_ms: 85,
        last_check: new Date().toISOString()
    },
    {
        service_name: 'frontend',
        status: 'healthy',
        uptime_percentage: 99.9,
        response_time_ms: 28,
        last_check: new Date().toISOString()
    },
    {
        service_name: 'email_service',
        status: 'degraded',
        uptime_percentage: 95.5,
        response_time_ms: 1250,
        last_check: new Date().toISOString(),
        error_message: 'High latency detected'
    }
];

// Audit log seed data
const AUDIT_LOGS = [
    {
        action: 'user.login',
        user_id: 'owner-1',
        user_email: process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
        severity: 'info',
        metadata: JSON.stringify({ ip: '192.168.1.1', userAgent: 'Mozilla/5.0' }),
        timestamp: new Date().toISOString()
    },
    {
        action: 'tenant.create',
        user_id: 'owner-1',
        user_email: process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
        severity: 'info',
        metadata: JSON.stringify({ tenantName: 'Demo School', plan: 'premium' }),
        timestamp: new Date(Date.now() - 60000).toISOString()
    },
    {
        action: 'broadcast.send',
        user_id: 'owner-1',
        user_email: process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
        severity: 'critical',
        metadata: JSON.stringify({ subject: 'Platform Update', recipients: 1250 }),
        timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
        action: 'webhook.create',
        user_id: 'owner-1',
        user_email: process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
        severity: 'info',
        metadata: JSON.stringify({ webhookName: 'Slack Notifications', url: 'https://hooks.slack.com/...' }),
        timestamp: new Date(Date.now() - 7200000).toISOString()
    },
    {
        action: 'backup.create',
        user_id: 'system',
        user_email: 'system@growyourneed.com',
        severity: 'info',
        metadata: JSON.stringify({ type: 'automatic', size_mb: 256 }),
        timestamp: new Date(Date.now() - 86400000).toISOString()
    }
];

// Feature flags seed data
const FEATURE_FLAGS = [
    {
        name: 'ai_grading',
        key: 'ai_grading',
        description: 'AI-powered grading assistant for teachers',
        enabled: true,
        category: 'ai',
        rollout_percentage: 100,
        allowed_plans: JSON.stringify(['premium', 'enterprise'])
    },
    {
        name: 'video_editor',
        key: 'video_editor',
        description: 'Advanced video editing in Creator Studio',
        enabled: true,
        category: 'overlay',
        rollout_percentage: 100,
        allowed_plans: JSON.stringify(['basic', 'premium', 'enterprise'])
    },
    {
        name: 'stripe_payments',
        key: 'stripe_payments',
        description: 'Stripe payment processing',
        enabled: true,
        category: 'payment',
        rollout_percentage: 100,
        allowed_plans: JSON.stringify(['basic', 'premium', 'enterprise'])
    },
    {
        name: 'real_time_chat',
        key: 'real_time_chat',
        description: 'Real-time messaging between users',
        enabled: true,
        category: 'communication',
        rollout_percentage: 80,
        allowed_plans: JSON.stringify(['premium', 'enterprise'])
    },
    {
        name: 'advanced_analytics',
        key: 'advanced_analytics',
        description: 'Advanced analytics dashboard',
        enabled: false,
        category: 'analytics',
        rollout_percentage: 0,
        allowed_plans: JSON.stringify(['enterprise'])
    },
    {
        name: 'multi_language',
        key: 'multi_language',
        description: 'Multi-language support',
        enabled: true,
        category: 'core',
        rollout_percentage: 50,
        allowed_plans: JSON.stringify(['basic', 'premium', 'enterprise'])
    }
];

async function seedData() {
    try {
        // Authenticate as admin
        console.log('Authenticating...');
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.PB_ADMIN_PASSWORD || '1234567890'
        );
        console.log('Authenticated successfully');

        // Seed webhooks
        console.log('\nSeeding webhooks...');
        for (const webhook of WEBHOOKS) {
            try {
                // Check if exists
                const existing = await pb.collection('webhooks').getFirstListItem(
                    `name = "${webhook.name}"`,
                    { requestKey: null }
                ).catch(() => null);

                if (existing) {
                    console.log(`  Webhook "${webhook.name}" already exists, skipping`);
                } else {
                    await pb.collection('webhooks').create(webhook);
                    console.log(`  Created webhook: ${webhook.name}`);
                }
            } catch (err) {
                console.error(`  Error creating webhook ${webhook.name}:`, err.message);
            }
        }

        // Seed broadcast messages
        console.log('\nSeeding broadcast messages...');
        for (const broadcast of BROADCASTS) {
            try {
                const existing = await pb.collection('broadcast_messages').getFirstListItem(
                    `subject = "${broadcast.subject}"`,
                    { requestKey: null }
                ).catch(() => null);

                if (existing) {
                    console.log(`  Broadcast "${broadcast.subject.substring(0, 30)}..." already exists, skipping`);
                } else {
                    await pb.collection('broadcast_messages').create(broadcast);
                    console.log(`  Created broadcast: ${broadcast.subject.substring(0, 40)}...`);
                }
            } catch (err) {
                console.error(`  Error creating broadcast:`, err.message);
            }
        }

        // Seed health metrics
        console.log('\nSeeding system health metrics...');
        for (const metric of HEALTH_METRICS) {
            try {
                await pb.collection('system_health_metrics').create(metric);
                console.log(`  Created metric for: ${metric.service_name}`);
            } catch (err) {
                console.error(`  Error creating metric for ${metric.service_name}:`, err.message);
            }
        }

        // Seed audit logs
        console.log('\nSeeding audit logs...');
        for (const log of AUDIT_LOGS) {
            try {
                await pb.collection('audit_logs').create(log);
                console.log(`  Created audit log: ${log.action}`);
            } catch (err) {
                console.error(`  Error creating audit log:`, err.message);
            }
        }

        // Seed feature flags
        console.log('\nSeeding feature flags...');
        for (const flag of FEATURE_FLAGS) {
            try {
                const existing = await pb.collection('feature_flags').getFirstListItem(
                    `key = "${flag.key}"`,
                    { requestKey: null }
                ).catch(() => null);

                if (existing) {
                    console.log(`  Feature flag "${flag.key}" already exists, skipping`);
                } else {
                    await pb.collection('feature_flags').create(flag);
                    console.log(`  Created feature flag: ${flag.key}`);
                }
            } catch (err) {
                console.error(`  Error creating feature flag ${flag.key}:`, err.message);
            }
        }

        console.log('\n✅ Platform owner seed data completed!');

    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seedData();
