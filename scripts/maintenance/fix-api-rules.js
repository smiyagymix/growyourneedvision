import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Authenticate as admin
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);

async function updateApiRules(collectionName, rule) {
    try {
        const collection = await pb.collections.getOne(collectionName);
        console.log(`Updating rules for ${collectionName}...`);
        
        // Allow full access to authenticated users for now to unblock testing
        // In production, these should be tighter (e.g., @request.auth.role = 'Owner')
        collection.listRule = rule;
        collection.viewRule = rule;
        collection.createRule = rule;
        collection.updateRule = rule;
        collection.deleteRule = rule;
        
        await pb.collections.update(collectionName, collection);
        console.log(`✅ Updated ${collectionName}`);
    } catch (e) {
        console.error(`❌ Failed to update ${collectionName}:`, e.message);
    }
}

async function main() {
    console.log('Fixing API Rules for Owner Dashboard Collections...');

    const collections = [
        'tenants',
        'invoices',
        'subscription_plans',
        'system_alerts',
        'revenue_history',
        'tenant_growth',
        'users' // Ensure users can list other users if needed
    ];

    // Rule: Any authenticated user can access
    // For 'users', we might want to be careful, but for this test environment:
    const authRule = "@request.auth.id != ''";

    for (const name of collections) {
        await updateApiRules(name, authRule);
    }

    console.log('API Rules Update Complete!');
}

main().catch(console.error);
