import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedBusinessData() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Seed Plans
        const plans = [
            { name: 'Starter', price: 0, billing_cycle: 'Monthly', features: ['5 Users', 'Basic Support'], user_limit: 5, adoption_rate: 80, is_active: true },
            { name: 'Professional', price: 29, billing_cycle: 'Monthly', features: ['50 Users', 'Priority Support'], user_limit: 50, adoption_rate: 45, is_active: true },
            { name: 'Enterprise', price: 99, billing_cycle: 'Monthly', features: ['Unlimited Users', 'Dedicated Account Manager'], user_limit: 9999, adoption_rate: 20, is_active: true }
        ];

        for (const plan of plans) {
            try {
                await pb.collection('business_plans').create(plan);
                console.log(`Created plan: ${plan.name}`);
            } catch (e) {
                console.log(`Failed to create plan ${plan.name}: ${e.message}`);
            }
        }

        // 2. Seed Rules
        const rules = [
            { name: 'Welcome Email Sequence', trigger: 'New User Signup', action: 'Send Email', status: 'Active' },
            { name: 'Churn Prevention', trigger: 'Usage Drop < 10%', action: 'Alert Account Manager', status: 'Active' },
            { name: 'Upsell Prompt', trigger: 'Limit Reached', action: 'Show Modal', status: 'Paused' },
            { name: 'Invoice Reminder', trigger: 'Payment Due - 3 Days', action: 'Send SMS', status: 'Active' }
        ];

        for (const rule of rules) {
            try {
                await pb.collection('business_rules').create(rule);
                console.log(`Created rule: ${rule.name}`);
            } catch (e) {
                console.log(`Failed to create rule ${rule.name}: ${e.message}`);
            }
        }

        // 3. Seed Segments
        const segments = [
            { name: 'High Value Enterprise', criteria: { revenue: '> 1000' }, count: 124, growth: '+12%', color: 'bg-purple-500' },
            { name: 'At Risk (Low Usage)', criteria: { usage: '< 10%' }, count: 45, growth: '-5%', color: 'bg-red-500' },
            { name: 'Recent Signups (Trial)', criteria: { days: '< 14' }, count: 890, growth: '+24%', color: 'bg-blue-500' }
        ];

        for (const seg of segments) {
            try {
                await pb.collection('customer_segments').create(seg);
                console.log(`Created segment: ${seg.name}`);
            } catch (e) {
                console.log(`Failed to create segment ${seg.name}: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('Failed to seed business data:', error);
    }
}

seedBusinessData();
