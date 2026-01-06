/**
 * Initialize IP Rate Limiting Collections
 * Collections: ip_rate_limits, ip_violations
 * Run with: node scripts/init-rate-limiting-schema.js
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initRateLimitingSchema() {
    console.log('🚀 Initializing IP Rate Limiting schema...');

    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');
        console.log('✅ Authenticated as admin');

        const collections = await pb.collections.getFullList();
        
        // 1. Create ip_rate_limits collection
        const ipRateLimitsExists = collections.find(c => c.name === 'ip_rate_limits');
        if (!ipRateLimitsExists) {
            await pb.collections.create({
                name: 'ip_rate_limits',
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
                        name: 'requestsPerHour',
                        type: 'number',
                        required: true,
                        options: {
                            min: 1,
                            max: 1000000
                        }
                    },
                    {
                        name: 'requestsPerDay',
                        type: 'number',
                        required: true,
                        options: {
                            min: 1,
                            max: 10000000
                        }
                    },
                    {
                        name: 'ipWhitelist',
                        type: 'json',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'ipBlacklist',
                        type: 'json',
                        required: false,
                        options: {}
                    },
                    {
                        name: 'enabled',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'violationThreshold',
                        type: 'number',
                        required: true,
                        options: {
                            min: 1,
                            max: 100
                        }
                    },
                    {
                        name: 'currentViolations',
                        type: 'number',
                        required: false,
                        options: {
                            min: 0
                        }
                    },
                    {
                        name: 'autoBanEnabled',
                        type: 'bool',
                        required: true
                    },
                    {
                        name: 'banDuration',
                        type: 'number',
                        required: false,
                        options: {
                            min: 0
                        }
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created ip_rate_limits collection');
        } else {
            console.log('ℹ️  ip_rate_limits collection already exists');
        }

        // 2. Create ip_violations collection
        const ipViolationsExists = collections.find(c => c.name === 'ip_violations');
        if (!ipViolationsExists) {
            await pb.collections.create({
                name: 'ip_violations',
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
                        name: 'ipAddress',
                        type: 'text',
                        required: true,
                        options: {
                            min: 7,
                            max: 45
                        }
                    },
                    {
                        name: 'endpoint',
                        type: 'text',
                        required: true,
                        options: {
                            max: 500
                        }
                    },
                    {
                        name: 'requestCount',
                        type: 'number',
                        required: true,
                        options: {
                            min: 1
                        }
                    },
                    {
                        name: 'limit',
                        type: 'number',
                        required: true,
                        options: {
                            min: 1
                        }
                    },
                    {
                        name: 'timestamp',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'action',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['blocked', 'warned', 'logged', 'banned']
                        }
                    },
                    {
                        name: 'duration',
                        type: 'number',
                        required: false,
                        options: {
                            min: 0
                        }
                    },
                    {
                        name: 'userAgent',
                        type: 'text',
                        required: false,
                        options: {
                            max: 500
                        }
                    },
                    {
                        name: 'resolved',
                        type: 'bool',
                        required: true
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
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null, // Allow system to create violations
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created ip_violations collection');
        } else {
            console.log('ℹ️  ip_violations collection already exists');
        }

        // 3. Create ip_request_log collection for detailed tracking
        const ipRequestLogExists = collections.find(c => c.name === 'ip_request_log');
        if (!ipRequestLogExists) {
            await pb.collections.create({
                name: 'ip_request_log',
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
                        name: 'ipAddress',
                        type: 'text',
                        required: true,
                        options: {
                            min: 7,
                            max: 45
                        }
                    },
                    {
                        name: 'endpoint',
                        type: 'text',
                        required: true,
                        options: {
                            max: 500
                        }
                    },
                    {
                        name: 'method',
                        type: 'select',
                        required: true,
                        options: {
                            maxSelect: 1,
                            values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
                        }
                    },
                    {
                        name: 'timestamp',
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'statusCode',
                        type: 'number',
                        required: true,
                        options: {
                            min: 100,
                            max: 599
                        }
                    },
                    {
                        name: 'responseTime',
                        type: 'number',
                        required: false,
                        options: {
                            min: 0
                        }
                    },
                    {
                        name: 'userAgent',
                        type: 'text',
                        required: false,
                        options: {
                            max: 500
                        }
                    },
                    {
                        name: 'blocked',
                        type: 'bool',
                        required: true
                    }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null, // Allow system to create logs
                updateRule: null, // Logs are immutable
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created ip_request_log collection');
        } else {
            console.log('ℹ️  ip_request_log collection already exists');
        }

        console.log('✅ IP Rate Limiting schema initialization complete!');
    } catch (error) {
        console.error('❌ Error initializing IP Rate Limiting schema:', error);
        throw error;
    }
}

// Run the initialization
initRateLimitingSchema()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
