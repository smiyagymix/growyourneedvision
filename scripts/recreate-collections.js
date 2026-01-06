import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const RECREATE = [
    {
        name: 'classes',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'code', type: 'text' },
            { name: 'teacher', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } },
            { name: 'schedule', type: 'json' },
            { name: 'room', type: 'text' },
            { name: 'academic_year', type: 'text' }
        ]
    },
    {
        name: 'messages',
        type: 'base',
        schema: [
            { name: 'sender', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } },
            { name: 'recipient', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } },
            { name: 'content', type: 'text' },
            { name: 'read_at', type: 'date' },
            { name: 'attachments', type: 'file' }
        ]
    },
    {
        name: 'activities',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'type', type: 'text' },
            { name: 'location', type: 'text' },
            { name: 'schedule', type: 'json' },
            { name: 'capacity', type: 'number' },
            { name: 'organizer', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } }
        ]
    },
    {
        name: 'notifications',
        type: 'base',
        schema: [
            { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: true, maxSelect: 1 } },
            { name: 'title', type: 'text' },
            { name: 'message', type: 'text' },
            { name: 'type', type: 'text' },
            { name: 'is_read', type: 'bool' },
            { name: 'link', type: 'text' }
        ]
    }
];

async function recreateCollections() {
    console.log('🚀 Recreating specific PocketBase collections...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
    } catch (error) {
        console.error('❌ Failed to authenticate as admin:', error.message);
        process.exit(1);
    }

    for (const colDef of RECREATE) {
        try {
            console.log(`🗑️  Deleting collection: ${colDef.name}`);
            try {
                await pb.collections.delete(colDef.name);
                console.log(`   ✅ Deleted ${colDef.name}`);
            } catch (e) {
                console.log(`   ⚠️  Could not delete ${colDef.name} (maybe it didn't exist)`);
            }

            console.log(`➕ Creating collection: ${colDef.name}`);
            await pb.collections.create({
                name: colDef.name,
                type: colDef.type,
                schema: colDef.schema
            });
            console.log(`   ✅ Created ${colDef.name}`);

        } catch (error) {
            console.error(`   ❌ Error processing ${colDef.name}:`, error.message);
        }
    }
    
    console.log('\n✨ Collection recreation complete!');
}

recreateCollections().catch(console.error);
