import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateSchoolSchemaGrades() {
    console.log('🚀 Updating School Schema for Grades...');

    // Authenticate as admin
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    const gradesCollection = {
        name: 'grades',
        type: 'base',
        schema: [
            { name: 'student', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true } },
            { name: 'class', type: 'relation', required: true, options: { collectionId: 'school_classes', cascadeDelete: true } },
            { name: 'exam', type: 'relation', required: false, options: { collectionId: 'exams', cascadeDelete: false } },
            { name: 'assignment', type: 'relation', required: false, options: { collectionId: 'assignments', cascadeDelete: false } },
            { name: 'score', type: 'number', required: true },
            { name: 'max_score', type: 'number', required: true },
            { name: 'weight', type: 'number', required: true },
            { name: 'type', type: 'select', required: true, options: { values: ['Exam', 'Assignment', 'Project', 'Participation'] } },
            { name: 'graded_by', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'graded_at', type: 'date', required: true },
            { name: 'feedback', type: 'text', required: false }
        ]
    };

    try {
        await pb.collections.create(gradesCollection);
        console.log(`✅ Created collection: grades`);
    } catch (err) {
        if (err.status === 400 && err.response?.data?.name?.message === 'Collection name must be unique (case insensitive).') {
            console.log(`⚠️  Collection grades already exists.`);
        } else {
            console.error(`❌ Failed to create collection grades:`, err.message);
        }
    }

    console.log('✨ Grades schema update complete!');
}

updateSchoolSchemaGrades();
