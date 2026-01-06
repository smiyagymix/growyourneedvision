import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function checkCollections() {
    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        const enrollments = await pb.collections.getOne('enrollments');
        console.log('Enrollments:', JSON.stringify(enrollments, null, 2));

    } catch (err) {
        console.error(err);
    }
}

checkCollections();
