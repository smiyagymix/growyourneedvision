const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function main() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        const usersCollection = await pb.collections.getOne('users');
        const usersId = usersCollection.id;
        console.log('Users collection ID:', usersId);

        // 1. Create gamification_achievements collection
        let achievementsId;
        try {
            const collection = await pb.collections.create({
                name: 'gamification_achievements',
                type: 'base',
                fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'icon', type: 'text', required: true },
                    { name: 'category', type: 'select', values: ['Learning', 'Social', 'Activity', 'Milestone'], maxSelect: 1 },
                    { name: 'xp_reward', type: 'number' },
                    { name: 'requirement_type', type: 'select', values: ['count', 'score', 'streak'], maxSelect: 1 },
                    { name: 'requirement_value', type: 'number' },
                    { name: 'rarity', type: 'select', values: ['Common', 'Rare', 'Epic', 'Legendary'], maxSelect: 1 }
                ],
                listRule: "",
                viewRule: "",
                createRule: "@request.auth.role = 'Admin'",
                updateRule: "@request.auth.role = 'Admin'",
                deleteRule: "@request.auth.role = 'Admin'"
            });
            achievementsId = collection.id;
            console.log('Created gamification_achievements collection');
        } catch (e) {
            console.log('gamification_achievements collection might already exist or failed:', e.message);
            if (e.data) console.log(JSON.stringify(e.data, null, 2));
            try {
                const existing = await pb.collections.getOne('gamification_achievements');
                achievementsId = existing.id;
                console.log('Retrieved existing gamification_achievements ID:', achievementsId);
            } catch (err) {
                console.error('Could not retrieve gamification_achievements:', err.message);
            }
        }

        if (!achievementsId) {
            throw new Error('Failed to get gamification_achievements ID');
        }

        // 2. Create user_achievements collection
        try {
            await pb.collections.create({
                name: 'user_achievements',
                type: 'base',
                fields: [
                    { name: 'user', type: 'relation', collectionId: usersId, required: true, cascadeDelete: true, maxSelect: 1 },
                    { name: 'achievement', type: 'relation', collectionId: achievementsId, required: true, cascadeDelete: true, maxSelect: 1 },
                    { name: 'unlocked_at', type: 'date' },
                    { name: 'progress', type: 'number' },
                    { name: 'completed', type: 'bool' }
                ],
                listRule: null,
                viewRule: null,
                createRule: null,
                updateRule: null,
                deleteRule: null
            });
            console.log('Created user_achievements collection');

            // Update rules and indexes
            const ua = await pb.collections.getOne('user_achievements');
            await pb.collections.update(ua.id, {
                indexes: [
                    'CREATE INDEX idx_ua_user ON user_achievements (user)',
                    'CREATE INDEX idx_ua_achievement ON user_achievements (achievement)'
                ],
                listRule: "@request.auth.id = user",
                viewRule: "@request.auth.id = user",
                createRule: "@request.auth.id = user",
                updateRule: "@request.auth.id = user",
                deleteRule: "@request.auth.role = 'Admin'"
            });
            console.log('Updated rules and indexes for user_achievements');

        } catch (e) {
            console.log('user_achievements collection might already exist or failed:', e.message);
            if (e.data) console.log(JSON.stringify(e.data, null, 2));
        }

    } catch (e) {
        console.error('Failed to initialize achievements:', e);
    }
}

main();
