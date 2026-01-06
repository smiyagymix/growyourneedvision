import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateOwnerSchema() {
    console.log('🚀 Updating Owner Schema...');

    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err);
        process.exit(1);
    }

    // 1. Audit Logs
    const auditLogsCollection = {
        name: 'audit_logs',
        type: 'base',
        schema: [
            { name: 'action', type: 'text', required: true },
            { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'module', type: 'text' },
            { name: 'ip_address', type: 'text' },
            { name: 'details', type: 'json' }
        ]
    };

    try {
        await pb.collections.create(auditLogsCollection);
        console.log(`✅ Created collection: audit_logs`);
    } catch (err) {
        if (err.status === 400) {
            console.log(`⚠️  Collection audit_logs already exists.`);
        } else {
            console.error(`❌ Failed to create collection audit_logs:`, err.message);
        }
    }

    // 2. System Settings
    const systemSettingsCollection = {
        name: 'system_settings',
        type: 'base',
        schema: [
            { name: 'key', type: 'text', required: true, options: { unique: true } },
            { name: 'value', type: 'json' },
            { name: 'description', type: 'text' },
            { name: 'category', type: 'text' }
        ]
    };

    try {
        await pb.collections.create(systemSettingsCollection);
        console.log(`✅ Created collection: system_settings`);
        
        // Seed Settings
        const settings = [
            { key: 'general_settings', value: { site_name: 'Grow Your Need', maintenance_mode: false }, description: 'General site configuration', category: 'General' },
            { key: 'security_settings', value: { mfa_enabled: true, password_policy: 'strong', session_timeout: 30 }, description: 'Security policies', category: 'Security' },
            { key: 'email_settings', value: { smtp_host: 'smtp.example.com', sender_email: 'noreply@example.com' }, description: 'Email server configuration', category: 'Email' },
            { key: 'billing_settings', value: { currency: 'USD', tax_rate: 10 }, description: 'Billing and tax configuration', category: 'Billing' }
        ];

        for (const s of settings) {
            try {
                await pb.collection('system_settings').create(s);
                console.log(`   ✅ Created setting: ${s.key}`);
            } catch (e) {
                console.log(`   ⚠️  Setting ${s.key} already exists`);
            }
        }

    } catch (err) {
        if (err.status === 400) {
            console.log(`⚠️  Collection system_settings already exists.`);
        } else {
            console.error(`❌ Failed to create collection system_settings:`, err.message);
        }
    }

    // 3. Update Subscription Plans
    // We need to add price_monthly, price_yearly, limits, is_active
    try {
        const planCollection = await pb.collections.getOne('subscription_plans');
        let schemaChanged = false;
        
        if (!planCollection.schema) {
            planCollection.schema = [];
        }

        const newFields = [
            { name: 'price_monthly', type: 'number' },
            { name: 'price_yearly', type: 'number' },
            { name: 'limits', type: 'json' },
            { name: 'is_active', type: 'bool' }
        ];

        for (const field of newFields) {
            if (!planCollection.schema.find(f => f.name === field.name)) {
                planCollection.schema.push(field);
                schemaChanged = true;
            }
        }

        if (schemaChanged) {
            await pb.collections.update(planCollection.id, planCollection);
            console.log('✅ Updated subscription_plans schema');
            
            // Update existing records with default values
            const plans = await pb.collection('subscription_plans').getFullList();
            for (const plan of plans) {
                // Map old 'price' to 'price_monthly' if needed, or just set defaults
                const updateData = {
                    price_monthly: plan.price || 29,
                    price_yearly: (plan.price || 29) * 10, // 2 months free
                    limits: { students: 100, storage: '10GB' },
                    is_active: plan.active !== undefined ? plan.active : true
                };
                await pb.collection('subscription_plans').update(plan.id, updateData);
                console.log(`   ✅ Updated plan data: ${plan.name}`);
            }

        } else {
            console.log('⚠️  subscription_plans schema already up to date');
        }

    } catch (err) {
        console.error('❌ Failed to update subscription_plans:', err.message);
    }
    
    // 4. System Alerts (referenced in ownerService)
    const systemAlertsCollection = {
        name: 'system_alerts',
        type: 'base',
        schema: [
            { name: 'severity', type: 'select', options: { values: ['critical', 'warning', 'info'] } },
            { name: 'message', type: 'text' },
            { name: 'actionUrl', type: 'text' }
        ]
    };
    
    try {
        await pb.collections.create(systemAlertsCollection);
        console.log(`✅ Created collection: system_alerts`);
    } catch (err) {
         if (err.status === 400) {
            console.log(`⚠️  Collection system_alerts already exists.`);
        }
    }
}

updateOwnerSchema();
