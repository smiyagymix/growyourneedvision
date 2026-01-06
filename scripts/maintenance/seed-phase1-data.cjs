/**
 * Seed Phase 1 Collections with Sample Data
 * Populates new collections with realistic test data
 * Run AFTER init-phase1-collections.js
 */

const PocketBase = require('pocketbase').default;
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Admin credentials
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

/**
 * Seed Data
 */
async function seedData() {
    try {
        console.log('🔐 Authenticating as admin...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated\n');

        // Get a test user (Individual role)
        console.log('👤 Finding Individual user...');
        const users = await pb.collection('users').getFullList({
            filter: 'role = "Individual"',
            sort: '-created'
        });

        if (users.length === 0) {
            console.log('⚠️  No Individual user found. Creating one...');
            const newUser = await pb.collection('users').create({
                email: 'individual.user@test.com',
                password: 'TestPassword123!',
                passwordConfirm: 'TestPassword123!',
                name: 'Test Individual User',
                role: 'Individual',
                verified: true
            });
            users.push(newUser);
        }

        const testUser = users[0];
        console.log(`✅ Using user: ${testUser.name} (${testUser.id})\n`);

        // 1. Seed School Settings
        console.log('🏫 Seeding school settings...');
        try {
            const existingSettings = await pb.collection('school_settings').getFullList();
            if (existingSettings.length === 0) {
                await pb.collection('school_settings').create({
                    school_name: 'Riverside Academy',
                    academic_year: '2024-2025',
                    school_address: '123 Education Street, Learning City, LC 12345',
                    school_phone: '+1 (555) 123-4567',
                    school_email: 'info@riversideacademy.edu',
                    school_website: 'https://riversideacademy.edu',
                    principal_name: 'Dr. Sarah Johnson',
                    timezone: 'America/New_York',
                    locale: 'en-US',
                    currency: 'USD',
                    grading_scale: 'letter',
                    term_system: 'semester',
                    enable_parent_portal: true,
                    enable_online_payments: true,
                    enable_gradebook: true,
                    enable_attendance: true,
                    enable_messaging: true,
                    attendance_grace_period_minutes: 15,
                    mark_absent_after_minutes: 30,
                    passing_grade: 70,
                    honor_roll_threshold: 90
                });
                console.log('✅ School settings created\n');
            } else {
                console.log('⚠️  School settings already exist\n');
            }
        } catch (error) {
            console.error('❌ Error seeding school settings:', error.message);
        }

        // 2. Seed Individual Courses
        console.log('📚 Seeding individual courses...');
        const courses = [
            {
                user: testUser.id,
                course_title: 'Complete Web Development Bootcamp',
                course_description: 'Learn HTML, CSS, JavaScript, React, Node.js, and more',
                progress: 65,
                enrolled_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'active'
            },
            {
                user: testUser.id,
                course_title: 'Advanced Python Programming',
                course_description: 'Master Python with advanced techniques and best practices',
                progress: 45,
                enrolled_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'active'
            },
            {
                user: testUser.id,
                course_title: 'Introduction to Machine Learning',
                course_description: 'Fundamentals of ML algorithms and applications',
                progress: 100,
                enrolled_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                completed_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'completed'
            }
        ];

        for (const course of courses) {
            try {
                await pb.collection('individual_courses').create(course);
                console.log(`   ✅ Created: ${course.course_title}`);
            } catch (error) {
                if (error.message.includes('duplicate')) {
                    console.log(`   ⚠️  Skipped (exists): ${course.course_title}`);
                } else {
                    console.error(`   ❌ Error: ${error.message}`);
                }
            }
        }
        console.log('');

        // 3. Seed Wellness Data (last 7 days)
        console.log('💪 Seeding wellness data...');
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            try {
                await pb.collection('wellness_data').create({
                    user: testUser.id,
                    date: dateStr,
                    mood_score: Math.floor(Math.random() * 3) + 7, // 7-9
                    energy_level: Math.floor(Math.random() * 3) + 6, // 6-8
                    stress_level: Math.floor(Math.random() * 3) + 3, // 3-5
                    sleep_hours: Math.random() * 2 + 6.5, // 6.5-8.5
                    water_intake: Math.floor(Math.random() * 4) + 6, // 6-9 glasses
                    steps: Math.floor(Math.random() * 5000) + 7000, // 7000-12000
                    exercise_minutes: Math.floor(Math.random() * 40) + 20, // 20-60
                    meditation_minutes: Math.floor(Math.random() * 15) + 5 // 5-20
                });
                console.log(`   ✅ Created wellness data for ${dateStr}`);
            } catch (error) {
                console.log(`   ⚠️  Skipped ${dateStr} (may exist)`);
            }
        }
        console.log('');

        // 4. Seed Marketplace Orders
        console.log('🛒 Seeding marketplace orders...');
        const orders = [
            {
                user: testUser.id,
                order_number: 'ORD-2024-001',
                product_name: 'Wireless Bluetooth Headphones',
                quantity: 1,
                price: 79.99,
                status: 'delivered',
                order_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tracking_number: 'TRK1234567890'
            },
            {
                user: testUser.id,
                order_number: 'ORD-2024-002',
                product_name: 'Ergonomic Office Chair',
                quantity: 1,
                price: 249.99,
                status: 'shipped',
                order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tracking_number: 'TRK0987654321'
            },
            {
                user: testUser.id,
                order_number: 'ORD-2024-003',
                product_name: 'Standing Desk Converter',
                quantity: 1,
                price: 159.99,
                status: 'processing',
                order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ];

        for (const order of orders) {
            try {
                await pb.collection('marketplace_orders').create(order);
                console.log(`   ✅ Created order: ${order.order_number}`);
            } catch (error) {
                console.log(`   ⚠️  Skipped ${order.order_number}`);
            }
        }
        console.log('');

        // 5. Seed Service Bookings
        console.log('📅 Seeding service bookings...');
        const bookings = [
            {
                user: testUser.id,
                service_name: 'Career Coaching Session',
                service_provider: 'Jane Smith, Career Coach',
                booking_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                booking_time: '14:00',
                duration_minutes: 60,
                status: 'upcoming',
                price: 150.00,
                location: 'Virtual (Zoom)'
            },
            {
                user: testUser.id,
                service_name: 'Personal Fitness Training',
                service_provider: 'Mike Johnson, Personal Trainer',
                booking_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                booking_time: '10:00',
                duration_minutes: 45,
                status: 'upcoming',
                price: 80.00,
                location: 'FitLife Gym, Studio B'
            }
        ];

        for (const booking of bookings) {
            try {
                await pb.collection('service_bookings').create(booking);
                console.log(`   ✅ Created booking: ${booking.service_name}`);
            } catch (error) {
                console.log(`   ⚠️  Skipped ${booking.service_name}`);
            }
        }
        console.log('');

        // 6. Seed Recommendations
        console.log('💡 Seeding recommendations...');
        const recommendations = [
            {
                user: null, // General recommendation
                item_type: 'course',
                title: 'Advanced React Patterns',
                description: 'Master advanced React concepts including hooks, context, and performance optimization',
                image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
                price: 89.99,
                category: 'Programming',
                score: 95
            },
            {
                user: null,
                item_type: 'product',
                title: 'Home Gardening Starter Kit',
                description: 'Everything you need to start your indoor garden',
                image_url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400',
                price: 49.99,
                category: 'Hobbies',
                score: 88
            },
            {
                user: testUser.id, // Personalized recommendation
                item_type: 'course',
                title: 'Data Science with Python',
                description: 'Based on your completed ML course, continue your data science journey',
                image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
                price: 99.99,
                category: 'Programming',
                score: 98
            }
        ];

        for (const rec of recommendations) {
            try {
                await pb.collection('recommendations').create(rec);
                console.log(`   ✅ Created recommendation: ${rec.title}`);
            } catch (error) {
                console.log(`   ⚠️  Skipped ${rec.title}`);
            }
        }
        console.log('');

        // 7. Seed Individual Goals
        console.log('🎯 Seeding goals...');
        const goals = [
            {
                user: testUser.id,
                goal_text: 'Complete 3 Lessons',
                goal_type: 'daily',
                is_completed: true,
                completed_date: new Date().toISOString().split('T')[0]
            },
            {
                user: testUser.id,
                goal_text: 'Walk 10,000 Steps',
                goal_type: 'daily',
                is_completed: false
            },
            {
                user: testUser.id,
                goal_text: 'Read 20 Pages',
                goal_type: 'daily',
                is_completed: false
            },
            {
                user: testUser.id,
                goal_text: 'Finish Current Course',
                goal_type: 'monthly',
                is_completed: false,
                due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        ];

        for (const goal of goals) {
            try {
                await pb.collection('individual_goals').create(goal);
                console.log(`   ✅ Created goal: ${goal.goal_text}`);
            } catch (error) {
                console.log(`   ⚠️  Skipped ${goal.goal_text}`);
            }
        }
        console.log('');

        console.log('\n🎉 Seeding complete!');
        console.log('\n📊 Summary:');
        console.log(`   - School Settings: 1 record`);
        console.log(`   - Courses: ${courses.length} records`);
        console.log(`   - Wellness Data: 7 days`);
        console.log(`   - Orders: ${orders.length} records`);
        console.log(`   - Bookings: ${bookings.length} records`);
        console.log(`   - Recommendations: ${recommendations.length} records`);
        console.log(`   - Goals: ${goals.length} records`);
        console.log(`\n✨ Test user: ${testUser.email}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run seeding
seedData();
