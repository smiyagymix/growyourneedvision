import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initHobbiesSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Hobby Projects
        try {
            await pb.collections.create({
                name: 'hobby_projects',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users' } },
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'editor', required: false },
                    { name: 'category', type: 'select', required: true, options: { values: ['Arts & Crafts', 'Collections', 'Gaming', 'Music', 'Sports', 'Technology', 'Other'] } },
                    { name: 'difficulty', type: 'select', required: true, options: { values: ['Beginner', 'Intermediate', 'Advanced'] } },
                    { name: 'progress', type: 'number', required: false },
                    { name: 'start_date', type: 'date', required: true },
                    { name: 'target_completion', type: 'date', required: false },
                    { name: 'time_spent', type: 'number', required: false },
                    { name: 'image_url', type: 'url', required: false },
                    { name: 'status', type: 'select', required: true, options: { values: ['Planning', 'In Progress', 'Completed', 'On Hold'] } },
                    { name: 'tags', type: 'json', required: false }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created hobby_projects collection');
        } catch (e) {
            console.log('hobby_projects collection might already exist');
        }

        // 2. Hobby Resources
        try {
            await pb.collections.create({
                name: 'hobby_resources',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'text', required: false },
                    { name: 'category', type: 'text', required: true },
                    { name: 'resource_type', type: 'select', required: true, options: { values: ['Tutorial', 'Tool', 'Article', 'Video', 'Community'] } },
                    { name: 'url', type: 'url', required: false },
                    { name: 'rating', type: 'number', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created hobby_resources collection');
        } catch (e) {
            console.log('hobby_resources collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init hobbies schema:', error);
    }
}

initHobbiesSchema();
