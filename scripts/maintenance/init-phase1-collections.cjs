/**
 * Initialize Phase 1 Collections - Fixed Version
 * Uses PocketBase Admin SDK to create collections properly
 */

const PocketBase = require('pocketbase').default;
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function createCollections() {
    try {
        console.log('🔐 Authenticating...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated\n');

        // Get users collection ID
        const usersCollection = await pb.collections.getOne('users');
        const usersId = usersCollection.id;
        console.log(`📝 Users collection ID: ${usersId}\n`);

        const collections = [
            // Individual Courses
            {
                name: 'individual_courses',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: usersId, cascadeDelete: true, maxSelect: 1 } },
                    { name: 'course_title', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'course_description', type: 'text', required: false, options: { max: 2000 } },
                    { name: 'course_image', type: 'file', required: false, options: { maxSelect: 1, maxSize: 5242880 } },
                    { name: 'progress', type: 'number', required: true, options: { min: 0, max: 100 } },
                    { name: 'enrolled_date', type: 'date', required: true },
                    { name: 'completed_date', type: 'date', required: false },
                    { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['active', 'completed', 'paused'] } }
                ],
                listRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                viewRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                deleteRule: '@request.auth.id = user.id || @request.auth.role = "Owner"'
            },
            // Wellness Data
            {
                name: 'wellness_data',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: usersId, cascadeDelete: true, maxSelect: 1 } },
                    { name: 'date', type: 'date', required: true },
                    { name: 'mood_score', type: 'number', required: true, options: { min: 1, max: 10 } },
                    { name: 'energy_level', type: 'number', required: true, options: { min: 1, max: 10 } },
                    { name: 'stress_level', type: 'number', required: true, options: { min: 1, max: 10 } },
                    { name: 'sleep_hours', type: 'number', required: false, options: { min: 0, max: 24 } },
                    { name: 'water_intake', type: 'number', required: false, options: { min: 0, max: 50 } },
                    { name: 'steps', type: 'number', required: false, options: { min: 0 } },
                    { name: 'exercise_minutes', type: 'number', required: false, options: { min: 0, max: 1440 } },
                    { name: 'meditation_minutes', type: 'number', required: false, options: { min: 0, max: 1440 } }
                ],
                listRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                viewRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id'
            },
            // Marketplace Orders
            {
                name: 'marketplace_orders',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: usersId, cascadeDelete: false, maxSelect: 1 } },
                    { name: 'order_number', type: 'text', required: true, options: { min: 1, max: 100 } },
                    { name: 'product_name', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'product_image', type: 'file', required: false, options: { maxSelect: 1, maxSize: 5242880 } },
                    { name: 'quantity', type: 'number', required: true, options: { min: 1 } },
                    { name: 'price', type: 'number', required: true, options: { min: 0 } },
                    { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] } },
                    { name: 'order_date', type: 'date', required: true },
                    { name: 'tracking_number', type: 'text', required: false, options: { max: 200 } }
                ],
                listRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                viewRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.role = "Owner" || @request.auth.role = "Admin"',
                deleteRule: '@request.auth.role = "Owner"'
            },
            // Service Bookings
            {
                name: 'service_bookings',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: usersId, cascadeDelete: false, maxSelect: 1 } },
                    { name: 'service_name', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'service_provider', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'booking_date', type: 'date', required: true },
                    { name: 'booking_time', type: 'text', required: true, options: { max: 20 } },
                    { name: 'duration_minutes', type: 'number', required: true, options: { min: 15, max: 480 } },
                    { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['upcoming', 'completed', 'cancelled'] } },
                    { name: 'price', type: 'number', required: true, options: { min: 0 } },
                    { name: 'location', type: 'text', required: false, options: { max: 500 } }
                ],
                listRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                viewRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                deleteRule: '@request.auth.id = user.id || @request.auth.role = "Owner"'
            },
            // Recommendations
            {
                name: 'recommendations',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: false, options: { collectionId: usersId, cascadeDelete: true, maxSelect: 1 } },
                    { name: 'item_type', type: 'select', required: true, options: { maxSelect: 1, values: ['course', 'product', 'service'] } },
                    { name: 'item_id', type: 'text', required: false, options: { max: 100 } },
                    { name: 'title', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'description', type: 'text', required: false, options: { max: 1000 } },
                    { name: 'image_url', type: 'url', required: false },
                    { name: 'price', type: 'number', required: false, options: { min: 0 } },
                    { name: 'category', type: 'text', required: false, options: { max: 100 } },
                    { name: 'score', type: 'number', required: false, options: { min: 0, max: 100 } }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "Admin"',
                updateRule: '@request.auth.role = "Owner" || @request.auth.role = "Admin"',
                deleteRule: '@request.auth.role = "Owner"'
            },
            // Individual Goals
            {
                name: 'individual_goals',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: usersId, cascadeDelete: true, maxSelect: 1 } },
                    { name: 'goal_text', type: 'text', required: true, options: { min: 1, max: 500 } },
                    { name: 'goal_type', type: 'select', required: true, options: { maxSelect: 1, values: ['daily', 'weekly', 'monthly', 'yearly'] } },
                    { name: 'is_completed', type: 'bool', required: true },
                    { name: 'due_date', type: 'date', required: false },
                    { name: 'completed_date', type: 'date', required: false }
                ],
                listRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                viewRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id'
            }
        ];

        for (const collectionDef of collections) {
            try {
                console.log(`📦 Creating: ${collectionDef.name}`);

                // Check if exists
                try {
                    await pb.collections.getOne(collectionDef.name);
                    console.log(`   ⚠️  Already exists, skipping\n`);
                    continue;
                } catch (err) {
                    // Doesn't exist, create it
                }

                const created = await pb.collections.create(collectionDef);
                console.log(`   ✅ Created (ID: ${created.id})\n`);
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}\n`);
            }
        }

        console.log('🎉 Done!');
    } catch (error) {
        console.error('❌ Fatal:', error.message);
        process.exit(1);
    }
}

createCollections();
