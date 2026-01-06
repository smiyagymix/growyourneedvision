import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initSchoolCollections() {
    console.log('🚀 Initializing School Collections...');

    // Authenticate as admin
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    const collections = [
        {
            name: 'subjects',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'code', type: 'text', required: true },
                { name: 'credits', type: 'number' }
            ]
        },
        {
            name: 'school_classes',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'code', type: 'text' },
                { name: 'room', type: 'text' },
                { name: 'academic_year', type: 'text' },
                { name: 'teacher', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'schedule', type: 'json' }
            ]
        },
        {
            name: 'exams',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'date', type: 'date' },
                { name: 'total_marks', type: 'number' },
                { name: 'subject', type: 'relation', options: { collectionId: 'subjects', cascadeDelete: true } },
                { name: 'class', type: 'relation', options: { collectionId: 'school_classes', cascadeDelete: true } }
            ]
        },
        {
            name: 'exam_results',
            type: 'base',
            schema: [
                { name: 'exam', type: 'relation', options: { collectionId: 'exams', cascadeDelete: true } },
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: true } },
                { name: 'marks_obtained', type: 'number' },
                { name: 'grade', type: 'text' }
            ]
        },
        {
            name: 'enrollments',
            type: 'base',
            schema: [
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: true } },
                { name: 'class', type: 'relation', options: { collectionId: 'school_classes', cascadeDelete: true } },
                { name: 'enrolled_at', type: 'date' }
            ]
        },
        {
            name: 'attendance_records',
            type: 'base',
            schema: [
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'class', type: 'relation', options: { collectionId: 'school_classes', cascadeDelete: false } },
                { name: 'date', type: 'date' },
                { name: 'status', type: 'select', options: { values: ['Present', 'Absent', 'Late', 'Excused'] } }
            ]
        },
        {
            name: 'fees',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'amount', type: 'number' },
                { name: 'frequency', type: 'select', options: { values: ['One-time', 'Monthly', 'Yearly'] } },
                { name: 'due_day', type: 'number' }
            ]
        },
        {
            name: 'school_invoices',
            type: 'base',
            schema: [
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'fee', type: 'relation', options: { collectionId: 'fees', cascadeDelete: false } },
                { name: 'status', type: 'select', options: { values: ['Paid', 'Pending', 'Overdue'] } },
                { name: 'amount', type: 'number' }
            ]
        },
        {
            name: 'inquiries',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'email', type: 'email' },
                { name: 'phone', type: 'text' },
                { name: 'grade_interest', type: 'text' },
                { name: 'status', type: 'select', options: { values: ['New Inquiry', 'Contacted', 'Interview Scheduled', 'Offer Sent', 'Enrolled', 'Rejected'] } },
                { name: 'source', type: 'text' },
                { name: 'notes', type: 'text' },
                { name: 'next_follow_up', type: 'date' }
            ]
        },
        {
            name: 'interactions',
            type: 'base',
            schema: [
                { name: 'inquiry', type: 'relation', options: { collectionId: 'inquiries', cascadeDelete: false } },
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'type', type: 'select', options: { values: ['Call', 'Email', 'Meeting', 'Note'] } },
                { name: 'summary', type: 'text' },
                { name: 'details', type: 'text' },
                { name: 'date', type: 'date' },
                { name: 'logged_by', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
            ]
        },
        {
            name: 'parent_student_links',
            type: 'base',
            schema: [
                { name: 'parent', type: 'relation', options: { collectionId: 'users', cascadeDelete: true } },
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: true } },
                { name: 'relationship', type: 'text' }
            ]
        },
        {
            name: 'school_services',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'description', type: 'text' },
                { name: 'price', type: 'number' },
                { name: 'duration_minutes', type: 'number' },
                { name: 'category', type: 'select', options: { values: ['Transport', 'Canteen', 'Extra Class', 'Health'] } }
            ]
        },
        {
            name: 'school_bookings',
            type: 'base',
            schema: [
                { name: 'service', type: 'relation', options: { collectionId: 'school_services', cascadeDelete: false } },
                { name: 'parent', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'date', type: 'date' },
                { name: 'status', type: 'select', options: { values: ['Pending', 'Confirmed', 'Cancelled', 'Completed'] } },
                { name: 'notes', type: 'text' }
            ]
        },
        {
            name: 'assignments',
            type: 'base',
            schema: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'text' },
                { name: 'due_date', type: 'date' },
                { name: 'class_id', type: 'relation', options: { collectionId: 'school_classes', cascadeDelete: true } },
                { name: 'teacher_id', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'points', type: 'number' },
                { name: 'attachments', type: 'json' }
            ]
        },
        {
            name: 'submissions',
            type: 'base',
            schema: [
                { name: 'assignment_id', type: 'relation', options: { collectionId: 'assignments', cascadeDelete: true } },
                { name: 'student_id', type: 'relation', options: { collectionId: 'users', cascadeDelete: true } },
                { name: 'submitted_at', type: 'date' },
                { name: 'files', type: 'json' },
                { name: 'grade', type: 'number' },
                { name: 'feedback', type: 'text' },
                { name: 'graded_by', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
            ]
        }
    ];

    for (const col of collections) {
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

    // Seed Data
    console.log('🌱 Seeding school data...');

    try {
        // Fetch users
        const teacher = await pb.collection('users').getFirstListItem('email="teacher@school.com"').catch(() => null);
        const student = await pb.collection('users').getFirstListItem('email="student@school.com"').catch(() => null);
        const parent = await pb.collection('users').getFirstListItem('email="parent@school.com"').catch(() => null);

        if (teacher && student) {
            // Create Subject
            let subject;
            try {
                subject = await pb.collection('subjects').create({
                    name: 'Mathematics',
                    code: 'MATH101',
                    credits: 3
                });
                console.log('   ✅ Created subject: Mathematics');
            } catch (e) { 
                subject = await pb.collection('subjects').getFirstListItem('code="MATH101"').catch(() => null);
                console.log('   ⚠️  Subject Mathematics already exists'); 
            }

            // Create Class
            let schoolClass;
            try {
                schoolClass = await pb.collection('school_classes').create({
                    name: 'Grade 10-A',
                    code: '10A',
                    room: 'Room 101',
                    academic_year: '2025-2026',
                    teacher: teacher.id,
                    schedule: { "Monday": "09:00-10:00", "Wednesday": "09:00-10:00" }
                });
                console.log('   ✅ Created class: Grade 10-A');
            } catch (e) { 
                schoolClass = await pb.collection('school_classes').getFirstListItem('code="10A"').catch(() => null);
                console.log('   ⚠️  Class Grade 10-A already exists'); 
            }

            // Enroll Student
            if (schoolClass) {
                try {
                    await pb.collection('enrollments').create({
                        student: student.id,
                        class: schoolClass.id,
                        enrolled_at: new Date()
                    });
                    console.log('   ✅ Enrolled student in class');
                } catch (e) { console.log('   ⚠️  Student already enrolled'); }

                // Create Assignment
                try {
                    await pb.collection('assignments').create({
                        title: 'Algebra Homework 1',
                        description: 'Complete exercises 1-10 on page 42.',
                        due_date: new Date(Date.now() + 604800000), // +1 week
                        class_id: schoolClass.id,
                        teacher_id: teacher.id,
                        points: 100
                    });
                    console.log('   ✅ Created assignment');
                } catch (e) { console.log('   ⚠️  Assignment already exists'); }
            }

            // Link Parent
            if (parent) {
                try {
                    await pb.collection('parent_student_links').create({
                        parent: parent.id,
                        student: student.id,
                        relationship: 'Father'
                    });
                    console.log('   ✅ Linked parent and student');
                } catch (e) { console.log('   ⚠️  Parent-Student link already exists'); }
            }

        } else {
            console.log('   ⚠️  Skipping seeding: Teacher or Student user not found.');
        }

    } catch (e) {
        console.error('Error seeding data:', e);
    }

    console.log('✨ School collections initialization complete!');
}

initSchoolCollections();
