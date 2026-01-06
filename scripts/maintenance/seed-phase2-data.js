/**
 * Seed script for Phase 2 PocketBase collections
 * Creates realistic test data for all new features
 */

const PocketBase = require('pocketbase/cjs');

async function seedPhase2Data() {
    const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

    try {
        // Admin authentication
        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL || 'admin@example.com', process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);

        console.log('🌱 Seeding Phase 2 collections...\n');

        // 1. Legal Documents
        console.log('📄 Seeding legal_documents...');
        const legalDocs = [
            {
                title: 'Terms of Service',
                type: 'terms',
                version: '2.1',
                status: 'published',
                content: '<h1>Terms of Service</h1><p>These terms govern your use of our platform...</p>',
                updated_by: 'admin@growyourneed.com'
            },
            {
                title: 'Privacy Policy',
                type: 'privacy',
                version: '3.0',
                status: 'published',
                content: '<h1>Privacy Policy</h1><p>We respect your privacy and protect your data...</p>',
                updated_by: 'admin@growyourneed.com'
            },
            {
                title: 'GDPR Compliance',
                type: 'gdpr',
                version: '1.5',
                status: 'published',
                content: '<h1>GDPR Compliance</h1><p>We are fully GDPR compliant...</p>',
                updated_by: 'admin@growyourneed.com'
            },
            {
                title: 'Cookie Policy',
                type: 'cookie',
                version: '1.0',
                status: 'draft',
                content: '<h1>Cookie Policy</h1><p>We use cookies to improve your experience...</p>',
                updated_by: 'admin@growyourneed.com'
            }
        ];

        for (const doc of legalDocs) {
            try {
                await pb.collection('legal_documents').create(doc);
            } catch (err) {
                console.log(`  ⚠️  ${doc.title} might already exist`);
            }
        }
        console.log('  ✅ Legal documents seeded\n');

        // 2. Email Templates
        console.log('📧 Seeding email_templates...');
        const emailTemplates = [
            {
                name: 'Welcome Email',
                subject: 'Welcome to {{platform_name}}!',
                content: '<h1>Welcome {{tenant_name}}!</h1><p>Thanks for joining our platform.</p>',
                category: 'welcome',
                status: 'active',
                usage_count: 1250
            },
            {
                name: 'Payment Confirmation',
                subject: 'Payment Received - Invoice #{{invoice_number}}',
                content: '<h1>Payment Confirmed</h1><p>We received your payment of {{amount}}.</p>',
                category: 'billing',
                status: 'active',
                usage_count: 856
            },
            {
                name: 'Feature Announcement',
                subject: 'New Feature: {{feature_name}}',
                content: '<h1>Exciting News!</h1><p>Check out our new feature...</p>',
                category: 'marketing',
                status: 'draft',
                usage_count: 0
            },
            {
                name: 'Password Reset',
                subject: 'Reset Your Password',
                content: '<h1>Password Reset</h1><p>Click here to reset your password...</p>',
                category: 'notification',
                status: 'active',
                usage_count: 432
            }
        ];

        for (const template of emailTemplates) {
            try {
                await pb.collection('email_templates').create(template);
            } catch (err) {
                console.log(`  ⚠️  ${template.name} might already exist`);
            }
        }
        console.log('  ✅ Email templates seeded\n');

        // 3. System Health Metrics
        console.log('🏥 Seeding system_health_metrics...');
        const services = ['API Server', 'Database', 'Email Service', 'Storage (S3)', 'CDN', 'Payment Gateway'];

        for (const service of services) {
            try {
                await pb.collection('system_health_metrics').create({
                    service_name: service,
                    status: 'healthy',
                    uptime_percentage: 99.9 - Math.random() * 0.3,
                    response_time_ms: Math.floor(Math.random() * 100) + 10,
                    last_check: new Date().toISOString()
                });
            } catch (err) {
                console.log(`  ⚠️  ${service} metric might already exist`);
            }
        }
        console.log('  ✅ Health metrics seeded\n');

        // 4. Webhooks
        console.log('🪝 Seeding webhooks...');
        const webhooks = [
            {
                name: 'Tenant Created Hook',
                url: 'https://api.example.com/webhooks/tenant-created',
                events: JSON.stringify(['tenant.created', 'tenant.activated']),
                status: 'active',
                secret_key: 'whsec_' + Math.random().toString(36).substring(2, 15),
                last_triggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                success_rate: 98.5
            },
            {
                name: 'Payment Hook',
                url: 'https://api.example.com/webhooks/payment',
                events: JSON.stringify(['payment.succeeded', 'payment.failed']),
                status: 'active',
                secret_key: 'whsec_' + Math.random().toString(36).substring(2, 15),
                last_triggered: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                success_rate: 99.2
            }
        ];

        for (const webhook of webhooks) {
            try {
                await pb.collection('webhooks').create(webhook);
            } catch (err) {
                console.log(`  ⚠️  ${webhook.name} might already exist`);
            }
        }
        console.log('  ✅ Webhooks seeded\n');

        // 5. Scheduled Reports
        console.log('📊 Seeding scheduled_reports...');
        const reports = [
            {
                name: 'Monthly Revenue Report',
                type: 'revenue',
                frequency: 'monthly',
                recipients: JSON.stringify(['admin@growyourneed.com', 'finance@growyourneed.com']),
                format: 'pdf',
                status: 'active',
                next_run: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                last_run: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                name: 'Weekly Tenant Growth',
                type: 'tenants',
                frequency: 'weekly',
                recipients: JSON.stringify(['admin@growyourneed.com']),
                format: 'excel',
                status: 'active',
                next_run: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                last_run: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        for (const report of reports) {
            try {
                await pb.collection('scheduled_reports').create(report);
            } catch (err) {
                console.log(`  ⚠️  ${report.name} might already exist`);
            }
        }
        console.log('  ✅ Reports seeded\n');

        // 6. Backups
        console.log('💾 Seeding backups...');
        const backups = [
            {
                type: 'full',
                size_bytes: 2400000000,
                status: 'completed',
                file_path: '/backups/full_20240128_020000.tar.gz',
                retention_days: 30
            },
            {
                type: 'incremental',
                size_bytes: 145000000,
                status: 'completed',
                file_path: '/backups/incremental_20240127_020000.tar.gz',
                retention_days: 7
            },
            {
                type: 'manual',
                size_bytes: 2200000000,
                status: 'completed',
                file_path: '/backups/manual_20240125_143000.tar.gz',
                retention_days: 90
            }
        ];

        for (const backup of backups) {
            try {
                await pb.collection('backups').create(backup);
            } catch (err) {
                console.log(`  ⚠️  Backup might already exist`);
            }
        }
        console.log('  ✅ Backups seeded\n');

        // 7. Broadcast Messages
        console.log('📢 Seeding broadcast_messages...');
        const broadcasts = [
            {
                subject: 'Platform Maintenance Notice',
                message: 'We will be performing scheduled maintenance on Sunday...',
                target_audience: 'all',
                priority: 'high',
                channels: JSON.stringify({ email: true, inApp: true, sms: false }),
                sent_by: 'admin@growyourneed.com',
                sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                recipient_count: 150
            },
            {
                subject: 'New Feature Launch',
                message: 'We are excited to announce our new AI-powered analytics...',
                target_audience: 'active',
                priority: 'normal',
                channels: JSON.stringify({ email: true, inApp: true, sms: false }),
                sent_by: 'admin@growyourneed.com',
                sent_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                recipient_count: 120
            }
        ];

        for (const broadcast of broadcasts) {
            try {
                await pb.collection('broadcast_messages').create(broadcast);
            } catch (err) {
                console.log(`  ⚠️  Broadcast might already exist`);
            }
        }
        console.log('  ✅ Broadcasts seeded\n');

        console.log('✨ Phase 2 seed data complete!\n');
        console.log('Summary:');
        console.log('  - 4 Legal documents');
        console.log('  - 4 Email templates');
        console.log('  - 6 Health metrics');
        console.log('  - 2 Webhooks');
        console.log('  - 2 Scheduled reports');
        console.log('  - 3 Backups');
        console.log('  - 2 Broadcast messages');

    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedPhase2Data().catch(console.error);
}

module.exports = { seedPhase2Data };
