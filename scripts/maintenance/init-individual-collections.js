import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initIndividualCollections() {
    console.log('🚀 Initializing Individual Collections...');

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
            name: 'individual_profiles',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: true, maxSelect: 1 } },
                { name: 'bio', type: 'text' },
                { name: 'interests', type: 'json' }, // Array of strings
                { name: 'goals', type: 'json' }, // Array of objects { title, completed }
                { name: 'wellness_score', type: 'number' }
            ]
        },
        {
            name: 'learning_progress',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: true } },
                { name: 'course_name', type: 'text', required: true },
                { name: 'progress', type: 'number' }, // 0-100
                { name: 'status', type: 'select', options: { values: ['Not Started', 'In Progress', 'Completed'] } },
                { name: 'last_accessed', type: 'date' }
            ]
        },
        {
            name: 'purchases',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'item_name', type: 'text', required: true },
                { name: 'price', type: 'number' },
                { name: 'status', type: 'select', options: { values: ['Processing', 'Shipped', 'Delivered', 'Cancelled'] } },
                { name: 'tracking_number', type: 'text' }
            ]
        },
        {
            name: 'bookings',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'service_name', type: 'text', required: true },
                { name: 'date', type: 'date' },
                { name: 'status', type: 'select', options: { values: ['Confirmed', 'Pending', 'Cancelled'] } },
                { name: 'provider', type: 'text' }
            ]
        },
        {
            name: 'projects',
            type: 'base',
            schema: [
                { name: 'owner', type: 'relation', options: { collectionId: 'users', cascadeDelete: true } },
                { name: 'name', type: 'text', required: true },
                { name: 'status', type: 'select', options: { values: ['Planning', 'In Progress', 'Completed', 'On Hold'] } },
                { name: 'progress', type: 'number' },
                { name: 'thumbnail', type: 'file' },
                { name: 'description', type: 'text' }
            ]
        },
        {
            name: 'tasks',
            type: 'base',
            schema: [
                { name: 'project', type: 'relation', options: { collectionId: 'projects', cascadeDelete: true } },
                { name: 'title', type: 'text', required: true },
                { name: 'status', type: 'select', options: { values: ['To Do', 'In Progress', 'Done'] } },
                { name: 'due_date', type: 'date' },
                { name: 'assignee', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
            ]
        },
        {
            name: 'assets',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'file', type: 'file' },
                { name: 'type', type: 'select', options: { values: ['image', 'video', 'document', 'audio'] } },
                { name: 'project', type: 'relation', options: { collectionId: 'projects', cascadeDelete: false } },
                { name: 'tags', type: 'json' },
                { name: 'size', type: 'number' }
            ]
        },
        {
            name: 'templates',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'thumbnail', type: 'file' },
                { name: 'category', type: 'text' },
                { name: 'is_community', type: 'bool' },
                { name: 'data', type: 'json' }
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
    console.log('🌱 Seeding individual data...');

    // We need a user ID to seed data. We'll try to find one or create a dummy one if needed, 
    // but for this script, we'll just log that we are skipping if no user is found easily.
    // In a real scenario, we'd fetch the logged-in user or a specific test user.
    try {
        const user = await pb.collection('users').getFirstListItem('email="individual@individual.com"').catch(() => null);
        
        if (user) {
            // Seed Profile
            try {
                await pb.collection('individual_profiles').create({
                    user: user.id,
                    bio: 'Lifelong learner and wellness enthusiast.',
                    interests: ['Coding', 'Yoga', 'Gardening'],
                    goals: [{ title: 'Learn React', completed: false }, { title: 'Run 5k', completed: true }],
                    wellness_score: 85
                });
                console.log('   ✅ Seeded profile');
            } catch (e) { console.log('   ⚠️  Profile might already exist'); }

            // Seed Learning
            await pb.collection('learning_progress').create({
                user: user.id,
                course_name: 'Advanced React Patterns',
                progress: 45,
                status: 'In Progress',
                last_accessed: new Date()
            });
            console.log('   ✅ Seeded learning progress');

            // Seed Purchases
            await pb.collection('purchases').create({
                user: user.id,
                item_name: 'Yoga Mat',
                price: 29.99,
                status: 'Delivered',
                tracking_number: 'TRK123456789'
            });
            console.log('   ✅ Seeded purchases');

            // Seed Bookings
            await pb.collection('bookings').create({
                user: user.id,
                service_name: 'Personal Training Session',
                date: new Date(Date.now() + 86400000), // Tomorrow
                status: 'Confirmed',
                provider: 'FitLife Gym'
            });
            console.log('   ✅ Seeded bookings');
        } else {
            console.log('   ⚠️  Skipping data seeding: Test user "individual@test.com" not found. Run init-users.js first.');
        }

    } catch (e) {
        console.error('Error seeding data:', e);
    }

    console.log('✨ Individual collections initialization complete!');
}

initIndividualCollections();
