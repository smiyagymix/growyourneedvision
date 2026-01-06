const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function createCommunicationCollections() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);

        // --- Messages Collection ---
        console.log('Checking messages collection...');
        try {
            await pb.collections.getFirstListItem('messages', '');
            console.log('ℹ️  Messages collection already exists');
        } catch (e) {
            try {
                await pb.collections.getOne('messages');
                console.log('ℹ️  Messages collection already exists');
            } catch (err) {
                console.log('Creating messages collection...');
                try {
                    await pb.collections.create({
                        name: 'messages',
                        type: 'base',
                        schema: [
                            {
                                name: 'sender',
                                type: 'relation',
                                required: true,
                                options: {
                                    collectionId: (await pb.collections.getOne('users')).id,
                                    cascadeDelete: false,
                                    maxSelect: 1
                                }
                            },
                            {
                                name: 'recipient',
                                type: 'relation',
                                required: true,
                                options: {
                                    collectionId: (await pb.collections.getOne('users')).id,
                                    cascadeDelete: false,
                                    maxSelect: 1
                                }
                            },
                            {
                                name: 'content',
                                type: 'text',
                                required: true,
                                options: {
                                    min: 1,
                                    max: 10000
                                }
                            },
                            {
                                name: 'read_at',
                                type: 'date',
                                required: false
                            },
                            {
                                name: 'archived',
                                type: 'bool',
                                required: false
                            },
                            {
                                name: 'trashed',
                                type: 'bool',
                                required: false
                            },
                            {
                                name: 'starred',
                                type: 'bool',
                                required: false
                            },
                            {
                                name: 'attachments',
                                type: 'file',
                                required: false,
                                options: {
                                    maxSelect: 5,
                                    maxSize: 5242880,
                                    mimeTypes: [],
                                    thumbs: []
                                }
                            }
                        ],
                        listRule: 'sender = @request.auth.id || recipient = @request.auth.id',
                        viewRule: 'sender = @request.auth.id || recipient = @request.auth.id',
                        createRule: 'sender = @request.auth.id',
                        updateRule: 'sender = @request.auth.id || recipient = @request.auth.id',
                        deleteRule: 'sender = @request.auth.id || recipient = @request.auth.id'
                    });
                    console.log('✅ Messages collection created');
                } catch (createError) {
                    console.error('❌ Failed to create messages collection:', createError.message);
                }
            }
        }

        // --- Notifications Collection ---
        console.log('Checking notifications collection...');
        try {
            await pb.collections.getFirstListItem('notifications', '');
            console.log('ℹ️  Notifications collection already exists');
        } catch (e) {
            try {
                await pb.collections.getOne('notifications');
                console.log('ℹ️  Notifications collection already exists');
            } catch (err) {
                console.log('Creating notifications collection...');
                try {
                    await pb.collections.create({
                        name: 'notifications',
                        type: 'base',
                        schema: [
                            {
                                name: 'user',
                                type: 'relation',
                                required: true,
                                options: {
                                    collectionId: (await pb.collections.getOne('users')).id,
                                    cascadeDelete: true,
                                    maxSelect: 1
                                }
                            },
                            {
                                name: 'title',
                                type: 'text',
                                required: true,
                                options: { max: 200 }
                            },
                            {
                                name: 'message',
                                type: 'text',
                                required: true,
                                options: { max: 1000 }
                            },
                            {
                                name: 'type',
                                type: 'select',
                                required: true,
                                options: {
                                    maxSelect: 1,
                                    values: ['info', 'success', 'warning', 'error']
                                }
                            },
                            {
                                name: 'is_read',
                                type: 'bool',
                                required: false
                            },
                            {
                                name: 'link',
                                type: 'text',
                                required: false,
                                options: { max: 500 }
                            }
                        ],
                        listRule: 'user = @request.auth.id',
                        viewRule: 'user = @request.auth.id',
                        createRule: null, // Only system/admin creates notifications usually
                        updateRule: 'user = @request.auth.id',
                        deleteRule: 'user = @request.auth.id'
                    });
                    console.log('✅ Notifications collection created');
                } catch (createError) {
                    console.error('❌ Failed to create notifications collection:', createError.message);
                }
            }
        }

        // --- Social Posts Collection ---
        console.log('Checking social_posts collection...');
        try {
            await pb.collections.getFirstListItem('social_posts', '');
            console.log('ℹ️  Social Posts collection already exists');
        } catch (e) {
            try {
                await pb.collections.getOne('social_posts');
                console.log('ℹ️  Social Posts collection already exists');
            } catch (err) {
                console.log('Creating social_posts collection...');
                try {
                    await pb.collections.create({
                        name: 'social_posts',
                        type: 'base',
                        schema: [
                            {
                                name: 'platform',
                                type: 'select',
                                required: true,
                                options: {
                                    maxSelect: 1,
                                    values: ['Facebook', 'Twitter', 'Instagram', 'LinkedIn']
                                }
                            },
                            {
                                name: 'content',
                                type: 'text',
                                required: true,
                                options: { max: 2000 }
                            },
                            {
                                name: 'scheduled_for',
                                type: 'date',
                                required: false
                            },
                            {
                                name: 'status',
                                type: 'select',
                                required: true,
                                options: {
                                    maxSelect: 1,
                                    values: ['Draft', 'Scheduled', 'Published']
                                }
                            },
                            {
                                name: 'image',
                                type: 'file',
                                required: false,
                                options: {
                                    maxSelect: 1,
                                    maxSize: 5242880,
                                    mimeTypes: ['image/*'],
                                    thumbs: []
                                }
                            },
                            {
                                name: 'likes',
                                type: 'number',
                                required: false
                            },
                            {
                                name: 'comments',
                                type: 'number',
                                required: false
                            },
                            {
                                name: 'shares',
                                type: 'number',
                                required: false
                            }
                        ],
                        listRule: '@request.auth.id != ""',
                        viewRule: '@request.auth.id != ""',
                        createRule: '@request.auth.id != ""',
                        updateRule: '@request.auth.id != ""',
                        deleteRule: '@request.auth.id != ""'
                    });
                    console.log('✅ Social Posts collection created');
                } catch (createError) {
                    console.error('❌ Failed to create social_posts collection:', createError.message);
                }
            }
        }

        // --- Community Posts Collection ---
        console.log('Checking posts collection...');
        try {
            await pb.collections.getFirstListItem('posts', '');
            console.log('ℹ️  Posts collection already exists');
        } catch (e) {
            try {
                await pb.collections.getOne('posts');
                console.log('ℹ️  Posts collection already exists');
            } catch (err) {
                console.log('Creating posts collection...');
                try {
                    await pb.collections.create({
                        name: 'posts',
                        type: 'base',
                        schema: [
                            {
                                name: 'title',
                                type: 'text',
                                required: true,
                                options: { max: 200 }
                            },
                            {
                                name: 'content',
                                type: 'text',
                                required: true,
                                options: { max: 5000 }
                            },
                            {
                                name: 'author',
                                type: 'relation',
                                required: true,
                                options: {
                                    collectionId: (await pb.collections.getOne('users')).id,
                                    cascadeDelete: true,
                                    maxSelect: 1
                                }
                            },
                            {
                                name: 'likes',
                                type: 'number',
                                required: false
                            },
                            {
                                name: 'tags',
                                type: 'json',
                                required: false
                            }
                        ],
                        listRule: '@request.auth.id != ""',
                        viewRule: '@request.auth.id != ""',
                        createRule: '@request.auth.id != ""',
                        updateRule: 'author = @request.auth.id',
                        deleteRule: 'author = @request.auth.id'
                    });
                    console.log('✅ Posts collection created');
                } catch (createError) {
                    console.error('❌ Failed to create posts collection:', createError.message);
                }
            }
        }

        console.log('\n✅ All communication collections setup complete!');

    } catch (error) {
        console.error('❌ Error setting up collections:', error);
        process.exit(1);
    }
}

createCommunicationCollections()
    .then(() => {
        console.log('\n✅ Script finished successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Script failed:', err);
        process.exit(1);
    });
