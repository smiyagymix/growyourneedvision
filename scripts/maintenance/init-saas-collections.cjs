/**
 * Initialize SaaS Multi-Tenant Collections
 * Creates all necessary collections for tenant management, billing, and analytics in PocketBase
 * 
 * Run: node init-saas-collections.cjs
 */

const PocketBase = require('pocketbase').default;

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const collections = [
    {
        name: 'tenants',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'subdomain', type: 'text', required: true, unique: true },
            { name: 'custom_domain', type: 'text' },
            { name: 'logo', type: 'url' },
            { name: 'plan', type: 'select', required: true, options: { values: ['free', 'basic', 'pro', 'enterprise'] } },
            { name: 'status', type: 'select', required: true, options: { values: ['active', 'suspended', 'trial', 'cancelled'] } },
            { name: 'subscription_status', type: 'select', required: true, options: { values: ['active', 'past_due', 'cancelled', 'trialing'] } },
            { name: 'admin_email', type: 'email', required: true },
            { name: 'admin_user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'max_students', type: 'number', required: true },
            { name: 'max_teachers', type: 'number', required: true },
            { name: 'max_storage_gb', type: 'number', required: true },
            { name: 'features_enabled', type: 'json' },
            { name: 'trial_ends_at', type: 'date' },
            { name: 'subscription_ends_at', type: 'date' },
            { name: 'stripe_customer_id', type: 'text' },
            { name: 'stripe_subscription_id', type: 'text' },
            { name: 'metadata', type: 'json' }
        ]
    },
    {
        name: 'tenant_usage',
        type: 'base',
        schema: [
            { name: 'tenant', type: 'relation', required: true, options: { collectionId: 'tenants', cascadeDelete: true } },
            { name: 'period_start', type: 'date', required: true },
            { name: 'period_end', type: 'date', required: true },
            { name: 'student_count', type: 'number', required: true },
            { name: 'teacher_count', type: 'number', required: true },
            { name: 'storage_used_gb', type: 'number', required: true },
            { name: 'api_calls', type: 'number' },
            { name: 'active_users', type: 'number' }
        ]
    },
    {
        name: 'subscription_plans',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'stripe_price_id', type: 'text', required: true },
            { name: 'price_monthly', type: 'number', required: true },
            { name: 'price_annual', type: 'number', required: true },
            { name: 'max_students', type: 'number', required: true },
            { name: 'max_teachers', type: 'number', required: true },
            { name: 'max_storage_gb', type: 'number', required: true },
            { name: 'features', type: 'json', required: true },
            { name: 'is_active', type: 'bool', required: true }
        ]
    },
    {
        name: 'invoices',
        type: 'base',
        schema: [
            { name: 'tenant', type: 'relation', required: true, options: { collectionId: 'tenants', cascadeDelete: false } },
            { name: 'stripe_invoice_id', type: 'text', required: true },
            { name: 'amount', type: 'number', required: true },
            { name: 'currency', type: 'text', required: true },
            { name: 'status', type: 'select', required: true, options: { values: ['paid', 'pending', 'failed', 'cancelled'] } },
            { name: 'pdf_url', type: 'url' },
            { name: 'period_start', type: 'date', required: true },
            { name: 'period_end', type: 'date', required: true },
            { name: 'paid_at', type: 'date' }
        ]
    },
    {
        name: 'support_tickets',
        type: 'base',
        schema: [
            { name: 'tenant', type: 'relation', required: true, options: { collectionId: 'tenants', cascadeDelete: false } },
            { name: 'created_by', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'assigned_to', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'subject', type: 'text', required: true },
            { name: 'description', type: 'text', required: true },
            { name: 'priority', type: 'select', required: true, options: { values: ['low', 'medium', 'high', 'critical'] } },
            { name: 'status', type: 'select', required: true, options: { values: ['new', 'in_progress', 'resolved', 'closed'] } },
            { name: 'category', type: 'select', required: true, options: { values: ['technical', 'billing', 'feature', 'other'] } },
            { name: 'resolved_at', type: 'date' }
        ]
    },
    {
        name: 'support_replies',
        type: 'base',
        schema: [
            { name: 'ticket', type: 'relation', required: true, options: { collectionId: 'support_tickets', cascadeDelete: true } },
            { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'message', type: 'text', required: true },
            { name: 'is_internal_note', type: 'bool' },
            { name: 'attachments', type: 'json' }
        ]
    }
];

async function createCollections() {
    console.log('🚀 Initializing SaaS Multi-Tenant Collections...\n');

    try {
        // Authenticate
        console.log('🔐 Authenticating...');
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Authenticated\n');

        for (const collectionData of collections) {
            try {
                console.log(`📦 Creating collection: ${collectionData.name}...`);

                await pb.collections.create({
                    name: collectionData.name,
                    type: collectionData.type,
                    schema: collectionData.schema
                });

                console.log(`✅ Created: ${collectionData.name}\n`);
            } catch (error) {
                if (error.status === 400 && error.message?.includes('already exists')) {
                    console.log(`⚠️  Collection already exists: ${collectionData.name}\n`);
                } else {
                    console.error(`❌ Error creating ${collectionData.name}:`, error.message, '\n');
                }
            }
        }

        // Create default subscription plans
        console.log('💰 Creating default subscription plans...');

        const plans = [
            {
                name: 'Free Trial',
                stripe_price_id: 'price_free',
                price_monthly: 0,
                price_annual: 0,
                max_students: 50,
                max_teachers: 5,
                max_storage_gb: 5,
                features: ['basic_apps', 'email_support'],
                is_active: true
            },
            {
                name: 'Basic',
                stripe_price_id: 'price_basic',
                price_monthly: 99,
                price_annual: 950,
                max_students: 200,
                max_teachers: 20,
                max_storage_gb: 50,
                features: ['all_apps', 'email_support', 'analytics'],
                is_active: true
            },
            {
                name: 'Pro',
                stripe_price_id: 'price_pro',
                price_monthly: 299,
                price_annual: 2850,
                max_students: 500,
                max_teachers: 50,
                max_storage_gb: 200,
                features: ['all_apps', 'priority_support', 'analytics', 'white_label', 'custom_domain'],
                is_active: true
            },
            {
                name: 'Enterprise',
                stripe_price_id: 'price_enterprise',
                price_monthly: 999,
                price_annual: 9500,
                max_students: -1, // unlimited
                max_teachers: -1,
                max_storage_gb: 1000,
                features: ['all_apps', 'dedicated_support', 'advanced_analytics', 'white_label', 'custom_domain', 'api_access', 'sso'],
                is_active: true
            }
        ];

        for (const plan of plans) {
            try {
                await pb.collection('subscription_plans').create(plan);
                console.log(`✅  Created plan: ${plan.name}`);
            } catch (error) {
                console.log(`⚠️   Plan already exists: ${plan.name}`);
            }
        }

        console.log('\n✅ SaaS collections initialized successfully!');
        console.log('\n📋 Created Collections:');
        console.log('  • tenants - Multi-tenant management');
        console.log('  • tenant_usage - Usage tracking');
        console.log('  • subscription_plans - Pricing plans');
        console.log('  • invoices - Billing history');
        console.log('  • support_tickets - Customer support');
        console.log('  • support_replies - Ticket conversations');
        console.log('\n💰 Created 4 subscription plans (Free, Basic, Pro, Enterprise)');

    } catch (error) {
        console.error('\n❌ Initialization failed:', error.message);
        process.exit(1);
    }
}

createCollections().then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
}).catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
