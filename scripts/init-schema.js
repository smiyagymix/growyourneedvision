import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.PB_ADMIN_PASS || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
    try {
        console.log(`Attempting to authenticate as ${ADMIN_EMAIL}...`);
        await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
        console.log('Authentication successful!');

        // 1. Check/Create 'messages' collection
        try {
            await pb.collections.getFirstListItem('name="messages"');
            console.log('Collection "messages" already exists.');
        } catch {
            console.log('Creating "messages" collection...');
            await pb.collections.create({
                name: 'messages',
                type: 'base',
                schema: [
                    { name: 'sender', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } },
                    { name: 'recipient', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } },
                    { name: 'subject', type: 'text' },
                    { name: 'content', type: 'editor' },
                    { name: 'isRead', type: 'bool' },
                    { name: 'folder', type: 'select', options: { values: ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'] } }
                ]
            });
        }

        // 2. Check/Create 'wellness_logs' collection
        try {
            await pb.collections.getFirstListItem('name="wellness_logs"');
            console.log('Collection "wellness_logs" already exists.');
        } catch {
            console.log('Creating "wellness_logs" collection...');
            await pb.collections.create({
                name: 'wellness_logs',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: true, maxSelect: 1 } },
                    { name: 'date', type: 'date' },
                    { name: 'steps', type: 'number' },
                    { name: 'calories', type: 'number' },
                    { name: 'sleep_minutes', type: 'number' },
                    { name: 'mood', type: 'text' }
                ]
            });
        }

        // 3. Check/Create 'classes' collection
        try {
            await pb.collections.getFirstListItem('name="classes"');
            console.log('Collection "classes" already exists.');
        } catch {
            console.log('Creating "classes" collection...');
            await pb.collections.create({
                name: 'classes',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text' },
                    { name: 'code', type: 'text' },
                    { name: 'teacher', type: 'relation', options: { collectionId: 'users', cascadeDelete: false, maxSelect: 1 } },
                    { name: 'schedule', type: 'text' },
                    { name: 'room', type: 'text' }
                ]
            });
        }

        // 4. Check/Create 'finance_transactions' collection
        try {
            await pb.collections.getFirstListItem('name="finance_transactions"');
            console.log('Collection "finance_transactions" already exists.');
        } catch {
            console.log('Creating "finance_transactions" collection...');
            await pb.collections.create({
                name: 'finance_transactions',
                type: 'base',
                schema: [
                    { name: 'type', type: 'select', options: { values: ['income', 'expense'] } },
                    { name: 'amount', type: 'number' },
                    { name: 'category', type: 'text' },
                    { name: 'description', type: 'text' },
                    { name: 'date', type: 'date' },
                    { name: 'status', type: 'select', options: { values: ['pending', 'completed', 'failed'] } }
                ]
            });
        }

        // 5. Check/Create 'activities' collection
        try {
            await pb.collections.getFirstListItem('name="activities"');
            console.log('Collection "activities" already exists.');
        } catch {
            console.log('Creating "activities" collection...');
            await pb.collections.create({
                name: 'activities',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text' },
                    { name: 'date', type: 'date' },
                    { name: 'time_range', type: 'text' },
                    { name: 'category', type: 'select', options: { values: ['Outdoor', 'Music', 'Food', 'Learning', 'Sports'] } },
                    { name: 'description', type: 'text' },
                    { name: 'attendees_count', type: 'number' }
                ]
            });
        }

        console.log('Schema initialization complete!');
        
    } catch (err) {
        console.error('Error initializing schema:', err.originalError || err.message);
        console.log('Make sure PocketBase is running and you have created an admin account.');
    }
}

main();
