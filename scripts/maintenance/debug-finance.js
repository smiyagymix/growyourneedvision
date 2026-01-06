import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function debugFinance() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        const finance = await pb.collections.getOne('finance_transactions');
        console.log('Type:', finance.type);
        console.log('Keys:', Object.keys(finance));
        console.log('Fields:', finance.fields);
    } catch (e) {
        console.error(e);
    }
}

debugFinance();
