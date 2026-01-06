import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedAIData() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // Get admin user ID
        const admin = await pb.collection('users').getFirstListItem('email=process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL').catch(() => null);
        const userId = admin ? admin.id : (await pb.collection('users').getList(1, 1)).items[0]?.id;

        if (!userId) {
            console.error('No user found to assign');
            return;
        }

        // 1. Seed Logs
        const logs = [
            { user: userId, prompt: 'Generate a welcome email', completion: 'Subject: Welcome...', model: 'gpt-3.5-turbo', tokens_prompt: 50, tokens_completion: 150, latency_ms: 1200, status: 'Success' },
            { user: userId, prompt: 'Analyze this deal', completion: 'Based on the data...', model: 'gpt-4', tokens_prompt: 200, tokens_completion: 500, latency_ms: 3500, status: 'Success' },
            { user: userId, prompt: 'Write code for...', completion: '', model: 'gpt-4', tokens_prompt: 100, tokens_completion: 0, latency_ms: 500, status: 'Error', error_message: 'Rate limit exceeded' }
        ];

        for (const log of logs) {
            try {
                await pb.collection('ai_logs').create(log);
                console.log(`Created log for prompt: ${log.prompt.substring(0, 20)}...`);
            } catch (e) {
                console.log(`Failed to create log: ${e.message}`);
            }
        }

        // 2. Seed Stats
        const stats = [
            { date: new Date(Date.now() - 86400000 * 2).toISOString(), total_requests: 150, total_tokens: 45000, avg_latency: 1100, error_count: 2 },
            { date: new Date(Date.now() - 86400000).toISOString(), total_requests: 200, total_tokens: 60000, avg_latency: 1050, error_count: 1 },
            { date: new Date().toISOString(), total_requests: 50, total_tokens: 15000, avg_latency: 950, error_count: 0 }
        ];

        for (const stat of stats) {
            try {
                await pb.collection('ai_stats').create(stat);
                console.log(`Created stats for: ${stat.date}`);
            } catch (e) {
                console.log(`Failed to create stats: ${e.message}`);
            }
        }

        // 3. Seed Configs
        const configs = [
            { key: 'default_model', value: { model: 'gpt-3.5-turbo' }, description: 'Default model for general tasks' },
            { key: 'system_prompt', value: { text: 'You are a helpful assistant...' }, description: 'Global system prompt' }
        ];

        for (const config of configs) {
            try {
                await pb.collection('ai_configs').create(config);
                console.log(`Created config: ${config.key}`);
            } catch (e) {
                console.log(`Failed to create config: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('Failed to seed AI data:', error);
    }
}

seedAIData();
