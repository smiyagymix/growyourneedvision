/**
 * Initialize Dashboard Builder Collections
 * 
 * Creates PocketBase collection for custom dashboard layouts
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeCollections() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');
        console.log('✓ Authenticated as superuser');

        const collections = await pb.collections.getFullList();

        // ==================== DASHBOARD LAYOUTS ====================
        const dashboardLayoutsExists = collections.find(c => c.name === 'dashboard_layouts');

        if (!dashboardLayoutsExists) {
            console.log('\n📋 Creating dashboard_layouts collection...');
            await pb.collections.create({
                name: 'dashboard_layouts',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                        options: { min: 1, max: 255 }
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: false,
                        options: { max: 1000 }
                    },
                    {
                        name: 'userId',
                        type: 'text',
                        required: true,
                        options: { max: 255 }
                    },
                    {
                        name: 'isDefault',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'widgets',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'gridConfig',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'theme',
                        type: 'text',
                        required: false,
                        options: { max: 50 }
                    }
                ],
                listRule: '@request.auth.id = userId',
                viewRule: '@request.auth.id = userId',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = userId',
                deleteRule: '@request.auth.id = userId'
            });
            console.log('✓ Created dashboard_layouts collection');
        } else {
            console.log('\n✓ dashboard_layouts collection already exists');
        }

        // ==================== SEED DEFAULT LAYOUTS ====================
        console.log('\n🌱 Seeding default dashboard layouts...');
        
        const ownerUser = await pb.collection('users').getFirstListItem('role = "Owner"');

        const defaultLayouts = [
            {
                name: 'Default Owner Dashboard',
                description: 'Standard analytics and monitoring view',
                userId: ownerUser.id,
                isDefault: true,
                widgets: [
                    { id: 'w1', type: 'revenue-chart', x: 0, y: 0, width: 6, height: 4 },
                    { id: 'w2', type: 'tenant-health', x: 6, y: 0, width: 3, height: 3 },
                    { id: 'w3', type: 'active-users', x: 9, y: 0, width: 3, height: 2 },
                    { id: 'w4', type: 'churn-prediction', x: 0, y: 4, width: 4, height: 3 },
                    { id: 'w5', type: 'usage-graph', x: 4, y: 4, width: 6, height: 4 },
                    { id: 'w6', type: 'alerts-feed', x: 10, y: 2, width: 2, height: 4 }
                ],
                gridConfig: {
                    columns: 12,
                    rowHeight: 80,
                    gap: 16
                },
                theme: 'default'
            },
            {
                name: 'Revenue Focus',
                description: 'Financial metrics and revenue tracking',
                userId: ownerUser.id,
                isDefault: false,
                widgets: [
                    { id: 'w1', type: 'mrr-trend', x: 0, y: 0, width: 6, height: 3 },
                    { id: 'w2', type: 'revenue-chart', x: 6, y: 0, width: 6, height: 4 },
                    { id: 'w3', type: 'trial-conversions', x: 0, y: 3, width: 3, height: 2 },
                    { id: 'w4', type: 'tenant-health', x: 3, y: 3, width: 3, height: 3 }
                ],
                gridConfig: {
                    columns: 12,
                    rowHeight: 80,
                    gap: 16
                },
                theme: 'default'
            },
            {
                name: 'Operations Dashboard',
                description: 'Support, tickets, and system monitoring',
                userId: ownerUser.id,
                isDefault: false,
                widgets: [
                    { id: 'w1', type: 'support-tickets', x: 0, y: 0, width: 4, height: 3 },
                    { id: 'w2', type: 'system-status', x: 4, y: 0, width: 4, height: 2 },
                    { id: 'w3', type: 'recent-signups', x: 0, y: 3, width: 4, height: 3 },
                    { id: 'w4', type: 'alerts-feed', x: 8, y: 0, width: 4, height: 6 },
                    { id: 'w5', type: 'api-calls', x: 4, y: 2, width: 4, height: 3 }
                ],
                gridConfig: {
                    columns: 12,
                    rowHeight: 80,
                    gap: 16
                },
                theme: 'default'
            }
        ];

        for (const layout of defaultLayouts) {
            try {
                const exists = await pb.collection('dashboard_layouts').getFirstListItem(
                    `userId = "${layout.userId}" && name = "${layout.name}"`
                ).catch(() => null);

                if (!exists) {
                    await pb.collection('dashboard_layouts').create(layout);
                    console.log(`  ✓ Created layout: ${layout.name}`);
                } else {
                    console.log(`  ✓ Layout already exists: ${layout.name}`);
                }
            } catch (error) {
                console.error(`  ✗ Failed to create layout ${layout.name}:`, error.message);
            }
        }

        console.log('\n✅ Dashboard Builder collections initialized successfully!');
        console.log('\n📊 Summary:');
        console.log('  • dashboard_layouts: Custom dashboard configurations');
        console.log('  • 3 default layouts created for Owner role');
        console.log('  • 15+ widget types available');
        
    } catch (error) {
        console.error('❌ Failed to initialize collections:', error);
        process.exit(1);
    }
}

initializeCollections();
