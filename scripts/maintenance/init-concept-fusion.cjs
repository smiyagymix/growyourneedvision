const PocketBase = require('pocketbase').default;
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function createConceptFusionCollections() {
    try {
        console.log('🔐 Authenticating...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated\n');

        const collections = [
            {
                name: 'fragments',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'type', type: 'select', required: true, options: { maxSelect: 1, values: ['Math', 'Science', 'History', 'Art', 'Tech'] } },
                    { name: 'rarity', type: 'select', required: true, options: { maxSelect: 1, values: ['Common', 'Rare', 'Legendary'] } },
                    { name: 'description', type: 'text', required: false },
                    { name: 'icon', type: 'text', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            },
            {
                name: 'recipes',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'ingredients', type: 'json', required: true }, // Array of types e.g. ["Math", "Science"]
                    { name: 'result_description', type: 'text', required: true },
                    { name: 'xp_reward', type: 'number', required: true }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            },
            {
                name: 'user_fragments',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: true, maxSelect: 1 } },
                    { name: 'fragment', type: 'relation', required: true, options: { collectionId: 'fragments', cascadeDelete: true, maxSelect: 1 } },
                    { name: 'quantity', type: 'number', required: true }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id = user.id', // Or maybe system only? For now let user create for testing
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id'
            }
        ];

        for (const col of collections) {
            try {
                await pb.collections.create(col);
                console.log(`✅ Created collection: ${col.name}`);
            } catch (err) {
                if (err.status === 400) {
                    console.log(`ℹ️  Collection ${col.name} already exists`);
                } else {
                    console.error(`❌ Error creating ${col.name}:`, err.message);
                }
            }
        }

        // Seed some data
        console.log('\n🌱 Seeding initial data...');
        
        // Fragments
        const fragments = [
            { name: 'Algebra Shard', type: 'Math', rarity: 'Common', icon: 'Calculator' },
            { name: 'Geometry Crystal', type: 'Math', rarity: 'Rare', icon: 'Triangle' },
            { name: 'Physics Quark', type: 'Science', rarity: 'Common', icon: 'Atom' },
            { name: 'Biology Cell', type: 'Science', rarity: 'Common', icon: 'Dna' },
            { name: 'Ancient Scroll', type: 'History', rarity: 'Rare', icon: 'Scroll' },
            { name: 'Digital Bit', type: 'Tech', rarity: 'Common', icon: 'Cpu' }
        ];

        for (const f of fragments) {
            try {
                await pb.collection('fragments').create(f);
                console.log(`   Created fragment: ${f.name}`);
            } catch (e) {
                // Ignore duplicates if unique constraints existed (they don't here)
            }
        }

        // Recipes
        const recipes = [
            { name: 'Quantum Physics Core', ingredients: ['Math', 'Science'], result_description: 'Abstract numbers meet empirical reality.', xp_reward: 500 },
            { name: 'Computational History', ingredients: ['History', 'Tech'], result_description: 'Analyzing the past with future algorithms.', xp_reward: 600 },
            { name: 'Bio-Geometry', ingredients: ['Math', 'Science'], result_description: 'The shapes of life itself.', xp_reward: 450 }
        ];

        for (const r of recipes) {
            try {
                await pb.collection('recipes').create(r);
                console.log(`   Created recipe: ${r.name}`);
            } catch (e) {}
        }

    } catch (err) {
        console.error('Fatal error:', err);
    }
}

createConceptFusionCollections();
