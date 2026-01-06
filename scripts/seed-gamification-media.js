import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function seedGamificationAndMedia() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
        console.log('Authenticated.');

        // --- GAMIFICATION ---
        console.log('Seeding Gamification...');

        // Achievements
        const achievements = [
            { name: 'First Steps', description: 'Complete your profile setup', category: 'Milestone', xp_reward: 50, requirement_type: 'count', requirement_value: 1, rarity: 'Common', icon: '🏁' },
            { name: 'Social Butterfly', description: 'Send 10 messages', category: 'Social', xp_reward: 100, requirement_type: 'count', requirement_value: 10, rarity: 'Common', icon: '🦋' },
            { name: 'Bookworm', description: 'Read 5 documentation pages', category: 'Learning', xp_reward: 150, requirement_type: 'count', requirement_value: 5, rarity: 'Rare', icon: '📚' },
            { name: 'Daily Streak', description: 'Login for 7 days in a row', category: 'Activity', xp_reward: 300, requirement_type: 'streak', requirement_value: 7, rarity: 'Epic', icon: '🔥' },
            { name: 'Master of Coin', description: 'Earn 1000 XP total', category: 'Milestone', xp_reward: 500, requirement_type: 'score', requirement_value: 1000, rarity: 'Legendary', icon: '👑' }
        ];

        for (const ach of achievements) {
            try {
                await pb.collection('gamification_achievements').create(ach);
                console.log(`Created achievement: ${ach.name}`);
            } catch (e) {
                // console.log(`Achievement ${ach.name} might already exist.`);
            }
        }

        // Rewards
        const rewards = [
            { name: 'Blue Theme', description: 'Unlock the blue color theme', cost_xp: 500, category: 'Theme', icon: '🎨', available: true },
            { name: 'Golden Avatar Frame', description: 'Show off your status', cost_xp: 1000, category: 'Avatar', icon: '🖼️', available: true },
            { name: 'Early Adopter Badge', description: 'Badge for early users', cost_xp: 200, category: 'Badge', icon: '🏅', available: true },
            { name: 'Double XP Potion', description: '2x XP for 1 hour', cost_xp: 300, category: 'Power-Up', icon: '🧪', available: true }
        ];

        for (const rew of rewards) {
            try {
                await pb.collection('gamification_rewards').create(rew);
                console.log(`Created reward: ${rew.name}`);
            } catch (e) {
                // console.log(`Reward ${rew.name} might already exist.`);
            }
        }

        // Challenges
        const challenges = [
            { title: 'Daily Login', description: 'Log in today', type: 'Daily', xp_reward: 10, status: 'Active', expires_at: new Date(Date.now() + 86400000).toISOString() },
            { title: 'Weekly Reader', description: 'Read 3 articles this week', type: 'Weekly', xp_reward: 50, status: 'Active', expires_at: new Date(Date.now() + 7 * 86400000).toISOString() },
        ];

        for (const chal of challenges) {
            try {
                await pb.collection('gamification_challenges').create(chal);
                console.log(`Created challenge: ${chal.title}`);
            } catch (e) {
                // console.log(`Challenge ${chal.title} might already exist.`);
            }
        }

        // --- MEDIA ---
        console.log('Seeding Media...');

        // TV Channels
        const channels = [
            { name: 'News 24/7', category: 'News', stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', is_active: true, country: 'Global', language: 'English' },
            { name: 'Sports Live', category: 'Sports', stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', is_active: true, country: 'Global', language: 'English' },
            { name: 'Movie Central', category: 'Movies', stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', is_active: true, country: 'USA', language: 'English' },
            { name: 'DocuWorld', category: 'Documentary', stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', is_active: true, country: 'UK', language: 'English' }
        ];

        for (const ch of channels) {
            try {
                await pb.collection('tv_channels').create(ch);
                console.log(`Created channel: ${ch.name}`);
            } catch (e) {
                // console.log(`Channel ${ch.name} might already exist.`);
            }
        }

        // Media Items
        const mediaItems = [
            { title: 'Big Buck Bunny', description: 'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.', type: 'Movie', video_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg', rating: 'PG', duration: '10m', year: '2008', genre: ['Animation', 'Comedy'] },
            { title: 'Elephant Dream', description: 'The world\'s first open movie, made entirely with open source graphics software such as Blender, and with all production files freely available to use however you please.', type: 'Movie', video_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Elephants_Dream_poster.jpg/800px-Elephants_Dream_poster.jpg', rating: 'PG', duration: '11m', year: '2006', genre: ['Sci-Fi', 'Animation'] },
            { title: 'Cosmos: A Spacetime Odyssey', description: 'An exploration of our discovery of the laws of nature and coordinates in space and time.', type: 'Documentary', video_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnail: 'https://m.media-amazon.com/images/M/MV5BZTk5OTQyOTYtMDdlMi00YjFhLWJhZDYtM2Y2YTZkYmQtYmIyXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg', rating: 'TV-PG', duration: '45m', year: '2014', genre: ['Science', 'Documentary'] }
        ];

        for (const item of mediaItems) {
            try {
                await pb.collection('media_items').create(item);
                console.log(`Created media item: ${item.title}`);
            } catch (e) {
                // console.log(`Media item ${item.title} might already exist.`);
            }
        }

    } catch (err) {
        console.error('Error seeding data:', err);
    }
}

seedGamificationAndMedia();
