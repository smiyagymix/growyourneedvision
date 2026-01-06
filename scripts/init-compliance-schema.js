/**
 * Initialize Compliance & Security Collections
 * 
 * Collections: compliance_records, abuse_reports, sla_metrics, cost_attribution
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function authenticate() {
    try {
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || '12345678'
        );
        console.log('✓ Authenticated as super admin\n');
        return true;
    } catch (error) {
        console.error('Authentication failed:', error);
        return false;
    }
}

async function createComplianceCollections() {
    try {
        const collections = await pb.collections.getFullList();
        const existingNames = collections.map(c => c.name);

        // 1. COMPLIANCE_RECORDS - GDPR, SOC2, privacy compliance
        if (!existingNames.includes('compliance_records')) {
            console.log('Creating compliance_records collection...');
            await pb.collections.create({
                name: 'compliance_records',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'userId', type: 'relation', options: { collectionId: pb.collection('users').id }, required: false },
                    { name: 'type', type: 'select', options: { values: ['GDPR', 'SOC2', 'HIPAA', 'PCI-DSS', 'Data Export', 'Right to be Forgotten', 'Consent', 'Other'] }, required: true },
                    { name: 'status', type: 'select', options: { values: ['pending', 'in_progress', 'completed', 'failed'] }, required: true },
                    { name: 'requestedBy', type: 'relation', options: { collectionId: pb.collection('users').id }, required: true },
                    { name: 'description', type: 'text' },
                    { name: 'data', type: 'json' }, // Exported data or compliance details
                    { name: 'completedAt', type: 'date' },
                    { name: 'expiresAt', type: 'date' },
                    { name: 'metadata', type: 'json' }
                ],
                indexes: [
                    'CREATE INDEX idx_compliance_tenant ON compliance_records (tenantId)',
                    'CREATE INDEX idx_compliance_type ON compliance_records (type)',
                    'CREATE INDEX idx_compliance_status ON compliance_records (status)'
                ]
            });
            console.log('✓ compliance_records collection created\n');
        }

        // 2. ABUSE_REPORTS - Platform abuse & spam detection
        if (!existingNames.includes('abuse_reports')) {
            console.log('Creating abuse_reports collection...');
            await pb.collections.create({
                name: 'abuse_reports',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'reportedBy', type: 'relation', options: { collectionId: pb.collection('users').id } },
                    { name: 'reportedUserId', type: 'relation', options: { collectionId: pb.collection('users').id } },
                    { name: 'type', type: 'select', options: { values: ['spam', 'harassment', 'inappropriate_content', 'api_abuse', 'rate_limit_violation', 'security_violation', 'other'] }, required: true },
                    { name: 'severity', type: 'select', options: { values: ['low', 'medium', 'high', 'critical'] }, required: true },
                    { name: 'status', type: 'select', options: { values: ['open', 'investigating', 'resolved', 'dismissed'] }, required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'evidence', type: 'json' }, // Screenshots, logs, etc.
                    { name: 'actionTaken', type: 'text' },
                    { name: 'assignedTo', type: 'relation', options: { collectionId: pb.collection('users').id } },
                    { name: 'resolvedAt', type: 'date' },
                    { name: 'metadata', type: 'json' }
                ],
                indexes: [
                    'CREATE INDEX idx_abuse_tenant ON abuse_reports (tenantId)',
                    'CREATE INDEX idx_abuse_type ON abuse_reports (type)',
                    'CREATE INDEX idx_abuse_severity ON abuse_reports (severity)',
                    'CREATE INDEX idx_abuse_status ON abuse_reports (status)'
                ]
            });
            console.log('✓ abuse_reports collection created\n');
        }

        // 3. SLA_METRICS - Service-level agreement tracking
        if (!existingNames.includes('sla_metrics')) {
            console.log('Creating sla_metrics collection...');
            await pb.collections.create({
                name: 'sla_metrics',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'metric', type: 'select', options: { values: ['uptime', 'response_time', 'error_rate', 'availability', 'data_backup', 'support_response'] }, required: true },
                    { name: 'target', type: 'number', required: true }, // Target percentage or value
                    { name: 'actual', type: 'number', required: true }, // Actual measured value
                    { name: 'status', type: 'select', options: { values: ['met', 'breached', 'at_risk'] }, required: true },
                    { name: 'period', type: 'date', required: true }, // Month/week being measured
                    { name: 'incidents', type: 'json' }, // Array of incident details
                    { name: 'creditsIssued', type: 'number' }, // SLA credit amount if breached
                    { name: 'metadata', type: 'json' }
                ],
                indexes: [
                    'CREATE INDEX idx_sla_tenant ON sla_metrics (tenantId)',
                    'CREATE INDEX idx_sla_metric ON sla_metrics (metric)',
                    'CREATE INDEX idx_sla_period ON sla_metrics (period)',
                    'CREATE INDEX idx_sla_status ON sla_metrics (status)'
                ]
            });
            console.log('✓ sla_metrics collection created\n');
        }

        // 4. COST_ATTRIBUTION - Infrastructure cost per tenant
        if (!existingNames.includes('cost_attribution')) {
            console.log('Creating cost_attribution collection...');
            await pb.collections.create({
                name: 'cost_attribution',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'period', type: 'date', required: true }, // Month of cost
                    { name: 'computeCost', type: 'number', required: true },
                    { name: 'storageCost', type: 'number', required: true },
                    { name: 'bandwidthCost', type: 'number', required: true },
                    { name: 'aiApiCost', type: 'number' }, // OpenAI/AI service costs
                    { name: 'otherCosts', type: 'number' },
                    { name: 'totalCost', type: 'number', required: true },
                    { name: 'revenue', type: 'number' }, // Tenant's payment amount
                    { name: 'margin', type: 'number' }, // Profit margin percentage
                    { name: 'details', type: 'json' }, // Breakdown by service
                    { name: 'metadata', type: 'json' }
                ],
                indexes: [
                    'CREATE INDEX idx_cost_tenant ON cost_attribution (tenantId)',
                    'CREATE INDEX idx_cost_period ON cost_attribution (period)'
                ]
            });
            console.log('✓ cost_attribution collection created\n');
        }

        // 5. TENANT_COMMUNICATIONS - Broadcast announcements to tenants
        if (!existingNames.includes('tenant_communications')) {
            console.log('Creating tenant_communications collection...');
            await pb.collections.create({
                name: 'tenant_communications',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'message', type: 'text', required: true },
                    { name: 'type', type: 'select', options: { values: ['announcement', 'maintenance', 'incident', 'feature', 'billing', 'security'] }, required: true },
                    { name: 'severity', type: 'select', options: { values: ['info', 'warning', 'critical'] }, required: true },
                    { name: 'targetTenants', type: 'json' }, // Array of tenant IDs, or null for all
                    { name: 'targetPlans', type: 'json' }, // Array of plan names to target
                    { name: 'sentBy', type: 'relation', options: { collectionId: pb.collection('users').id }, required: true },
                    { name: 'scheduledFor', type: 'date' },
                    { name: 'sentAt', type: 'date' },
                    { name: 'status', type: 'select', options: { values: ['draft', 'scheduled', 'sent', 'failed'] }, required: true },
                    { name: 'channels', type: 'json' }, // ['email', 'in_app', 'sms']
                    { name: 'deliveryStats', type: 'json' }, // Sent, opened, clicked
                    { name: 'metadata', type: 'json' }
                ],
                indexes: [
                    'CREATE INDEX idx_comm_type ON tenant_communications (type)',
                    'CREATE INDEX idx_comm_status ON tenant_communications (status)',
                    'CREATE INDEX idx_comm_scheduled ON tenant_communications (scheduledFor)'
                ]
            });
            console.log('✓ tenant_communications collection created\n');
        }

        console.log('\n=== Compliance & Security Collections Created Successfully ===\n');
        console.log('Created Collections:');
        console.log('  - compliance_records (GDPR, SOC2, privacy)');
        console.log('  - abuse_reports (spam, harassment, violations)');
        console.log('  - sla_metrics (uptime, performance tracking)');
        console.log('  - cost_attribution (infrastructure costs)');
        console.log('  - tenant_communications (announcements)');

    } catch (error) {
        console.error('Error creating compliance collections:', error);
        throw error;
    }
}

async function main() {
    console.log('Starting Compliance & Security Schema Initialization...\n');
    
    const authenticated = await authenticate();
    if (!authenticated) {
        console.error('Failed to authenticate');
        process.exit(1);
    }

    await createComplianceCollections();
    
    console.log('\nSchema initialization complete!');
    process.exit(0);
}

main();
