
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function debug() {
    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated.');

        try {
            const owner = await pb.collection('users').getFirstListItem('role = "Owner"');
            console.log('Owner found:', owner.id);
        } catch (e) {
            console.error('Error finding owner:', e);
        }

        try {
            const msgs = await pb.collection('chat_messages').getList(1, 1);
            console.log('Chat messages collection exists.');
        } catch (e) {
            console.error('Error accessing chat_messages:', e);
        }

    } catch (e) {
        console.error('Fatal:', e);
    }
}

debug();
