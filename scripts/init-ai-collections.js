import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Authenticate as admin (you might need to change these credentials if they are different)
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

const AI_COLLECTIONS = [
    {
        name: 'training_jobs',
        type: 'base',
        schema: [
            { name: 'model_name', type: 'text', required: true },
            { name: 'base_model', type: 'text', required: true },
            { name: 'dataset_url', type: 'text' },
            { name: 'status', type: 'select', options: { values: ['Queued', 'Training', 'Completed', 'Failed'] } },
            { name: 'progress', type: 'number' },
            { name: 'epochs', type: 'number' },
            { name: 'loss', type: 'number' },
            { name: 'accuracy', type: 'number' },
            { name: 'started_at', type: 'date' },
            { name: 'completed_at', type: 'date' }
        ]
    },
    {
        name: 'datasets',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'file', type: 'file', options: { maxSelect: 1, maxSize: 52428800 } }, // 50MB
            { name: 'size_bytes', type: 'number' },
            { name: 'row_count', type: 'number' },
            { name: 'type', type: 'select', options: { values: ['jsonl', 'csv'] } }
        ]
    },
    {
        name: 'prompt_templates',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'content', type: 'text', required: true },
            { name: 'variables', type: 'json' },
            { name: 'category', type: 'select', options: { values: ['System', 'User', 'Assistant', 'Tool'] } },
            { name: 'is_active', type: 'bool' }
        ]
    },
    {
        name: 'knowledge_docs',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'file', type: 'file', options: { maxSelect: 1, maxSize: 52428800 } },
            { name: 'type', type: 'select', options: { values: ['PDF', 'TXT', 'URL', 'MD'] } },
            { name: 'status', type: 'select', options: { values: ['Indexed', 'Indexing', 'Pending', 'Failed'] } },
            { name: 'size_bytes', type: 'number' },
            { name: 'vector_id', type: 'text' }
        ]
    },
    {
        name: 'workflows',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'trigger', type: 'select', options: { values: ['Manual', 'Event', 'Schedule'] } },
            { name: 'steps', type: 'json' },
            { name: 'is_active', type: 'bool' }
        ]
    },
    {
        name: 'chat_messages',
        type: 'base',
        schema: [
            { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'role', type: 'select', options: { values: ['user', 'assistant', 'system'] } },
            { name: 'content', type: 'text' },
            { name: 'context', type: 'text' }
        ]
    }
];

async function initAICollections() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
        console.log('Authenticated.');

        for (const col of AI_COLLECTIONS) {
            try {
                console.log(`Checking collection: ${col.name}...`);
                await pb.collections.getFirstListItem(`name="${col.name}"`); // This is wrong, collections are not items
                // Actually we should try to get the collection definition
                await pb.collections.getOne(col.name);
                console.log(`Collection ${col.name} already exists.`);
            } catch (err) {
                if (err.status === 404) {
                    console.log(`Creating collection: ${col.name}...`);
                    await pb.collections.create(col);
                    console.log(`Created ${col.name}.`);
                } else {
                    // It might be that getOne throws 404 if collection doesn't exist
                    // But wait, pb.collections.getOne takes an ID or name.
                    console.log(`Creating collection: ${col.name}...`);
                    try {
                        await pb.collections.create(col);
                        console.log(`Created ${col.name}.`);
                    } catch (createErr) {
                        console.error(`Failed to create ${col.name}:`, createErr.message);
                    }
                }
            }
        }
        console.log('AI Collections initialization complete.');
    } catch (err) {
        console.error('Initialization failed:', err);
    }
}

initAICollections();
