import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://localhost:8090');

async function createBackup() {
    const email = process.env.POCKETBASE_ADMIN_EMAIL;
    const password = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('Error: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env');
        process.exit(1);
    }

    try {
        await pb.admins.authWithPassword(email, password);
        console.log('Authenticated as admin.');

        const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
        console.log(`Creating backup: ${backupName}...`);
        
        await pb.backups.create(backupName);
        console.log('Backup created successfully.');
        
    } catch (error) {
        console.error('Failed to create backup:', error);
        process.exit(1);
    }
}

createBackup();
