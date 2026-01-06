const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function main() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        const usersCollection = await pb.collections.getOne('users');
        const usersId = usersCollection.id;

        // 1. Create gamification_rewards collection
        let rewardsId;
        try {
            const collection = await pb.collections.create({
                name: 'gamification_rewards',
                type: 'base',
                fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'cost_xp', type: 'number', required: true },
                    { name: 'category', type: 'select', values: ['Avatar', 'Theme', 'Badge', 'Power-Up'], maxSelect: 1 },
                    { name: 'icon', type: 'text', required: true },
                    { name: 'available', type: 'bool', required: true }
                ],
                listRule: "",
                viewRule: "",
                createRule: "@request.auth.role = 'Admin'",
                updateRule: "@request.auth.role = 'Admin'",
                deleteRule: "@request.auth.role = 'Admin'"
            });
            rewardsId = collection.id;
            console.log('Created gamification_rewards collection');
        } catch (e) {
            console.log('gamification_rewards collection might already exist or failed:', e.message);
            try {
                const existing = await pb.collections.getOne('gamification_rewards');
                rewardsId = existing.id;
                console.log('Retrieved existing gamification_rewards ID:', rewardsId);
            } catch (err) {
                console.error('Could not retrieve gamification_rewards:', err.message);
            }
        }

        if (!rewardsId) {
            throw new Error('Failed to get gamification_rewards ID');
        }

        // 2. Create user_rewards collection
        try {
            await pb.collections.create({
                name: 'user_rewards',
                type: 'base',
                fields: [
                    { name: 'user', type: 'relation', collectionId: usersId, required: true, cascadeDelete: true, maxSelect: 1 },
                    { name: 'reward', type: 'relation', collectionId: rewardsId, required: true, cascadeDelete: true, maxSelect: 1 },
                    { name: 'purchased_at', type: 'date' },
                    { name: 'equipped', type: 'bool' }
                ],
                listRule: "@request.auth.id = user",
                viewRule: "@request.auth.id = user",
                createRule: "@request.auth.id = user",
                updateRule: "@request.auth.id = user",
                deleteRule: "@request.auth.role = 'Admin'"
            });
            console.log('Created user_rewards collection');

            // Update rules and indexes
            const ur = await pb.collections.getOne('user_rewards');
            await pb.collections.update(ur.id, {
                indexes: [
                    'CREATE INDEX idx_ur_user ON user_rewards (user)',
                    'CREATE INDEX idx_ur_reward ON user_rewards (reward)'
                ]
            });
            console.log('Updated indexes for user_rewards');

        } catch (e) {
            console.log('user_rewards collection might already exist or failed:', e.message);
            if (e.data) console.log(JSON.stringify(e.data, null, 2));
        }

    } catch (e) {
        console.error('Failed to initialize rewards:', e);
    }
}

main();
