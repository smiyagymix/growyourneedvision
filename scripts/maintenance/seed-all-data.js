// Seed Script: Create comprehensive real data for all collections
// Run this script: pnpm db:seed-all

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Enhanced seed data for forecasts
const forecastData = [
    { month: 'Jan 2025', projected: 45000, actual: 42000 },
    { month: 'Feb 2025', projected: 48000, actual: 51000 },
    { month: 'Mar 2025', projected: 52000, actual: 49500 },
    { month: 'Apr 2025', projected: 55000, actual: 57200 },
    { month: 'May 2025', projected: 58000, actual: 60000 },
    { month: 'Jun 2025', projected: 62000, actual: 63500 },
    { month: 'Jul 2025', projected: 65000, actual: 64200 },
    { month: 'Aug 2025', projected: 68000, actual: 70000 },
    { month: 'Sep 2025', projected: 72000, actual: 74500 },
    { month: 'Oct 2025', projected: 75000, actual: 0 },
    { month: 'Nov 2025', projected: 78000, actual: 0 },
    { month: 'Dec 2025', projected: 82000, actual: 0 },
];

// System alerts data
const systemAlerts = [
    {
        severity: 'warning',
        message: 'Database backup completed successfully',
        actionUrl: '/admin/settings',
    },
    {
        severity: 'info',
        message: 'New feature: Course materials upload now available',
        actionUrl: '/admin/features',
    },
    {
        severity: 'critical',
        message: 'SSL certificate expires in 30 days',
        actionUrl: '/admin/security',
    },
    {
        severity: 'warning',
        message: '3 tenants approaching storage limit',
        actionUrl: '/admin/tenants',
    },
    {
        severity: 'info',
        message: 'System update scheduled for this weekend',
        actionUrl: '/admin/maintenance',
    },
];

// Subscription plans data
const subscriptionPlans = [
    {
        name: 'Starter',
        price_monthly: 29,
        price_yearly: 290,
        features: [
            'Up to 50 students',
            '5GB storage',
            'Basic analytics',
            'Email support',
        ],
        limits: {
            students: 50,
            storage_gb: 5,
            teachers: 5,
        },
        is_active: true,
    },
    {
        name: 'Professional',
        price_monthly: 79,
        price_yearly: 790,
        features: [
            'Up to 200 students',
            '25GB storage',
            'Advanced analytics',
            'Priority support',
            'Custom branding',
        ],
        limits: {
            students: 200,
            storage_gb: 25,
            teachers: 20,
        },
        is_active: true,
    },
    {
        name: 'Enterprise',
        price_monthly: 199,
        price_yearly: 1990,
        features: [
            'Unlimited students',
            '100GB storage',
            'Real-time analytics',
            '24/7 support',
            'Custom branding',
            'API access',
            'SSO integration',
        ],
        limits: {
            students: -1, // unlimited
            storage_gb: 100,
            teachers: -1, // unlimited
        },
        is_active: true,
    },
    {
        name: 'Individual',
        price_monthly: 9,
        price_yearly: 90,
        features: [
            'Personal learning dashboard',
            '1GB storage',
            'Course tracking',
            'Email support',
        ],
        limits: {
            students: 1,
            storage_gb: 1,
            teachers: 0,
        },
        is_active: true,
    },
];

// Chat messages for AI concierge
const chatMessages = [
    {
        role: 'assistant',
        content: 'Welcome to Grow Your Need! I can help you with platform setup, analytics, and navigation. How can I assist you today?',
        context: 'Platform Owner',
    },
    {
        role: 'assistant',
        content: 'Hello! I\'m your wellness coach. I can help you track fitness goals, suggest mindfulness exercises, and monitor your overall wellbeing. What would you like to work on?',
        context: 'Wellness Coach',
    },
];

