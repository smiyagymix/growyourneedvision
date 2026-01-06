import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initCollections() {
    console.log('🚀 Initializing PocketBase collections...');

    // Authenticate as admin
    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        process.exit(1);
    }

    // Define collections
    const collections = [
        {
            name: 'tenants',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'type', type: 'select', options: { values: ['School', 'Individual', 'Enterprise'] } },
                { name: 'status', type: 'select', options: { values: ['Active', 'Pending', 'Suspended', 'Trial'] } },
                { name: 'domain', type: 'text' },
                { name: 'contact_email', type: 'email' },
                { name: 'subscription_plan', type: 'select', options: { values: ['Starter', 'Professional', 'Enterprise'] } },
                { name: 'users_count', type: 'number' },
                { name: 'branding', type: 'json' },
                { name: 'settings', type: 'json' },
                { name: 'address', type: 'text' },
                { name: 'phone', type: 'text' },
                { name: 'website', type: 'url' },
                { name: 'billing_cycle', type: 'select', options: { values: ['Monthly', 'Yearly'] } },
                { name: 'next_billing_date', type: 'date' }
            ]
        },
        {
            name: 'invoices',
            type: 'base',
            schema: [
                { name: 'tenantId', type: 'relation', options: { collectionId: 'tenants', cascadeDelete: false } },
                { name: 'amount', type: 'number' },
                { name: 'status', type: 'select', options: { values: ['Paid', 'Due', 'Overdue'] } },
                { name: 'date', type: 'date' },
                { name: 'pdfUrl', type: 'url' }
            ]
        },
        {
            name: 'deals',
            type: 'base',
            schema: [
                { name: 'title', type: 'text', required: true },
                { name: 'value', type: 'number' },
                { name: 'stage', type: 'select', options: { values: ['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] } },
                { name: 'contact_person', type: 'text' },
                { name: 'probability', type: 'number' },
                { name: 'expected_close_date', type: 'date' }
            ]
        },
        {
            name: 'contacts',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'email', type: 'email' },
                { name: 'phone', type: 'text' },
                { name: 'company', type: 'text' },
                { name: 'role', type: 'text' }
            ]
        },
        {
            name: 'wellness_logs',
            type: 'base',
            schema: [
                { name: 'date', type: 'date' },
                { name: 'steps', type: 'number' },
                { name: 'calories', type: 'number' },
                { name: 'sleep_minutes', type: 'number' },
                { name: 'mood', type: 'text' },
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
            ]
        },
        {
            name: 'chat_messages',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'role', type: 'select', options: { values: ['user', 'assistant', 'system'] } },
                { name: 'content', type: 'text' },
                { name: 'context', type: 'text' }
            ]
        },
        {
            name: 'products',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'price', type: 'number' },
                { name: 'description', type: 'text' },
                { name: 'category', type: 'text' }
            ]
        },
        {
            name: 'classes',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                { name: 'teacher', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'schedule', type: 'date' },
                { name: 'room', type: 'text' }
            ]
        },
        {
            name: 'tickets',
            type: 'base',
            schema: [
                { name: 'subject', type: 'text', required: true },
                { name: 'description', type: 'text' },
                { name: 'status', type: 'select', options: { values: ['Open', 'In Progress', 'Resolved', 'Closed'] } },
                { name: 'priority', type: 'select', options: { values: ['Low', 'Medium', 'High', 'Critical'] } },
                { name: 'tenantId', type: 'relation', options: { collectionId: 'tenants', cascadeDelete: false } },
                { name: 'created_by', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'assigned_to', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
                { name: 'category', type: 'select', options: { values: ['Technical', 'Billing', 'Feature Request', 'Other'] } }
            ]
        },
        {
            name: 'system_alerts',
            type: 'base',
            schema: [
                { name: 'severity', type: 'select', options: { values: ['critical', 'warning', 'info'] } },
                { name: 'message', type: 'text' },
                { name: 'actionUrl', type: 'url' }
            ]
        },
        {
            name: 'revenue_history',
            type: 'base',
            schema: [
                { name: 'label', type: 'text' },
                { name: 'value', type: 'number' },
                { name: 'value2', type: 'number' }
            ]
        },
        {
            name: 'tenant_growth',
            type: 'base',
            schema: [
                { name: 'label', type: 'text' },
                { name: 'value', type: 'number' }
            ]
        },
        {
            name: 'system_health',
            type: 'base',
            schema: [
                { name: 'status', type: 'text' },
                { name: 'uptime', type: 'number' },
                { name: 'cpu_load', type: 'number' },
                { name: 'memory_usage', type: 'number' }
            ]
        },
        {
            name: 'ai_analytics',
            type: 'base',
            schema: [
                { name: 'metric', type: 'text' },
                { name: 'value', type: 'number' },
                { name: 'timestamp', type: 'date' }
            ]
        },
        {
            name: 'ai_operations',
            type: 'base',
            schema: [
                { name: 'operation', type: 'text' },
                { name: 'status', type: 'text' },
                { name: 'duration', type: 'number' }
            ]
        },
        {
            name: 'ai_dev_logs',
            type: 'base',
            schema: [
                { name: 'level', type: 'text' },
                { name: 'message', type: 'text' },
                { name: 'source', type: 'text' }
            ]
        },
        {
            name: 'ai_system_stats',
            type: 'base',
            schema: [
                { name: 'latency', type: 'text' },
                { name: 'error_rate', type: 'text' },
                { name: 'load', type: 'text' },
                { name: 'tokens_total', type: 'text' },
                { name: 'tokens_input', type: 'text' },
                { name: 'tokens_output', type: 'text' },
                { name: 'provider', type: 'text' }
            ]
        }
    ];

    for (const col of collections) {
        try {
            await pb.collections.create(col);
            console.log(`✅ Created collection: ${col.name}`);
        } catch (err) {
            if (err.status === 400 && err.response?.data?.name?.message === 'Collection name must be unique (case insensitive).') {
                console.log(`⚠️  Collection ${col.name} already exists. Updating rules...`);
                try {
                    const existing = await pb.collections.getOne(col.name);
                    // Update rules to be public for testing
                    existing.listRule = '';
                    existing.viewRule = '';
                    existing.createRule = '';
                    existing.updateRule = '';
                    existing.deleteRule = '';
                    await pb.collections.update(existing.id, existing);
                    console.log(`   ✅ Updated rules for ${col.name}`);
                } catch (updateErr) {
                    console.error(`   ❌ Failed to update rules for ${col.name}:`, updateErr.message);
                }
            } else {
                console.error(`❌ Failed to create collection ${col.name}:`, err.message);
                console.error(JSON.stringify(err.response, null, 2));
            }
        }
    }

    console.log('✨ Collections initialization complete!');
}

initCollections();
