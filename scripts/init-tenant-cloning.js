/**
 * Initialize Tenant Cloning Collections
 * 
 * Creates collections for tenant templates and clone jobs
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeTenantCloningCollections() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');

        console.log('✅ Authenticated as admin');

        const collections = await pb.collections.getFullList();

        // Collection 1: tenant_templates
        const templateExists = collections.find(c => c.name === 'tenant_templates');
        if (!templateExists) {
            await pb.collections.create({
                name: 'tenant_templates',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'category',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['educational', 'corporate', 'non-profit', 'custom']
                        }
                    },
                    {
                        name: 'includes',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'defaultSettings',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'createdBy',
                        type: 'text',
                        required: true
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created tenant_templates collection');
        } else {
            console.log('⏭️  tenant_templates collection already exists');
        }

        // Collection 2: clone_jobs
        const cloneJobsExists = collections.find(c => c.name === 'clone_jobs');
        if (!cloneJobsExists) {
            await pb.collections.create({
                name: 'clone_jobs',
                type: 'base',
                schema: [
                    {
                        name: 'sourceTenantId',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'targetTenantId',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'templateId',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['pending', 'processing', 'completed', 'failed']
                        }
                    },
                    {
                        name: 'progress',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'includeData',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'mappings',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'error',
                        type: 'text',
                        required: false
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
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created clone_jobs collection');
        } else {
            console.log('⏭️  clone_jobs collection already exists');
        }

        // Seed sample templates
        const templateRecords = await pb.collection('tenant_templates').getFullList();
        if (templateRecords.length === 0) {
            const templates = [
                {
                    name: 'Basic School Template',
                    description: 'Standard K-12 school setup with core features',
                    category: 'educational',
                    includes: {
                        users: true,
                        classes: true,
                        courses: true,
                        settings: true,
                        features: true
                    },
                    defaultSettings: {
                        max_students: 500,
                        max_teachers: 50,
                        max_storage_gb: 10
                    },
                    createdBy: 'system'
                },
                {
                    name: 'Enterprise Corporate',
                    description: 'Full-featured corporate training platform',
                    category: 'corporate',
                    includes: {
                        users: true,
                        classes: true,
                        courses: true,
                        settings: true,
                        features: true
                    },
                    defaultSettings: {
                        max_students: 2000,
                        max_teachers: 200,
                        max_storage_gb: 50
                    },
                    createdBy: 'system'
                },
                {
                    name: 'Non-Profit Starter',
                    description: 'Affordable setup for non-profit organizations',
                    category: 'non-profit',
                    includes: {
                        users: true,
                        classes: true,
                        courses: false,
                        settings: true,
                        features: false
                    },
                    defaultSettings: {
                        max_students: 200,
                        max_teachers: 20,
                        max_storage_gb: 5
                    },
                    createdBy: 'system'
                }
            ];

            for (const template of templates) {
                await pb.collection('tenant_templates').create(template);
            }
            console.log('✅ Seeded 3 tenant templates');
        } else {
            console.log('⏭️  Templates already seeded');
        }

        console.log('\n✅ Tenant cloning collections initialized successfully!');

    } catch (error) {
        console.error('❌ Error initializing tenant cloning collections:', error);
        process.exit(1);
    }
}

initializeTenantCloningCollections();
