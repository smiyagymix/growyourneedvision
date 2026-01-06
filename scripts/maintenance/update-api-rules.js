import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateRules() {
    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        const collections = [
            'system_alerts', 
            'revenue_history', 
            'tenant_growth',
            'tenants',
            'invoices',
            'subscription_plans'
        ];
        
        for (const colName of collections) {
            try {
                const collection = await pb.collections.getOne(colName);
                
                console.log(`Current rules for ${colName}: List='${collection.listRule}', View='${collection.viewRule}'`);
                
                // Allow Owners to view/list
                // For simplicity in this dev environment, we allow all authenticated users to view
                // In production, this should be stricter: @request.auth.role = 'Owner'
                const newRule = "@request.auth.id != ''"; 
                
                let updated = false;
                if (collection.listRule !== newRule) {
                    collection.listRule = newRule;
                    updated = true;
                }
                if (collection.viewRule !== newRule) {
                    collection.viewRule = newRule;
                    updated = true;
                }
                
                if (updated) {
                    await pb.collections.update(collection.id, collection);
                    console.log(`✅ Updated rules for ${colName}`);
                } else {
                    console.log(`ℹ️ Rules already set for ${colName}`);
                }
            } catch (err) {
                console.error(`❌ Failed to update ${colName}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Auth failed:', err);
    }
}

updateRules();
