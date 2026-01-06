import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function main() {
    console.log('Starting analytics schema update...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Analytics Pages Collection
        try {
            await pb.collections.create({
                name: 'analytics_pages',
                type: 'base',
                schema: [
                    { name: 'path', type: 'text', required: true },
                    { name: 'visitors', type: 'number', required: true },
                    { name: 'category', type: 'text', required: false }
                ]
            });
            console.log('Created analytics_pages collection');
        } catch (e) {
            console.log('analytics_pages collection might already exist');
        }

        // 2. Analytics Sources Collection (for Top Users Access)
        try {
            await pb.collections.create({
                name: 'analytics_sources',
                type: 'base',
                schema: [
                    { name: 'source', type: 'text', required: true },
                    { name: 'visitors', type: 'number', required: true },
                    { name: 'color', type: 'text', required: false }
                ]
            });
            console.log('Created analytics_sources collection');
        } catch (e) {
            console.log('analytics_sources collection might already exist');
        }

        // 3. Finance Expenses Collection
        try {
            await pb.collections.create({
                name: 'finance_expenses',
                type: 'base',
                schema: [
                    { name: 'category', type: 'text', required: true },
                    { name: 'amount', type: 'number', required: true },
                    { name: 'color', type: 'text', required: false },
                    { name: 'percentage', type: 'number', required: false }
                ]
            });
            console.log('Created finance_expenses collection');
        } catch (e) {
            console.log('finance_expenses collection might already exist');
        }

        // Seed Data
        console.log('Seeding analytics data...');

        // Clear existing
        const pages = await pb.collection('analytics_pages').getFullList();
        for (const p of pages) await pb.collection('analytics_pages').delete(p.id);
        
        const sources = await pb.collection('analytics_sources').getFullList();
        for (const s of sources) await pb.collection('analytics_sources').delete(s.id);

        const expenses = await pb.collection('finance_expenses').getFullList();
        for (const e of expenses) await pb.collection('finance_expenses').delete(e.id);

        // Seed Pages
        await pb.collection('analytics_pages').create({ path: '/facebook', visitors: 20874, category: 'Social' });
        await pb.collection('analytics_pages').create({ path: '/components', visitors: 19188, category: 'Internal' });
        await pb.collection('analytics_pages').create({ path: '/docs/getting-started', visitors: 17922, category: 'Docs' });
        await pb.collection('analytics_pages').create({ path: '/docs/visualization', visitors: 10067, category: 'Docs' });

        // Seed Sources
        await pb.collection('analytics_sources').create({ source: 'google.com', visitors: 9882, color: '#3b82f6' });
        await pb.collection('analytics_sources').create({ source: 'twitter.com', visitors: 1904, color: '#06b6d4' });
        await pb.collection('analytics_sources').create({ source: 'github.com', visitors: 1904, color: '#8b5cf6' });
        await pb.collection('analytics_sources').create({ source: 'youtube.com', visitors: 1118, color: '#f59e0b' });
        await pb.collection('analytics_sources').create({ source: 'reddit.com', visitors: 396, color: '#f97316' });

        // Seed Expenses
        await pb.collection('finance_expenses').create({ category: 'Travel', amount: 6730, percentage: 32.1, color: '#3b82f6' });
        await pb.collection('finance_expenses').create({ category: 'IT and Equipment', amount: 4120, percentage: 19.6, color: '#ef4444' });
        await pb.collection('finance_expenses').create({ category: 'Training and development', amount: 3920, percentage: 18.6, color: '#06b6d4' });
        await pb.collection('finance_expenses').create({ category: 'Office supplies', amount: 3210, percentage: 15.3, color: '#a855f7' });
        await pb.collection('finance_expenses').create({ category: 'Communication', amount: 3010, percentage: 14.3, color: '#22c55e' });

        console.log('Analytics data seeded successfully!');

    } catch (error) {
        console.error('Error updating schema:', error);
    }
}

main();
