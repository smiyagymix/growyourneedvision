import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initWellnessToolsSchema() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('Authenticated as admin');

        // 1. Wellness Logs
        try {
            await pb.collections.create({
                name: 'wellness_logs',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
                    { name: 'date', type: 'date', required: true },
                    { name: 'steps', type: 'number', required: false },
                    { name: 'calories', type: 'number', required: false },
                    { name: 'sleep_minutes', type: 'number', required: false },
                    { name: 'mood', type: 'select', required: false, options: { values: ['Happy', 'Neutral', 'Sad', 'Stressed', 'Energetic'] } },
                    { name: 'meals', type: 'json', required: false }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id',
            });
            console.log('Created wellness_logs collection');
        } catch (e) {
            console.log('wellness_logs collection might already exist');
        }

        // 2. Notes
        try {
            await pb.collections.create({
                name: 'notes',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
                    { name: 'title', type: 'text', required: true },
                    { name: 'content', type: 'editor', required: false },
                    { name: 'tags', type: 'json', required: false },
                    { name: 'is_pinned', type: 'bool', required: false }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id',
            });
            console.log('Created notes collection');
        } catch (e) {
            console.log('notes collection might already exist');
        }

        // 3. Flashcards
        try {
            await pb.collections.create({
                name: 'flashcards',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
                    { name: 'deck_name', type: 'text', required: true },
                    { name: 'front', type: 'text', required: true },
                    { name: 'back', type: 'text', required: true },
                    { name: 'difficulty', type: 'select', required: false, options: { values: ['Easy', 'Medium', 'Hard'] } },
                    { name: 'last_reviewed', type: 'date', required: false }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id',
            });
            console.log('Created flashcards collection');
        } catch (e) {
            console.log('flashcards collection might already exist');
        }

        // 4. Tasks
        try {
            await pb.collections.create({
                name: 'tasks',
                type: 'base',
                schema: [
                    { name: 'user', type: 'relation', required: true, options: { collectionId: 'users', cascadeDelete: false } },
                    { name: 'content', type: 'text', required: true },
                    { name: 'completed', type: 'bool', required: false },
                    { name: 'due_date', type: 'date', required: false },
                    { name: 'priority', type: 'select', required: false, options: { values: ['Low', 'Medium', 'High'] } }
                ],
                listRule: '@request.auth.id = user.id',
                viewRule: '@request.auth.id = user.id',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = user.id',
                deleteRule: '@request.auth.id = user.id',
            });
            console.log('Created tasks collection');
        } catch (e) {
            console.log('tasks collection might already exist');
        }

    } catch (error) {
        console.error('Failed to init wellness & tools schema:', error);
    }
}

initWellnessToolsSchema();
