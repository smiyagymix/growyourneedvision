import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updatePlatformSchemaTickets() {
    console.log('🚀 Updating Platform Schema for Tickets...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    const collections = [
        {
            name: 'tickets',
            type: 'base',
            schema: [
                { name: 'subject', type: 'text', required: true },
                { name: 'description', type: 'text' },
                { name: 'status', type: 'select', options: { values: ['Open', 'In Progress', 'Resolved', 'Closed'] } },
                { name: 'priority', type: 'select', options: { values: ['Low', 'Medium', 'High', 'Critical'] } },
                { name: 'tenantId', type: 'relation', options: { collectionId: 'tenants', cascadeDelete: false } },
                { name: 'created_by', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'assigned_to', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'category', type: 'select', options: { values: ['Technical', 'Billing', 'Feature Request', 'Other'] } }
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
}

updatePlatformSchemaTickets();
