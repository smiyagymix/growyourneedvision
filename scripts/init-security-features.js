/**
 * Security Features Collections Initialization
 * 
 * Sets up collections for:
 * - Security audit logs
 * - Penetration tests
 * - Vulnerabilities
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Authenticate as admin
await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
    process.env.POCKETBASE_ADMIN_PASSWORD || '12345678'
);

async function createAuditLogs() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'audit_logs');

        if (!exists) {
            await pb.collections.create({
                name: 'audit_logs',
                type: 'base',
                schema: [
                    {
                        name: 'userId',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'userEmail',
                        type: 'email',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'userName',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'action',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'resource',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'resourceId',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'severity',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['info', 'warning', 'critical']
                        }
                    },
                    {
                        name: 'ipAddress',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'userAgent',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'details',
                        type: 'json',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['success', 'failure']
                        }
                    },
                    {
                        name: 'errorMessage',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'timestamp',
                        type: 'date',
                        required: true,
                        options: {}
                    }
                ],
                listRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                viewRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                createRule: '', // System creates these
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            
            // Create index for faster queries
            console.log('✓ audit_logs collection created');
        } else {
            console.log('audit_logs collection already exists');
        }
    } catch (error) {
        console.error('Error creating audit_logs:', error);
    }
}

async function createPenetrationTests() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'penetration_tests');

        if (!exists) {
            await pb.collections.create({
                name: 'penetration_tests',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'type',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['automated', 'manual', 'social_engineering', 'physical']
                        }
                    },
                    {
                        name: 'scope',
                        type: 'json',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'tester',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'testerCompany',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'scheduledDate',
                        type: 'date',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'completedDate',
                        type: 'date',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['scheduled', 'in_progress', 'completed', 'cancelled']
                        }
                    },
                    {
                        name: 'severity',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['low', 'medium', 'high', 'critical']
                        }
                    },
                    {
                        name: 'findings',
                        type: 'number',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'reportUrl',
                        type: 'url',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: {}
                    }
                ],
                listRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                viewRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                updateRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ penetration_tests collection created');
        } else {
            console.log('penetration_tests collection already exists');
        }
    } catch (error) {
        console.error('Error creating penetration_tests:', error);
    }
}

async function createVulnerabilities() {
    try {
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'vulnerabilities');

        if (!exists) {
            await pb.collections.create({
                name: 'vulnerabilities',
                type: 'base',
                schema: [
                    {
                        name: 'testId',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'title',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'severity',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['low', 'medium', 'high', 'critical']
                        }
                    },
                    {
                        name: 'cvss_score',
                        type: 'number',
                        required: false,
                        options: {
                            min: 0,
                            max: 10
                        }
                    },
                    {
                        name: 'cve_id',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'category',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'affectedSystem',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'exploitability',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['none', 'low', 'medium', 'high']
                        }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['open', 'in_progress', 'resolved', 'accepted', 'false_positive']
                        }
                    },
                    {
                        name: 'discoveredDate',
                        type: 'date',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'resolvedDate',
                        type: 'date',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'assignedTo',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'remediationSteps',
                        type: 'text',
                        required: true,
                        options: {}
                    },
                    {
                        name: 'remediationPriority',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['low', 'medium', 'high', 'critical']
                        }
                    },
                    {
                        name: 'estimatedEffort',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'actualEffort',
                        type: 'text',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'verificationStatus',
                        type: 'select',
                        required: false,
                        options: {
                            values: ['not_started', 'pending', 'verified', 'failed']
                        }
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        required: false,
                        options: {}
                    }
                ],
                listRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                viewRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                createRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                updateRule: '@request.auth.role = "Owner" || @request.auth.role = "SchoolAdmin"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ vulnerabilities collection created');
        } else {
            console.log('vulnerabilities collection already exists');
        }
    } catch (error) {
        console.error('Error creating vulnerabilities:', error);
    }
}

// Run initialization
console.log('Initializing security features collections...');
await createAuditLogs();
await createPenetrationTests();
await createVulnerabilities();
console.log('Security features collections initialized successfully!');

process.exit(0);
