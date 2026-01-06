import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function fixCriticalRules() {
    console.log('🛠️ Fixing Critical Rule Flaws...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);

        // 1. Fix Users Collection (CRITICAL)
        try {
            const users = await pb.collections.getOne('users');
            console.log('Fixing users collection...');
            
            // Allow public registration
            users.createRule = ""; 
            
            // Allow users to see others (for social features), but restrict editing/deleting to self
            users.listRule = "@request.auth.id != ''";
            users.viewRule = "@request.auth.id != ''";
            users.updateRule = "id = @request.auth.id";
            users.deleteRule = "id = @request.auth.id"; // Or null (Admin only)

            await pb.collections.update('users', users);
            console.log('✅ Users collection secured (Self-update only, Public registration)');
        } catch (e) {
            console.error('Failed to fix users:', e.message);
        }

        // 2. Fix Finance Transactions (Privacy)
        try {
            const finance = await pb.collections.getOne('finance_transactions');
            console.log('Fixing finance_transactions...');
            
            // Check if it has a 'user' field (support both schema and fields for compatibility)
            const fields = finance.fields || finance.schema || [];
            const hasUser = fields.some(f => f.name === 'user');
            const hasTenant = fields.some(f => f.name === 'tenantId');

            let rule = "@request.auth.id != ''"; // Default fallback
            
            if (hasUser) {
                rule = "user = @request.auth.id";
            } else if (hasTenant) {
                // Assuming user has tenantId, but we can't easily check user's tenant in rule without a relation join or API filter
                // For now, let's lock it down to Admin Only if we can't be sure, OR strict user ownership
                // If no user field, maybe it's system data?
                // Let's set it to Admin Only if we are unsure, to be safe.
                // But if it's "expenses" or similar, users need to see it.
                // Let's assume it's personal/tenant data.
                // If we don't know, Admin Only is safest.
                rule = null; 
                console.log('⚠️ finance_transactions schema unclear, setting to ADMIN ONLY for safety.');
            }

            if (hasUser) {
                finance.listRule = rule;
                finance.viewRule = rule;
                finance.createRule = rule; // Users create their own transactions?
                finance.updateRule = rule;
                finance.deleteRule = rule;
                await pb.collections.update('finance_transactions', finance);
                console.log(`✅ Secured finance_transactions with rule: ${rule}`);
            } else {
                 // If no user field, lock it.
                 finance.listRule = null;
                 finance.viewRule = null;
                 finance.createRule = null;
                 finance.updateRule = null;
                 finance.deleteRule = null;
                 await pb.collections.update('finance_transactions', finance);
                 console.log(`✅ Locked finance_transactions (Admin Only)`);
            }

        } catch (e) {
            console.error('Failed to fix finance_transactions:', e.message);
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

fixCriticalRules();
