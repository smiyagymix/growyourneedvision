import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function setupChatSchema() {
    console.log('🚀 Setting up Chat Schema...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');

        try {
            await pb.collections.getOne('chat_messages');
            console.log('✅ Collection chat_messages exists');
        } catch (e) {
            console.log('Creating chat_messages collection...');
            await pb.collections.create({
                name: 'chat_messages',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1, required: true },
                    { name: 'role', type: 'select', options: { values: ['user', 'assistant', 'system'] }, required: true },
                    { name: 'content', type: 'text', required: true },
                    { name: 'context', type: 'text' }
                ]
            });
            console.log('✅ Created chat_messages collection');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

setupChatSchema();
