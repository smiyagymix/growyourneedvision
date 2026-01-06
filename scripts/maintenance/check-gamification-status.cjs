const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function main() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        const collections = ['user_progress', 'user_achievements', 'gamification_achievements'];
        
        for (const name of collections) {
            try {
                const col = await pb.collections.getOne(name);
                console.log(`✅ Collection '${name}' exists (ID: ${col.id})`);
                console.log(JSON.stringify(col, null, 2));
            } catch (e) {
                console.log(`❌ Collection '${name}' does not exist (Status: ${e.status})`);
                if (e.status !== 404) console.log(e);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

main();
