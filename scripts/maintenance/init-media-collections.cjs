const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function main() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Create m3u_playlists collection (Create this FIRST because tv_channels references it)
        try {
            await pb.collections.create({
                name: 'm3u_playlists',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'url', type: 'url', required: true },
                    { name: 'added_by', type: 'relation', collectionId: 'users', required: true },
                    { name: 'is_active', type: 'bool', options: { default: true } },
                    { name: 'last_synced', type: 'date' },
                    { name: 'channel_count', type: 'number', options: { default: 0 } }
                ],
                indexes: [
                    'CREATE INDEX idx_pl_added_by ON m3u_playlists (added_by)',
                    'CREATE INDEX idx_pl_active ON m3u_playlists (is_active)'
                ],
                listRule: "@request.auth.id != ''",
                viewRule: "@request.auth.id != ''",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''"
            });
            console.log('Created m3u_playlists collection');
        } catch (e) {
            console.log('m3u_playlists collection might already exist or failed:', e);
        }

        // 2. Create tv_channels collection
        try {
            await pb.collections.create({
                name: 'tv_channels',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'logo', type: 'url' },
                    { name: 'stream_url', type: 'url', required: true },
                    { name: 'category', type: 'text', required: true },
                    { name: 'country', type: 'text', options: { default: 'Unknown' } },
                    { name: 'language', type: 'text', options: { default: 'en' } },
                    { name: 'is_active', type: 'bool', options: { default: true } },
                    { name: 'playlist', type: 'relation', collectionId: 'm3u_playlists', cascadeDelete: false }
                ],
                indexes: [
                    'CREATE INDEX idx_tv_active ON tv_channels (is_active)',
                    'CREATE INDEX idx_tv_category ON tv_channels (category)',
                    'CREATE INDEX idx_tv_country ON tv_channels (country)'
                ],
                listRule: "@request.auth.id != ''",
                viewRule: "@request.auth.id != ''",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''"
            });
            console.log('Created tv_channels collection');
        } catch (e) {
            console.log('tv_channels collection might already exist or failed:', e);
        }

        // 3. Create/Update media_items collection
        try {
            // Check if exists first
            try {
                await pb.collections.getOne('media_items');
                console.log('media_items collection exists');
            } catch (e) {
                await pb.collections.create({
                    name: 'media_items',
                    type: 'base',
                    schema: [
                        { name: 'title', type: 'text', required: true },
                        { name: 'description', type: 'text', required: true },
                        { name: 'type', type: 'select', options: { values: ['Movie', 'Series', 'Documentary', 'Live TV'] } },
                        { name: 'genre', type: 'json' },
                        { name: 'matchScore', type: 'number' },
                        { name: 'rating', type: 'text' },
                        { name: 'duration', type: 'text' },
                        { name: 'thumbnail', type: 'url' },
                        { name: 'video_url', type: 'url' },
                        { name: 'imdb_id', type: 'text' },
                        { name: 'year', type: 'number' },
                        { name: 'cast', type: 'json' },
                        { name: 'director', type: 'text' }
                    ],
                    listRule: "@request.auth.id != ''",
                    viewRule: "@request.auth.id != ''",
                    createRule: "@request.auth.role ~ 'Admin|Teacher'",
                    updateRule: "@request.auth.role ~ 'Admin|Teacher'",
                    deleteRule: "@request.auth.role = 'Admin'"
                });
                console.log('Created media_items collection');
            }
        } catch (e) {
            console.log('media_items collection failed:', e.message);
        }

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

main();
