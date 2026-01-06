import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updatePlatformSchemaPlans() {
    console.log('🚀 Updating Platform Schema for Plans...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    const collections = [
        {
            name: 'subscription_plans',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'price', type: 'number' },
                { name: 'interval', type: 'select', options: { values: ['month', 'year'] } },
                { name: 'features', type: 'json' },
                { name: 'active', type: 'bool' }
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

    // Seed Plans
    try {
        const plans = [
            { name: 'Basic', price: 29, interval: 'month', features: ['Up to 100 students', 'Basic Reporting'], active: true },
            { name: 'Pro', price: 79, interval: 'month', features: ['Up to 500 students', 'Advanced Reporting', 'API Access'], active: true },
            { name: 'Enterprise', price: 199, interval: 'month', features: ['Unlimited students', 'Dedicated Support', 'Custom Integrations'], active: true }
        ];

        for (const plan of plans) {
            try {
                await pb.collection('subscription_plans').create(plan);
                console.log(`   ✅ Created plan: ${plan.name}`);
            } catch (e) {
                // Ignore duplicates if unique constraint fails (though we don't have one on name here, so it might duplicate if run multiple times. 
                // Ideally we check first.
                // For simplicity in this fix script, we'll just try to create.
                // To avoid duplicates, let's check first.
                const existing = await pb.collection('subscription_plans').getFirstListItem(`name="${plan.name}"`).catch(() => null);
                if (!existing) {
                    await pb.collection('subscription_plans').create(plan);
                    console.log(`   ✅ Created plan: ${plan.name}`);
                } else {
                    console.log(`   ⚠️  Plan ${plan.name} already exists`);
                }
            }
        }
    } catch (e) {
        console.error('Error seeding plans:', e);
    }
}

updatePlatformSchemaPlans();
