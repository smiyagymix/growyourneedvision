import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Configuration
const ADMIN_EMAIL = process.argv[2] || 'owner@growyourneed.com';
const ADMIN_PASSWORD = process.argv[3] || '12345678';

const MOCK_APPS = [
    { name: 'Advanced Analytics Dashboard', provider: 'GYN Team', category: 'Analytics', rating: 4.8, installs: 15420, price: 'Free', verified: true, data: { description: 'Real-time insights for your school management.' } },
    { name: 'AI Content Generator', provider: 'AI Labs', category: 'AI & Automation', rating: 4.6, installs: 8930, price: '$9.99/mo', verified: true, data: { description: 'Generate high-quality course content automatically.' } },
    { name: 'Zoom Integration', provider: 'Zoom Video Communications', category: 'Communication', rating: 4.5, installs: 25000, price: 'Free', verified: true, data: { description: 'Seamless video conferencing for classrooms.' } },
    { name: 'Stripe Payments', provider: 'Stripe', category: 'Finance', rating: 4.9, installs: 12000, price: 'Free', verified: true, data: { description: 'Accept payments globally.' } },
    { name: 'Attendance Tracker Pro', provider: 'EduTools', category: 'Administrative', rating: 4.2, installs: 5000, price: '$4.99/mo', verified: false, data: { description: 'Advanced attendance tracking with biometrics.' } },
];

async function main() {
    console.log(`Starting Marketplace Seeding...`);
    console.log(`Target: ${pb.baseUrl}`);

    try {
        // 1. Authenticate
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated as Admin');

        // 2. Seed Apps
        console.log(`\nChecking ${MOCK_APPS.length} apps...`);
        let changes = 0;

        // Fetch all existing apps to check efficiently in memory
        let existingApps = [];
        try {
            existingApps = await pb.collection('marketplace_apps').getFullList();
            console.log(`Loaded ${existingApps.length} existing apps.`);
        } catch (e) {
            console.error('Error fetching existing apps (Collection might not exist yet):', e.status, e.message);
            console.log('Ensure you have restarted PocketBase to apply the migration!');
            return;
        }

        const existingNames = new Set(existingApps.map(a => a.name));

        for (const app of MOCK_APPS) {
            try {
                if (existingNames.has(app.name)) {
                    console.log(`  - [${app.name}] Exists. Skipping.`);
                } else {
                    process.stdout.write(`  - [${app.name}] Creating... `);
                    await pb.collection('marketplace_apps').create(app);
                    console.log('Done.');
                    changes++;
                }
            } catch (e) {
                console.error(`  - [${app.name}] Error creating:`, e.status, e.message);
                if (e.data) console.error('    Details:', JSON.stringify(e.data));
            }
        }

        console.log(`\n✨ Seeding Complete! Added ${changes} new apps.`);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
    }
}

main();
