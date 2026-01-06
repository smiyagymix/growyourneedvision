import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function debugCreate() {
    try {
        await pb.admins.authWithPassword('owner@growyourneed.com', 'Darnag123456789@');
        
        // Delete if exists
        try {
            const existing = await pb.collections.getOne('multiverse_profiles');
            await pb.collections.delete(existing.id);
            console.log("Deleted existing multiverse_profiles");
        } catch (e) {}

        // Get users collection ID
        const usersCol = await pb.collections.getOne('users');
        console.log("Users Collection ID:", usersCol.id);

        // Create
        const fields = [
            { 
                name: 'user', 
                type: 'relation', 
                required: true,
                collectionId: usersCol.id, // Use actual ID
                cascadeDelete: false,
                maxSelect: 1
            },
            { name: 'totalXP', type: 'number' },
            { name: 'level', type: 'number' },
            { name: 'streakDays', type: 'number' },
            { name: 'badges', type: 'json' }
        ];

        const col = await pb.collections.create({
            name: 'multiverse_profiles',
            type: 'base',
            fields: fields
        });

        console.log("Created Collection:", JSON.stringify(col, null, 2));

    } catch (e) {
        console.error("Error:", e);
        if (e.data) console.error(JSON.stringify(e.data, null, 2));
    }
}

debugCreate();
