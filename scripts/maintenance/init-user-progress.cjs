const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function main() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // Get all users
        const users = await pb.collection('users').getFullList();
        console.log(`Found ${users.length} users`);

        for (const user of users) {
            try {
                // Check if user_progress exists
                const existing = await pb.collection('user_progress').getList(1, 1, {
                    filter: `user = "${user.id}"`
                });

                if (existing.items.length === 0) {
                    await pb.collection('user_progress').create({
                        user: user.id,
                        current_xp: 1,
                        level: 1,
                        streak_days: 1,
                        last_active: new Date().toISOString()
                    });
                    console.log(`Created user_progress for user: ${user.email}`);
                } else {
                    console.log(`user_progress already exists for user: ${user.email}`);
                }
            } catch (e) {
                console.error(`Error creating user_progress for ${user.email}:`, e.message);
                if (e.data) console.error(JSON.stringify(e.data, null, 2));
            }
        }

    } catch (e) {
        console.error('Failed to initialize user progress:', e);
    }
}

main();
