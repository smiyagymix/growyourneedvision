import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function debugNotifications() {
    try {
        console.log('Authenticating...');
        // Authenticate as the user who was having issues if possible, or admin to test the query structure
        // The error log showed user ID "dmkkc12tni06f68"
        // I can't auth as that user without password, so I'll auth as admin and try to list with that filter
        // Note: Admin requests ignore listRules, so this might pass even if the rule is wrong.
        // But a 400 error usually implies a syntax error in the filter, not a permission error.
        
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        const userId = "dmkkc12tni06f68";
        
        console.log('Test 1: No filter');
        try {
            await pb.collection('notifications').getList(1, 1);
            console.log('Test 1 passed');
        } catch(e) { console.log('Test 1 failed', e.status); }

        console.log('Test 2: Filter by user only');
        try {
            await pb.collection('notifications').getList(1, 1, { filter: `user = "${userId}"` });
            console.log('Test 2 passed');
        } catch(e) { console.log('Test 2 failed', e.status); }

        console.log('Test 3: Filter by is_read only');
        try {
            await pb.collection('notifications').getList(1, 1, { filter: `is_read = false` });
            console.log('Test 3 passed');
        } catch(e) { console.log('Test 3 failed', e.status); }
        
    } catch (err) {
        console.error('Error:', err);
    }
}

debugNotifications();
