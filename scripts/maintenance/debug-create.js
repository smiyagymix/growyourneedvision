import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function debugCreate() {
    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        // Get a user
        const users = await pb.collection('users').getList(1, 1, { filter: 'role = "Student"' });
        if (users.items.length === 0) throw new Error("No students found");
        const student = users.items[0];
        console.log(`Student: ${student.id}`);

        // Get a class
        const classes = await pb.collection('classes').getList(1, 1);
        if (classes.items.length === 0) throw new Error("No classes found");
        const cls = classes.items[0];
        console.log(`Class: ${cls.id}`);

        // Try to create enrollment
        console.log("Creating enrollment...");
        const enrollment = await pb.collection('enrollments').create({
            student: student.id,
            class: cls.id,
            status: 'Active'
        });
        console.log("✅ Enrollment created:", enrollment.id);

    } catch (err) {
        console.error("❌ Failed:", err.message);
        if (err.response) console.error(JSON.stringify(err.response, null, 2));
    }
}

debugCreate();
