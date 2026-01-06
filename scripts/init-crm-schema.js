import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initCRMSchema() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Deals
        try {
            await pb.collections.create({
                name: 'deals',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'value', type: 'number', required: true },
                    { name: 'stage', type: 'select', required: true, options: { values: ['Lead', 'Contacted', 'Demo Scheduled', 'Trial', 'Subscribed', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] } },
                    { name: 'description', type: 'editor', required: false },
                    { name: 'contact_name', type: 'text', required: false },
                    { name: 'assigned_to', type: 'relation', required: false, options: { collectionId: 'users' } },
                    { name: 'expected_close_date', type: 'date', required: false },
                    { name: 'probability', type: 'number', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created deals collection');
        } catch (e) {
            console.log('deals collection might already exist');
        }

        // 2. Contacts
        try {
            await pb.collections.create({
                name: 'contacts',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'email', type: 'email', required: true },
                    { name: 'phone', type: 'text', required: false },
                    { name: 'company', type: 'text', required: false },
                    { name: 'role', type: 'text', required: false },
                    { name: 'last_contact', type: 'date', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created contacts collection');
        } catch (e) {
            console.log('contacts collection might already exist');
        }

        // 3. Forecasts
        try {
            await pb.collections.create({
                name: 'forecasts',
                type: 'base',
                schema: [
                    { name: 'month', type: 'text', required: true }, // YYYY-MM
                    { name: 'projected', type: 'number', required: true },
                    { name: 'actual', type: 'number', required: true }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created forecasts collection');
        } catch (e) {
            console.log('forecasts collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init CRM schema:', error);
    }
}

initCRMSchema();
