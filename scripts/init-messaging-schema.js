import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initMessagingSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Messages
        try {
            await pb.collections.create({
                name: 'messages',
                type: 'base',
                schema: [
                    { name: 'sender', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'recipient', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'content', type: 'editor', required: true },
                    { name: 'read_at', type: 'date', required: false },
                    { name: 'archived', type: 'bool', required: false },
                    { name: 'trashed', type: 'bool', required: false },
                    { name: 'starred', type: 'bool', required: false },
                    { name: 'attachments', type: 'file', required: false, options: { maxSelect: 5 } }
                ],
                listRule: '@request.auth.id = sender.id || @request.auth.id = recipient.id',
                viewRule: '@request.auth.id = sender.id || @request.auth.id = recipient.id',
                createRule: '@request.auth.id = sender.id',
                updateRule: '@request.auth.id = sender.id || @request.auth.id = recipient.id',
                deleteRule: '@request.auth.id = sender.id || @request.auth.id = recipient.id',
            });
            console.log('Created messages collection');
        } catch (e) {
            console.log('messages collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init messaging schema:', error);
    }
}

initMessagingSchema();
