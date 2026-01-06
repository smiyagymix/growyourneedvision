import PocketBase from 'pocketbase';

const client = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function testNewCollection() {
    try {
        await client.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log("Authenticated as admin.");

        const colName = 'test_diagnose_' + Date.now();
        console.log(`Creating collection ${colName}...`);

        await client.collections.create({
            name: colName,
            type: 'base',
            fields: [
                { name: 'title', type: 'text' }
            ]
        });

        console.log("Collection created. Creating record...");
        await client.collection(colName).create({ title: 'test' });

        console.log("Testing sort by created...");
        try {
            const result = await client.collection(colName).getList(1, 1, {
                sort: '-created'
            });
            console.log("Success! Total items:", result.totalItems);
        } catch (e) {
            console.error("FAILED:", e.message);
        }

        console.log("Cleaning up...");
        const col = await client.collections.getFirstListItem(`name="${colName}"`);
        await client.collections.delete(col.id);
        console.log("Done.");

    } catch (err) {
        console.error("Global Error:", err);
    }
}

testNewCollection();
