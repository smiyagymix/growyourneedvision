import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function fixSchema() {
    console.log('🔧 Fixing Schema Relations...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    // Get IDs
    const usersCol = await pb.collections.getOne('users');
    const classesCol = await pb.collections.getOne('classes');
    const subjectsCol = await pb.collections.getOne('subjects');
    const examsCol = await pb.collections.getOne('exams');
    const assignmentsCol = await pb.collections.getOne('assignments');

    console.log(`IDs: Users=${usersCol.id}, Classes=${classesCol.id}`);

    // 1. Fix Enrollments
    try {
        const enrollments = await pb.collections.getOne('enrollments');
        enrollments.fields = [
            { name: 'student', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: usersCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'class', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: classesCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'status', type: 'select', required: false, presentable: false, system: false, options: { values: ['Active', 'Dropped', 'Completed'], maxSelect: 1 } }
        ];
        await pb.collections.update(enrollments.id, enrollments);
        console.log('✅ Fixed enrollments schema');
    } catch (err) {
        console.error('❌ Failed to fix enrollments:', err.message);
    }

    // 2. Fix Assignments
    try {
        const assignments = await pb.collections.getOne('assignments');
        assignments.fields = [
            { name: 'title', type: 'text', required: true, presentable: false, system: false, options: { min: null, max: null, pattern: "" } },
            { name: 'description', type: 'text', required: false, presentable: false, system: false, options: { min: null, max: null, pattern: "" } },
            { name: 'due_date', type: 'date', required: false, presentable: false, system: false, options: { min: "", max: "" } },
            { name: 'class_id', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: classesCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'teacher_id', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: usersCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'points', type: 'number', required: false, presentable: false, system: false, options: { min: null, max: null, noDecimal: false } },
            { name: 'attachments', type: 'json', required: false, presentable: false, system: false, options: { maxSize: 2000000 } }
        ];
        await pb.collections.update(assignments.id, assignments);
        console.log('✅ Fixed assignments schema');
    } catch (err) {
        console.error('❌ Failed to fix assignments:', err.message);
    }

    // 3. Fix Submissions
    try {
        const submissions = await pb.collections.getOne('submissions');
        submissions.fields = [
            { name: 'assignment_id', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: assignmentsCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'student_id', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: usersCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'submitted_at', type: 'date', required: false, presentable: false, system: false, options: { min: "", max: "" } },
            { name: 'files', type: 'json', required: false, presentable: false, system: false, options: { maxSize: 2000000 } },
            { name: 'grade', type: 'number', required: false, presentable: false, system: false, options: { min: null, max: null, noDecimal: false } },
            { name: 'feedback', type: 'text', required: false, presentable: false, system: false, options: { min: null, max: null, pattern: "" } },
            { name: 'graded_by', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: usersCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'graded_at', type: 'date', required: false, presentable: false, system: false, options: { min: "", max: "" } },
            { name: 'notes', type: 'text', required: false, presentable: false, system: false, options: { min: null, max: null, pattern: "" } }
        ];
        await pb.collections.update(submissions.id, submissions);
        console.log('✅ Fixed submissions schema');
    } catch (err) {
        console.error('❌ Failed to fix submissions:', err.message);
    }

    // 4. Fix Exams
    try {
        const exams = await pb.collections.getOne('exams');
        exams.fields = [
            { name: 'name', type: 'text', required: true, presentable: false, system: false, options: { min: null, max: null, pattern: "" } },
            { name: 'date', type: 'date', required: false, presentable: false, system: false, options: { min: "", max: "" } },
            { name: 'subject', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: subjectsCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'class', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: classesCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } }
        ];
        await pb.collections.update(exams.id, exams);
        console.log('✅ Fixed exams schema');
    } catch (err) {
        console.error('❌ Failed to fix exams:', err.message);
    }

    // 5. Fix Exam Results
    try {
        const results = await pb.collections.getOne('exam_results');
        results.fields = [
            { name: 'exam', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: examsCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'student', type: 'relation', required: false, presentable: false, system: false, options: { collectionId: usersCol.id, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: null } },
            { name: 'score', type: 'number', required: false, presentable: false, system: false, options: { min: null, max: null, noDecimal: false } },
            { name: 'max_score', type: 'number', required: false, presentable: false, system: false, options: { min: null, max: null, noDecimal: false } },
            { name: 'remarks', type: 'text', required: false, presentable: false, system: false, options: { min: null, max: null, pattern: "" } }
        ];
        await pb.collections.update(results.id, results);
        console.log('✅ Fixed exam_results schema');
    } catch (err) {
        console.error('❌ Failed to fix exam_results:', err.message);
    }

    console.log('✨ Schema fix complete!');
}

fixSchema();
