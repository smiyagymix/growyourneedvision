const PocketBase = require('pocketbase').default;
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function seedExtras() {
    try {
        console.log('🔐 Authenticating...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated\n');

        // 1. Update Missions Collection Schema to support new types
        console.log('🔄 Updating Missions Schema...');
        try {
            const collection = await pb.collections.getOne('missions');
            const typeField = collection.schema.find(f => f.name === 'type');
            if (typeField) {
                // Add new types if not present
                const currentOptions = typeField.options.values || [];
                const newTypes = ['TimeLoop', 'GlitchHunter', 'ConceptFusion', 'QuantumQuiz'];
                const updatedOptions = [...new Set([...currentOptions, ...newTypes])];
                
                typeField.options.values = updatedOptions;
                
                await pb.collections.update(collection.id, {
                    schema: collection.schema
                });
                console.log('✅ Missions Schema Updated');
            }
        } catch (e) {
            console.error('⚠️ Failed to update schema (might already be correct or permission issue):', e.message);
        }

        // 2. Create Time Loop Mission
        console.log('\n⏳ Creating Time Loop Mission...');
        const universes = await pb.collection('universes').getFullList();
        if (universes.length > 0) {
            const universeId = universes[0].id; // Just pick the first one
            
            try {
                await pb.collection('missions').create({
                    title: "The Infinite Loop",
                    description: "You are trapped in a time loop. Solve the logic puzzle to break free.",
                    type: "TimeLoop",
                    universe: universeId,
                    xp_reward: 500,
                    content: {
                        puzzle: "logic_gate",
                        difficulty: 3
                    },
                    status: "available"
                });
                console.log('✅ Time Loop Mission Created');
            } catch (e) {
                console.log('ℹ️ Time Loop Mission might already exist or failed:', e.message);
            }
        } else {
            console.log('⚠️ No universes found, skipping mission creation');
        }

        // 3. Create Glitches
        console.log('\n👾 Creating Glitches...');
        const glitches = [
            {
                title: "Corrupted Variable",
                description: "A variable in the physics engine is undefined.",
                broken_content: "const gravity = undefined;",
                correct_content: "const gravity = 9.81;",
                difficulty: 1,
                xp_reward: 50,
                is_active: true,
                universe: universes[0]?.id
            },
            {
                title: "Infinite Loop",
                description: "A while loop has no exit condition.",
                broken_content: "while(true) { console.log('running'); }",
                correct_content: "while(isRunning) { console.log('running'); isRunning = false; }",
                difficulty: 2,
                xp_reward: 100,
                is_active: true,
                universe: universes[0]?.id
            },
            {
                title: "Memory Leak",
                description: "Event listeners are not being removed.",
                broken_content: "useEffect(() => { window.addEventListener('resize', handleResize); }, []);",
                correct_content: "useEffect(() => { window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);",
                difficulty: 3,
                xp_reward: 150,
                is_active: true,
                universe: universes[0]?.id
            }
        ];

        for (const glitch of glitches) {
            if (!glitch.universe) continue;
            try {
                // Check if exists
                const existing = await pb.collection('glitches').getList(1, 1, {
                    filter: `title = "${glitch.title}"`
                });

                if (existing.totalItems === 0) {
                    await pb.collection('glitches').create(glitch);
                    console.log(`✅ Created glitch: ${glitch.title}`);
                } else {
                    console.log(`ℹ️ Glitch already exists: ${glitch.title}`);
                }
            } catch (e) {
                console.error(`❌ Failed to create glitch ${glitch.title}:`, e.message);
            }
        }

        // 4. Create Parallel Class Mission
        console.log('\n🏫 Creating Parallel Class Mission...');
        try {
            // Find a timeline
            const timelines = await pb.collection('timelines').getFullList();
            if (timelines.length > 0 && universes.length > 0) {
                const timelineId = timelines[0].id;
                const universeId = universes[0].id;

                await pb.collection('missions').create({
                    title: "The Lost Lecture",
                    description: "Recover the lost notes from the parallel dimension classroom.",
                    type: "ParallelClass",
                    universe: universeId,
                    timeline: timelineId,
                    xp_reward: 300,
                    content: {
                        subject: "History",
                        topic: "The Great Divergence"
                    },
                    status: "available"
                });
                console.log('✅ Parallel Class Mission Created');
            } else {
                console.log('⚠️ No timelines found, skipping parallel class mission');
            }
        } catch (e) {
            console.log('ℹ️ Parallel Class Mission might already exist or failed:', e.message);
        }

    } catch (e) {
        console.error('❌ Script failed:', e);
    }
}

seedExtras();
