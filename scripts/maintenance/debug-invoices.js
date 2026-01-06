import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function debugInvoices() {
    try {
        console.log('Authenticating as owner...');
        await pb.collection('users').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated.');

        console.log('--- Test 1: Fetch all invoices (no filter, no sort) ---');
        try {
            const invoices = await pb.collection('invoices').getFullList();
            console.log(`Success! Found ${invoices.length} invoices.`);
        } catch (e) {
            console.error('Test 1 Failed:', e.message, e.data);
        }

        console.log('\n--- Test 2: Fetch invoices with filter (status = "Paid") ---');
        try {
            const invoices = await pb.collection('invoices').getFullList({
                filter: 'status = "Paid"'
            });
            console.log(`Success! Found ${invoices.length} paid invoices.`);
        } catch (e) {
            console.error('Test 2 Failed:', e.message, e.data);
        }

        console.log('\n--- Test 4: Fetch invoices with filter (tenantId = "some_id") ---');
        try {
            // Get a tenant ID first
            const tenants = await pb.collection('tenants').getList(1, 1);
            if (tenants.items.length > 0) {
                const tenantId = tenants.items[0].id;
                const invoices = await pb.collection('invoices').getFullList({
                    filter: `tenantId = "${tenantId}"`
                });
                console.log(`Success! Found ${invoices.length} invoices for tenant ${tenantId}.`);
            } else {
                console.log('Skipping Test 4: No tenants found.');
            }
        } catch (e) {
            console.error('Test 4 Failed:', e.message, e.data);
        }

        console.log('\n--- Test 3: Fetch invoices with sort (sort: "-created") ---');
        try {
            const invoices = await pb.collection('invoices').getFullList({
                sort: '-created'
            });
            console.log(`Success! Found ${invoices.length} invoices sorted by created.`);
        } catch (e) {
            console.error('Test 3 Failed (Expected?):', e.message, e.data);
        }

    } catch (err) {
        console.error('Global Error:', err);
    }
}

debugInvoices();
