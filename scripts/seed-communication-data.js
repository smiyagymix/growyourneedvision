import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function seedCommunicationData() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // Get admin user ID
        const admin = await pb.collection('users').getFirstListItem('email=process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL').catch(() => null);
        const userId = admin ? admin.id : (await pb.collection('users').getList(1, 1)).items[0]?.id;

        if (!userId) {
            console.error('No user found to assign as author');
            return;
        }

        // 1. Seed Social Posts
        const socialPosts = [
            { platform: 'Twitter', content: 'Excited to announce our new feature! #SaaS #Growth', scheduled_for: new Date(Date.now() + 86400000).toISOString(), status: 'Scheduled', likes: 0, comments: 0, shares: 0 },
            { platform: 'LinkedIn', content: 'We are hiring! Check out our careers page.', scheduled_for: new Date().toISOString(), status: 'Published', likes: 45, comments: 12, shares: 5 },
            { platform: 'Instagram', content: 'Behind the scenes at our office.', scheduled_for: new Date().toISOString(), status: 'Draft', likes: 0, comments: 0, shares: 0 }
        ];

        for (const post of socialPosts) {
            try {
                await pb.collection('social_posts').create(post);
                console.log(`Created social post for ${post.platform}`);
            } catch (e) {
                console.log(`Failed to create social post: ${e.message}`);
            }
        }

        // 2. Seed Community Posts
        const communityPosts = [
            { title: 'Best practices for using the API', content: 'Here are some tips...', author: userId, likes: 15, tags: ['API', 'Dev'] },
            { title: 'Feature Request: Dark Mode', content: 'It would be great to have...', author: userId, likes: 42, tags: ['Feature', 'UI'] },
            { title: 'Welcome to the community!', content: 'Introduce yourself here.', author: userId, likes: 100, tags: ['General'] }
        ];

        for (const post of communityPosts) {
            try {
                await pb.collection('community_posts').create(post);
                console.log(`Created community post: ${post.title}`);
            } catch (e) {
                console.log(`Failed to create community post: ${e.message}`);
            }
        }

        // 3. Seed Notifications
        const notifications = [
            { user: userId, title: 'Welcome', message: 'Welcome to the platform!', type: 'info', is_read: false },
            { user: userId, title: 'Payment Success', message: 'Your subscription has been renewed.', type: 'success', is_read: false },
            { user: userId, title: 'System Update', message: 'Maintenance scheduled for tonight.', type: 'warning', is_read: false }
        ];

        for (const notif of notifications) {
            try {
                await pb.collection('notifications').create(notif);
                console.log(`Created notification: ${notif.title}`);
            } catch (e) {
                console.log(`Failed to create notification: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('Failed to seed communication data:', error);
    }
}

seedCommunicationData();
