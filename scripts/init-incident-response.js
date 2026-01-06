/**
 * Initialize Incident Response Collections
 * 
 * Creates collections for incidents and incident rules
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeIncidentCollections() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');

        console.log('✅ Authenticated as admin');

        const collections = await pb.collections.getFullList();

        // Collection 1: incidents
        const incidentsExists = collections.find(c => c.name === 'incidents');
        if (!incidentsExists) {
            await pb.collections.create({
                name: 'incidents',
                type: 'base',
                schema: [
                    {
                        name: 'title',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'severity',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['critical', 'high', 'medium', 'low']
                        }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed']
                        }
                    },
                    {
                        name: 'category',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['performance', 'security', 'availability', 'data', 'integration', 'other']
                        }
                    },
                    {
                        name: 'affectedServices',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'affectedTenants',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'detectedBy',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['auto', 'user', 'monitoring', 'manual']
                        }
                    },
                    {
                        name: 'detectedAt',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'acknowledgedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'resolvedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'closedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'assignedTo',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'priority',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'impact',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['none', 'minor', 'major', 'critical']
                        }
                    },
                    {
                        name: 'timeline',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'resolution',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'rootCause',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'preventionSteps',
                        type: 'json',
                        required: false
                    },
                    {
                        name: 'metrics',
                        type: 'json',
                        required: true
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created incidents collection');
        } else {
            console.log('⏭️  incidents collection already exists');
        }

        // Collection 2: incident_rules
        const rulesExists = collections.find(c => c.name === 'incident_rules');
        if (!rulesExists) {
            await pb.collections.create({
                name: 'incident_rules',
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
                        name: 'enabled',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'trigger',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'severity',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['critical', 'high', 'medium', 'low']
                        }
                    },
                    {
                        name: 'category',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'autoAssign',
                        type: 'text',
                        required: false
                    },
                    {
                        name: 'notifyChannels',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'escalationPolicy',
                        type: 'json',
                        required: false
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created incident_rules collection');
        } else {
            console.log('⏭️  incident_rules collection already exists');
        }

        // Seed sample incident rule
        const ruleRecords = await pb.collection('incident_rules').getFullList();
        if (ruleRecords.length === 0) {
            await pb.collection('incident_rules').create({
                name: 'High Database Connection Pool',
                description: 'Alert when DB connection pool exceeds 90%',
                enabled: true,
                trigger: {
                    type: 'threshold',
                    metric: 'db_connection_pool',
                    threshold: 90,
                    operator: 'gt',
                    duration: 300
                },
                severity: 'high',
                category: 'performance',
                notifyChannels: ['email', 'slack']
            });
            console.log('✅ Seeded sample incident rule');
        }

        console.log('\n✅ Incident response collections initialized successfully!');

    } catch (error) {
        console.error('❌ Error initializing incident collections:', error);
        process.exit(1);
    }
}

initializeIncidentCollections();
