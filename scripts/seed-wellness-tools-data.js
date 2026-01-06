import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedWellnessToolsData() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        // Get the first user (likely the owner or a test user)
        const users = await pb.collection('users').getList(1, 1);
        if (users.items.length === 0) {
            console.log('No users found to seed data for.');
            return;
        }
        const userId = users.items[0].id;

        // 1. Seed Wellness Logs
        try {
            await pb.collection('wellness_logs').create({
                user: userId,
                date: new Date().toISOString(),
                steps: 8500,
                calories: 2100,
                sleep_minutes: 450,
                mood: 'Happy',
                meals: [
                    { name: 'Oatmeal & Berries', calories: 350, protein: 12, carbs: 45, fats: 6, time: '08:00' },
                    { name: 'Grilled Chicken Salad', calories: 450, protein: 40, carbs: 15, fats: 20, time: '13:00' }
                ]
            });
            console.log('Seeded wellness log');
        } catch (e) {
            console.log('Wellness log might already exist');
        }

        // 2. Seed Notes
        try {
            await pb.collection('notes').create({
                user: userId,
                title: 'Project Ideas',
                content: '<p>1. AI Tutor App<br>2. Sustainable Garden Tracker<br>3. Community Marketplace</p>',
                tags: ['ideas', 'dev'],
                is_pinned: true
            });
            console.log('Seeded note');
        } catch (e) {
            console.log('Note might already exist');
        }

        // 3. Seed Flashcards
        try {
            await pb.collection('flashcards').create({
                user: userId,
                deck_name: 'React Basics',
                front: 'What is a Hook?',
                back: 'A special function that lets you hook into React features.',
                difficulty: 'Easy',
                last_reviewed: new Date().toISOString()
            });
            console.log('Seeded flashcard');
        } catch (e) {
            console.log('Flashcard might already exist');
        }

        // 4. Seed Tasks
        try {
            await pb.collection('tasks').create({
                user: userId,
                content: 'Review pull requests',
                completed: false,
                priority: 'High',
                due_date: new Date(Date.now() + 86400000).toISOString()
            });
            await pb.collection('tasks').create({
                user: userId,
                content: 'Update documentation',
                completed: true,
                priority: 'Medium'
            });
            console.log('Seeded tasks');
        } catch (e) {
            console.log('Tasks might already exist');
        }

    } catch (error) {
        console.error('Failed to seed wellness & tools data:', error);
    }
}

seedWellnessToolsData();
