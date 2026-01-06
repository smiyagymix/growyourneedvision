import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initServicesSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Services
        try {
            await pb.collections.create({
                name: 'services',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'provider_name', type: 'text', required: true },
                    { name: 'description', type: 'editor', required: true },
                    { name: 'category', type: 'text', required: true },
                    { name: 'price', type: 'number', required: true },
                    { name: 'rating', type: 'number', required: false },
                    { name: 'reviews_count', type: 'number', required: false },
                    { name: 'location', type: 'text', required: false },
                    { name: 'image', type: 'file', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created services collection');
        } catch (e) {
            console.log('services collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init services schema:', error);
    }
}

initServicesSchema();
