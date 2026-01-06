import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@growyourneed.com';
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD || '';

async function main() {
    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);

        const collection = await pb.collections.getOne('finance_transactions');
        console.log(JSON.stringify(collection, null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
