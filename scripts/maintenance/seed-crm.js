import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const COLLECTIONS = [
    {
        name: 'deals',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'value', type: 'number' },
            { name: 'stage', type: 'select', options: { values: ['Lead', 'Contacted', 'Demo Scheduled', 'Trial', 'Subscribed'] } },
            { name: 'description', type: 'text' },
            { name: 'contact_name', type: 'text' },
            { name: 'assigned_to', type: 'text' } // Simplified for seed, ideally relation
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
            { name: 'role', type: 'text' },
            { name: 'last_contact', type: 'date' }
        ]
    },
    {
        name: 'forecasts',
        type: 'base',
        schema: [
            { name: 'month', type: 'text' },
            { name: 'projected', type: 'number' },
            { name: 'actual', type: 'number' }
        ]
    }
];

const SEED_DATA = {
    deals: [
        { title: 'Enterprise License - TechCorp', value: 15000, stage: 'Demo Scheduled', description: 'Full platform access for 500 users', contact_name: 'John Doe', assigned_to: 'u1' },
        { title: 'School District Pilot', value: 5000, stage: 'Lead', description: 'Pilot program for 2 schools', contact_name: 'Jane Smith', assigned_to: 'u1' },
        { title: 'Startup Plan', value: 1000, stage: 'Subscribed', description: 'Basic plan for startup', contact_name: 'Mike Brown', assigned_to: 'u1' }
    ],
    contacts: [
        { name: 'John Doe', email: 'john@techcorp.com', phone: '555-0101', company: 'TechCorp', role: 'CTO', last_contact: new Date().toISOString() },
        { name: 'Jane Smith', email: 'jane@schools.edu', phone: '555-0102', company: 'City Schools', role: 'Principal', last_contact: new Date().toISOString() }
    ],
    forecasts: [
        { month: 'Jan', projected: 50000, actual: 45000 },
        { month: 'Feb', projected: 55000, actual: 58000 },
        { month: 'Mar', projected: 60000, actual: 52000 }
    ],
    tickets: [
        { subject: 'Login Issue', description: 'User cannot login with correct password', status: 'Open', priority: 'High', category: 'Technical' },
        { subject: 'Billing Question', description: 'Invoice amount incorrect', status: 'In Progress', priority: 'Medium', category: 'Billing' },
        { subject: 'Feature Request: Dark Mode', description: 'Please add dark mode', status: 'Resolved', priority: 'Low', category: 'Feature Request' }
    ],
    system_alerts: [
        { severity: 'critical', message: 'High CPU usage detected on server 1', actionUrl: '/admin/system' },
        { severity: 'warning', message: 'Database backup delayed', actionUrl: '/admin/backups' },
        { severity: 'info', message: 'System maintenance scheduled for Sunday', actionUrl: '/admin/maintenance' }
    ],
    revenue_history: [
        { label: 'Jan', value: 45000, value2: 40000 },
        { label: 'Feb', value: 58000, value2: 42000 },
        { label: 'Mar', value: 52000, value2: 45000 },
        { label: 'Apr', value: 63000, value2: 48000 },
        { label: 'May', value: 71000, value2: 50000 }
    ],
    tenant_growth: [
        { label: 'Jan', value: 10 },
        { label: 'Feb', value: 15 },
        { label: 'Mar', value: 22 },
        { label: 'Apr', value: 35 },
        { label: 'May', value: 48 }
    ]
};

async function seedCRM() {
    console.log('🚀 Starting CRM Data Seeding...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);

        for (const col of COLLECTIONS) {
            try {
                await pb.collections.getOne(col.name);
                console.log(`ℹ️  Collection '${col.name}' exists.`);
            } catch (e) {
                if (e.status === 404) {
                    console.log(`🔨 Creating collection '${col.name}'...`);
                    try {
                        const created = await pb.collections.create(col);
                        // Set public rules for simplicity in this demo, or authenticated
                        created.listRule = "@request.auth.id != ''";
                        created.viewRule = "@request.auth.id != ''";
                        created.createRule = "@request.auth.id != ''";
                        created.updateRule = "@request.auth.id != ''";
                        created.deleteRule = "@request.auth.id != ''";
                        await pb.collections.update(created.id, created);
                        console.log(`   ✅ Created '${col.name}'`);
                    } catch (err) {
                        console.error(`   ❌ Failed to create '${col.name}':`, err.message);
                    }
                }
            }
        }

        for (const [name, items] of Object.entries(SEED_DATA)) {
            try {
                const existing = await pb.collection(name).getList(1, 1);
                if (existing.totalItems === 0) {
                    console.log(`   Populating '${name}'...`);
                    for (const item of items) {
                        await pb.collection(name).create(item);
                    }
                    console.log(`   ✅ Added ${items.length} records to '${name}'`);
                } else {
                    console.log(`   ⚠️  Data exists in '${name}', skipping.`);
                }
            } catch (e) {
                console.error(`   ❌ Failed to seed '${name}':`, e.message);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

seedCRM();
