import PocketBase from 'pocketbase';

// Initialize PocketBase client
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const WELLNESS_LOGS = [
    { date: new Date().toISOString(), steps: 8432, calories: 2100, sleep_minutes: 450, mood: 'Happy' },
    { date: new Date(Date.now() - 86400000).toISOString(), steps: 7500, calories: 1950, sleep_minutes: 420, mood: 'Neutral' },
    { date: new Date(Date.now() - 172800000).toISOString(), steps: 9200, calories: 2300, sleep_minutes: 480, mood: 'Energetic' },
    { date: new Date(Date.now() - 259200000).toISOString(), steps: 6000, calories: 1800, sleep_minutes: 400, mood: 'Tired' },
    { date: new Date(Date.now() - 345600000).toISOString(), steps: 10500, calories: 2500, sleep_minutes: 460, mood: 'Happy' },
    { date: new Date(Date.now() - 432000000).toISOString(), steps: 11000, calories: 2600, sleep_minutes: 490, mood: 'Energetic' },
    { date: new Date(Date.now() - 518400000).toISOString(), steps: 5000, calories: 1600, sleep_minutes: 380, mood: 'Stressed' },
];

async function seedWellness() {
    console.log('🚀 Starting Wellness Data Seeding...\n');

    try {
        console.log('🔐 Authenticating as admin...');
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authentication successful\n');
    } catch (error) {
        console.error('❌ Failed to authenticate as admin.');
        process.exit(1);
    }

    // Get all non-owner users
    const users = await pb.collection('users').getFullList({
        filter: 'role != "Owner"'
    });

    console.log(`Found ${users.length} users to seed data for.`);

    for (const user of users) {
        console.log(`Processing user: ${user.email} (${user.role})`);
        
        // Check if logs already exist
        const existingLogs = await pb.collection('wellness_logs').getList(1, 1, {
            filter: `user = "${user.id}"`
        });

        if (existingLogs.totalItems > 0) {
            console.log(`   ⚠️  Logs already exist for ${user.email}, skipping...`);
            continue;
        }

        for (const log of WELLNESS_LOGS) {
            try {
                await pb.collection('wellness_logs').create({
                    ...log,
                    user: user.id
                });
            } catch (e) {
                console.error(`   ❌ Failed to create log for ${user.email}: ${e.message}`);
            }
        }
        console.log(`   ✅ Created 7 wellness logs for ${user.email}`);
    }

    console.log('\n✨ Wellness seeding complete!');
}

seedWellness();
