import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedAcademics() {
    console.log('🚀 Seeding Academic Data...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    // 1. Get Users
    const teachers = await pb.collection('users').getFullList({ filter: 'role = "Teacher"' });
    const students = await pb.collection('users').getFullList({ filter: 'role = "Student"' });

    if (teachers.length === 0 || students.length === 0) {
        console.error('❌ No teachers or students found. Run init-users.js first.');
        return;
    }

    const teacher = teachers[0];
    console.log(`👨‍🏫 Using Teacher: ${teacher.name}`);

    // 2. Create Classes
    const classNames = ['Mathematics 101', 'Physics A', 'History of Art'];
    const createdClasses = [];

    for (const name of classNames) {
        try {
            // Check if exists
            const existing = await pb.collection('classes').getList(1, 1, { filter: `name = "${name}"` });
            if (existing.items.length > 0) {
                console.log(`   ⚠️ Class ${name} already exists.`);
                createdClasses.push(existing.items[0]);
                continue;
            }

            const cls = await pb.collection('classes').create({
                name: name,
                teacher: teacher.id,
                room: `Room ${Math.floor(Math.random() * 100) + 100}`,
                schedule: new Date().toISOString()
            });
            console.log(`   ✅ Created Class: ${name}`);
            createdClasses.push(cls);
        } catch (err) {
            console.error(`   ❌ Failed to create class ${name}:`, err.message);
        }
    }

    // 3. Enroll Students
    for (const cls of createdClasses) {
        for (const student of students.slice(0, 5)) { // Enroll first 5 students
            try {
                // Check enrollment
                // const existing = await pb.collection('enrollments').getList(1, 1, { 
                //     filter: `class = "${cls.id}" && student = "${student.id}"` 
                // });
                // if (existing.items.length > 0) continue;

                const payload = {
                    class: cls.id,
                    student: student.id,
                    status: 'Active'
                };
                console.log(`   Payload: ${JSON.stringify(payload)}`);

                await pb.collection('enrollments').create(payload);
                console.log(`   🎓 Enrolled ${student.name} in ${cls.name}`);
            } catch (err) {
                console.error(`   ❌ Failed to enroll student:`, err.message);
                console.error(JSON.stringify(err.response, null, 2));
            }
        }
    }

    // 4. Create Assignments
    const assignments = [
        { title: 'Algebra Quiz', description: 'Solve chapter 1 problems', points: 100, due_offset: 2 }, // Due in 2 days
        { title: 'Physics Lab Report', description: 'Report on gravity experiment', points: 50, due_offset: -1 }, // Overdue
        { title: 'Art Essay', description: 'Renaissance period analysis', points: 20, due_offset: 5 }
    ];

    for (const cls of createdClasses) {
        for (const assign of assignments) {
            try {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + assign.due_offset);

                // Check if exists
                // const existing = await pb.collection('assignments').getList(1, 1, { 
                //     filter: `title = "${assign.title}" && class_id = "${cls.id}"` 
                // });
                // if (existing.items.length > 0) continue;

                await pb.collection('assignments').create({
                    title: assign.title,
                    description: assign.description,
                    due_date: dueDate.toISOString(),
                    class_id: cls.id,
                    teacher_id: teacher.id,
                    points: assign.points
                });
                console.log(`   📝 Created Assignment: ${assign.title} for ${cls.name}`);
            } catch (err) {
                console.error(`   ❌ Failed to create assignment:`, err.message);
                console.error(JSON.stringify(err.response, null, 2));
            }
        }
    }

    console.log('✨ Academic seeding complete!');
}

seedAcademics();
