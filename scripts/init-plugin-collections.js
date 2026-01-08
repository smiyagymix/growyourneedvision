/**
 * Initialize Plugin Collections
 * 
 * Creates PocketBase collections for plugin marketplace:
 * - plugins: Available plugins in marketplace
 * - plugin_installs: Plugin installations per tenant
 * - plugin_configs: Plugin configuration per tenant
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeCollections() {
    try {
        // Authenticate as superuser
        console.log('🔐 Authenticating with PocketBase...');
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || process.env.SUPERUSER_PASSWORD || 'Darnag123456789@'
        );
        console.log('✓ Authenticated as superuser');

        const collections = await pb.collections.getFullList();

        // ==================== PLUGINS ====================
        const pluginsExists = collections.find(c => c.name === 'plugins');

        if (!pluginsExists) {
            console.log('\n📋 Creating plugins collection...');
            await pb.collections.create({
                name: 'plugins',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'slug',
                        type: 'text',
                        required: true,
                        options: { max: 100, unique: true }
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: true,
                        options: { max: 2000 }
                    },
                    {
                        name: 'version',
                        type: 'text',
                        required: true,
                        options: { max: 20 }
                    },
                    {
                        name: 'author',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'authorEmail',
                        type: 'email',
                        required: false
                    },
                    {
                        name: 'category',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['integration', 'analytics', 'communication', 'productivity', 'security', 'customization', 'other']
                        }
                    },
                    {
                        name: 'icon',
                        type: 'file',
                        required: false,
                        options: { maxSelect: 1, maxSize: 2097152 } // 2 MB
                    },
                    {
                        name: 'screenshots',
                        type: 'file',
                        required: false,
                        options: { maxSelect: 5, maxSize: 5242880 } // 5 MB each
                    },
                    {
                        name: 'price',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'currency',
                        type: 'text',
                        required: true,
                        options: { max: 3 }
                    },
                    {
                        name: 'pricingModel',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['free', 'one-time', 'monthly', 'yearly', 'usage-based']
                        }
                    },
                    {
                        name: 'isActive',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'isApproved',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'isFeatured',
                        type: 'bool',
                        required: false
                    },
                    {
                        name: 'downloads',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'rating',
                        type: 'number',
                        required: false
                    },
                    {
                        name: 'reviewsCount',
                        type: 'number',
                        required: false
                    },
                    {
                        name: 'requirements',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'configSchema',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'webhookUrl',
                        type: 'url',
                        required: false
                    },
                    {
                        name: 'documentation',
                        type: 'url',
                        required: false
                    },
                    {
                        name: 'supportUrl',
                        type: 'url',
                        required: false
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        required: false
                    }
                ],
                listRule: 'isActive = true',
                viewRule: 'isActive = true',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created plugins collection');
        } else {
            console.log('\n✓ plugins collection already exists');
        }

        // ==================== PLUGIN INSTALLS ====================
        const installsExists = collections.find(c => c.name === 'plugin_installs');

        if (!installsExists) {
            console.log('\n📋 Creating plugin_installs collection...');
            await pb.collections.create({
                name: 'plugin_installs',
                type: 'base',
                schema: [
                    {
                        name: 'pluginId',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'plugins',
                            cascadeDelete: false
                        }
                    },
                    {
                        name: 'tenantId',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'tenants',
                            cascadeDelete: true
                        }
                    },
                    {
                        name: 'version',
                        type: 'text',
                        required: true,
                        options: { max: 20 }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['installing', 'active', 'inactive', 'updating', 'failed', 'uninstalled']
                        }
                    },
                    {
                        name: 'installedAt',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'updatedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'uninstalledAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'installedBy',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'users',
                            cascadeDelete: false
                        }
                    },
                    {
                        name: 'errorMessage',
                        type: 'text',
                        required: false,
                        options: { max: 1000 }
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        required: false
                    }
                ],
                listRule: '@request.auth.role = "Owner" || tenantId.user.tenantId = @request.auth.tenantId',
                viewRule: '@request.auth.role = "Owner" || tenantId.user.tenantId = @request.auth.tenantId',
                createRule: '@request.auth.role = "Owner" || tenantId.user.tenantId = @request.auth.tenantId',
                updateRule: '@request.auth.role = "Owner" || tenantId.user.tenantId = @request.auth.tenantId',
                deleteRule: '@request.auth.role = "Owner" || tenantId.user.tenantId = @request.auth.tenantId'
            });
            console.log('✓ Created plugin_installs collection');
        } else {
            console.log('\n✓ plugin_installs collection already exists');
        }

        // ==================== PLUGIN CONFIGS ====================
        const configsExists = collections.find(c => c.name === 'plugin_configs');

        if (!configsExists) {
            console.log('\n📋 Creating plugin_configs collection...');
            await pb.collections.create({
                name: 'plugin_configs',
                type: 'base',
                schema: [
                    {
                        name: 'installId',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'plugin_installs',
                            cascadeDelete: true
                        }
                    },
                    {
                        name: 'config',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'isActive',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'lastUpdated',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'updatedBy',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'users',
                            cascadeDelete: false
                        }
                    }
                ],
                listRule: '@request.auth.role = "Owner" || installId.tenantId.user.tenantId = @request.auth.tenantId',
                viewRule: '@request.auth.role = "Owner" || installId.tenantId.user.tenantId = @request.auth.tenantId',
                createRule: '@request.auth.role = "Owner" || installId.tenantId.user.tenantId = @request.auth.tenantId',
                updateRule: '@request.auth.role = "Owner" || installId.tenantId.user.tenantId = @request.auth.tenantId',
                deleteRule: '@request.auth.role = "Owner" || installId.tenantId.user.tenantId = @request.auth.tenantId'
            });
            console.log('✓ Created plugin_configs collection');
        } else {
            console.log('\n✓ plugin_configs collection already exists');
        }

        console.log('\n✅ Plugin collections initialized successfully!');
        console.log('\n📊 Summary:');
        console.log('  • plugins: Available plugins in marketplace');
        console.log('  • plugin_installs: Plugin installations per tenant');
        console.log('  • plugin_configs: Plugin configuration per tenant');
        
    } catch (error) {
        console.error('❌ Failed to initialize collections:', error);
        process.exit(1);
    }
}

initializeCollections();