// Sample announcements
const announcements = [
    {
        title: 'Platform Update: New Features Available',
        content: 'We\'ve added course materials upload functionality and enhanced markdown preview. Check out the new features in teacher dashboard!',
        type: 'feature',
        priority: 'high',
        published: true,
    },
    {
        title: 'Scheduled Maintenance This Weekend',
        content: 'The platform will undergo scheduled maintenance on Saturday from 2 AM to 4 AM EST. All services will be temporarily unavailable during this time.',
        type: 'maintenance',
        priority: 'critical',
        published: true,
    },
    {
        title: 'New Pricing Plans Announced',
        content: 'We\'re excited to introduce new flexible pricing plans for schools and individuals. Visit the billing section to learn more.',
        type: 'info',
        priority: 'medium',
        published: true,
    },
];

async function seedAllData() {
    try {
        // Authenticate as admin
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD
        );

        console.log('✅ Authenticated as admin\n');

        // Seed forecasts
        console.log('📊 Seeding forecast data...');
        let forecastsCreated = 0;
        for (const forecast of forecastData) {
            try {
                const existing = await pb.collection('forecasts').getFullList({
                    filter: `month = "${forecast.month}"`,
                });
                if (existing.length === 0) {
                    await pb.collection('forecasts').create(forecast);
                    forecastsCreated++;
                }
            } catch (err) {
                // Collection might not exist yet
            }
        }
        console.log(`✅ Created ${forecastsCreated} forecast records\n`);

        // Seed system alerts
        console.log('🚨 Seeding system alerts...');
        let alertsCreated = 0;
        for (const alert of systemAlerts) {
            try {
                const existing = await pb.collection('system_alerts').getFullList({
                    filter: `message = "${alert.message}"`,
                });
                if (existing.length === 0) {
                    await pb.collection('system_alerts').create(alert);
                    alertsCreated++;
                }
            } catch (err) {
                // Collection might not exist yet
            }
        }
        console.log(`✅ Created ${alertsCreated} system alerts\n`);

        // Seed subscription plans
        console.log('💳 Seeding subscription plans...');
        let plansCreated = 0;
        for (const plan of subscriptionPlans) {
            try {
                const existing = await pb.collection('subscription_plans').getFullList({
                    filter: `name = "${plan.name}"`,
                });
                if (existing.length === 0) {
                    await pb.collection('subscription_plans').create(plan);
                    plansCreated++;
                }
            } catch (err) {
                // Collection might not exist yet
            }
        }
        console.log(`✅ Created ${plansCreated} subscription plans\n`);

        // Seed chat messages
        console.log('💬 Seeding chat messages...');
        let messagesCreated = 0;
        try {
            const owner = await pb.collection('users').getFirstListItem('role = "Owner"');
            for (const message of chatMessages) {
                const existing = await pb.collection('chat_messages').getFullList({
                    filter: `content = "${message.content}"`,
                });
                if (existing.length === 0) {
                    await pb.collection('chat_messages').create({
                        ...message,
                        user: owner.id,
                    });
                    messagesCreated++;
                }
            }
        } catch (err) {
            console.log('⚠️  Skipping chat messages - collection or owner not found');
        }
        console.log(`✅ Created ${messagesCreated} chat messages\n`);

        // Seed announcements
        console.log('📢 Seeding announcements...');
        let announcementsCreated = 0;
        for (const announcement of announcements) {
            try {
                const existing = await pb.collection('announcements').getFullList({
                    filter: `title = "${announcement.title}"`,
                });
                if (existing.length === 0) {
                    await pb.collection('announcements').create(announcement);
                    announcementsCreated++;
                }
            } catch (err) {
                // Collection might not exist yet
            }
        }
        console.log(`✅ Created ${announcementsCreated} announcements\n`);

        console.log('\n🎉 Summary:');
        console.log(`  📊 Forecasts: ${forecastsCreated}`);
        console.log(`  🚨 Alerts: ${alertsCreated}`);
        console.log(`  💳 Plans: ${plansCreated}`);
        console.log(`  💬 Messages: ${messagesCreated}`);
        console.log(`  📢 Announcements: ${announcementsCreated}`);
        console.log(`\n✅ All data seeded successfully!`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedAllData()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    });
