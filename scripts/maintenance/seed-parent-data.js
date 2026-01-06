import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const PARENT_EMAIL = 'parent@school.com';
const PARENT_PASSWORD = '12345678';

async function main() {
    console.log('Starting seed script...');
    try {
        // 1. Authenticate
        try {
            await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
            console.log('Authenticated as owner.');
        } catch (e) {
            console.log('Failed to auth as owner:', e.message);
            try {
                await pb.collection('_superusers').authWithPassword('admin@growyourneed.com', 'password123');
                console.log('Authenticated as admin.');
            } catch (e2) {
                console.error('Failed to auth as admin:', e2.message);
                process.exit(1);
            }
        }

        // 2. Create Parent User
        let parent;
        try {
            parent = await pb.collection('users').getFirstListItem(`email="${PARENT_EMAIL}"`);
            console.log('Parent user already exists:', parent.id);
        } catch (e) {
            console.log('Creating parent user...');
            parent = await pb.collection('users').create({
                email: PARENT_EMAIL,
                password: PARENT_PASSWORD,
                passwordConfirm: PARENT_PASSWORD,
                name: 'Parent User',
                role: 'parent'
            });
            console.log('Created parent user:', parent.id);
        }

        // 3. Create Students (Alex, Sarah)
        const studentsData = [
            { name: 'Alex', email: 'alex@school.com' },
            { name: 'Sarah', email: 'sarah@school.com' }
        ];

        const students = [];
        for (const s of studentsData) {
            let student;
            try {
                student = await pb.collection('users').getFirstListItem(`email="${s.email}"`);
                console.log(`Student ${s.name} already exists:`, student.id);
            } catch (e) {
                console.log(`Creating student ${s.name}...`);
                try {
                    student = await pb.collection('users').create({
                        email: s.email,
                        password: 'password123',
                        passwordConfirm: 'password123',
                        name: s.name,
                        role: 'student'
                    });
                    console.log(`Created student ${s.name}:`, student.id);
                } catch (createError) {
                    console.error(`Failed to create student ${s.name}:`, createError.data);
                }
            }
            if (student) students.push(student);
        }

        // 4. Link Parent to Students
        for (const student of students) {
            try {
                await pb.collection('parent_student_links').getFirstListItem(`parent="${parent.id}" && student="${student.id}"`);
                console.log(`Link for ${student.name} already exists.`);
            } catch (e) {
                console.log(`Linking ${student.name} to parent...`);
                await pb.collection('parent_student_links').create({
                    parent: parent.id,
                    student: student.id
                });
                console.log(`Linked ${student.name} to parent.`);
            }
        }

        // 5. Create Classes & Subjects
        let mathSubject;
        try {
            mathSubject = await pb.collection('subjects').getFirstListItem('name="Mathematics"');
        } catch (e) {
            console.log('Creating Mathematics subject...');
            mathSubject = await pb.collection('subjects').create({ name: 'Mathematics', code: 'MATH101' });
        }

        let class10A;
        try {
            class10A = await pb.collection('classes').getFirstListItem('name="Class 10A"');
        } catch (e) {
            console.log('Creating Class 10A...');
            let teacher;
            try {
                // Try to find by email first to avoid duplicates
                teacher = await pb.collection('users').getFirstListItem('email="teacher@school.com"');
            } catch (e) {
                try {
                    teacher = await pb.collection('users').getFirstListItem('role="teacher"');
                } catch (e2) {
                    teacher = await pb.collection('users').create({
                        email: 'teacher@school.com',
                        password: 'password123',
                        passwordConfirm: 'password123',
                        name: 'Mr. Teacher',
                        role: 'teacher'
                    });
                }
            }
            class10A = await pb.collection('classes').create({ name: 'Class 10A', teacher: teacher.id });
        }

        // Enroll students
        for (const student of students) {
            try {
                await pb.collection('enrollments').getFirstListItem(`student="${student.id}" && class="${class10A.id}"`);
            } catch (e) {
                console.log(`Enrolling ${student.name}...`);
                await pb.collection('enrollments').create({ student: student.id, class: class10A.id });
            }
        }

        // 6. Add Grades
        let midtermExam;
        try {
            midtermExam = await pb.collection('exams').getFirstListItem(`subject="${mathSubject.id}" && name="Midterm"`);
        } catch (e) {
            console.log('Creating Midterm exam...');
            midtermExam = await pb.collection('exams').create({
                subject: mathSubject.id,
                class: class10A.id,
                name: 'Midterm',
                date: new Date().toISOString(),
                total_marks: 100
            });
        }

        for (const student of students) {
            try {
                await pb.collection('exam_results').getFirstListItem(`student="${student.id}" && exam="${midtermExam.id}"`);
                console.log(`Grade for ${student.name} already exists.`);
            } catch (e) {
                console.log(`Adding grade for ${student.name}...`);
                const score = Math.floor(Math.random() * 20) + 80;
                await pb.collection('exam_results').create({
                    student: student.id,
                    exam: midtermExam.id,
                    score: score,
                    grade: score >= 90 ? 'A' : 'B',
                    remarks: 'Good job'
                });
            }
        }

        // 7. Add Attendance
        const dates = [
            new Date(Date.now() - 86400000 * 1).toISOString(),
            new Date(Date.now() - 86400000 * 2).toISOString()
        ];

        for (const student of students) {
            for (const date of dates) {
                try {
                    const existing = await pb.collection('attendance').getList(1, 1, {
                        filter: `student="${student.id}" && date >= "${date.split('T')[0]} 00:00:00"`
                    });
                    if (existing.total === 0) {
                        console.log(`Adding attendance for ${student.name} on ${date}...`);
                        await pb.collection('attendance').create({
                            student: student.id,
                            class: class10A.id,
                            date: date,
                            status: Math.random() > 0.1 ? 'Present' : 'Absent'
                        });
                    }
                } catch (e) {
                    console.log('Error adding attendance', e.message);
                }
            }
        }

        // 8. Add Invoices
        let tuitionFee;
        try {
            tuitionFee = await pb.collection('fees').getFirstListItem('name="Tuition Fee"');
        } catch (e) {
            console.log('Creating Tuition Fee...');
            tuitionFee = await pb.collection('fees').create({ name: 'Tuition Fee', amount: 500, due_date: new Date().toISOString() });
        }

        for (const student of students) {
            try {
                await pb.collection('invoices').getFirstListItem(`student="${student.id}" && fee="${tuitionFee.id}"`);
            } catch (e) {
                console.log(`Adding invoice for ${student.name}...`);
                await pb.collection('invoices').create({
                    student: student.id,
                    fee: tuitionFee.id,
                    amount: 500,
                    status: Math.random() > 0.5 ? 'Paid' : 'Pending'
                });
            }
        }

        console.log('Parent data seeding completed!');

    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

main();
