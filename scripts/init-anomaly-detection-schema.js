/**
 * Initialize Anomaly Detection Collections
 * Collections: anomaly_detections, anomaly_baselines
 * Run with: node scripts/init-anomaly-detection-schema.js
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initAnomalyDetectionSchema() {
    console.log('🚀 Initializing Anomaly Detection schema...');

    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');
        console.log('✅ Authenticated as admin');

        const collections = await pb.collections.getFullList();
        
        // 1. Create anomaly_detections collection
        const anomalyDetectionsExists = collections.find(c => c.name === 'anomaly_detections');
        if (!anomalyDetectionsExists) {
            await pb.collections.create({
                name: 'anomaly_detections',
                type: 'base',
                schema: [
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: {
                            max: 255
                        }
                    },
                    {
                        name: 'type',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: [
                                'revenue_drop',
                                'usage_spike',
                                'error_rate',
                                'response_time',
                                'user_churn',
                                'storage_spike',
                                'api_abuse'
                            ]
                        }
                    },
                    {
                        name: 'severity',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['low', 'medium', 'high', 'critical']
                        }
                    },
                    {
                        name: 'metric',
                        type: 'text',
                        required: true,
                        options: {
                            max: 100
                        }
                    },
                    {
                        name: 'currentValue',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'expectedValue',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'threshold',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'deviation',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'zScore',
                        type: 'number',
                        required: false
                    },
                    {
                        name: 'detectedAt',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['active', 'acknowledged', 'resolved', 'false_positive']
                        }
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: true,
                        options: {
                            max: 1000
                        }
                    },
                    {
                        name: 'affectedEntities',
                        type: 'json',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'acknowledgedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'acknowledgedBy',
                        type: 'text',
                        required: false,
                        options: {
                            max: 255
                        }
                    },
                    {
                        name: 'resolvedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'resolvedBy',
                        type: 'text',
                        required: false,
                        options: {
                            max: 255
                        }
                    },
                    {
                        name: 'resolutionNotes',
                        type: 'text',
                        required: false,
                        options: {
                            max: 2000
                        }
                    },
                    {
                        name: 'autoResolved',
                        type: 'bool',
                        required: false
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null, // Allow system to create anomalies
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created anomaly_detections collection');
        } else {
            console.log('ℹ️  anomaly_detections collection already exists');
        }

        // 2. Create anomaly_baselines collection
        const anomalyBaselinesExists = collections.find(c => c.name === 'anomaly_baselines');
        if (!anomalyBaselinesExists) {
            await pb.collections.create({
                name: 'anomaly_baselines',
                type: 'base',
                schema: [
                    {
                        name: 'metric',
                        type: 'text',
                        required: true,
                        options: {
                            max: 100
                        }
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: {
                            max: 255
                        }
                    },
                    {
                        name: 'mean',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'standardDeviation',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'threshold',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'upperBound',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'lowerBound',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'sampleSize',
                        type: 'number',
                        required: true,
                        options: {
                            min: 1
                        }
                    },
                    {
                        name: 'calculatedAt',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'dataPoints',
                        type: 'json',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'period',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['7days', '30days', '90days']
                        }
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null, // Allow system to create baselines
                updateRule: null, // Baselines are recalculated, not updated
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created anomaly_baselines collection');
        } else {
            console.log('ℹ️  anomaly_baselines collection already exists');
        }

        // 3. Create anomaly_detection_rules collection
        const anomalyDetectionRulesExists = collections.find(c => c.name === 'anomaly_detection_rules');
        if (!anomalyDetectionRulesExists) {
            await pb.collections.create({
                name: 'anomaly_detection_rules',
                type: 'base',
                schema: [
                    {
                        name: 'metric',
                        type: 'text',
                        required: true,
                        options: {
                            max: 100
                        }
                    },
                    {
                        name: 'type',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: [
                                'revenue_drop',
                                'usage_spike',
                                'error_rate',
                                'response_time',
                                'user_churn',
                                'storage_spike',
                                'api_abuse'
                            ]
                        }
                    },
                    {
                        name: 'enabled',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'zScoreThreshold',
                        type: 'number',
                        required: true,
                        options: {
                            min: 0,
                            max: 10
                        }
                    },
                    {
                        name: 'minimumDeviationPercent',
                        type: 'number',
                        required: false,
                        options: {
                            min: 0,
                            max: 1000
                        }
                    },
                    {
                        name: 'checkFrequency',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['5min', '15min', '30min', '1hour', '6hour', '1day']
                        }
                    },
                    {
                        name: 'autoCreateAlerts',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'notificationChannels',
                        type: 'json',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'appliesTo',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['all_tenants', 'specific_tenant', 'platform']
                        }
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: {
                            max: 255
                        }
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created anomaly_detection_rules collection');
        } else {
            console.log('ℹ️  anomaly_detection_rules collection already exists');
        }

        console.log('✅ Anomaly Detection schema initialization complete!');
    } catch (error) {
        console.error('❌ Error initializing Anomaly Detection schema:', error);
        throw error;
    }
}

// Run the initialization
initAnomalyDetectionSchema()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
