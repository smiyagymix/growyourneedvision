/**
 * Seed Owner Analytics Collections with Sample Data
 * 
 * Populates the analytics collections with realistic sample data
 * for development and testing purposes.
 * 
 * Run after: init-owner-analytics-collections.js
 * Usage: node scripts/maintenance/seed-owner-analytics.js
 */

const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://localhost:8090');

async function authenticate() {
    try {
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD
        );
        console.log('✅ Authenticated as admin');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }
}

async function clearCollection(collectionName) {
    try {
        const records = await pb.collection(collectionName).getFullList();
        for (const record of records) {
            await pb.collection(collectionName).delete(record.id);
        }
        console.log(`🗑️  Cleared ${records.length} records from ${collectionName}`);
    } catch (err) {
        console.log(`ℹ️  Collection ${collectionName} is empty or doesn't exist`);
    }
}

async function seedAnalyticsPages() {
    const pages = [
        { path: '/dashboard', visitors: 1247, category: 'Dashboard' },
        { path: '/tenant-management', visitors: 892, category: 'Internal' },
        { path: '/analytics', visitors: 743, category: 'Dashboard' },
        { path: '/platform-crm', visitors: 621, category: 'Internal' },
        { path: '/concierge-ai', visitors: 534, category: 'Internal' },
        { path: '/communication', visitors: 489, category: 'Social' },
        { path: '/tool-platform', visitors: 412, category: 'Internal' },
        { path: '/settings', visitors: 367, category: 'Settings' },
        { path: '/help-center', visitors: 298, category: 'External' },
        { path: '/marketplace', visitors: 221, category: 'External' }
    ];

    for (const page of pages) {
        await pb.collection('analytics_pages').create(page);
    }

    console.log(`✅ Seeded ${pages.length} analytics pages`);
}

async function seedAnalyticsSources() {
    const sources = [
        { source: 'Direct', visitors: 3421, color: '#3b82f6' },
        { source: 'Google', visitors: 2134, color: '#10b981' },
        { source: 'Email Campaign', visitors: 1567, color: '#8b5cf6' },
        { source: 'Social Media', visitors: 987, color: '#ec4899' },
        { source: 'Referral', visitors: 654, color: '#f59e0b' },
        { source: 'Organic Search', visitors: 432, color: '#06b6d4' }
    ];

    for (const source of sources) {
        await pb.collection('analytics_sources').create(source);
    }

    console.log(`✅ Seeded ${sources.length} analytics sources`);
}

async function seedFinanceExpenses() {
    const now = new Date();
    const expenses = [
        {
            category: 'Infrastructure',
            amount: 4500,
            color: '#3b82f6',
            percentage: 30.5,
            month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        },
        {
            category: 'AI Services',
            amount: 3200,
            color: '#8b5cf6',
            percentage: 21.7,
            month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        },
        {
            category: 'Personnel',
            amount: 2800,
            color: '#10b981',
            percentage: 19.0,
            month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        },
        {
            category: 'Marketing',
            amount: 1900,
            color: '#ec4899',
            percentage: 12.9,
            month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        },
        {
            category: 'Software',
            amount: 1200,
            color: '#f59e0b',
            percentage: 8.1,
            month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        },
        {
            category: 'Support',
            amount: 800,
            color: '#06b6d4',
            percentage: 5.4,
            month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        },
        {
            category: 'Legal',
            amount: 350,
            color: '#6366f1',
            percentage: 2.4,
            month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        }
    ];

    for (const expense of expenses) {
        await pb.collection('finance_expenses').create(expense);
    }

    console.log(`✅ Seeded ${expenses.length} finance expenses`);
}

async function seedSystemHealth() {
    const healthData = {
        uptime: 99.92,
        api_response_time: 124, // milliseconds
        error_rate: 0.23, // percentage
        db_latency: 18, // milliseconds
        service_status: {
            pocketbase: 'healthy',
            ai_service: 'healthy',
            payment_server: 'healthy',
            frontend: 'healthy'
        }
    };

    await pb.collection('system_health').create(healthData);
    console.log('✅ Seeded system health data');
}

async function seedSystemAlerts() {
    const alerts = [
        {
            severity: 'critical',
            message: 'High API error rate detected (5.2%) in payment processing endpoint',
            action_url: '/admin/tool_platform/logs',
            resolved: false,
            metadata: {
                endpoint: '/api/payments/process',
                error_rate: 5.2,
                threshold: 2.0
            }
        },
        {
            severity: 'warning',
            message: 'Database backup failed - retry scheduled',
            action_url: '/admin/settings/integrations',
            resolved: false,
            metadata: {
                backup_type: 'daily',
                failed_at: new Date().toISOString()
            }
        },
        {
            severity: 'warning',
            message: '3 tenants approaching storage quota limit (>90%)',
            action_url: '/admin/school',
            resolved: false,
            metadata: {
                affected_tenants: 3
            }
        },
        {
            severity: 'info',
            message: 'New feature release available: AI Playground v2.0',
            action_url: '/admin/concierge_ai/development',
            resolved: false,
            metadata: {
                version: '2.0.0',
                release_date: new Date().toISOString()
            }
        },
        {
            severity: 'info',
            message: 'Monthly analytics report ready for review',
            action_url: '/admin/dashboard/analytics',
            resolved: true,
            metadata: {
                report_month: new Date().getMonth()
            }
        }
    ];

    for (const alert of alerts) {
        await pb.collection('system_alerts').create(alert);
    }

    console.log(`✅ Seeded ${alerts.length} system alerts`);
}

async function main() {
    console.log('🌱 Starting Owner Analytics Data Seeding...\n');

    await authenticate();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await clearCollection('analytics_pages');
    await clearCollection('analytics_sources');
    await clearCollection('finance_expenses');
    await clearCollection('system_health');
    await clearCollection('system_alerts');

    console.log('\n📊 Seeding new data...');
    await seedAnalyticsPages();
    await seedAnalyticsSources();
    await seedFinanceExpenses();
    await seedSystemHealth();
    await seedSystemAlerts();

    console.log('\n✨ Seeding Complete!');
    console.log('\n📋 Summary:');
    console.log('   • 10 analytics pages');
    console.log('   • 6 traffic sources');
    console.log('   • 7 expense categories');
    console.log('   • 1 system health snapshot');
    console.log('   • 5 system alerts (3 active, 2 resolved)');
    console.log('\n🎯 Next: Refresh owner dashboard to see live data!');
}

main().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
