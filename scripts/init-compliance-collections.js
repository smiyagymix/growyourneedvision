/**
 * Initialize Compliance Collections
 * 
 * Creates PocketBase collections for compliance reporting:
 * - compliance_reports: Generated compliance reports
 * - compliance_violations: Tracked violations
 * - compliance_configs: Automated reporting configuration
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

        // ==================== COMPLIANCE REPORTS ====================
        const reportsExists = collections.find(c => c.name === 'compliance_reports');

        if (!reportsExists) {
            console.log('\n📋 Creating compliance_reports collection...');
            await pb.collections.create({
                name: 'compliance_reports',
                type: 'base',
                schema: [
                    {
                        name: 'standard',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['GDPR', 'SOC2', 'HIPAA', 'CCPA', 'ISO27001', 'PCI-DSS']
                        }
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: { max: 255 }
                    },
                    {
                        name: 'reportDate',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'period',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['compliant', 'non-compliant', 'partial', 'pending-review']
                        }
                    },
                    {
                        name: 'score',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'violations',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'recommendations',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'metrics',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'generatedBy',
                        type: 'text',
                        required: true,
                        options: { max: 255 }
                    },
                    {
                        name: 'file',
                        type: 'file',
                        required: false,
                        options: { maxSelect: 1, maxSize: 52428800 } // 50 MB
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created compliance_reports collection');
        } else {
            console.log('\n✓ compliance_reports collection already exists');
        }

        // ==================== COMPLIANCE VIOLATIONS ====================
        const violationsExists = collections.find(c => c.name === 'compliance_violations');

        if (!violationsExists) {
            console.log('\n📋 Creating compliance_violations collection...');
            await pb.collections.create({
                name: 'compliance_violations',
                type: 'base',
                schema: [
                    {
                        name: 'standard',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['GDPR', 'SOC2', 'HIPAA', 'CCPA', 'ISO27001', 'PCI-DSS']
                        }
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: { max: 255 }
                    },
                    {
                        name: 'violationType',
                        type: 'text',
                        required: true,
                        options: { max: 255 }
                    },
                    {
                        name: 'severity',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['critical', 'high', 'medium', 'low']
                        }
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: true,
                        options: { max: 2000 }
                    },
                    {
                        name: 'detectedAt',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'resolvedAt',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['open', 'in-progress', 'resolved', 'false-positive']
                        }
                    },
                    {
                        name: 'affectedRecords',
                        type: 'number',
                        required: true
                    },
                    {
                        name: 'remediationSteps',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'resolution',
                        type: 'text',
                        required: false,
                        options: { max: 2000 }
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✓ Created compliance_violations collection');
        } else {
            console.log('\n✓ compliance_violations collection already exists');
        }

        // ==================== COMPLIANCE CONFIGS ====================
        const configsExists = collections.find(c => c.name === 'compliance_configs');

        if (!configsExists) {
            console.log('\n📋 Creating compliance_configs collection...');
            await pb.collections.create({
                name: 'compliance_configs',
                type: 'base',
                schema: [
                    {
                        name: 'standard',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['GDPR', 'SOC2', 'HIPAA', 'CCPA', 'ISO27001', 'PCI-DSS']
                        }
                    },
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: false,
                        options: { max: 255 }
                    },
                    {
                        name: 'enabled',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'frequency',
                        type: 'select',
                        required: true,
                        options: {
                            values: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
                        }
                    },
                    {
                        name: 'emailRecipients',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'thresholds',
                        type: 'json',
                        required: true
                    },
                    {
                        name: 'lastReportDate',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'nextReportDate',
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
            console.log('✓ Created compliance_configs collection');
        } else {
            console.log('\n✓ compliance_configs collection already exists');
        }

        console.log('\n✅ Compliance collections initialized successfully!');
        console.log('\n📊 Summary:');
        console.log('  • compliance_reports: Generated compliance reports with PDF export');
        console.log('  • compliance_violations: Violation tracking and resolution');
        console.log('  • compliance_configs: Automated reporting configuration');
        console.log('  • Standards supported: GDPR, SOC2, HIPAA, CCPA, ISO27001, PCI-DSS');
        
    } catch (error) {
        console.error('❌ Failed to initialize collections:', error);
        process.exit(1);
    }
}

initializeCollections();
