import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateCommunicationSchema() {
    console.log('🚀 Updating Communication Schema...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    // 1. Messages
    const messagesCollection = {
        name: 'messages',
        type: 'base',
        schema: [
            { name: 'sender', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'recipient', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'content', type: 'text', required: true },
            { name: 'read_at', type: 'date' },
            { name: 'archived', type: 'bool' },
            { name: 'starred', type: 'bool' },
            { name: 'trashed', type: 'bool' },
            { name: 'attachments', type: 'json' }
        ]
    };

    try {
        await pb.collections.create(messagesCollection);
        console.log(`✅ Created collection: messages`);
    } catch (err) {
        if (err.status === 400) {
            console.log(`⚠️  Collection messages already exists.`);
            // Update schema if needed
            try {
                const col = await pb.collections.getOne('messages');
                let changed = false;
                
                if (!col.schema) {
                    col.schema = [];
                }

                const newFields = ['archived', 'starred', 'trashed'];
                for (const field of newFields) {
                    if (!col.schema.find(f => f.name === field)) {
                        col.schema.push({ name: field, type: 'bool' });
                        changed = true;
                    }
                }
                if (changed) {
                    await pb.collections.update(col.id, col);
                    console.log('✅ Updated messages schema with new fields');
                }
            } catch (e) {
                console.error('Error updating messages schema:', e);
            }
        } else {
            console.error(`❌ Failed to create collection messages:`, err.message);
        }
    }

    // 2. Notifications
    const notificationsCollection = {
        name: 'notifications',
        type: 'base',
        schema: [
            { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true } },
            { name: 'title', type: 'text', required: true },
            { name: 'message', type: 'text' },
            { name: 'type', type: 'select', options: { values: ['info', 'success', 'warning', 'error'] } },
            { name: 'is_read', type: 'bool' },
            { name: 'link', type: 'text' }
        ]
    };

    try {
        await pb.collections.create(notificationsCollection);
        console.log(`✅ Created collection: notifications`);
    } catch (err) {
        if (err.status === 400) {
            console.log(`⚠️  Collection notifications already exists.`);
        }
    }
}

updateCommunicationSchema();
