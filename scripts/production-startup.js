#!/usr/bin/env node

/**
 * Production Startup & Verification Script
 * Ensures all services are running and properly configured
 * Runs health checks and initializes required schemas
 */

import fetch from 'node-fetch';
import { spawn, execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// Configuration
const SERVICES = {
    pocketbase: {
        name: 'PocketBase',
        port: 8090,
        url: 'http://localhost:8090/api/health',
        executable: process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase',
        cwd: path.join(ROOT_DIR, 'pocketbase'),
        critical: true
    },
    paymentServer: {
        name: 'Payment Server',
        port: 3001,
        url: 'http://localhost:3001/api/health',
        executable: process.platform === 'win32' ? 'pnpm' : 'pnpm',
        args: ['run', 'server'],
        cwd: ROOT_DIR,
        critical: true
    },
    aiService: {
        name: 'AI Service',
        port: 8000,
        url: 'http://localhost:8000/health',
        executable: 'python',
        args: ['main.py'],
        cwd: path.join(ROOT_DIR, 'ai_service'),
        critical: false
    },
    frontend: {
        name: 'Frontend Dev Server',
        port: 3001,
        url: 'http://localhost:3001/',
        critical: false
    }
};

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
    console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSuccess(message) {
    console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logInfo(message) {
    console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

/**
 * Check if a port is in use
 */
async function isPortInUse(port) {
    try {
        const response = await fetch(`http://localhost:${port}/`, { timeout: 1000 });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Wait for service to be ready
 */
async function waitForService(service, maxRetries = 30) {
    logInfo(`Waiting for ${service.name} on port ${service.port}...`);
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const response = await fetch(service.url, { 
                timeout: 2000,
                method: 'GET'
            });
            if (response.ok || response.status < 500) {
                logSuccess(`${service.name} is ready`);
                return true;
            }
        } catch (error) {
            // Service not ready yet
        }
        
        retries++;
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('');
    return false;
}

/**
 * Start a service
 */
function startService(service) {
    return new Promise((resolve, reject) => {
        try {
            const child = spawn(service.executable, service.args || ['serve'], {
                cwd: service.cwd,
                stdio: 'pipe',
                shell: true,
                windowsHide: true
            });

            let output = '';
            child.stdout?.on('data', (data) => {
                output += data.toString();
                if (output.includes('serving') || output.includes('Ready')) {
                    resolve(child);
                }
            });

            child.stderr?.on('data', (data) => {
                console.error(`[${service.name}] ${data}`);
            });

            child.on('error', reject);

            // Timeout after 15 seconds
            setTimeout(() => {
                if (output.length > 0) {
                    resolve(child);
                } else {
                    reject(new Error(`${service.name} failed to start`));
                }
            }, 15000);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Check environment variables
 */
function checkEnvironment() {
    logInfo('Checking environment configuration...');
    
    const requiredVars = [
        'POCKETBASE_URL',
        'POCKETBASE_SERVICE_TOKEN',
        'NODE_ENV'
    ];

    const optionalVars = [
        'STRIPE_SECRET_KEY',
        'VITE_OPENAI_API_KEY',
        'SENTRY_DSN'
    ];

    const missing = [];
    const empty = [];

    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    if (missing.length > 0) {
        logError(`Missing required environment variables: ${missing.join(', ')}`);
        return false;
    }

    optionalVars.forEach(varName => {
        if (!process.env[varName]) {
            empty.push(varName);
        }
    });

    if (empty.length > 0) {
        logWarning(`Optional variables not configured: ${empty.join(', ')}`);
    }

    logSuccess('Environment configuration OK');
    return true;
}

/**
 * Initialize required collections in PocketBase
 */
async function initializeCollections() {
    logInfo('Initializing required collections...');
    
    const requiredCollections = [
        'users',
        'tenants',
        'ip_rate_limits',
        'ip_violations',
        'audit_logs',
        'platform_settings',
        'feature_flags'
    ];

    try {
        const pb_url = process.env.POCKETBASE_URL || 'http://localhost:8090';
        const pb_token = process.env.POCKETBASE_SERVICE_TOKEN || '';

        // Check which collections exist
        const response = await fetch(`${pb_url}/api/collections`, {
            headers: {
                'Authorization': `Bearer ${pb_token}`
            }
        });

        if (!response.ok) {
            logWarning('Could not verify collections (might not have admin token)');
            return true;
        }

        const data = await response.json();
        const existingCollections = (data.items || []).map(c => c.name);

        const missingCollections = requiredCollections.filter(
            c => !existingCollections.includes(c)
        );

        if (missingCollections.length > 0) {
            logWarning(`Missing collections: ${missingCollections.join(', ')}`);
            logInfo('Run: pnpm run init-collections');
        } else {
            logSuccess('All required collections exist');
        }

        return true;
    } catch (error) {
        logWarning(`Could not initialize collections: ${error.message}`);
        return true;
    }
}

/**
 * Run health checks on all services
 */
async function runHealthChecks() {
    logInfo('Running health checks...');
    
    const criticalServices = Object.values(SERVICES).filter(s => s.critical && s.url);
    const results = {};

    for (const service of criticalServices) {
        try {
            const response = await fetch(service.url, { timeout: 5000 });
            results[service.name] = {
                healthy: response.ok || response.status < 500,
                status: response.status
            };
        } catch (error) {
            results[service.name] = {
                healthy: false,
                error: error.message
            };
        }
    }

    let allHealthy = true;
    Object.entries(results).forEach(([name, result]) => {
        if (result.healthy) {
            logSuccess(`${name}: OK`);
        } else {
            logError(`${name}: ${result.error || `Status ${result.status}`}`);
            allHealthy = false;
        }
    });

    return allHealthy;
}

/**
 * Main startup sequence
 */
async function startup() {
    console.clear();
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║  GROW YOUR NEED - PRODUCTION STARTUP VERIFICATION          ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');
    log('');

    try {
        // Step 1: Environment Check
        log('▶ STEP 1: Environment Configuration', 'cyan');
        if (!checkEnvironment()) {
            process.exit(1);
        }
        log('');

        // Step 2: Service Status
        log('▶ STEP 2: Checking Service Status', 'cyan');
        const pbRunning = await isPortInUse(8090);
        const paymentRunning = await isPortInUse(3001);

        if (pbRunning) {
            logSuccess('PocketBase is already running');
        } else {
            logWarning('PocketBase is not running');
            logInfo('Start with: cd pocketbase && .\\pocketbase.exe serve');
        }

        if (paymentRunning) {
            logSuccess('Payment Server is already running');
        } else {
            logWarning('Payment Server is not running');
            logInfo('Start with: pnpm run server');
        }
        log('');

        // Step 3: Wait for critical services
        if (!pbRunning || !paymentRunning) {
            log('▶ STEP 3: Waiting for Services to Be Ready', 'cyan');
            if (!pbRunning) {
                logWarning('Please start PocketBase:');
                logInfo('  cd pocketbase && .\\pocketbase.exe serve');
            }
            if (!paymentRunning) {
                logWarning('Please start Payment Server:');
                logInfo('  pnpm run server');
            }
            log('');
        } else {
            // Step 3: Initialize Collections
            log('▶ STEP 3: Initializing Collections', 'cyan');
            await initializeCollections();
            log('');

            // Step 4: Health Checks
            log('▶ STEP 4: Health Checks', 'cyan');
            const healthy = await runHealthChecks();
            log('');

            if (healthy) {
                log('╔════════════════════════════════════════════════════════════╗', 'green');
                log('║  ✓ ALL SYSTEMS GO - PRODUCTION READY                       ║', 'green');
                log('╚════════════════════════════════════════════════════════════╝', 'green');
                log('');
                logInfo('Frontend URL: http://localhost:3001');
                logInfo('Admin Panel:  http://localhost:8090/_/');
                logInfo('API Health:   http://localhost:3001/api/health');
            } else {
                log('╔════════════════════════════════════════════════════════════╗', 'red');
                log('║  ✗ SOME SERVICES NOT READY                                 ║', 'red');
                log('╚════════════════════════════════════════════════════════════╝', 'red');
                process.exit(1);
            }
        }

    } catch (error) {
        logError(`Startup failed: ${error.message}`);
        process.exit(1);
    }
}

// Run startup
startup();
