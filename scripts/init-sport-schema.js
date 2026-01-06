import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initSportSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Sport Activities
        try {
            await pb.collections.create({
                name: 'sport_activities',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'sport', type: 'text', required: true },
                    { name: 'activity_type', type: 'select', options: { values: ['Training', 'Match', 'Practice'] } },
                    { name: 'duration', type: 'number', required: true }, // minutes
                    { name: 'calories', type: 'number', required: false },
                    { name: 'date', type: 'date', required: true },
                    { name: 'notes', type: 'text', required: false }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created sport_activities collection');
        } catch (e) {
            console.log('sport_activities collection might already exist');
        }

        // 2. Sport Teams
        try {
            await pb.collections.create({
                name: 'sport_teams',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'sport', type: 'text', required: true },
                    { name: 'league', type: 'text', required: false },
                    { name: 'logo_url', type: 'url', required: false },
                    { name: 'wins', type: 'number', required: false },
                    { name: 'losses', type: 'number', required: false },
                    { name: 'draws', type: 'number', required: false },
                    { name: 'points', type: 'number', required: false },
                    { name: 'members', type: 'relation', required: false, options: { collectionId: 'users', maxSelect: 100 } },
                    { name: 'coach', type: 'relation', required: false, options: { collectionId: 'users', maxSelect: 1 } }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created sport_teams collection');
        } catch (e) {
            console.log('sport_teams collection might already exist');
        }

        // 3. Sport Matches
        try {
            await pb.collections.create({
                name: 'sport_matches',
                type: 'base',
                schema: [
                    { name: 'team_home', type: 'relation', required: true, options: { collectionId: 'sport_teams' } },
                    { name: 'team_away', type: 'relation', required: true, options: { collectionId: 'sport_teams' } },
                    { name: 'score_home', type: 'number', required: false },
                    { name: 'score_away', type: 'number', required: false },
                    { name: 'status', type: 'select', required: true, options: { values: ['Scheduled', 'Live', 'Finished', 'Cancelled'] } },
                    { name: 'match_date', type: 'date', required: true },
                    { name: 'venue', type: 'text', required: false },
                    { name: 'sport', type: 'text', required: true }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created sport_matches collection');
        } catch (e) {
            console.log('sport_matches collection might already exist');
        }

        // 4. Sport Venues
        try {
            await pb.collections.create({
                name: 'sport_venues',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'address', type: 'text', required: true },
                    { name: 'capacity', type: 'number', required: false },
                    { name: 'sport_types', type: 'json', required: false },
                    { name: 'facilities', type: 'json', required: false },
                    { name: 'booking_available', type: 'bool', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created sport_venues collection');
        } catch (e) {
            console.log('sport_venues collection might already exist');
        }

        // 5. Player Stats
        try {
            await pb.collections.create({
                name: 'player_stats',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'sport', type: 'text', required: true },
                    { name: 'games_played', type: 'number', required: false },
                    { name: 'goals', type: 'number', required: false },
                    { name: 'assists', type: 'number', required: false },
                    { name: 'points', type: 'number', required: false },
                    { name: 'season', type: 'text', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created player_stats collection');
        } catch (e) {
            console.log('player_stats collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init sport schema:', error);
    }
}

initSportSchema();
