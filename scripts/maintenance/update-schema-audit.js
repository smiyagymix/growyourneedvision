import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateSchema() {
    console.log('🚀 Updating PocketBase schema for Owner Dashboard...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    const newCollections = [
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
                { name: 'features', type: 'json' }, // Array of strings
                { name: 'limits', type: 'json' },
                { name: 'is_active', type: 'bool' }
            ]
        }
    ];

    for (const col of newCollections) {
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
    
    console.log('✨ Schema update complete!');
}

updateSchema();
