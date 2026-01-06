import 'dotenv/config';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function seedData() {
    console.log("🌱 Seeding EduMultiverse Data...");

    try {
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || 'Darnag123456789@'
        );
    } catch (e) {
        console.error("❌ Auth failed.");
        return;
    }

    // 1. Create Universe
    let universe;
    try {
        universe = await pb.collection('universes').create({
            name: 'Quantum Mathematics',
            subject: 'Math',
            type: 'SchoolClass',
            description: 'Master the language of the cosmos through algebra and geometry.',
            icon: '📐'
        });
        console.log("✅ Created Universe: Quantum Mathematics");
    } catch (e) {
        console.log("ℹ️ Universe might already exist, fetching...");
        universe = await pb.collection('universes').getFirstListItem('name="Quantum Mathematics"');
    }

    // 2. Create Timeline
    let timeline;
    try {
        timeline = await pb.collection('timelines').create({
            name: 'Prime Timeline',
            universe: universe.id,
            difficulty: 'Medium',
            color: '#10b981'
        });
        console.log("✅ Created Timeline: Prime Timeline");
    } catch (e) {
        console.log("ℹ️ Timeline might already exist.");
        timeline = await pb.collection('timelines').getFirstListItem(`name="Prime Timeline"`);
    }

    // 3. Create Missions
    const missions = [
        {
            title: 'Algebraic Anomalies',
            description: 'Solve the equations to stabilize the reality field.',
            type: 'ParallelClass',
            universe: universe.id,
            timeline: timeline.id,
            xpReward: 150,
            content: { difficulty: 1, topic: 'Algebra' }
        },
        {
            title: 'The Geometry Glitch',
            description: 'Find the broken polygons in the system.',
            type: 'GlitchHunter',
            universe: universe.id,
            timeline: timeline.id,
            xpReward: 300,
            content: { difficulty: 2, topic: 'Geometry' }
        }
    ];

    for (const m of missions) {
        try {
            await pb.collection('missions').create(m);
            console.log(`✅ Created Mission: ${m.title}`);
        } catch (e) {
            console.log(`ℹ️ Mission ${m.title} already exists.`);
        }
    }

    // 4. Create Glitch
    try {
        await pb.collection('glitches').create({
            title: 'Corrupted Variable',
            universe: universe.id,
            brokenContent: 'x + 5 = 2',
            correctContent: 'x + 5 = 7 (if x=2)',
            difficulty: 1
        });
        console.log("✅ Created Glitch: Corrupted Variable");
    } catch (e) {
        console.log("ℹ️ Glitch already exists.");
    }

    console.log("🌱 Seeding Complete!");
}

seedData();
