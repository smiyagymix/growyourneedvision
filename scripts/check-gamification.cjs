const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function check() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated.');

        const collections = await pb.collections.getFullList();
        console.log('Collections:', collections.map(c => c.name).join(', '));

        const achievements = await pb.collection('gamification_achievements').getFullList();
        console.log('Achievements count:', achievements.length);

    } catch (e) {
        console.error('Check failed:', e);
    }
}

check();
