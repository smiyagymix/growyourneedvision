import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
    try {
        await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS);

        const collections = [
            'finance_transactions',
            'classes'
        ];

        for (const colName of collections) {
            const collection = await pb.collections.getOne(colName);
            console.log(`Collection: ${colName}`);
            console.log(`  listRule: "${collection.listRule}"`);
            console.log(`  viewRule: "${collection.viewRule}"`);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
