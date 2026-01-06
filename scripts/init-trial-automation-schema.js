/**
 * Initialize Trial Automation Collections
 * Collections: tenant_trials
 * Run with: node scripts/init-trial-automation-schema.js
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initTrialAutomationSchema() {
    console.log('🚀 Initializing Trial Automation schema...');

    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');
        console.log('✅ Authenticated as admin');

        const collections = await pb.collections.getFullList();
        
        // 1. Create tenant_trials collection
        const tenantTrialsExists = collections.find(c => c.name === 'tenant_trials');
        if (!tenantTrialsExists) {
            await pb.collections.create({
                name: 'tenant_trials',
                type: 'base',
                schema: [
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: true,
                        options: {
                            min: 1,
                            max: 255
                        }
                    },
                    {
                        name: 'tenantName',
                        type: 'text',
                        required: true,
                        options: {
                            min: 1,
                            max: 255
                        }
                    },
                    {
                        name: 'adminEmail',
                        type: 'email',
                        required: true
                    },
                    {
                        name: 'planName',
                        type: 'text',
                        required: true,
                        options: {
                            min: 1,
                            max: 100
                        }
                    },
                    {
                        name: 'trialStartDate',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'trialEndDate',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['active', 'expired', 'converted', 'suspended']
                        }
                    },
                    {
                        name: 'remindersSent',
                        type: 'json',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'convertedDate',
                        type: 'date',
                        required: false
                    },
                    {
                        name: 'convertedToPlan',
                        type: 'text',
                        required: false,
                        options: {
                            max: 100
                        }
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        required: false,
                        options: {
                            max: 1000
                        }
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created tenant_trials collection');
        } else {
            console.log('ℹ️  tenant_trials collection already exists');
        }

        // 2. Create trial_email_log collection for tracking sent emails
        const trialEmailLogExists = collections.find(c => c.name === 'trial_email_log');
        if (!trialEmailLogExists) {
            await pb.collections.create({
                name: 'trial_email_log',
                type: 'base',
                schema: [
                    {
                        name: 'tenantId',
                        type: 'text',
                        required: true,
                        options: {
                            min: 1,
                            max: 255
                        }
                    },
                    {
                        name: 'templateId',
                        type: 'text',
                        required: true,
                        options: {
                            min: 1,
                            max: 100
                        }
                    },
                    {
                        name: 'recipientEmail',
                        type: 'email',
                        required: true
                    },
                    {
                        name: 'subject',
                        type: 'text',
                        required: true,
                        options: {
                            max: 255
                        }
                    },
                    {
                        name: 'status',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['sent', 'failed', 'bounced', 'opened']
                        }
                    },
                    {
                        name: 'sentAt',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'errorMessage',
                        type: 'text',
                        required: false,
                        options: {
                            max: 1000
                        }
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created trial_email_log collection');
        } else {
            console.log('ℹ️  trial_email_log collection already exists');
        }

        console.log('✅ Trial Automation schema initialization complete!');
    } catch (error) {
        console.error('❌ Error initializing Trial Automation schema:', error);
        throw error;
    }
}

// Run the initialization
initTrialAutomationSchema()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
