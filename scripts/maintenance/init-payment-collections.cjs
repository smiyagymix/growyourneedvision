/**
 * Create Payment Collections
 * Sets up database collections for Stripe payment processing
 */

const PocketBase = require('pocketbase').default;
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function createPaymentCollections() {
    try {
        console.log('🔐 Authenticating...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated\n');

        // Get users collection ID
        const usersCollection = await pb.collections.getOne('users');
        const usersId = usersCollection.id;

        // Try to get tenants collection ID (may not exist)
        let tenantsId = null;
        try {
            const tenantsCollection = await pb.collections.getOne('tenants');
            tenantsId = tenantsCollection.id;
        } catch (err) {
            console.log('⚠️  Tenants collection not found (optional)\n');
        }

        const collections = [
            // 1. Payment Intents
            {
                name: 'payment_intents',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: usersId, cascadeDelete: false, maxSelect: 1 } },
                    { name: 'stripe_payment_intent_id', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'amount', type: 'number', required: true, options: { min: 0 } },
                    { name: 'currency', type: 'text', required: true, options: { min: 3, max: 3 } },
                    { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'] } },
                    { name: 'description', type: 'text', required: false, options: { max: 500 } },
                    { name: 'metadata', type: 'json', required: false },
                    { name: 'receipt_email', type: 'email', required: false },
                    { name: 'client_secret', type: 'text', required: false, options: { max: 500 } }
                ],
                listRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                viewRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            },

            // 2. Subscriptions
            {
                name: 'subscriptions',
                type: 'base',
                schema: [
                    { name: 'tenant', type: 'relation', required: false, options: { collectionId: tenantsId || usersId, cascadeDelete: false, maxSelect: 1 } },
                    { name: 'user', type: 'relation', required: false, options: { collectionId: usersId, cascadeDelete: false, maxSelect: 1 } },
                    { name: 'stripe_subscription_id', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'stripe_customer_id', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'plan_id', type: 'text', required: true, options: { min: 1, max: 100 } },
                    { name: 'plan_name', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'] } },
                    { name: 'current_period_start', type: 'date', required: true },
                    { name: 'current_period_end', type: 'date', required: true },
                    { name: 'cancel_at_period_end', type: 'bool', required: true },
                    { name: 'canceled_at', type: 'date', required: false },
                    { name: 'trial_end', type: 'date', required: false }
                ],
                listRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                viewRule: '@request.auth.id = user.id || @request.auth.role = "Owner"',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            },

            // 3. Payment Methods
            {
                name: 'payment_methods',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: usersId, cascadeDelete: true, maxSelect: 1 } },
                    { name: 'stripe_payment_method_id', type: 'text', required: true, options: { min: 1, max: 200 } },
                    { name: 'type', type: 'select', required: true, options: { maxSelect: 1, values: ['card', 'bank_account'] } },
                    { name: 'card_brand', type: 'text', required: false, options: { max: 50 } },
                    { name: 'card_last4', type: 'text', required: false, options: { min: 4, max: 4 } },
                    { name: 'card_exp_month', type: 'number', required: false, options: { min: 1, max: 12 } },
                    { name: 'card_exp_year', type: 'number', required: false },
                    { name: 'billing_details', type: 'json', required: false },
                    { name: 'is_default', type: 'bool', required: true }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id = user.id',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id'
            }
        ];

        for (const collectionDef of collections) {
            try {
                console.log(`📦 Creating: ${collectionDef.name}`);

                // Check if exists
                try {
                    await pb.collections.getOne(collectionDef.name);
                    console.log(`   ⚠️  Already exists, skipping\n`);
                    continue;
                } catch (err) {
                    // Doesn't exist, create it
                }

                const created = await pb.collections.create(collectionDef);
                console.log(`   ✅ Created (ID: ${created.id})\n`);
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}\n`);
            }
        }

        console.log('🎉 Payment collections setup complete!');
        console.log('\n📋 Summary:');
        console.log('   - payment_intents: Tracks all payment transactions');
        console.log('   - subscriptions: Manages recurring billing');
        console.log('   - payment_methods: Stores saved payment methods');
        console.log('\n💡 Next steps:');
        console.log('   1. Add Stripe keys to .env file');
        console.log('   2. Create backend API endpoints');
        console.log('   3. Test with Stripe test cards');

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

createPaymentCollections();
