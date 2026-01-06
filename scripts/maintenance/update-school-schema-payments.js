import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateSchoolSchemaPayments() {
    console.log('🚀 Updating School Schema for Payments...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    const collections = [
        {
            name: 'school_payments',
            type: 'base',
            schema: [
                { name: 'invoice', type: 'relation', options: { collectionId: 'school_invoices', cascadeDelete: false } },
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'amount', type: 'number' },
                { name: 'method', type: 'select', options: { values: ['Cash', 'Card', 'Bank Transfer', 'Cheque'] } },
                { name: 'reference', type: 'text' },
                { name: 'date', type: 'date' }
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
                // Optional: Update schema if needed
            } else {
                console.error(`❌ Failed to create collection ${col.name}:`, err.message);
            }
        }
    }
}

updateSchoolSchemaPayments();
