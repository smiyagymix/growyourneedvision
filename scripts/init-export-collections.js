/**
 * Initialize Export Center Collections
 * 
 * Creates PocketBase collections for scheduled exports:
 * - export_configs: Export schedules and configuration
 * - export_jobs: Export execution history and files
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeCollections() {
    try {
        // Authenticate as superuser
        console.log('🔐 Authenticating with PocketBase...');
        await pb.collection('_superusers').authWithPassword(
            'owner@growyourneed.com',
            process.env.SUPERUSER_PASSWORD || 'Darnag123456789@'
        );
        console.log('✓ Authenticated as superuser');

        const collections = await pb.collections.getFullList();

        // ==================== EXPORT CONFIGS ====================
        const exportConfigsExists = collections.find(c => c.name === 'export_configs');

        if (!exportConfigsExists) {
            console.log('\n📋 Creating export_configs collection...');
            await pb.collections.create({
                name: 'export_configs',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                        options: { min: 1, max: 255 }
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: false,
                        options: { max: 1000 }
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: { max: 255 }
                    },
                    {
                        name: 'dataType',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['tenants', 'users', 'revenue', 'usage', 'compliance', 'custom']
                        }
                    },
                    {
                        name: 'format',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['csv', 'pdf', 'excel']
                        }
                    },
                    {
                        name: 'schedule',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['manual', 'daily', 'weekly', 'monthly']
                        }
                    },
                    {
                        name: 'scheduleConfig',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'filters',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'columns',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'emailRecipients',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'storageProvider',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['pocketbase', 's3', 'gcs', 'local']
                        }
                    },
                    {
                        name: 'storageConfig',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'enabled',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'lastRun',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'nextRun',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'createdBy',
                        type: 'text',
                        required: true,
                        options: { max: 255 }
                    }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created export_configs collection');
        } else {
            console.log('\n✓ export_configs collection already exists');
        }

        // ==================== EXPORT JOBS ====================
        const exportJobsExists = collections.find(c => c.name === 'export_jobs');

        if (!exportJobsExists) {
            console.log('\n📋 Creating export_jobs collection...');
            await pb.collections.create({
                name: 'export_jobs',
                type: 'base',
                schema: [
                    {
                        name: 'configId',
                        type: 'text',
                        required: true,
                        options: { max: 255 }
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: { max: 255 }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['pending', 'processing', 'completed', 'failed']
                        }
                    },
                    {
                        name: 'format',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['csv', 'pdf', 'excel']
                        }
                    },
                    {
                        name: 'dataType',
                        type: 'text',
                        required: true,
                        options: { max: 100 }
                    },
                    {
                        name: 'recordCount',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'fileSize',
                        type: 'number',
                        required: false
                    },
                    {
                        name: 'fileUrl',
                        type: 'text',
                        required: false,
                        options: { max: 2000 }
                    },
                    {
                        name: 'fileName',
                        type: 'text',
                        required: true,
                        options: { max: 500 }
                    },
                    {
                        name: 'file',
                        type: 'file',
                        required: false,
                        options: { maxSelect: 1, maxSize: 104857600 } // 100 MB
                    },
                    {
                        name: 'error',
                        type: 'text',
                        required: false,
                        options: { max: 2000 }
                    },
                    {
                        name: 'startedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'completedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'downloadCount',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'expiresAt',
                        type: 'date',
                        required: false
                    }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created export_jobs collection');
        } else {
            console.log('\n✓ export_jobs collection already exists');
        }

        // ==================== SEED SAMPLE DATA ====================
        console.log('\n🌱 Seeding sample export configurations...');
        
        const ownerUser = await pb.collection('users').getFirstListItem('role = "Owner"');

        const sampleConfigs = [
            {
                name: 'Daily Revenue Report',
                description: 'Daily revenue breakdown by tenant',
                dataType: 'revenue',
                format: 'pdf',
                schedule: 'daily',
                scheduleConfig: { time: '09:00' },
                columns: ['tenantId', 'amount', 'status', 'period', 'created'],
                emailRecipients: ['finance@growyourneed.com'],
                storageProvider: 'pocketbase',
                enabled: true,
                createdBy: ownerUser.id
            },
            {
                name: 'Weekly Tenant Usage',
                description: 'User activity and storage metrics',
                dataType: 'usage',
                format: 'excel',
                schedule: 'weekly',
                scheduleConfig: { dayOfWeek: 1, time: '08:00' },
                columns: ['tenantId', 'date', 'activeUsers', 'storageUsed', 'apiCalls'],
                emailRecipients: ['ops@growyourneed.com'],
                storageProvider: 'pocketbase',
                enabled: true,
                createdBy: ownerUser.id
            },
            {
                name: 'Monthly Compliance Audit',
                description: 'Full audit log for GDPR compliance',
                dataType: 'compliance',
                format: 'csv',
                schedule: 'monthly',
                scheduleConfig: { dayOfMonth: 1, time: '00:00' },
                columns: ['action', 'entityType', 'userId', 'description', 'created'],
                emailRecipients: ['compliance@growyourneed.com'],
                storageProvider: 'pocketbase',
                enabled: true,
                createdBy: ownerUser.id
            }
        ];

        for (const config of sampleConfigs) {
            try {
                // Check if already exists
                const exists = await pb.collection('export_configs').getFirstListItem(`name = "${config.name}"`).catch(() => null);
                if (!exists) {
                    await pb.collection('export_configs').create(config);
                    console.log(`  ✓ Created config: ${config.name}`);
                } else {
                    console.log(`  ✓ Config already exists: ${config.name}`);
                }
            } catch (error) {
                console.error(`  ✗ Failed to create config ${config.name}:`, error.message);
            }
        }

        console.log('\n✅ Export Center collections initialized successfully!');
        console.log('\n📊 Summary:');
        console.log('  • export_configs: Export schedules and configuration');
        console.log('  • export_jobs: Export execution history and files');
        console.log('  • 3 sample configurations created');
        
    } catch (error) {
        console.error('❌ Failed to initialize collections:', error);
        process.exit(1);
    }
}

initializeCollections();
