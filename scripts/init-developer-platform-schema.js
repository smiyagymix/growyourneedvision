import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function createCollection(name, schema, extraOptions = {}) {
    try {
        console.log(`Creating collection: ${name}...`);
        await pb.collections.create({
            name,
            type: 'base',
            schema,
            ...extraOptions
        });
        console.log(`✅ Collection ${name} created successfully`);
    } catch (error) {
        if (error.message && error.message.includes('already exists')) {
            console.log(`⚠️ Collection ${name} already exists, skipping...`);
        } else {
            console.error(`❌ Error creating collection ${name}:`, error);
        }
    }
}

async function main() {
    try {
        console.log('Authenticating...');
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL || 'owner@growyourneed.com';
        const adminPass = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASS || 'Darnag12345678@';
        
        await pb.collection('_superusers').authWithPassword(adminEmail, adminPass);
        console.log('✅ Authenticated successfully');

        console.log('\n=== Creating Developer Platform Collections ===\n');

        // API Keys Collection
        await createCollection('api_keys', [
            {
                name: 'userId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true
                }
            },
            {
                name: 'tenantId',
                type: 'text',
                required: false
            },
            {
                name: 'keyType',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['public', 'secret']
                }
            },
            {
                name: 'keyValue',
                type: 'text',
                required: true
            },
            {
                name: 'keyHash',
                type: 'text',
                required: true
            },
            {
                name: 'rateLimit',
                type: 'number',
                required: true
            },
            {
                name: 'lastUsed',
                type: 'date',
                required: false
            },
            {
                name: 'expiresAt',
                type: 'date',
                required: false
            },
            {
                name: 'status',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['active', 'revoked', 'expired']
                }
            }
        ]);

        // Plugins Collection
        await createCollection('plugins', [
            {
                name: 'pluginId',
                type: 'text',
                required: true
            },
            {
                name: 'name',
                type: 'text',
                required: true
            },
            {
                name: 'description',
                type: 'text',
                required: true
            },
            {
                name: 'authorId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false
                }
            },
            {
                name: 'version',
                type: 'text',
                required: true
            },
            {
                name: 'manifest',
                type: 'json',
                required: true
            },
            {
                name: 'icon',
                type: 'file',
                required: false,
                options: {
                    maxSelect: 1,
                    maxSize: 5242880, // 5MB
                    mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml']
                }
            },
            {
                name: 'downloads',
                type: 'number',
                required: true
            },
            {
                name: 'revenue',
                type: 'number',
                required: true
            },
            {
                name: 'price',
                type: 'number',
                required: true
            },
            {
                name: 'revenueShare',
                type: 'number',
                required: true
            },
            {
                name: 'category',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['productivity', 'education', 'analytics', 'integration', 'communication', 'other']
                }
            },
            {
                name: 'tags',
                type: 'json',
                required: false
            },
            {
                name: 'status',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['pending', 'approved', 'active', 'suspended', 'rejected']
                }
            },
            {
                name: 'verified',
                type: 'bool',
                required: true
            },
            {
                name: 'rating',
                type: 'number',
                required: true
            },
            {
                name: 'reviewCount',
                type: 'number',
                required: true
            },
            {
                name: 'repositoryUrl',
                type: 'url',
                required: false
            },
            {
                name: 'documentationUrl',
                type: 'url',
                required: false
            }
        ]);

        // Plugin Installs Collection
        await createCollection('plugin_installs', [
            {
                name: 'userId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true
                }
            },
            {
                name: 'tenantId',
                type: 'text',
                required: false
            },
            {
                name: 'pluginId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '',
                    cascadeDelete: true
                }
            },
            {
                name: 'installedAt',
                type: 'date',
                required: true
            },
            {
                name: 'config',
                type: 'json',
                required: false
            },
            {
                name: 'enabled',
                type: 'bool',
                required: true
            },
            {
                name: 'version',
                type: 'text',
                required: true
            }
        ]);

        // Webhooks Collection
        await createCollection('webhooks', [
            {
                name: 'userId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true
                }
            },
            {
                name: 'tenantId',
                type: 'text',
                required: false
            },
            {
                name: 'url',
                type: 'url',
                required: true
            },
            {
                name: 'secret',
                type: 'text',
                required: true
            },
            {
                name: 'events',
                type: 'json',
                required: true
            },
            {
                name: 'status',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['active', 'failed', 'disabled']
                }
            },
            {
                name: 'lastTriggered',
                type: 'date',
                required: false
            },
            {
                name: 'failureCount',
                type: 'number',
                required: true
            },
            {
                name: 'metadata',
                type: 'json',
                required: false
            }
        ]);

        // API Usage Logs Collection
        await createCollection('api_usage_logs', [
            {
                name: 'userId',
                type: 'relation',
                required: true,
                options: {
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true
                }
            },
            {
                name: 'apiKeyId',
                type: 'relation',
                required: false,
                options: {
                    collectionId: '',
                    cascadeDelete: true
                }
            },
            {
                name: 'endpoint',
                type: 'text',
                required: true
            },
            {
                name: 'method',
                type: 'select',
                required: true,
                options: {
                    maxSelect: 1,
                    values: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
                }
            },
            {
                name: 'statusCode',
                type: 'number',
                required: true
            },
            {
                name: 'responseTime',
                type: 'number',
                required: true
            },
            {
                name: 'ipAddress',
                type: 'text',
                required: true
            },
            {
                name: 'userAgent',
                type: 'text',
                required: false
            },
            {
                name: 'requestBody',
                type: 'json',
                required: false
            },
            {
                name: 'errorMessage',
                type: 'text',
                required: false
            }
        ], {
            // Short retention for logs (30 days auto-delete)
            listRule: '@request.auth.id != "" && userId = @request.auth.id',
            viewRule: '@request.auth.id != "" && userId = @request.auth.id'
        });

        console.log('\n✅ Developer Platform schema initialization complete!');
        console.log('\n📊 Created Collections:');
        console.log('  - api_keys');
        console.log('  - plugins');
        console.log('  - plugin_installs');
        console.log('  - webhooks');
        console.log('  - api_usage_logs');
        console.log('\n✨ Next steps:');
        console.log('  1. Run: node scripts/seed-developer-platform-data.js');
        console.log('  2. Create Developer Platform service: src/services/developerPlatformService.ts');
        console.log('  3. Wire UI to backend APIs');
    } catch (error) {
        console.error('❌ Schema initialization failed:', error);
        process.exit(1);
    }
}

main();
