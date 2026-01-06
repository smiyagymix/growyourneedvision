import 'dotenv/config';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function cleanup() {
    console.log("🧹 Cleaning up EduMultiverse Collections...");

    try {
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || 'Darnag123456789@'
        );
    } catch (e) {
        console.error("❌ Auth failed.");
        return;
    }

    const collections = [
        'mission_runs',
        'multiverse_profiles',
        'glitches',
        'missions',
        'timelines',
        'universes'
    ];

    for (const name of collections) {
        try {
            const col = await pb.collections.getOne(name); // Try getOne instead of getFirstListItem
            await pb.collections.delete(col.id);
            console.log(`✅ Deleted ${name}`);
        } catch (e) {
            console.log(`ℹ️ ${name} not found or already deleted.`);
        }
    }
}

cleanup();
