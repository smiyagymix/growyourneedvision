const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const achievements = [
    {
        name: "First Steps",
        description: "Complete your first mission",
        icon: "Footprints",
        category: "Milestone",
        xp_reward: 100,
        requirement_type: "count",
        requirement_value: 1,
        rarity: "Common"
    },
    {
        name: "Knowledge Seeker",
        description: "Complete 5 Learning missions",
        icon: "BookOpen",
        category: "Learning",
        xp_reward: 500,
        requirement_type: "count",
        requirement_value: 5,
        rarity: "Rare"
    },
    {
        name: "Social Butterfly",
        description: "Connect with 3 friends",
        icon: "Users",
        category: "Social",
        xp_reward: 300,
        requirement_type: "count",
        requirement_value: 3,
        rarity: "Common"
    },
    {
        name: "Streak Master",
        description: "Maintain a 7-day streak",
        icon: "Fire",
        category: "Activity",
        xp_reward: 1000,
        requirement_type: "streak",
        requirement_value: 7,
        rarity: "Epic"
    },
    {
        name: "Legendary Solver",
        description: "Fix a Legendary Glitch",
        icon: "Trophy",
        category: "Milestone",
        xp_reward: 5000,
        requirement_type: "count",
        requirement_value: 1,
        rarity: "Legendary"
    }
];

async function main() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        for (const achievement of achievements) {
            try {
                // Check if exists
                const existing = await pb.collection('gamification_achievements').getList(1, 1, {
                    filter: `name = "${achievement.name}"`
                });

                if (existing.items.length === 0) {
                    await pb.collection('gamification_achievements').create(achievement);
                    console.log(`Created achievement: ${achievement.name}`);
                } else {
                    console.log(`Achievement already exists: ${achievement.name}`);
                }
            } catch (e) {
                console.error(`Error creating ${achievement.name}:`, e.message);
                if (e.data) console.error(JSON.stringify(e.data, null, 2));
            }
        }

    } catch (e) {
        console.error('Seeding failed:', e);
        if (e.data) console.error(JSON.stringify(e.data, null, 2));
    }
}

main();
