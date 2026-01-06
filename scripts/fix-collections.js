import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const UPDATES = [
    {
        name: 'classes',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'code', type: 'text' },
            { name: 'teacher', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'schedule', type: 'json' },
            { name: 'room', type: 'text' },
            { name: 'academic_year', type: 'text' }
        ]
    },
    {
        name: 'messages',
        schema: [
            { name: 'sender', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'recipient', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'content', type: 'text' },
            { name: 'read_at', type: 'date' },
            { name: 'attachments', type: 'file' }
        ]
    },
    {
        name: 'activities',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'type', type: 'text' },
            { name: 'location', type: 'text' },
            { name: 'schedule', type: 'json' },
            { name: 'capacity', type: 'number' },
            { name: 'organizer', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
        ]
    }
];

async function fixCollections() {
    console.log('🚀 Starting PocketBase collection fix...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
    } catch (error) {
        console.error('❌ Failed to authenticate as admin:', error.message);
        process.exit(1);
    }

    for (const update of UPDATES) {
        try {
            console.log(`🔧 Fixing collection: ${update.name}`);
            const collection = await pb.collections.getOne(update.name);
            
            // We will merge the new schema into the existing one
            // Or rather, we will ensure all fields in our definition exist
            
            const existingFields = collection.fields || collection.schema || [];
            const newFields = update.schema;
            
            let changed = false;
            
            for (const field of newFields) {
                const exists = existingFields.find(f => f.name === field.name);
                if (!exists) {
                    console.log(`   ➕ Adding field: ${field.name}`);
                    existingFields.push(field);
                    changed = true;
                } else {
                    // Optional: Update type if different? 
                    // For now, we assume if it exists it's fine, unless we want to force update
                }
            }
            
            if (changed) {
                if (collection.fields) collection.fields = existingFields;
                else collection.schema = existingFields;
                
                await pb.collections.update(collection.id, collection);
                console.log(`   ✅ Updated schema for ${update.name}`);
            } else {
                console.log(`   ✅ Schema for ${update.name} is already up to date (or compatible)`);
            }

        } catch (error) {
            console.error(`   ❌ Error fixing ${update.name}:`, error.message);
        }
    }
    
    console.log('\n✨ Collection fix complete!');
}

fixCollections().catch(console.error);
