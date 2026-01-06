import PocketBase from 'pocketbase';

const client = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function inspect() {
    try {
        await client.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        const collection = await client.collections.getFirstListItem('name="tenants"');
        console.log("Tenants Collection Schema:");
        console.log(JSON.stringify(collection, null, 2));

    } catch (err) {
        console.error(err);
    }
}

inspect();
