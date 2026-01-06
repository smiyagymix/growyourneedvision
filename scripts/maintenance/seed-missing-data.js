
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedMissing() {
    console.log('Starting seedMissing...');
    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        
        // 1. Notifications
        try {
            const notifs = await pb.collection('notifications').getList(1, 1);
            if (notifs.totalItems === 0) {
                console.log('Seeding notifications...');
                const user = await pb.collection('users').getFirstListItem('role = "Owner"');
                await pb.collection('notifications').create({
                    user: user.id,
                    title: 'Welcome!',
                    message: 'Welcome to the platform.',
                    read: false,
                    type: 'info'
                });
            }
        } catch (e) { console.log('Error seeding notifications:', e.message); }

        // 2. Announcements
        try {
            const ann = await pb.collection('announcements').getList(1, 1);
            if (ann.totalItems === 0) {
                console.log('Seeding announcements...');
                await pb.collection('announcements').create({
                    title: 'System Maintenance',
                    content: 'Maintenance scheduled for Sunday.',
                    type: 'info',
                    priority: 'medium',
                    published: true
                });
            }
        } catch (e) { console.log('Error seeding announcements:', e.message); }

        // 3. Chat Messages
        try {
            const chats = await pb.collection('chat_messages').getList(1, 1);
            if (chats.totalItems === 0) {
                console.log('Seeding chat_messages...');
                const user = await pb.collection('users').getFirstListItem('role = "Owner"');
                await pb.collection('chat_messages').create({
                    user: user.id,
                    role: 'assistant',
                    content: 'Hello! How can I help you today?',
                    context: 'General'
                });
            }
        } catch (e) { console.log('Error seeding chat_messages:', e.message); }

    } catch (e) {
        console.error(e);
    }
}

seedMissing();
