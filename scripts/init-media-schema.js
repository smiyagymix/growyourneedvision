import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initMediaSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. M3U Playlists
        try {
            await pb.collections.create({
                name: 'm3u_playlists',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'url', type: 'url', required: true },
                    { name: 'added_by', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'is_active', type: 'bool', required: false },
                    { name: 'last_synced', type: 'date', required: false },
                    { name: 'channel_count', type: 'number', required: false }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created m3u_playlists collection');
        } catch (e) {
            console.log('m3u_playlists collection might already exist');
        }

        // 2. TV Channels
        try {
            await pb.collections.create({
                name: 'tv_channels',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'logo', type: 'url', required: false },
                    { name: 'stream_url', type: 'url', required: true },
                    { name: 'category', type: 'text', required: true },
                    { name: 'country', type: 'text', required: false },
                    { name: 'language', type: 'text', required: false },
                    { name: 'is_active', type: 'bool', required: false },
                    { name: 'playlist', type: 'relation', required: false, options: { collectionId: 'm3u_playlists' } }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created tv_channels collection');
        } catch (e) {
            console.log('tv_channels collection might already exist');
        }

        // 3. Media Items
        try {
            await pb.collections.create({
                name: 'media_items',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'type', type: 'select', required: true, options: { values: ['Movie', 'Series', 'Documentary', 'Live TV'] } },
                    { name: 'genre', type: 'json', required: false },
                    { name: 'matchScore', type: 'number', required: false },
                    { name: 'rating', type: 'text', required: false },
                    { name: 'duration', type: 'text', required: false },
                    { name: 'year', type: 'text', required: false },
                    { name: 'video_url', type: 'url', required: false },
                    { name: 'embed_url', type: 'url', required: false },
                    { name: 'thumbnail', type: 'url', required: false },
                    { name: 'cast', type: 'text', required: false },
                    { name: 'director', type: 'text', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created media_items collection');
        } catch (e) {
            console.log('media_items collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init media schema:', error);
    }
}

initMediaSchema();
