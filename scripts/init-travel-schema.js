import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initTravelSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Travel Destinations
        try {
            await pb.collections.create({
                name: 'travel_destinations',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'country', type: 'text', required: true },
                    { name: 'region', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'image_url', type: 'url', required: false },
                    { name: 'featured', type: 'bool', required: false },
                    { name: 'average_cost_per_day', type: 'number', required: false },
                    { name: 'popular_activities', type: 'json', required: false },
                    { name: 'best_season', type: 'text', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created travel_destinations collection');
        } catch (e) {
            console.log('travel_destinations collection might already exist');
        }

        // 2. Travel Bookings
        try {
            await pb.collections.create({
                name: 'travel_bookings',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'type', type: 'select', required: true, options: { values: ['Flight', 'Hotel', 'Car', 'Package'] } },
                    { name: 'destination', type: 'text', required: true },
                    { name: 'origin', type: 'text', required: false },
                    { name: 'start_date', type: 'date', required: true },
                    { name: 'end_date', type: 'date', required: false },
                    { name: 'status', type: 'select', required: true, options: { values: ['Pending', 'Confirmed', 'Cancelled', 'Completed'] } },
                    { name: 'total_cost', type: 'number', required: true },
                    { name: 'details', type: 'json', required: false },
                    { name: 'confirmation_code', type: 'text', required: false }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created travel_bookings collection');
        } catch (e) {
            console.log('travel_bookings collection might already exist');
        }

        // 3. Travel Itineraries
        try {
            await pb.collections.create({
                name: 'travel_itineraries',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'title', type: 'text', required: true },
                    { name: 'destination', type: 'text', required: true },
                    { name: 'start_date', type: 'date', required: true },
                    { name: 'end_date', type: 'date', required: true },
                    { name: 'days', type: 'json', required: false }, // Array of DayPlan
                    { name: 'total_budget', type: 'number', required: false },
                    { name: 'status', type: 'select', required: true, options: { values: ['Planning', 'Booked', 'Active', 'Completed'] } },
                    { name: 'shared_with', type: 'relation', required: false, options: { collectionId: 'users', maxSelect: 10 } }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created travel_itineraries collection');
        } catch (e) {
            console.log('travel_itineraries collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init travel schema:', error);
    }
}

initTravelSchema();
