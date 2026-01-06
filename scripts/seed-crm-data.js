import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedCRMData() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // Get admin user ID
        const admin = await pb.collection('users').getFirstListItem('email=process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL').catch(() => null);
        const userId = admin ? admin.id : (await pb.collection('users').getList(1, 1)).items[0]?.id;

        if (!userId) {
            console.error('No user found to assign');
            return;
        }

        // 1. Seed Deals
        const deals = [
            { title: 'Enterprise License - TechCorp', value: 50000, stage: 'Negotiation', description: '500 seats', contact_name: 'John Doe', assigned_to: userId, probability: 80 },
            { title: 'School District A', value: 12000, stage: 'Proposal', description: 'Pilot program', contact_name: 'Jane Smith', assigned_to: userId, probability: 60 },
            { title: 'Startup Bundle', value: 2500, stage: 'Closed Won', description: 'Standard plan', contact_name: 'Mike Jones', assigned_to: userId, probability: 100 },
            { title: 'University Deal', value: 75000, stage: 'Lead', description: 'Initial outreach', contact_name: 'Dr. Brown', assigned_to: userId, probability: 10 }
        ];

        for (const deal of deals) {
            try {
                await pb.collection('deals').create(deal);
                console.log(`Created deal: ${deal.title}`);
            } catch (e) {
                console.log(`Failed to create deal: ${e.message}`);
            }
        }

        // 2. Seed Contacts
        const contacts = [
            { name: 'John Doe', email: 'john@techcorp.com', phone: '555-0101', company: 'TechCorp', role: 'CTO', last_contact: new Date().toISOString() },
            { name: 'Jane Smith', email: 'jane@schooldistrict.edu', phone: '555-0102', company: 'School District A', role: 'Superintendent', last_contact: new Date().toISOString() },
            { name: 'Mike Jones', email: 'mike@startup.io', phone: '555-0103', company: 'Startup IO', role: 'CEO', last_contact: new Date().toISOString() }
        ];

        for (const contact of contacts) {
            try {
                await pb.collection('contacts').create(contact);
                console.log(`Created contact: ${contact.name}`);
            } catch (e) {
                console.log(`Failed to create contact: ${e.message}`);
            }
        }

        // 3. Seed Forecasts
        const forecasts = [
            { month: '2025-10', projected: 45000, actual: 48000 },
            { month: '2025-11', projected: 50000, actual: 52000 },
            { month: '2025-12', projected: 55000, actual: 0 }
        ];

        for (const forecast of forecasts) {
            try {
                await pb.collection('forecasts').create(forecast);
                console.log(`Created forecast for: ${forecast.month}`);
            } catch (e) {
                console.log(`Failed to create forecast: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('Failed to seed CRM data:', error);
    }
}

seedCRMData();
