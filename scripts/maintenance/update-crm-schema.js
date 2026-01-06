import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateCrmSchema() {
    console.log('🚀 Updating CRM Schema...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    // 1. Deals
    const dealsCollection = {
        name: 'deals',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'value', type: 'number' },
            { name: 'stage', type: 'select', options: { values: ['Lead', 'Contacted', 'Demo Scheduled', 'Trial', 'Subscribed', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] } },
            { name: 'description', type: 'text' },
            { name: 'contact_name', type: 'text' },
            { name: 'assigned_to', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'expected_close_date', type: 'date' },
            { name: 'probability', type: 'number' }
        ]
    };

    try {
        await pb.collections.create(dealsCollection);
        console.log(`✅ Created collection: deals`);
    } catch (err) {
        if (err.status === 400) {
            console.log(`⚠️  Collection deals already exists.`);
        } else {
            console.error(`❌ Failed to create collection deals:`, err.message);
        }
    }

    // 2. Contacts
    const contactsCollection = {
        name: 'contacts',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'email', type: 'email' },
            { name: 'phone', type: 'text' },
            { name: 'company', type: 'text' },
            { name: 'role', type: 'text' },
            { name: 'last_contact', type: 'date' }
        ]
    };

    try {
        await pb.collections.create(contactsCollection);
        console.log(`✅ Created collection: contacts`);
    } catch (err) {
        if (err.status === 400) {
            console.log(`⚠️  Collection contacts already exists.`);
        } else {
            console.error(`❌ Failed to create collection contacts:`, err.message);
        }
    }

    // 3. Forecasts
    const forecastsCollection = {
        name: 'forecasts',
        type: 'base',
        schema: [
            { name: 'month', type: 'text', required: true },
            { name: 'projected', type: 'number' },
            { name: 'actual', type: 'number' }
        ]
    };

    try {
        await pb.collections.create(forecastsCollection);
        console.log(`✅ Created collection: forecasts`);
        
        // Seed Forecasts
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        for (const month of months) {
            try {
                await pb.collection('forecasts').create({
                    month,
                    projected: Math.floor(Math.random() * 50000) + 10000,
                    actual: Math.floor(Math.random() * 50000) + 10000
                });
                console.log(`   ✅ Created forecast for ${month}`);
            } catch (e) {
                // Ignore
            }
        }

    } catch (err) {
        if (err.status === 400) {
            console.log(`⚠️  Collection forecasts already exists.`);
        } else {
            console.error(`❌ Failed to create collection forecasts:`, err.message);
        }
    }
}

updateCrmSchema();
