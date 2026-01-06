const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const sampleChannels = [
    {
        name: "ESPN HD",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/ESPN_logo.svg/1200px-ESPN_logo.svg.png",
        stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Test stream
        category: "Sports",
        country: "USA",
        language: "en",
        is_active: true
    },
    {
        name: "CNN International",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/CNN_International_logo.svg/1200px-CNN_International_logo.svg.png",
        stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Test stream
        category: "News",
        country: "USA",
        language: "en",
        is_active: true
    },
    {
        name: "HBO",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/1200px-HBO_logo.svg.png",
        stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Test stream
        category: "Entertainment",
        country: "USA",
        language: "en",
        is_active: true
    }
];

const sampleMovies = [
    {
        title: "The Dark Knight",
        description: "When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological tests.",
        type: "Movie",
        genre: ["Action", "Crime", "Drama"],
        matchScore: 96,
        rating: "PG-13",
        duration: "2h 32m",
        year: 2008,
        cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
        director: "Christopher Nolan",
        thumbnail: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    },
    {
        title: "Breaking Bad",
        description: "A chemistry teacher diagnosed with cancer turns to cooking meth.",
        type: "Series",
        genre: ["Crime", "Drama", "Thriller"],
        matchScore: 98,
        rating: "TV-MA",
        duration: "5 Seasons",
        year: 2008,
        thumbnail: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg"
    }
];

async function main() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        // Get a user for the playlist
        const users = await pb.collection('users').getList(1, 1);
        const userId = users.items[0]?.id;

        if (!userId) {
            console.log('No users found. Please create a user first.');
            return;
        }

        // Seed Channels
        console.log('Seeding Channels...');
        for (const channel of sampleChannels) {
            try {
                await pb.collection('tv_channels').create(channel);
                console.log(`Created channel: ${channel.name}`);
            } catch (e) {
                console.log(`Failed to create channel ${channel.name}:`, e.message);
            }
        }

        // Seed Playlist
        console.log('Seeding Playlist...');
        try {
            await pb.collection('m3u_playlists').create({
                name: "Free IPTV Channels",
                url: "https://iptv-org.github.io/iptv/index.m3u8",
                added_by: userId,
                is_active: true,
                last_synced: new Date().toISOString(),
                channel_count: 150
            });
            console.log('Created sample playlist');
        } catch (e) {
            console.log('Failed to create playlist:', e.message);
        }

        // Seed Media Items
        console.log('Seeding Media Items...');
        for (const item of sampleMovies) {
            try {
                await pb.collection('media_items').create(item);
                console.log(`Created media item: ${item.title}`);
            } catch (e) {
                console.log(`Failed to create media item ${item.title}:`, e.message);
            }
        }

    } catch (error) {
        console.error('Seeding failed:', error);
    }
}

main();
