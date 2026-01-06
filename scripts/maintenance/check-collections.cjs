const pb = require('pocketbase');
const fs = require('fs');

// Initialize PocketBase
// We need to know the URL. Usually localhost:8090
const client = new pb.default(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function checkCollections() {
    try {
        // Authenticate as admin to get full access
        await client.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log("Authenticated as admin.");

        const collections = await client.collections.getFullList();
        console.log(`Found ${collections.length} collections.`);

        const targetCollections = ['analytics_pages', 'analytics_sources', 'finance_expenses', 'tenants', 'invoices', 'system_alerts'];
        
        for (const name of targetCollections) {
            const collection = collections.find(c => c.name === name);
            if (collection) {
                console.log(`\nCollection '${name}' exists.`);
                console.log(`Type: ${collection.type}`);
                console.log(`API Rules:`);
                console.log(`  listRule: ${collection.listRule}`);
                console.log(`  viewRule: ${collection.viewRule}`);
                console.log(`  createRule: ${collection.createRule}`);
                console.log(`  updateRule: ${collection.updateRule}`);
                console.log(`  deleteRule: ${collection.deleteRule}`);
                console.log(`Schema fields:`);
                collection.schema.forEach(f => {
                    console.log(`  - ${f.name} (${f.type}) required=${f.required}`);
                });
            } else {
                console.log(`\nCollection '${name}' DOES NOT EXIST.`);
            }
        }

    } catch (err) {
        console.error("Error checking collections:", err);
    }
}

checkCollections();
