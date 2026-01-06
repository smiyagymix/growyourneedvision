import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function resetCollections() {
    console.log('🚀 Resetting CRM collections...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    const collections = ['deals', 'contacts'];

    for (const name of collections) {
        try {
            await pb.collections.delete(name);
            console.log(`🗑️ Deleted collection: ${name}`);
        } catch (err) {
            console.log(`ℹ️ Collection ${name} not found (or failed to delete): ${err.message}`);
        }
    }

    // Now run init-collections logic (simplified)
    const newCollections = [
        {
            name: 'deals',
            type: 'base',
            fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'value', type: 'number' },
                { name: 'stage', type: 'select', maxSelect: 1, values: ['Lead', 'Contacted', 'Demo Scheduled', 'Trial', 'Subscribed'] },
                { name: 'contact_name', type: 'text' },
                { name: 'description', type: 'text' },
                { name: 'assigned_to', type: 'text' },
                { name: 'probability', type: 'number' },
                { name: 'expected_close_date', type: 'date' }
            ]
        },
        {
            name: 'contacts',
            type: 'base',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'email', type: 'email' },
                { name: 'phone', type: 'text' },
                { name: 'company', type: 'text' },
                { name: 'role', type: 'text' }
            ]
        }
    ];

    for (const col of newCollections) {
        try {
            const record = await pb.collections.create(col);
            console.log(`✅ Created collection: ${col.name}`);
            
            // Set public rules
            record.listRule = '';
            record.viewRule = '';
            record.createRule = '';
            record.updateRule = '';
            record.deleteRule = '';
            await pb.collections.update(record.id, record);
            console.log(`   ✅ Set public rules for ${col.name}`);

        } catch (err) {
            console.error(`❌ Failed to create ${col.name}:`, err.message);
            if (err.response) console.error(JSON.stringify(err.response, null, 2));
        }
    }
}

resetCollections();
