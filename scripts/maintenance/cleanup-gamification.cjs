const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function main() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        const collections = [
            'user_progress', 
            'user_achievements', 
            'gamification_achievements',
            'user_mission_completions',
            'user_glitch_fixes',
            'universes',
            'timelines',
            'missions',
            'glitches'
        ];
        
        for (const name of collections) {
            try {
                await pb.collections.delete(name);
                console.log(`✅ Deleted '${name}'`);
            } catch (e) {
                console.log(`⚠️  Could not delete '${name}': ${e.message}`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

main();
