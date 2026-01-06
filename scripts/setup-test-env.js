/**
 * Setup Test Environment
 * 
 * 1. Starts the PocketBase test container via Docker Compose
 * 2. Seeds the database with necessary users and data
 * 3. Prepares the environment for Playwright E2E tests
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const POCKETBASE_TEST_URL = 'http://localhost:8091';

async function setup() {
    console.log('🏗️  Setting up Test Environment...');

    try {
        // 1. Start Docker Container
        console.log('🐳 Starting PocketBase test container...');
        execSync('docker-compose -f docker-compose.test.yml up -d', { stdio: 'inherit', cwd: rootDir });

        // 2. Wait for PocketBase to be ready
        console.log('⏳ Waiting for PocketBase to be ready...');
        let attempts = 0;
        const maxAttempts = 12; // 60 seconds
        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`${POCKETBASE_TEST_URL}/api/health`);
                if (response.ok) break;
            } catch (e) {
                // Ignore and retry
            }
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        if (attempts === maxAttempts) {
            throw new Error('PocketBase test container failed to start in time.');
        }

        console.log('✅ PocketBase is healthy.');

        // 3. Seed Data
        console.log('🌱 Seeding database...');
        process.env.POCKETBASE_URL = POCKETBASE_TEST_URL;

        // Run seed scripts
        execSync('node scripts/maintenance/seed-users-collection.js', { stdio: 'inherit', cwd: rootDir });
        execSync('node scripts/maintenance/seed-all-data.js', { stdio: 'inherit', cwd: rootDir });

        console.log('🚀 Test Environment Setup Complete!');
        console.log(`📡 Backend: ${POCKETBASE_TEST_URL}`);
        console.log('📝 You can now run: npm test:e2e');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setup();
