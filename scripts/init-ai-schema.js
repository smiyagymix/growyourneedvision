import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initAISchema() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. AI Logs
        try {
            await pb.collections.create({
                name: 'ai_logs',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'prompt', type: 'text', required: true },
                    { name: 'completion', type: 'text', required: true },
                    { name: 'model', type: 'text', required: true },
                    { name: 'tokens_prompt', type: 'number', required: false },
                    { name: 'tokens_completion', type: 'number', required: false },
                    { name: 'latency_ms', type: 'number', required: false },
                    { name: 'status', type: 'select', options: { values: ['Success', 'Error'] } },
                    { name: 'error_message', type: 'text', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '', // Logs should be immutable
                deleteRule: '',
            });
            console.log('Created ai_logs collection');
        } catch (e) {
            console.log('ai_logs collection might already exist');
        }

        // 2. AI Stats (Aggregated)
        try {
            await pb.collections.create({
                name: 'ai_stats',
                type: 'base',
                schema: [
                    { name: 'date', type: 'date', required: true }, // Daily stats
                    { name: 'total_requests', type: 'number', required: true },
                    { name: 'total_tokens', type: 'number', required: true },
                    { name: 'avg_latency', type: 'number', required: true },
                    { name: 'error_count', type: 'number', required: true }
                ],
                listRule: '',
                viewRule: '',
                createRule: '', // System only
                updateRule: '',
                deleteRule: '',
            });
            console.log('Created ai_stats collection');
        } catch (e) {
            console.log('ai_stats collection might already exist');
        }

        // 3. AI Configs
        try {
            await pb.collections.create({
                name: 'ai_configs',
                type: 'base',
                schema: [
                    { name: 'key', type: 'text', required: true, unique: true },
                    { name: 'value', type: 'json', required: true },
                    { name: 'description', type: 'text', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""', // Admin only ideally
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created ai_configs collection');
        } catch (e) {
            console.log('ai_configs collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init AI schema:', error);
    }
}

initAISchema();
