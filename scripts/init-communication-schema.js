import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initCommunicationSchema() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Social Posts
        try {
            await pb.collections.create({
                name: 'social_posts',
                type: 'base',
                schema: [
                    { name: 'platform', type: 'select', required: true, options: { values: ['Facebook', 'Twitter', 'Instagram', 'LinkedIn'] } },
                    { name: 'content', type: 'text', required: true },
                    { name: 'scheduled_for', type: 'date', required: false },
                    { name: 'status', type: 'select', required: true, options: { values: ['Draft', 'Scheduled', 'Published'] } },
                    { name: 'image', type: 'file', required: false },
                    { name: 'likes', type: 'number', required: false },
                    { name: 'comments', type: 'number', required: false },
                    { name: 'shares', type: 'number', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created social_posts collection');
        } catch (e) {
            console.log('social_posts collection might already exist');
        }

        // 2. Community Posts
        try {
            // Get users collection ID
            const usersCollection = await pb.collections.getOne('users');
            
            // Update the existing collection to add fields
            const collection = await pb.collections.getOne('community_posts');
            
            // PocketBase JS SDK returns schema as array in .schema property
            const currentSchema = Array.isArray(collection.schema) ? collection.schema : [];

            await pb.collections.update(collection.id, {
                schema: [
                    ...currentSchema,
                    { name: 'author', type: 'relation', required: true, options: { collectionId: usersCollection.id } },
                    { name: 'likes', type: 'number', required: false },
                    { name: 'tags', type: 'json', required: false }
                ]
            });
            console.log('Updated community_posts collection');
        } catch (e) {
            console.log('Failed to update community_posts: ' + e.message);
        }

        // 3. Notifications
        try {
            await pb.collections.create({
                name: 'notifications',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'title', type: 'text', required: true },
                    { name: 'message', type: 'text', required: true },
                    { name: 'type', type: 'select', required: true, options: { values: ['info', 'success', 'warning', 'error'] } },
                    { name: 'is_read', type: 'bool', required: false },
                    { name: 'link', type: 'text', required: false }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '', // Usually created by system
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id',
            });
            console.log('Created notifications collection');
        } catch (e) {
            console.log('notifications collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init communication schema:', error);
    }
}

initCommunicationSchema();
