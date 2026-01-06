import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initBusinessSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Business Plans
        try {
            await pb.collections.create({
                name: 'business_plans',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true }, // Starter, Professional, Enterprise
                    { name: 'price', type: 'number', required: true },
                    { name: 'billing_cycle', type: 'select', options: { values: ['Monthly', 'Yearly'] } },
                    { name: 'features', type: 'json', required: false }, // List of features
                    { name: 'user_limit', type: 'number', required: false },
                    { name: 'adoption_rate', type: 'number', required: false }, // Percentage
                    { name: 'is_active', type: 'bool', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created business_plans collection');
        } catch (e) {
            console.log('business_plans collection might already exist');
        }

        // 2. Business Rules (Automation)
        try {
            await pb.collections.create({
                name: 'business_rules',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'trigger', type: 'text', required: true },
                    { name: 'action', type: 'text', required: true },
                    { name: 'status', type: 'select', options: { values: ['Active', 'Paused', 'Draft'] } },
                    { name: 'last_run', type: 'date', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created business_rules collection');
        } catch (e) {
            console.log('business_rules collection might already exist');
        }

        // 3. Customer Segments
        try {
            await pb.collections.create({
                name: 'customer_segments',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'criteria', type: 'json', required: true }, // Filter criteria
                    { name: 'count', type: 'number', required: false },
                    { name: 'growth', type: 'text', required: false }, // e.g. "+12%"
                    { name: 'color', type: 'text', required: false } // e.g. "bg-purple-500"
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created customer_segments collection');
        } catch (e) {
            console.log('customer_segments collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init business schema:', error);
    }
}

initBusinessSchema();
