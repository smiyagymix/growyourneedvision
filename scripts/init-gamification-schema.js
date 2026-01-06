import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initGamificationSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Achievements
        try {
            await pb.collections.create({
                name: 'gamification_achievements',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'icon', type: 'text', required: false }, // emoji or url
                    { name: 'category', type: 'select', required: true, options: { values: ['Learning', 'Social', 'Activity', 'Milestone'] } },
                    { name: 'xp_reward', type: 'number', required: true },
                    { name: 'requirement_type', type: 'select', required: true, options: { values: ['count', 'score', 'streak'] } },
                    { name: 'requirement_value', type: 'number', required: true },
                    { name: 'rarity', type: 'select', required: true, options: { values: ['Common', 'Rare', 'Epic', 'Legendary'] } }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created gamification_achievements collection');
        } catch (e) {
            console.log('gamification_achievements collection might already exist');
        }

        // 2. User Achievements
        try {
            await pb.collections.create({
                name: 'user_achievements',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'achievement', type: 'relation', required: true, options: { collectionId: 'gamification_achievements' } },
                    { name: 'progress', type: 'number', required: false },
                    { name: 'completed', type: 'bool', required: false },
                    { name: 'unlocked_at', type: 'date', required: false }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created user_achievements collection');
        } catch (e) {
            console.log('user_achievements collection might already exist');
        }

        // 3. Rewards
        try {
            await pb.collections.create({
                name: 'gamification_rewards',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'cost_xp', type: 'number', required: true },
                    { name: 'category', type: 'select', required: true, options: { values: ['Avatar', 'Theme', 'Badge', 'Power-Up'] } },
                    { name: 'icon', type: 'text', required: false },
                    { name: 'available', type: 'bool', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created gamification_rewards collection');
        } catch (e) {
            console.log('gamification_rewards collection might already exist');
        }

        // 4. User Rewards
        try {
            await pb.collections.create({
                name: 'user_rewards',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'reward', type: 'relation', required: true, options: { collectionId: 'gamification_rewards' } },
                    { name: 'purchased_at', type: 'date', required: true },
                    { name: 'equipped', type: 'bool', required: false }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created user_rewards collection');
        } catch (e) {
            console.log('user_rewards collection might already exist');
        }

        // 5. Gamification Progress
        try {
            await pb.collections.create({
                name: 'gamification_progress',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'level', type: 'number', required: false },
                    { name: 'current_xp', type: 'number', required: false },
                    { name: 'total_xp', type: 'number', required: false },
                    { name: 'achievements_unlocked', type: 'number', required: false },
                    { name: 'streak_days', type: 'number', required: false },
                    { name: 'last_activity', type: 'date', required: false }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created gamification_progress collection');
        } catch (e) {
            console.log('gamification_progress collection might already exist');
        }

        // 6. Gamification Challenges
        try {
            await pb.collections.create({
                name: 'gamification_challenges',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'type', type: 'select', required: true, options: { values: ['Daily', 'Weekly', 'Special'] } },
                    { name: 'xp_reward', type: 'number', required: true },
                    { name: 'status', type: 'select', required: true, options: { values: ['Active', 'Expired', 'Completed'] } },
                    { name: 'expires_at', type: 'date', required: false },
                    { name: 'target_user', type: 'relation', required: false, options: { collectionId: 'users' } }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created gamification_challenges collection');
        } catch (e) {
            console.log('gamification_challenges collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init gamification schema:', error);
    }
}

initGamificationSchema();
