/**
 * Initialize Audit Logs Collection
 * Stores all user actions for compliance and security auditing
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function authenticate() {
    try {
        // Try to authenticate with owner credentials
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');
        console.log('✅ Authenticated as admin');
        return true;
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        console.log('Make sure PocketBase is running and admin credentials are correct.');
        return false;
    }
}

async function initAuditSchema() {
    try {
        console.log('\n🔧 Initializing Audit Logs Schema...\n');

        // Check if collection exists
        try {
            await pb.collection('audit_logs').getList(1, 1);
            console.log('✅ audit_logs collection already exists');
            return true;
        } catch (error) {
            console.log('📋 Creating audit_logs collection...');
        }

        // Create audit_logs collection
        await pb.collections.create({
            name: 'audit_logs',
            type: 'base',
            schema: [
                {
                    name: 'action',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 100
                    }
                },
                {
                    name: 'userId',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 50
                    }
                },
                {
                    name: 'userEmail',
                    type: 'email',
                    required: true
                },
                {
                    name: 'resource',
                    type: 'text',
                    required: true,
                    options: {
                        min: 1,
                        max: 200
                    }
                },
                {
                    name: 'details',
                    type: 'json',
                    required: false
                },
                {
                    name: 'ipAddress',
                    type: 'text',
                    required: false,
                    options: {
                        max: 50
                    }
                },
                {
                    name: 'timestamp',
                    type: 'date',
                    required: true
                },
                {
                    name: 'tenantId',
                    type: 'text',
                    required: false,
                    options: {
                        max: 50
                    }
                }
            ],
            indexes: [
                'CREATE INDEX idx_audit_action ON audit_logs (action)',
                'CREATE INDEX idx_audit_user ON audit_logs (userId)',
                'CREATE INDEX idx_audit_timestamp ON audit_logs (timestamp)',
                'CREATE INDEX idx_audit_resource ON audit_logs (resource)'
            ],
            listRule: '@request.auth.id != ""',
            viewRule: '@request.auth.id != ""',
            createRule: null, // Only server can create
            updateRule: null, // Audit logs are immutable
            deleteRule: '@request.auth.role = "Owner"' // Only owner can delete
        });

        console.log('✅ audit_logs collection created');

        // Seed some test data
        const testActions = [
            {
                action: 'export_created',
                userId: 'system',
                userEmail: 'owner@growyourneed.com',
                resource: 'subscriptions_export.csv',
                details: { format: 'csv', recordCount: 150 },
                ipAddress: '127.0.0.1',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                action: 'export_downloaded',
                userId: 'system',
                userEmail: 'admin@school.com',
                resource: 'revenue_report.xlsx',
                details: { format: 'excel', reportType: 'revenue_analysis' },
                ipAddress: '192.168.1.1',
                timestamp: new Date(Date.now() - 7200000).toISOString()
            },
            {
                action: 'report_generated',
                userId: 'system',
                userEmail: 'owner@growyourneed.com',
                resource: 'churn_prediction_report.pdf',
                details: { format: 'pdf', predictions: 25 },
                ipAddress: '127.0.0.1',
                timestamp: new Date(Date.now() - 1800000).toISOString()
            }
        ];

        for (const action of testActions) {
            await pb.collection('audit_logs').create(action);
        }

        console.log('✅ Seeded 3 test audit log entries');
        console.log('\n' + '='.repeat(60));
        console.log('✅ Audit Logs Schema Initialized Successfully');
        console.log('='.repeat(60) + '\n');

        return true;
    } catch (error) {
        console.error('❌ Error initializing audit logs schema:', error);
        return false;
    }
}

// Run initialization
const authenticated = await authenticate();
if (authenticated) {
    const success = await initAuditSchema();
    process.exit(success ? 0 : 1);
} else {
    process.exit(1);
}
