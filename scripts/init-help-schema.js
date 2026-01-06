import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initHelpSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Help FAQs
        try {
            await pb.collections.create({
                name: 'help_faqs',
                type: 'base',
                schema: [
                    { name: 'category', type: 'select', required: true, options: { values: ['Account', 'Billing', 'Technical', 'Features', 'General'] } },
                    { name: 'question', type: 'text', required: true },
                    { name: 'answer', type: 'editor', required: true },
                    { name: 'views', type: 'number', required: false },
                    { name: 'helpful_count', type: 'number', required: false },
                    { name: 'order', type: 'number', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created help_faqs collection');
        } catch (e) {
            console.log('help_faqs collection might already exist');
        }

        // 2. Support Tickets
        try {
            await pb.collections.create({
                name: 'support_tickets',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'subject', type: 'text', required: true },
                    { name: 'description', type: 'editor', required: true },
                    { name: 'category', type: 'select', required: true, options: { values: ['Technical', 'Billing', 'Feature Request', 'Bug Report', 'Other'] } },
                    { name: 'priority', type: 'select', required: true, options: { values: ['Low', 'Medium', 'High', 'Urgent'] } },
                    { name: 'status', type: 'select', required: true, options: { values: ['Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'] } },
                    { name: 'assigned_to', type: 'relation', required: false, options: { collectionId: 'users' } },
                    { name: 'attachments', type: 'file', required: false, options: { maxSelect: 5 } }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created support_tickets collection');
        } catch (e) {
            console.log('support_tickets collection might already exist');
        }

        // 3. Ticket Replies
        try {
            await pb.collections.create({
                name: 'ticket_replies',
                type: 'base',
                schema: [
                    { name: 'ticket', type: 'relation', required: true, options: { collectionId: 'support_tickets' } },
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'message', type: 'editor', required: true },
                    { name: 'is_staff', type: 'bool', required: false }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created ticket_replies collection');
        } catch (e) {
            console.log('ticket_replies collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init help schema:', error);
    }
}

initHelpSchema();
