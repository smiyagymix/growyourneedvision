import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.PB_ADMIN_PASS || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
    try {
        console.log(`Authenticating as ${ADMIN_EMAIL}...`);
        await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS);

        const collections = [
            'activities',
            'classes',
            'finance_transactions',
            'wellness_logs',
            'messages'
        ];

        for (const colName of collections) {
            try {
                const collection = await pb.collections.getOne(colName);
                console.log(`Updating rules for ${colName}...`);
                
                // Allow everyone to list and view (for demo purposes, or restrict to auth users)
                // Using "" (empty string) means public. 
                // Using "@request.auth.id != ''" means authenticated users only.
                
                await pb.collections.update(collection.id, {
                    listRule: "",
                    viewRule: "",
                    createRule: "@request.auth.id != ''",
                    updateRule: "@request.auth.id != ''",
                    deleteRule: "@request.auth.id != ''",
                });
                console.log(`Updated rules for ${colName} to PUBLIC`);
            } catch (e) {
                console.log(`Collection ${colName} not found or error updating:`, e.message);
            }
        }

    } catch (err) {
        console.error('Error updating rules:', err);
    }
}

main();
