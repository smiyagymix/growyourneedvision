import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedIndividualData() {
    console.log('🚀 Seeding Individual App Data...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    // Find a user to seed data for (e.g., the first user found)
    let userId;
    try {
        const users = await pb.collection('users').getList(1, 1, { filter: 'role = "Student" || role = "Parent"' });
        if (users.items.length > 0) {
            userId = users.items[0].id;
            console.log(`Found user to seed: ${userId} (${users.items[0].email})`);
        } else {
            console.log('⚠️ No suitable user found to seed data for. Creating a test user.');
            const newUser = await pb.collection('users').create({
                email: 'test.individual@example.com',
                password: 'password123',
                passwordConfirm: 'password123',
                name: 'Test Individual',
                role: 'Student',
                status: 'active'
            });
            userId = newUser.id;
        }
    } catch (error) {
        console.error('Error finding/creating user:', error);
        return;
    }

    // Seed Courses
    const courses = [
        {
            user: userId,
            course_title: 'Introduction to Python',
            course_description: 'Learn the basics of Python programming.',
            progress: 45,
            enrolled_date: new Date().toISOString(),
            status: 'active'
        },
        {
            user: userId,
            course_title: 'Digital Marketing 101',
            course_description: 'Master the art of digital marketing.',
            progress: 100,
            enrolled_date: new Date(Date.now() - 86400000 * 30).toISOString(),
            completed_date: new Date().toISOString(),
            status: 'completed'
        },
        {
            user: userId,
            course_title: 'Financial Literacy',
            course_description: 'Manage your finances better.',
            progress: 10,
            enrolled_date: new Date().toISOString(),
            status: 'active'
        }
    ];

    for (const course of courses) {
        try {
            await pb.collection('individual_courses').create(course);
            console.log(`Created course: ${course.course_title}`);
        } catch (e) {
            console.error(`Failed to create course ${course.course_title}:`, e.message);
        }
    }

    // Seed Wellness Data (Last 7 days)
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const wellness = {
            user: userId,
            date: date.toISOString().split('T')[0],
            mood_score: Math.floor(Math.random() * 5) + 5, // 5-10
            energy_level: Math.floor(Math.random() * 5) + 5,
            stress_level: Math.floor(Math.random() * 5) + 1, // 1-6
            sleep_hours: Math.floor(Math.random() * 4) + 5, // 5-9
            water_intake: Math.floor(Math.random() * 5) + 3,
            steps: Math.floor(Math.random() * 5000) + 3000,
            exercise_minutes: Math.floor(Math.random() * 60),
            meditation_minutes: Math.floor(Math.random() * 20)
        };

        try {
            await pb.collection('wellness_data').create(wellness);
            console.log(`Created wellness data for: ${wellness.date}`);
        } catch (e) {
            console.error(`Failed to create wellness data for ${wellness.date}:`, e.message);
        }
    }

    // Seed Marketplace Orders
    const orders = [
        {
            user: userId,
            order_number: 'ORD-' + Math.floor(Math.random() * 10000),
            product_name: 'Ergonomic Chair',
            quantity: 1,
            price: 199.99,
            status: 'shipped',
            order_date: new Date(Date.now() - 86400000 * 2).toISOString(),
            tracking_number: 'TRK123456789'
        },
        {
            user: userId,
            order_number: 'ORD-' + Math.floor(Math.random() * 10000),
            product_name: 'Wireless Headphones',
            quantity: 1,
            price: 89.99,
            status: 'delivered',
            order_date: new Date(Date.now() - 86400000 * 10).toISOString(),
            tracking_number: 'TRK987654321'
        }
    ];

    for (const order of orders) {
        try {
            await pb.collection('marketplace_orders').create(order);
            console.log(`Created order: ${order.order_number}`);
        } catch (e) {
            console.error(`Failed to create order ${order.order_number}:`, e.message);
        }
    }

    console.log('✅ Seeding complete!');
}

seedIndividualData();
