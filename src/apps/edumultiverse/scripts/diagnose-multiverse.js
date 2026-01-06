import 'dotenv/config';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function diagnose() {
    console.log("🔍 Starting EduMultiverse Diagnostic...");

    // 1. Check Connection
    try {
        const health = await pb.health.check();
        console.log("✅ PocketBase Connection: OK", health);
    } catch (e) {
        console.error("❌ PocketBase Connection: FAILED. Is the server running?");
        return;
    }

    // 2. Auth Check
    try {
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || 'Darnag123456789@'
        );
        console.log("✅ Admin Auth: OK");
    } catch (e) {
        console.error("❌ Admin Auth: FAILED. Check credentials in .env");
        return;
    }

    // 3. Schema Check
    const requiredCollections = [
        'universes',
        'timelines',
        'missions',
        'glitches',
        'multiverse_profiles',
        'mission_runs'
    ];

    console.log("\n📊 Checking Collections:");
    for (const name of requiredCollections) {
        try {
            await pb.collections.getFirstListItem(`name="${name}"`); // This is wrong, getFirstListItem searches data
            // Better way to check collection existence via API is fetching all collections or trying to get one
            // But simpler: try to fetch the collection metadata
            try {
                await pb.collections.getOne(name); // This expects ID, not name usually, but let's try finding by name in list
                // Actually, let's just list all collections and check
            } catch (err) {
                // If getOne fails, it might be ID mismatch. Let's list all.
            }
        } catch (e) {
            // ignore
        }
    }

    try {
        const collections = await pb.collections.getFullList();
        const existingNames = collections.map(c => c.name);

        for (const name of requiredCollections) {
            if (existingNames.includes(name)) {
                console.log(`  ✅ ${name}: Found`);
            } else {
                console.log(`  ❌ ${name}: MISSING`);
            }
        }
    } catch (e) {
        console.error("  ❌ Failed to list collections:", e.message);
    }

    console.log("\n🏁 Diagnostic Complete.");
}

diagnose();
