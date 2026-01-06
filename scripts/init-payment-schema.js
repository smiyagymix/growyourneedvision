import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initPaymentSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Payment Intents
        try {
            await pb.collections.create({
                name: 'payment_intents',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
                    { name: 'stripe_payment_intent_id', type: 'text', required: true },
                    { name: 'amount', type: 'number', required: true },
                    { name: 'currency', type: 'text', required: true },
                    { name: 'status', type: 'text', required: true },
                    { name: 'description', type: 'text', required: false },
                    { name: 'metadata', type: 'json', required: false },
                    { name: 'receipt_email', type: 'email', required: false },
                    { name: 'client_secret', type: 'text', required: false }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id',
            });
            console.log('Created payment_intents collection');
        } catch (e) {
            console.log('payment_intents collection might already exist');
        }

        // 2. Subscriptions
        try {
            await pb.collections.create({
                name: 'subscriptions',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
                    { name: 'stripe_subscription_id', type: 'text', required: true },
                    { name: 'stripe_customer_id', type: 'text', required: true },
                    { name: 'plan_id', type: 'text', required: true },
                    { name: 'plan_name', type: 'text', required: false },
                    { name: 'status', type: 'text', required: true },
                    { name: 'current_period_start', type: 'date', required: false },
                    { name: 'current_period_end', type: 'date', required: false },
                    { name: 'cancel_at_period_end', type: 'bool', required: false },
                    { name: 'canceled_at', type: 'date', required: false },
                    { name: 'trial_end', type: 'date', required: false }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id',
            });
            console.log('Created subscriptions collection');
        } catch (e) {
            console.log('subscriptions collection might already exist');
        }

        // 3. Payment Methods
        try {
            await pb.collections.create({
                name: 'payment_methods',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
                    { name: 'stripe_payment_method_id', type: 'text', required: true },
                    { name: 'type', type: 'text', required: true },
                    { name: 'card_brand', type: 'text', required: false },
                    { name: 'card_last4', type: 'text', required: false },
                    { name: 'card_exp_month', type: 'number', required: false },
                    { name: 'card_exp_year', type: 'number', required: false },
                    { name: 'billing_details', type: 'json', required: false },
                    { name: 'is_default', type: 'bool', required: false }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id',
            });
            console.log('Created payment_methods collection');
        } catch (e) {
            console.log('payment_methods collection might already exist');
        }

        // 4. Invoices
        try {
            await pb.collections.create({
                name: 'invoices',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
                    { name: 'stripe_invoice_id', type: 'text', required: true },
                    { name: 'amount_due', type: 'number', required: true },
                    { name: 'amount_paid', type: 'number', required: true },
                    { name: 'amount_remaining', type: 'number', required: true },
                    { name: 'currency', type: 'text', required: true },
                    { name: 'status', type: 'text', required: true },
                    { name: 'invoice_pdf', type: 'url', required: false },
                    { name: 'period_start', type: 'date', required: false },
                    { name: 'period_end', type: 'date', required: false }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id',
            });
            console.log('Created invoices collection');
        } catch (e) {
            console.log('invoices collection might already exist');
        }

    } catch (err) {
        console.error('Error initializing payment schema:', err);
    }
}

initPaymentSchema();
