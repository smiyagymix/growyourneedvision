import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function resetAcademics() {
    console.log('♻️ Resetting Academic Collections...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    const collectionsToDelete = ['enrollments', 'assignments', 'submissions', 'exams', 'exam_results'];
    
    for (const name of collectionsToDelete) {
        try {
            await pb.collections.delete(name);
            console.log(`🗑️ Deleted collection: ${name}`);
        } catch (err) {
            console.log(`   Collection ${name} not found or already deleted.`);
        }
    }

    // Get IDs
    const usersCol = await pb.collections.getOne('users');
    const classesCol = await pb.collections.getOne('classes');
    const subjectsCol = await pb.collections.getOne('subjects');

    console.log(`IDs: Users=${usersCol.id}, Classes=${classesCol.id}`);

    // Recreate with correct IDs
    const newCollections = [
        {
            name: 'enrollments',
            type: 'base',
            schema: [
                { name: 'student', type: 'relation', options: { collectionId: usersCol.id, cascadeDelete: false } },
                { name: 'class', type: 'relation', options: { collectionId: classesCol.id, cascadeDelete: false } },
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
                { name: 'class_id', type: 'relation', options: { collectionId: classesCol.id, cascadeDelete: false } },
                { name: 'teacher_id', type: 'relation', options: { collectionId: usersCol.id, cascadeDelete: false } },
                { name: 'points', type: 'number' },
                { name: 'attachments', type: 'json' }
            ]
        },
        {
            name: 'exams',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'date', type: 'date' },
                { name: 'subject', type: 'relation', options: { collectionId: subjectsCol.id, cascadeDelete: false } },
                { name: 'class', type: 'relation', options: { collectionId: classesCol.id, cascadeDelete: false } }
            ]
        }
    ];

    for (const col of newCollections) {
        try {
            await pb.collections.create(col);
            console.log(`✅ Created collection: ${col.name}`);
        } catch (err) {
            console.error(`❌ Failed to create collection ${col.name}:`, err.message);
        }
    }

    // Need assignments ID for submissions
    const assignmentsCol = await pb.collections.getOne('assignments');
    const examsCol = await pb.collections.getOne('exams');

    const dependentCollections = [
        {
            name: 'submissions',
            type: 'base',
            schema: [
                { name: 'assignment_id', type: 'relation', options: { collectionId: assignmentsCol.id, cascadeDelete: false } },
                { name: 'student_id', type: 'relation', options: { collectionId: usersCol.id, cascadeDelete: false } },
                { name: 'submitted_at', type: 'date' },
                { name: 'files', type: 'json' },
                { name: 'grade', type: 'number' },
                { name: 'feedback', type: 'text' },
                { name: 'graded_by', type: 'relation', options: { collectionId: usersCol.id, cascadeDelete: false } },
                { name: 'graded_at', type: 'date' },
                { name: 'notes', type: 'text' }
            ]
        },
        {
            name: 'exam_results',
            type: 'base',
            schema: [
                { name: 'exam', type: 'relation', options: { collectionId: examsCol.id, cascadeDelete: false } },
                { name: 'student', type: 'relation', options: { collectionId: usersCol.id, cascadeDelete: false } },
                { name: 'score', type: 'number' },
                { name: 'max_score', type: 'number' },
                { name: 'remarks', type: 'text' }
            ]
        }
    ];

    for (const col of dependentCollections) {
        try {
            await pb.collections.create(col);
            console.log(`✅ Created collection: ${col.name}`);
        } catch (err) {
            console.error(`❌ Failed to create collection ${col.name}:`, err.message);
        }
    }

    console.log('✨ Reset complete!');
}

resetAcademics();
