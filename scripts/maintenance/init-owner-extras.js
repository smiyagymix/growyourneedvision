import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initExtraCollections() {
    console.log('🚀 Initializing Extra Owner Collections...');

    // Authenticate as admin
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    const collections = [
        {
            name: 'audit_logs',
            type: 'base',
            schema: [
                { name: 'action', type: 'text', required: true },
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'details', type: 'json' },
                { name: 'ip_address', type: 'text' },
                { name: 'module', type: 'text' }
            ]
        },
        {
            name: 'system_settings',
            type: 'base',
            schema: [
                { name: 'key', type: 'text', required: true, unique: true },
                { name: 'value', type: 'json' },
                { name: 'description', type: 'text' },
                { name: 'category', type: 'text' }
            ]
        },
        {
            name: 'subscription_plans',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'price_monthly', type: 'number' },
                { name: 'price_yearly', type: 'number' },
                { name: 'features', type: 'json' },
                { name: 'limits', type: 'json' },
                { name: 'is_active', type: 'bool' }
            ]
        }
    ];

    for (const col of collections) {
        try {
            await pb.collections.create(col);
            console.log(`✅ Created collection: ${col.name}`);
        } catch (err) {
            if (err.status === 400 && err.response?.data?.name?.message === 'Collection name must be unique (case insensitive).') {
                console.log(`⚠️  Collection ${col.name} already exists.`);
            } else {
                console.error(`❌ Failed to create collection ${col.name}:`, err.message);
            }
        }
    }

    // Seed Data
    console.log('🌱 Seeding extra data...');

    // Seed Subscription Plans
    try {
        const plans = [
            {
                name: 'Starter',
                price_monthly: 29,
                price_yearly: 290,
                features: ['Up to 5 Users', 'Basic Support', '1GB Storage'],
                limits: { users: 5, storage_gb: 1 },
                is_active: true
            },
            {
                name: 'Professional',
                price_monthly: 99,
                price_yearly: 990,
                features: ['Up to 50 Users', 'Priority Support', '10GB Storage', 'Advanced Analytics'],
                limits: { users: 50, storage_gb: 10 },
                is_active: true
            },
            {
                name: 'Enterprise',
                price_monthly: 299,
                price_yearly: 2990,
                features: ['Unlimited Users', '24/7 Support', 'Unlimited Storage', 'Custom Branding'],
                limits: { users: 9999, storage_gb: 9999 },
                is_active: true
            }
        ];
        for (const plan of plans) {
            await pb.collection('subscription_plans').create(plan);
        }
        console.log('   ✅ Seeded subscription plans');
    } catch (e) { console.log('   ⚠️  Skipping plan seeding (might already exist)'); }

    // Seed System Settings
    try {
        const settings = [
            {
                key: 'maintenance_mode',
                value: { enabled: false, message: 'System is under maintenance. Please check back later.' },
                description: 'Toggle system-wide maintenance mode',
                category: 'general'
            },
            {
                key: 'feature_flags',
                value: { ai_v2: true, beta_dashboard: false },
                description: 'Enable/Disable experimental features',
                category: 'features'
            }
        ];
        for (const setting of settings) {
            await pb.collection('system_settings').create(setting);
        }
        console.log('   ✅ Seeded system settings');
    } catch (e) { console.log('   ⚠️  Skipping settings seeding'); }

    // Seed Audit Logs
    try {
        const logs = [
            { action: 'LOGIN', details: { status: 'success' }, ip_address: '192.168.1.1', module: 'auth' },
            { action: 'UPDATE_SETTINGS', details: { key: 'maintenance_mode', old: false, new: false }, ip_address: '192.168.1.1', module: 'admin' },
            { action: 'CREATE_TENANT', details: { name: 'New School A' }, ip_address: '10.0.0.5', module: 'tenant' }
        ];
        for (const log of logs) {
            await pb.collection('audit_logs').create(log);
        }
        console.log('   ✅ Seeded audit logs');
    } catch (e) { console.log('   ⚠️  Skipping logs seeding'); }

    console.log('✨ Extra collections initialization complete!');
}

initExtraCollections();
