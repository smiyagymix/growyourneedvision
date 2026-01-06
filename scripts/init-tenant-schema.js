/**
 * Initialize Tenant Management Schema
 * Supports multi-tenancy with white-labeling and custom branding
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function authenticate() {
    try {
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');
        console.log('✅ Authenticated as admin');
        return true;
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        return false;
    }
}

async function initTenantSchema() {
    try {
        console.log('\n🔧 Initializing Tenant Management Schema...\n');

        // Check if tenants collection exists
        let tenantsExists = false;
        try {
            await pb.collection('tenants').getList(1, 1);
            console.log('✅ tenants collection already exists');
            tenantsExists = true;
        } catch (error) {
            console.log('📋 Creating tenants collection...');
        }

        // Create tenants collection
        if (!tenantsExists) {
            await pb.collections.create({
                name: 'tenants',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                        options: { min: 2, max: 100 }
                    },
                    {
                        name: 'slug',
                        type: 'text',
                        required: true,
                        options: { min: 2, max: 50, pattern: '^[a-z0-9-]+$' }
                    },
                    {
                        name: 'domain',
                        type: 'text',
                        required: false,
                        options: { max: 100 }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['active', 'suspended', 'trial', 'cancelled']
                        }
                    },
                    {
                        name: 'plan',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['free', 'starter', 'professional', 'enterprise']
                        }
                    },
                    {
                        name: 'maxUsers',
                        type: 'number',
                        required: true,
                        options: { min: 1 }
                    },
                    {
                        name: 'maxStorage',
                        type: 'number',
                        required: true,
                        options: { min: 1 }
                    },
                    {
                        name: 'trialEndsAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'features',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'branding',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'settings',
                        type: 'json',
                        required: false
                    }
                ],
                indexes: [
                    'CREATE UNIQUE INDEX idx_tenant_slug ON tenants (slug)',
                    'CREATE INDEX idx_tenant_status ON tenants (status)',
                    'CREATE INDEX idx_tenant_plan ON tenants (plan)'
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ tenants collection created');
        }

        // Check if tenant_branding collection exists
        let brandingExists = false;
        try {
            await pb.collection('tenant_branding').getList(1, 1);
            console.log('✅ tenant_branding collection already exists');
            brandingExists = true;
        } catch (error) {
            console.log('📋 Creating tenant_branding collection...');
        }

        // Create tenant_branding collection
        if (!brandingExists) {
            await pb.collections.create({
                name: 'tenant_branding',
                type: 'base',
                schema: [
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: true,
                        options: { max: 50 }
                    },
                    {
                        name: 'logo',
                        type: 'file',
                        required: false,
                        options: {
                            maxSelect: 1,
                            maxSize: 5242880,
                            mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml']
                        }
                    },
                    {
                        name: 'favicon',
                        type: 'file',
                        required: false,
                        options: {
                            maxSelect: 1,
                            maxSize: 1048576,
                            mimeTypes: ['image/x-icon', 'image/png']
                        }
                    },
                    {
                        name: 'primaryColor',
                        type: 'text',
                        required: false,
                        options: { pattern: '^#[0-9A-Fa-f]{6}$' }
                    },
                    {
                        name: 'secondaryColor',
                        type: 'text',
                        required: false,
                        options: { pattern: '^#[0-9A-Fa-f]{6}$' }
                    },
                    {
                        name: 'accentColor',
                        type: 'text',
                        required: false,
                        options: { pattern: '^#[0-9A-Fa-f]{6}$' }
                    },
                    {
                        name: 'fontFamily',
                        type: 'text',
                        required: false,
                        options: { max: 100 }
                    },
                    {
                        name: 'customCSS',
                        type: 'text',
                        required: false,
                        options: { max: 10000 }
                    },
                    {
                        name: 'emailTemplate',
                        type: 'text',
                        required: false,
                        options: { max: 50000 }
                    }
                ],
                indexes: [
                    'CREATE UNIQUE INDEX idx_branding_tenant ON tenant_branding (tenantId)'
                ],
                listRule: '@request.auth.tenantId = tenantId || @request.auth.role = "Owner"',
                viewRule: '@request.auth.tenantId = tenantId || @request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                updateRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ tenant_branding collection created');
        }

        // Check if tenant_features collection exists
        let featuresExists = false;
        try {
            await pb.collection('tenant_features').getList(1, 1);
            console.log('✅ tenant_features collection already exists');
            featuresExists = true;
        } catch (error) {
            console.log('📋 Creating tenant_features collection...');
        }

        // Create tenant_features collection
        if (!featuresExists) {
            await pb.collections.create({
                name: 'tenant_features',
                type: 'base',
                schema: [
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: true,
                        options: { max: 50 }
                    },
                    {
                        name: 'featureName',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'enabled',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'config',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'enabledAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'enabledBy',
                        type: 'text',
                        required: false,
                        options: { max: 50 }
                    }
                ],
                indexes: [
                    'CREATE INDEX idx_features_tenant ON tenant_features (tenantId)',
                    'CREATE INDEX idx_features_name ON tenant_features (featureName)',
                    'CREATE UNIQUE INDEX idx_features_tenant_name ON tenant_features (tenantId, featureName)'
                ],
                listRule: '@request.auth.tenantId = tenantId || @request.auth.role = "Owner"',
                viewRule: '@request.auth.tenantId = tenantId || @request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ tenant_features collection created');
        }

        // Seed default tenant data
        if (!tenantsExists) {
            const defaultTenant = await pb.collection('tenants').create({
                name: 'Grow Your Need Platform',
                slug: 'grow-your-need',
                status: 'active',
                plan: 'enterprise',
                maxUsers: 10000,
                maxStorage: 1000000,
                features: {
                    ai: true,
                    payments: true,
                    analytics: true,
                    whiteLabel: true
                },
                branding: {
                    companyName: 'Grow Your Need',
                    tagline: 'Grow Your Potential'
                },
                settings: {
                    timezone: 'UTC',
                    currency: 'USD',
                    locale: 'en-US'
                }
            });
            console.log('✅ Default tenant created:', defaultTenant.id);

            // Create default branding
            await pb.collection('tenant_branding').create({
                tenantId: defaultTenant.id,
                primaryColor: '#3B82F6',
                secondaryColor: '#1E40AF',
                accentColor: '#10B981',
                fontFamily: 'Inter, system-ui, sans-serif'
            });
            console.log('✅ Default branding created');

            // Create default feature flags
            const defaultFeatures = [
                { featureName: 'ai_assistant', enabled: true },
                { featureName: 'business_intelligence', enabled: true },
                { featureName: 'payment_processing', enabled: true },
                { featureName: 'advanced_analytics', enabled: true },
                { featureName: 'custom_branding', enabled: true },
                { featureName: 'api_access', enabled: true },
                { featureName: 'sso', enabled: false },
                { featureName: 'audit_logs', enabled: true }
            ];

            for (const feature of defaultFeatures) {
                await pb.collection('tenant_features').create({
                    tenantId: defaultTenant.id,
                    ...feature,
                    enabledAt: new Date().toISOString(),
                    enabledBy: 'system'
                });
            }
            console.log('✅ Default feature flags created');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Tenant Management Schema Initialized Successfully');
        console.log('='.repeat(60) + '\n');

        return true;
    } catch (error) {
        console.error('❌ Error initializing tenant schema:', error);
        return false;
    }
}

// Run initialization
const authenticated = await authenticate();
if (authenticated) {
    const success = await initTenantSchema();
    process.exit(success ? 0 : 1);
} else {
    process.exit(1);
}
