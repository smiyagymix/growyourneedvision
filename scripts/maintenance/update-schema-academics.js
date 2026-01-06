import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateSchema() {
    console.log('🚀 Updating PocketBase schema for Academics...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    const newCollections = [
        {
            name: 'subjects',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'code', type: 'text' },
                { name: 'description', type: 'text' }
            ]
        },
        {
            name: 'enrollments',
            type: 'base',
            schema: [
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'class', type: 'relation', options: { collectionId: 'classes', cascadeDelete: false } },
                { name: 'status', type: 'select', options: { values: ['Active', 'Dropped', 'Completed'] } }
            ]
        },
        {
            name: 'assignments',
            type: 'base',
            schema: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'text' },
                { name: 'due_date', type: 'date' },
                { name: 'class_id', type: 'relation', options: { collectionId: 'classes', cascadeDelete: false } },
                { name: 'teacher_id', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'points', type: 'number' },
                { name: 'attachments', type: 'json' } // Array of file URLs or paths
            ]
        },
        {
            name: 'submissions',
            type: 'base',
            schema: [
                { name: 'assignment_id', type: 'relation', options: { collectionId: 'assignments', cascadeDelete: false } },
                { name: 'student_id', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'submitted_at', type: 'date' },
                { name: 'files', type: 'json' },
                { name: 'grade', type: 'number' },
                { name: 'feedback', type: 'text' },
                { name: 'graded_by', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'graded_at', type: 'date' },
                { name: 'notes', type: 'text' }
            ]
        },
        {
            name: 'exams',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'date', type: 'date' },
                { name: 'subject', type: 'relation', options: { collectionId: 'subjects', cascadeDelete: false } },
                { name: 'class', type: 'relation', options: { collectionId: 'classes', cascadeDelete: false } }
            ]
        },
        {
            name: 'exam_results',
            type: 'base',
            schema: [
                { name: 'exam', type: 'relation', options: { collectionId: 'exams', cascadeDelete: false } },
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'score', type: 'number' },
                { name: 'max_score', type: 'number' },
                { name: 'remarks', type: 'text' }
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
    
    console.log('✨ Academic schema update complete!');
}

updateSchema();
