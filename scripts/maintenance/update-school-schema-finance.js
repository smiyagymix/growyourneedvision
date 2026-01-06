import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateSchoolSchemaFinance() {
    console.log('🚀 Updating School Schema for Finance...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    const collections = [
        {
            name: 'expenses',
            type: 'base',
            schema: [
                { name: 'title', type: 'text', required: true },
                { name: 'category', type: 'select', options: { values: ['Utilities', 'Supplies', 'Maintenance', 'Events', 'Other'] } },
                { name: 'amount', type: 'number' },
                { name: 'date', type: 'date' },
                { name: 'status', type: 'select', options: { values: ['Pending', 'Approved', 'Rejected', 'Paid'] } },
                { name: 'approved_by', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'receipt', type: 'file' }
            ]
        },
        {
            name: 'payroll',
            type: 'base',
            schema: [
                { name: 'staff', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'month', type: 'text' }, // e.g. "2023-10"
                { name: 'amount', type: 'number' },
                { name: 'status', type: 'select', options: { values: ['Pending', 'Processing', 'Paid'] } },
                { name: 'payment_date', type: 'date' },
                { name: 'payslip', type: 'file' }
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

updateSchoolSchemaFinance();
