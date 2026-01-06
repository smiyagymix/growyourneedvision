import 'dotenv/config';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function setupMultiverseSchema() {
    console.log("🚀 Initializing EduMultiverse Database Setup (v2 - Fields)...");

    // Authenticate
    try {
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || 'Darnag123456789@'
        );
        console.log("✅ Authenticated");
    } catch (e) {
        console.error("❌ Auth failed.");
        return;
    }

    // Helper to get ID or create
    const collectionIds = {};

    // Get Users ID
    try {
        const users = await pb.collections.getOne('users');
        collectionIds['users'] = users.id;
        console.log(`✅ Found users collection: ${users.id}`);
    } catch (e) {
        console.error("❌ Could not find users collection!");
        return;
    }

    // Define Collections in Order
    const definitions = [
        {
            name: 'universes',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'subject', type: 'text' },
                { name: 'type', type: 'select', values: ['SchoolClass', 'SoloTrack'] },
                { name: 'owner', type: 'relation', collectionId: collectionIds['users'], cascadeDelete: false },
                { name: 'description', type: 'text' },
                { name: 'icon', type: 'text' }
            ]
        },
        {
            name: 'timelines',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'difficulty', type: 'select', values: ['Easy', 'Medium', 'Hard'] },
                { name: 'color', type: 'text' }
                // Relation to universe added dynamically below
            ]
        },
        {
            name: 'missions',
            fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'text' },
                { name: 'type', type: 'select', values: ['ParallelClass', 'GlitchHunter', 'TimeLoop', 'ConceptFusion'] },
                { name: 'xpReward', type: 'number' },
                { name: 'content', type: 'json' }
                // Relations added dynamically
            ]
        },
        {
            name: 'glitches',
            fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'brokenContent', type: 'text' },
                { name: 'correctContent', type: 'text' },
                { name: 'difficulty', type: 'number' }
                // Relation added dynamically
            ]
        },
        {
            name: 'multiverse_profiles',
            fields: [
                { name: 'user', type: 'relation', required: true, collectionId: collectionIds['users'], maxSelect: 1, cascadeDelete: false },
                { name: 'totalXP', type: 'number' },
                { name: 'level', type: 'number' },
                { name: 'streakDays', type: 'number' },
                { name: 'badges', type: 'json' }
            ]
        },
        {
            name: 'mission_runs',
            fields: [
                { name: 'student', type: 'relation', required: true, collectionId: collectionIds['users'], cascadeDelete: false },
                { name: 'score', type: 'number' },
                { name: 'status', type: 'select', values: ['completed', 'failed', 'in-progress'] },
                { name: 'completedAt', type: 'date' }
                // Mission relation added dynamically
            ]
        }
    ];

    // Execute Creation
    for (const def of definitions) {
        // Dynamic Relation Injection
        if (def.name === 'timelines') {
            def.fields.push({ name: 'universe', type: 'relation', required: true, collectionId: collectionIds['universes'], cascadeDelete: true });
        }
        if (def.name === 'missions') {
            def.fields.push({ name: 'universe', type: 'relation', required: true, collectionId: collectionIds['universes'] });
            def.fields.push({ name: 'timeline', type: 'relation', collectionId: collectionIds['timelines'] });
        }
        if (def.name === 'glitches') {
            def.fields.push({ name: 'universe', type: 'relation', required: true, collectionId: collectionIds['universes'] });
        }
        if (def.name === 'mission_runs') {
            def.fields.push({ name: 'mission', type: 'relation', required: true, collectionId: collectionIds['missions'] });
        }

        try {
            // Check if exists
            try {
                const existing = await pb.collections.getOne(def.name);
                console.log(`ℹ️ ${def.name} already exists.`);
                collectionIds[def.name] = existing.id;
            } catch (e) {
                // Create
                const col = await pb.collections.create({
                    name: def.name,
                    type: 'base',
                    fields: def.fields
                });
                console.log(`✅ Created ${def.name}`);
                collectionIds[def.name] = col.id;
            }
        } catch (e) {
            console.error(`❌ Failed to create ${def.name}:`, e.message);
            if (e.data) console.error(JSON.stringify(e.data, null, 2));
            return; // Stop if dependency fails
        }
    }

    console.log("EduMultiverse Schema Setup Complete!");
}

setupMultiverseSchema();
