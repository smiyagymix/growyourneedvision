import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function inspect() {
    try {
        await pb.admins.authWithPassword('owner@growyourneed.com', 'Darnag123456789@');
        
        try {
            const p = await pb.collections.getOne('multiverse_profiles');
            console.log("Profiles Schema:", JSON.stringify(p.schema, null, 2));
        } catch (e) { console.log("Profiles not found"); }

        try {
            const r = await pb.collections.getOne('mission_runs');
            console.log("Runs Schema:", JSON.stringify(r.schema, null, 2));
        } catch (e) { console.log("Runs not found"); }

    } catch (e) {
        console.error(e);
    }
}

inspect();
