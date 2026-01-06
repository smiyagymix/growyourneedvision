import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function deepVerify() {
    console.log('🔍 Deep Verification of Rules...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);

        const sensitive = ['wellness_logs', 'users', 'products', 'finance_transactions'];
        
        for (const name of sensitive) {
            try {
                const col = await pb.collections.getOne(name);
                console.log(`\nCollection: ${name}`);
                console.log(`List:   ${col.listRule}`);
                console.log(`View:   ${col.viewRule}`);
                console.log(`Create: ${col.createRule}`);
                console.log(`Update: ${col.updateRule}`);
                console.log(`Delete: ${col.deleteRule}`);
            } catch (e) {
                console.log(`Could not fetch ${name}: ${e.message}`);
            }
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

deepVerify();
