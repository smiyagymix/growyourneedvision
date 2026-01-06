import PocketBase from 'pocketbase';

const client = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function diagnose() {
    try {
        await client.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log("Authenticated as admin.");

        // 0. Test Simple List
        console.log("\n--- Testing Simple List (No Filter/Sort) ---");
        try {
            const result = await client.collection('tenants').getList(1, 1);
            console.log("Success! Total items:", result.totalItems);
        } catch (e) {
            console.error("FAILED 0:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        }

        // 1. Test Tenant Metrics Filter
        console.log("\n--- Testing Tenant Metrics Filter ---");
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().replace('T', ' ');
        const filter = `created >= "${firstDayOfMonth}"`;
        console.log(`Filter: ${filter}`);
        try {
            const result = await client.collection('tenants').getList(1, 1, {
                filter: filter
            });
            console.log("Success! Total items:", result.totalItems);
        } catch (e) {
            console.error("FAILED 1:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        }

        // 2. Test Alerts Sort
        console.log("\n--- Testing Alerts Sort ---");
        try {
            const result = await client.collection('system_alerts').getList(1, 5, {
                sort: '-created'
            });
            console.log("Success! Total items:", result.totalItems);
        } catch (e) {
            console.error("FAILED 2:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        }

        // 3. Test Activity Feed Sort
        console.log("\n--- Testing Activity Feed Sort ---");
        try {
            const result = await client.collection('tenants').getList(1, 5, {
                sort: '-created'
            });
            console.log("Success! Total items:", result.totalItems);
        } catch (e) {
            console.error("FAILED 3:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        }

        // 4. Test Filter by Name
        console.log("\n--- Testing Filter by Name ---");
        try {
            const result = await client.collection('tenants').getList(1, 1, {
                filter: 'name != ""'
            });
            console.log("Success! Total items:", result.totalItems);
        } catch (e) {
            console.error("FAILED 4:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        }

        // 5. Test Sort by Name
        console.log("\n--- Testing Sort by Name ---");
        try {
            const result = await client.collection('tenants').getList(1, 1, {
                sort: 'name'
            });
            console.log("Success! Total items:", result.totalItems);
        } catch (e) {
            console.error("FAILED 5:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        }

    } catch (err) {
        console.error("Global Error:", err);
    }
}

diagnose();
