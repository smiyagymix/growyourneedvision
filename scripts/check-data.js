import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
        
        console.log('Checking finance_transactions...');
        const transactions = await pb.collection('finance_transactions').getFullList();
        console.log(`Found ${transactions.length} transactions.`);
        if (transactions.length > 0) {
            console.log('Sample:', JSON.stringify(transactions[0], null, 2));
        }

        console.log('Checking classes...');
        const classes = await pb.collection('classes').getFullList();
        console.log(`Found ${classes.length} classes.`);

        console.log('Checking users...');
        const student = await pb.collection('users').getFirstListItem('email="student@school.com"');
        console.log('Student:', student.name, student.email);

    } catch (e) {
        console.error(e);
    }
}

main();
