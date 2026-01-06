import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const COLLECTIONS = [
    {
        name: 'classes',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'room', type: 'text' },
            { name: 'teacher_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 }
        ]
    },
    {
        name: 'enrollments',
        type: 'base',
        schema: [
            { name: 'student_id', type: 'relation', collectionId: 'users', cascadeDelete: true, maxSelect: 1 },
            { name: 'class_id', type: 'relation', collectionId: 'classes', cascadeDelete: true, maxSelect: 1 },
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
            { name: 'points', type: 'number' },
            { name: 'class_id', type: 'relation', collectionId: 'classes', cascadeDelete: true, maxSelect: 1 },
            { name: 'teacher_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 }
        ]
    },
    {
        name: 'submissions',
        type: 'base',
        schema: [
            { name: 'assignment_id', type: 'relation', collectionId: 'assignments', cascadeDelete: true, maxSelect: 1 },
            { name: 'student_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'submitted_at', type: 'date' },
            { name: 'grade', type: 'number' },
            { name: 'feedback', type: 'text' },
            { name: 'graded_by', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'notes', type: 'text' }
        ]
    },
    {
        name: 'resources',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'type', type: 'select', options: { values: ['Lesson Plan', 'Worksheet', 'Video', 'Presentation', 'Guide'] } },
            { name: 'url', type: 'url' },
            { name: 'subject', type: 'text' },
            { name: 'teacher_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 }
        ]
    },
    {
        name: 'attendance',
        type: 'base',
        schema: [
            { name: 'student_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'class_id', type: 'relation', collectionId: 'classes', cascadeDelete: false, maxSelect: 1 },
            { name: 'date', type: 'date' },
            { name: 'status', type: 'select', options: { values: ['Present', 'Absent', 'Late', 'Excused'] } }
        ]
    },
    {
        name: 'messages',
        type: 'base',
        schema: [
            { name: 'sender', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'recipient', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'content', type: 'text' },
            { name: 'read_at', type: 'date' }
        ]
    }
];

async function initData() {
    console.log('🚀 Starting PocketBase data initialization...');

    try {
        // Authenticate
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Authenticated as admin');

        // 1. Create Collections
        for (const col of COLLECTIONS) {
            try {
                await pb.collections.getOne(col.name);
                console.log(`   ℹ️  Collection '${col.name}' already exists.`);
            } catch (e) {
                console.log(`   ➕ Creating collection '${col.name}'...`);
                await pb.collections.create(col);
                console.log(`   ✅ Created collection '${col.name}'`);
            }
        }

        // 2. Get Users
        const teacher = await pb.collection('users').getFirstListItem('email="teacher@school.com"');
        const student = await pb.collection('users').getFirstListItem('email="student@school.com"');
        const parent = await pb.collection('users').getFirstListItem('email="parent@school.com"');
        
        if (!teacher || !student) {
            console.error('❌ Required users not found. Run init-users.js first.');
            return;
        }

        // 3. Create Classes
        console.log('\n🌱 Seeding Classes...');
        let mathClass;
        try {
            mathClass = await pb.collection('classes').getFirstListItem('name="Mathematics 101"');
        } catch {
            mathClass = await pb.collection('classes').create({
                name: 'Mathematics 101',
                room: 'Room 304',
                teacher_id: teacher.id
            });
            console.log('   ✅ Created Class: Mathematics 101');
        }

        let scienceClass;
        try {
            scienceClass = await pb.collection('classes').getFirstListItem('name="Science 101"');
        } catch {
            scienceClass = await pb.collection('classes').create({
                name: 'Science 101',
                room: 'Lab 2',
                teacher_id: teacher.id
            });
            console.log('   ✅ Created Class: Science 101');
        }

        // 4. Create Enrollments
        console.log('\n🌱 Seeding Enrollments...');
        try {
            await pb.collection('enrollments').getFirstListItem(`student_id="${student.id}" && class_id="${mathClass.id}"`);
        } catch {
            await pb.collection('enrollments').create({
                student_id: student.id,
                class_id: mathClass.id,
                status: 'Active'
            });
            console.log('   ✅ Enrolled Student in Math');
        }

        // 5. Create Assignments
        console.log('\n🌱 Seeding Assignments...');
        let assignment;
        try {
            assignment = await pb.collection('assignments').getFirstListItem(`title="Algebra Homework 1"`);
        } catch {
            assignment = await pb.collection('assignments').create({
                title: 'Algebra Homework 1',
                description: 'Complete exercises 1-10 on page 42.',
                due_date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
                points: 100,
                class_id: mathClass.id,
                teacher_id: teacher.id
            });
            console.log('   ✅ Created Assignment: Algebra Homework 1');
        }

        // 6. Create Resources
        console.log('\n🌱 Seeding Resources...');
        try {
            await pb.collection('resources').getFirstListItem(`title="Algebra Syllabus"`);
        } catch {
            await pb.collection('resources').create({
                title: 'Algebra Syllabus',
                description: 'Course outline for the semester',
                type: 'Guide',
                subject: 'Math',
                teacher_id: teacher.id
            });
            console.log('   ✅ Created Resource: Algebra Syllabus');
        }

        // 7. Create Messages
        console.log('\n🌱 Seeding Messages...');
        try {
            await pb.collection('messages').getFirstListItem(`content~"Welcome"`);
        } catch {
            await pb.collection('messages').create({
                sender: parent.id,
                recipient: teacher.id,
                content: 'Hello, I wanted to ask about the upcoming field trip.',
                read_at: ''
            });
            await pb.collection('messages').create({
                sender: teacher.id,
                recipient: parent.id,
                content: 'Hi! Yes, the details will be sent out tomorrow.',
                read_at: ''
            });
            console.log('   ✅ Created Conversation between Parent and Teacher');
        }

        console.log('\n✨ Data initialization complete!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

initData();
