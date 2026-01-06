import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

const NEW_COLLECTIONS = [
    {
        name: 'ai_config',
        type: 'base',
        schema: [
            { name: 'key', type: 'text', required: true, unique: true },
            { name: 'value', type: 'json' },
            { name: 'description', type: 'text' }
        ]
    },
    {
        name: 'ai_objectives',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'target', type: 'text' },
            { name: 'current_value', type: 'number' },
            { name: 'target_value', type: 'number' },
            { name: 'unit', type: 'text' },
            { name: 'status', type: 'select', options: { values: ['On Track', 'At Risk', 'Behind', 'Completed'] } },
            { name: 'deadline', type: 'date' }
        ]
    },
    {
        name: 'usage_logs',
        type: 'base',
        schema: [
            { name: 'user_id', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'model', type: 'text' },
            { name: 'tokens_input', type: 'number' },
            { name: 'tokens_output', type: 'number' },
            { name: 'cost', type: 'number' },
            { name: 'request_type', type: 'text' } // e.g., 'chat', 'embedding', 'generation'
        ]
    }
];

async function initMoreAICollections() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
        console.log('Authenticated.');

        for (const col of NEW_COLLECTIONS) {
            try {
                await pb.collections.getOne(col.name);
                console.log(`Collection ${col.name} already exists.`);
            } catch (err) {
                if (err.status === 404) {
                    console.log(`Creating collection: ${col.name}...`);
                    await pb.collections.create(col);
                    console.log(`Created ${col.name}.`);
                } else {
                    throw err;
                }
            }
        }

        // Seed some initial data for ai_config if empty
        try {
            const configs = await pb.collection('ai_config').getList(1, 1);
            if (configs.totalItems === 0) {
                console.log('Seeding initial AI config...');
                await pb.collection('ai_config').create({
                    key: 'model_default',
                    value: { model: 'gpt-4-turbo', temperature: 0.7 },
                    description: 'Default model settings'
                });
                await pb.collection('ai_config').create({
                    key: 'safety_settings',
                    value: { filter_profanity: true, block_pii: true },
                    description: 'Safety and moderation settings'
                });
            }
        } catch (e) {
            console.log('Error seeding config:', e.message);
        }

        // Seed some initial data for ai_objectives if empty
        try {
            const objectives = await pb.collection('ai_objectives').getList(1, 1);
            if (objectives.totalItems === 0) {
                console.log('Seeding initial AI objectives...');
                await pb.collection('ai_objectives').create({
                    title: 'Reduce Support Tickets',
                    target: '30% reduction',
                    current_value: 15,
                    target_value: 30,
                    unit: '%',
                    status: 'On Track',
                    deadline: '2024-12-31'
                });
                await pb.collection('ai_objectives').create({
                    title: 'Increase User Engagement',
                    target: '5 mins/session',
                    current_value: 3.5,
                    target_value: 5,
                    unit: 'mins',
                    status: 'At Risk',
                    deadline: '2024-06-30'
                });
            }
        } catch (e) {
            console.log('Error seeding objectives:', e.message);
        }

    } catch (err) {
        console.error('Error initializing collections:', err);
    }
}

initMoreAICollections();
