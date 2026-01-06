import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedMarketplaceData() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // Get admin user ID to use as provider
        const admin = await pb.collection('users').getFirstListItem('email=process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL').catch(() => null);
        const providerId = admin ? admin.id : (await pb.collection('users').getList(1, 1)).items[0]?.id;

        if (!providerId) {
            console.error('No user found to assign as provider');
            return;
        }

        const apps = [
            {
                name: 'Stripe Payments',
                description: 'Accept payments globally with Stripe integration.',
                category: 'Finance',
                price: 'Free',
                provider: providerId,
                icon: 'CreditCardIcon',
                rating: 4.8,
                installs: 1250,
                verified: true
            },
            {
                name: 'Mailchimp Sync',
                description: 'Sync your customer segments with Mailchimp audiences.',
                category: 'Marketing',
                price: '$9.99',
                provider: providerId,
                icon: 'EnvelopeIcon',
                rating: 4.5,
                installs: 890,
                verified: true
            },
            {
                name: 'Slack Notifications',
                description: 'Get real-time alerts in your Slack channels.',
                category: 'Communication',
                price: 'Free',
                provider: providerId,
                icon: 'ChatBubbleLeftRightIcon',
                rating: 4.9,
                installs: 2100,
                verified: true
            },
            {
                name: 'Google Analytics 4',
                description: 'Advanced analytics for your platform.',
                category: 'Analytics',
                price: 'Free',
                provider: providerId,
                icon: 'ChartBarIcon',
                rating: 4.7,
                installs: 1500,
                verified: true
            }
        ];

        for (const app of apps) {
            try {
                await pb.collection('marketplace_apps').create(app);
                console.log(`Created app: ${app.name}`);
            } catch (e) {
                console.log(`Failed to create app ${app.name}: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('Failed to seed marketplace data:', error);
    }
}

seedMarketplaceData();
