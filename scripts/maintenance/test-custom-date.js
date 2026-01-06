import PocketBase from 'pocketbase';

const client = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function testCustomDate() {
    try {
        await client.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log("Authenticated as admin.");

        console.log("Testing filter by paid_at (custom date)...");
        try {
            // Just try to list with filter, even if empty
            const result = await client.collection('invoices').getList(1, 1, {
                filter: 'paid_at > "2020-01-01"'
            });
            console.log("Success! Total items:", result.totalItems);
        } catch (e) {
            console.error("FAILED paid_at:", e.message);
        }

    } catch (err) {
        console.error("Global Error:", err);
    }
}

testCustomDate();
