import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Authenticate as admin
await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);

async function createCollection(name, fields) {
    try {
        const existing = await pb.collections.getOne(name);
        console.log(`Collection ${name} already exists.`);
    } catch (e) {
        console.log(`Creating collection ${name}...`);
        await pb.collections.create({
            name: name,
            type: 'base',
            fields: fields
        });
    }
}

async function main() {
    console.log('Starting Full Database Initialization...');

    // 1. Tenants
    await createCollection('tenants', [
        { name: 'name', type: 'text', required: true },
        { name: 'type', type: 'select', maxSelect: 1, values: ['School', 'Individual', 'Enterprise'], required: true },
        { name: 'status', type: 'select', maxSelect: 1, values: ['Active', 'Pending', 'Suspended', 'Trial'], required: true },
        { name: 'domain', type: 'text' },
        { name: 'contact_email', type: 'email' },
        { name: 'subscription_plan', type: 'select', maxSelect: 1, values: ['Starter', 'Professional', 'Enterprise'] },
        { name: 'users_count', type: 'number' },
        { name: 'branding', type: 'json' },
        { name: 'settings', type: 'json' }
    ]);

    // Seed Tenants
    try {
        const tenants = await pb.collection('tenants').getFullList();
        if (tenants.length === 0) {
            console.log('Seeding tenants...');
            await pb.collection('tenants').create({
                name: 'Springfield High',
                type: 'School',
                status: 'Active',
                domain: 'springfield.edu',
                contact_email: 'admin@springfield.edu',
                subscription_plan: 'Enterprise',
                users_count: 1250
            });
            await pb.collection('tenants').create({
                name: 'John Doe',
                type: 'Individual',
                status: 'Trial',
                contact_email: 'john@example.com',
                subscription_plan: 'Starter',
                users_count: 1
            });
        }
    } catch (e) { console.error('Error seeding tenants:', e); }

    // 2. Invoices
    await createCollection('invoices', [
        { name: 'tenantId', type: 'relation', collectionId: 'tenants', maxSelect: 1 },
        { name: 'amount', type: 'number', required: true },
        { name: 'status', type: 'select', maxSelect: 1, values: ['Paid', 'Pending', 'Overdue', 'Void'], required: true },
        { name: 'due_date', type: 'date' },
        { name: 'paid_at', type: 'date' },
        { name: 'items', type: 'json' }
    ]);

    // Seed Invoices
    try {
        const invoices = await pb.collection('invoices').getFullList();
        if (invoices.length === 0) {
            console.log('Seeding invoices...');
            const tenant = await pb.collection('tenants').getFirstListItem('');
            await pb.collection('invoices').create({
                tenantId: tenant.id,
                amount: 2500,
                status: 'Paid',
                due_date: new Date().toISOString(),
                paid_at: new Date().toISOString(),
                items: [{ description: 'Enterprise License', amount: 2500 }]
            });
        }
    } catch (e) { console.error('Error seeding invoices:', e); }

    // 3. Subscription Plans
    await createCollection('subscription_plans', [
        { name: 'name', type: 'text', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'interval', type: 'select', maxSelect: 1, values: ['month', 'year'] },
        { name: 'features', type: 'json' },
        { name: 'active', type: 'bool' }
    ]);

    // 4. System Alerts (Ensure exists)
    await createCollection('system_alerts', [
        { name: 'severity', type: 'select', maxSelect: 1, values: ['critical', 'warning', 'info'], required: true },
        { name: 'message', type: 'text', required: true },
        { name: 'actionUrl', type: 'text' },
        { name: 'isRead', type: 'bool' }
    ]);

    // Seed System Alerts
    try {
        const alerts = await pb.collection('system_alerts').getList(1, 1);
        if (alerts.items.length === 0) {
            console.log('Seeding system_alerts...');
            await pb.collection('system_alerts').create({
                severity: 'critical',
                message: 'High API Error Rate Detected',
                isRead: false
            });
            await pb.collection('system_alerts').create({
                severity: 'warning',
                message: 'Storage usage at 85%',
                isRead: false
            });
        }
    } catch (e) { console.error('Error seeding system_alerts:', e); }

    // 5. Revenue History (Ensure exists)
    await createCollection('revenue_history', [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'number', required: true },
        { name: 'value2', type: 'number' },
        { name: 'date', type: 'date' }
    ]);

    // Seed Revenue History
    try {
        const history = await pb.collection('revenue_history').getList(1, 1);
        if (history.items.length === 0) {
            console.log('Seeding revenue_history...');
            await pb.collection('revenue_history').create({ label: 'Jan', value: 1000, value2: 800 });
            await pb.collection('revenue_history').create({ label: 'Feb', value: 1500, value2: 1000 });
            await pb.collection('revenue_history').create({ label: 'Mar', value: 2000, value2: 1200 });
            await pb.collection('revenue_history').create({ label: 'Apr', value: 2500, value2: 1500 });
            await pb.collection('revenue_history').create({ label: 'May', value: 3000, value2: 1800 });
            await pb.collection('revenue_history').create({ label: 'Jun', value: 3500, value2: 2000 });
        }
    } catch (e) { console.error('Error seeding revenue_history:', e); }

    // 6. Tenant Growth (Ensure exists)
    await createCollection('tenant_growth', [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'number', required: true },
        { name: 'date', type: 'date' }
    ]);

    // Seed Tenant Growth
    try {
        const growth = await pb.collection('tenant_growth').getList(1, 1);
        if (growth.items.length === 0) {
            console.log('Seeding tenant_growth...');
            await pb.collection('tenant_growth').create({ label: 'Jan', value: 10 });
            await pb.collection('tenant_growth').create({ label: 'Feb', value: 15 });
            await pb.collection('tenant_growth').create({ label: 'Mar', value: 25 });
            await pb.collection('tenant_growth').create({ label: 'Apr', value: 40 });
            await pb.collection('tenant_growth').create({ label: 'May', value: 60 });
            await pb.collection('tenant_growth').create({ label: 'Jun', value: 85 });
        }
    } catch (e) { console.error('Error seeding tenant_growth:', e); }

    console.log('Database Initialization Complete!');
}

main().catch(console.error);
