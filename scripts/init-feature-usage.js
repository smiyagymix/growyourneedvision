/**
 * Initialize Feature Usage Analytics Collections
 * 
 * Creates collections for feature definitions and usage tracking
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeFeatureUsageCollections() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');

        console.log('✅ Authenticated as admin');

        const collections = await pb.collections.getFullList();

        // Collection 1: feature_definitions
        const featuresExists = collections.find(c => c.name === 'feature_definitions');
        if (!featuresExists) {
            await pb.collections.create({
                name: 'feature_definitions',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'displayName',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'category',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['core', 'overlay', 'ai', 'payment', 'communication', 'analytics']
                        }
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'requiredPlan',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'isDeprecated',
                        type: 'bool',
                        required: true
                    }
                ],
                listRule: null, // Allow all authenticated
                viewRule: null,
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created feature_definitions collection');
        } else {
            console.log('⏭️  feature_definitions collection already exists');
        }

        // Collection 2: feature_usage
        const usageExists = collections.find(c => c.name === 'feature_usage');
        if (!usageExists) {
            await pb.collections.create({
                name: 'feature_usage',
                type: 'base',
                schema: [
                    {
                        name: 'featureName',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'userId',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'action',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['viewed', 'clicked', 'completed', 'dismissed']
                        }
                    },
                    {
                        name: 'metadata',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'sessionId',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'timestamp',
                        type: 'date',
                        required: true
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null, // Allow system to track usage
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created feature_usage collection');
        } else {
            console.log('⏭️  feature_usage collection already exists');
        }

        // Collection 3: comparison_reports
        const reportsExists = collections.find(c => c.name === 'comparison_reports');
        if (!reportsExists) {
            await pb.collections.create({
                name: 'comparison_reports',
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
                        name: 'tenantIds',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'metrics',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'period',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'results',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'insights',
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
            console.log('✅ Created comparison_reports collection');
        } else {
            console.log('⏭️  comparison_reports collection already exists');
        }

        // Seed feature definitions
        const featureRecords = await pb.collection('feature_definitions').getFullList();
        if (featureRecords.length === 0) {
            const features = [
                {
                    name: 'ai_assistant',
                    displayName: 'AI Assistant',
                    category: 'ai',
                    description: 'AI-powered chat assistant for students and teachers',
                    requiredPlan: ['professional', 'enterprise'],
                    isDeprecated: false
                },
                {
                    name: 'grade_book',
                    displayName: 'Grade Book',
                    category: 'core',
                    description: 'Manage student grades and assessments',
                    requiredPlan: ['basic', 'professional', 'enterprise'],
                    isDeprecated: false
                },
                {
                    name: 'attendance_tracking',
                    displayName: 'Attendance Tracking',
                    category: 'core',
                    description: 'Track daily student attendance',
                    requiredPlan: ['basic', 'professional', 'enterprise'],
                    isDeprecated: false
                },
                {
                    name: 'payment_gateway',
                    displayName: 'Payment Gateway',
                    category: 'payment',
                    description: 'Accept online payments for tuition and fees',
                    requiredPlan: ['professional', 'enterprise'],
                    isDeprecated: false
                },
                {
                    name: 'analytics_dashboard',
                    displayName: 'Analytics Dashboard',
                    category: 'analytics',
                    description: 'Comprehensive analytics and reporting',
                    requiredPlan: ['professional', 'enterprise'],
                    isDeprecated: false
                },
                {
                    name: 'messaging',
                    displayName: 'Messaging',
                    category: 'communication',
                    description: 'Internal messaging between teachers, students, and parents',
                    requiredPlan: ['basic', 'professional', 'enterprise'],
                    isDeprecated: false
                }
            ];

            for (const feature of features) {
                await pb.collection('feature_definitions').create(feature);
            }
            console.log('✅ Seeded 6 feature definitions');
        } else {
            console.log('⏭️  Features already seeded');
        }

        console.log('\n✅ Feature usage analytics collections initialized successfully!');

    } catch (error) {
        console.error('❌ Error initializing feature usage collections:', error);
        process.exit(1);
    }
}

initializeFeatureUsageCollections();
