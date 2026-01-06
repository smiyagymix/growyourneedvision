import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateIndividualSchema() {
    console.log('🚀 Updating Individual App Schema...');

    // Authenticate as admin
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    const collections = [
        {
            name: 'individual_courses',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: true, maxSelect: 1 } },
                { name: 'course_title', type: 'text', required: true },
                { name: 'course_description', type: 'text' },
                { name: 'course_image', type: 'file' },
                { name: 'progress', type: 'number' }, // 0-100
                { name: 'enrolled_date', type: 'date' },
                { name: 'completed_date', type: 'date' },
                { name: 'status', type: 'select', options: { values: ['active', 'completed', 'paused'] } }
            ]
        },
        {
            name: 'wellness_data',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: true, maxSelect: 1 } },
                { name: 'date', type: 'date', required: true },
                { name: 'mood_score', type: 'number' }, // 1-10
                { name: 'energy_level', type: 'number' }, // 1-10
                { name: 'stress_level', type: 'number' }, // 1-10
                { name: 'sleep_hours', type: 'number' },
                { name: 'water_intake', type: 'number' }, // in glasses
                { name: 'steps', type: 'number' },
                { name: 'exercise_minutes', type: 'number' },
                { name: 'meditation_minutes', type: 'number' }
            ]
        },
        {
            name: 'individual_goals',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: true, maxSelect: 1 } },
                { name: 'goal_text', type: 'text', required: true },
                { name: 'goal_type', type: 'select', options: { values: ['daily', 'weekly', 'monthly', 'yearly'] } },
                { name: 'is_completed', type: 'bool' },
                { name: 'due_date', type: 'date' },
                { name: 'completed_date', type: 'date' }
            ]
        },
        {
            name: 'marketplace_orders',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } },
                { name: 'order_number', type: 'text', required: true },
                { name: 'product_name', type: 'text', required: true },
                { name: 'product_image', type: 'file' },
                { name: 'quantity', type: 'number' },
                { name: 'price', type: 'number' },
                { name: 'status', type: 'select', options: { values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] } },
                { name: 'order_date', type: 'date' },
                { name: 'tracking_number', type: 'text' }
            ]
        },
        {
            name: 'service_bookings',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } },
                { name: 'service_name', type: 'text', required: true },
                { name: 'service_provider', type: 'text' },
                { name: 'booking_date', type: 'date' },
                { name: 'booking_time', type: 'text' },
                { name: 'duration_minutes', type: 'number' },
                { name: 'status', type: 'select', options: { values: ['upcoming', 'completed', 'cancelled'] } },
                { name: 'price', type: 'number' },
                { name: 'location', type: 'text' }
            ]
        },
        {
            name: 'recommendations',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } }, // Optional, if null -> general
                { name: 'item_type', type: 'select', options: { values: ['course', 'product', 'service'] } },
                { name: 'item_id', type: 'text' },
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'text' },
                { name: 'image_url', type: 'url' },
                { name: 'price', type: 'number' },
                { name: 'category', type: 'text' },
                { name: 'score', type: 'number' }
            ]
        }
    ];

    for (const collection of collections) {
        try {
            const existing = await pb.collections.getOne(collection.name).catch(() => null);
            if (existing) {
                console.log(`⚠️ Collection ${collection.name} already exists. Skipping creation (might need update).`);
                // In a real scenario, we might want to update the schema here.
                // For now, we assume if it exists, it's fine, or we'd need a more complex diffing logic.
                // But since we are fixing mismatches, maybe we should try to update?
                // Let's just try to create if missing for now to avoid destructive changes on existing data if any.
            } else {
                await pb.collections.create(collection);
                console.log(`✅ Created collection: ${collection.name}`);
            }
        } catch (error) {
            console.error(`❌ Failed to process collection ${collection.name}:`, error);
        }
    }
}

updateIndividualSchema();
