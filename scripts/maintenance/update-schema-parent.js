import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateParentSchema() {
    console.log('🚀 Updating PocketBase schema for Parent/Attendance...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    // Get IDs
    const usersCol = await pb.collections.getOne('users');
    const classesCol = await pb.collections.getOne('classes');

    const newCollections = [
        {
            name: 'parent_student_links',
            type: 'base',
            schema: [
                { name: 'parent', type: 'relation', options: { collectionId: usersCol.id, cascadeDelete: false } },
                { name: 'student', type: 'relation', options: { collectionId: usersCol.id, cascadeDelete: false } },
                { name: 'relationship', type: 'text' }
            ]
        },
        {
            name: 'attendance',
            type: 'base',
            schema: [
                { name: 'student', type: 'relation', options: { collectionId: usersCol.id, cascadeDelete: false } },
                { name: 'class', type: 'relation', options: { collectionId: classesCol.id, cascadeDelete: false } },
                { name: 'date', type: 'date' },
                { name: 'status', type: 'select', options: { values: ['Present', 'Absent', 'Late', 'Excused'] } },
                { name: 'marked_by', type: 'relation', options: { collectionId: usersCol.id, cascadeDelete: false } }
            ]
        }
    ];

    for (const col of newCollections) {
        try {
            await pb.collections.create(col);
            console.log(`✅ Created collection: ${col.name}`);
        } catch (err) {
            if (err.status === 400 && err.response?.data?.name?.message === 'Collection name must be unique (case insensitive).') {
                console.log(`⚠️  Collection ${col.name} already exists.`);
            } else {
                console.error(`❌ Failed to create collection ${col.name}:`, err.message);
            }
        }
    }
    
    console.log('✨ Parent/Attendance schema update complete!');
}

updateParentSchema();
