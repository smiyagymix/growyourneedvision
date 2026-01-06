import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function main() {
    console.log('Authenticating as Owner (User)...');
    try {
        await pb.collection('users').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Authenticated');
    } catch (e) {
        console.error('❌ Authentication failed:', e.message);
        return;
    }

    console.log('Fetching Tenants (Sort by name)...');
    try {
        const tenants = await pb.collection('tenants').getFullList({
            sort: 'name'
        });
        console.log(`✅ Fetched ${tenants.length} tenants.`);
    } catch (e) {
        console.error('❌ Fetch failed (name):', e.message);
    }

    console.log('Fetching Tenants (Sort by -updated)...');
    try {
        const tenants = await pb.collection('tenants').getFullList({
            sort: '-updated'
        });
        console.log(`✅ Fetched ${tenants.length} tenants.`);
    } catch (e) {
        console.error('❌ Fetch failed (-updated):', e.message);
    }
}

main();
