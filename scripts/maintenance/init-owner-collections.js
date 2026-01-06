import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Authenticate as admin
await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, '1234567890');

async function createCollection(name, fields) {
    try {
        const existing = await pb.collections.getOne(name);
        console.log(`Collection ${name} already exists. Deleting...`);
        await pb.collections.delete(name);
    } catch (e) {
        // Collection doesn't exist, proceed
    }

    console.log(`Creating collection ${name}...`);
    await pb.collections.create({
        name: name,
        type: 'base',
        fields: fields
    });
}

async function main() {
    console.log('Starting Owner Dashboard Database Initialization...');

    // 1. System Alerts
    await createCollection('system_alerts', [
        { name: 'severity', type: 'select', maxSelect: 1, values: ['critical', 'warning', 'info'], required: true },
        { name: 'message', type: 'text', required: true },
        { name: 'actionUrl', type: 'text' },
        { name: 'isRead', type: 'bool' }
    ]);

    // Seed Alerts
    const alerts = [
        { severity: 'critical', message: 'High API Error Rate Detected (5.2%)', actionUrl: '/admin/concierge_ai/operations', isRead: false },
        { severity: 'warning', message: 'Payment Gateway Connection Issue', actionUrl: '/admin/school/billing', isRead: false },
        { severity: 'info', message: 'Scheduled Maintenance Completed', actionUrl: '/admin/settings', isRead: true },
        { severity: 'info', message: 'New Feature Flag "AI-V2" Enabled', actionUrl: '/admin/settings', isRead: false },
        { severity: 'warning', message: 'Storage Usage at 85%', actionUrl: '/admin/settings', isRead: false }
    ];

    for (const alert of alerts) {
        await pb.collection('system_alerts').create(alert);
    }
    console.log(`Seeded ${alerts.length} system alerts.`);

    // 2. Revenue History
    await createCollection('revenue_history', [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'number', required: true },
        { name: 'value2', type: 'number' }, // Previous period or expenses
        { name: 'date', type: 'date' }
    ]);

    // Seed Revenue History (Last 6 months)
    const revenueData = [
        { label: 'Jun', value: 12500, value2: 10000 },
        { label: 'Jul', value: 13200, value2: 11000 },
        { label: 'Aug', value: 14100, value2: 11500 },
        { label: 'Sep', value: 13800, value2: 12000 },
        { label: 'Oct', value: 14900, value2: 12500 },
        { label: 'Nov', value: 15230, value2: 13000 }
    ];

    for (const data of revenueData) {
        await pb.collection('revenue_history').create(data);
    }
    console.log(`Seeded ${revenueData.length} revenue history points.`);

    // 3. Tenant Growth
    await createCollection('tenant_growth', [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'number', required: true },
        { name: 'date', type: 'date' }
    ]);

    // Seed Tenant Growth
    const growthData = [
        { label: 'Jun', value: 8 },
        { label: 'Jul', value: 12 },
        { label: 'Aug', value: 15 },
        { label: 'Sep', value: 10 },
        { label: 'Oct', value: 18 },
        { label: 'Nov', value: 22 }
    ];

    for (const data of growthData) {
        await pb.collection('tenant_growth').create(data);
    }
    console.log(`Seeded ${growthData.length} tenant growth points.`);

    console.log('Owner Dashboard Database Initialization Complete!');
}

main().catch(console.error);
