import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function updateRules() {
    console.log("🔒 Updating EduMultiverse API Rules...");

    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', 'Darnag123456789@');
    } catch (e) {
        console.error("❌ Auth failed. Please ensure PocketBase is running.");
        return;
    }

    const collections = [
        {
            name: 'universes',
            rules: {
                listRule: '@request.auth.id != ""', // Any logged in user
                viewRule: '@request.auth.id != ""',
            }
        },
        {
            name: 'timelines',
            rules: {
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
            }
        },
        {
            name: 'missions',
            rules: {
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
            }
        },
        {
            name: 'glitches',
            rules: {
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
            }
        },
        {
            name: 'multiverse_profiles',
            rules: {
                listRule: 'user = @request.auth.id', // Users can only see their own profile
                viewRule: 'user = @request.auth.id',
                createRule: '@request.auth.id != ""',
                updateRule: 'user = @request.auth.id',
            }
        },
        {
            name: 'mission_runs',
            rules: {
                listRule: 'student = @request.auth.id',
                viewRule: 'student = @request.auth.id',
                createRule: '@request.auth.id != ""',
            }
        }
    ];

    for (const col of collections) {
        try {
            const record = await pb.collections.getFirstListItem(`name="${col.name}"`);
            await pb.collections.update(record.id, col.rules);
            console.log(`✅ Updated rules for ${col.name}`);
        } catch (e) {
            console.error(`❌ Failed to update ${col.name}:`, e.message);
            if (e.data) console.error(JSON.stringify(e.data, null, 2));
        }
    }
}

updateRules();
