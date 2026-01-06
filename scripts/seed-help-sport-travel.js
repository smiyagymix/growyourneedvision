import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function seedHelpSportTravel() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
        console.log('Authenticated.');

        // --- HELP CENTER ---
        console.log('Seeding Help Center...');
        const faqs = [
            { category: 'General', question: 'How do I reset my password?', answer: 'Go to settings and click "Reset Password".', order: 1 },
            { category: 'Billing', question: 'What payment methods do you accept?', answer: 'We accept Visa, Mastercard, and PayPal.', order: 2 },
            { category: 'Technical', question: 'Why is the app slow?', answer: 'Check your internet connection or clear cache.', order: 3 }
        ];

        for (const faq of faqs) {
            try {
                await pb.collection('help_faqs').create(faq);
                console.log(`Created FAQ: ${faq.question}`);
            } catch (e) {
                // console.log(`FAQ might already exist.`);
            }
        }

        // --- SPORT ---
        console.log('Seeding Sport...');
        const teams = [
            { name: 'Red Dragons', sport: 'Soccer', league: 'Premier League', wins: 10, losses: 2, draws: 1, points: 31 },
            { name: 'Blue Sharks', sport: 'Soccer', league: 'Premier League', wins: 8, losses: 4, draws: 1, points: 25 },
            { name: 'Golden State', sport: 'Basketball', league: 'NBA', wins: 40, losses: 10, draws: 0, points: 80 }
        ];

        for (const team of teams) {
            try {
                await pb.collection('sport_teams').create(team);
                console.log(`Created team: ${team.name}`);
            } catch (e) {
                // console.log(`Team might already exist.`);
            }
        }

        const venues = [
            { name: 'City Stadium', address: '123 Main St', capacity: 50000, sport_types: ['Soccer', 'Rugby'], booking_available: true },
            { name: 'Community Gym', address: '456 Elm St', capacity: 500, sport_types: ['Basketball', 'Volleyball'], booking_available: true }
        ];

        for (const venue of venues) {
            try {
                await pb.collection('sport_venues').create(venue);
                console.log(`Created venue: ${venue.name}`);
            } catch (e) {
                // console.log(`Venue might already exist.`);
            }
        }

        // --- TRAVEL ---
        console.log('Seeding Travel...');
        const destinations = [
            { name: 'Paris', country: 'France', region: 'Europe', description: 'The city of lights.', featured: true, average_cost_per_day: 200, best_season: 'Spring', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques_-_Paris_ao%C3%BBt_2014_%282%29.jpg/800px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques_-_Paris_ao%C3%BBt_2014_%282%29.jpg' },
            { name: 'Tokyo', country: 'Japan', region: 'Asia', description: 'A mix of modern and traditional.', featured: true, average_cost_per_day: 150, best_season: 'Spring', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/800px-Skyscrapers_of_Shinjuku_2009_January.jpg' },
            { name: 'New York', country: 'USA', region: 'North America', description: 'The city that never sleeps.', featured: false, average_cost_per_day: 250, best_season: 'Fall', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu.jpg/800px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu.jpg' }
        ];

        for (const dest of destinations) {
            try {
                await pb.collection('travel_destinations').create(dest);
                console.log(`Created destination: ${dest.name}`);
            } catch (e) {
                // console.log(`Destination might already exist.`);
            }
        }

    } catch (err) {
        console.error('Error seeding data:', err);
    }
}

seedHelpSportTravel();
