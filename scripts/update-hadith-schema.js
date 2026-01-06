import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function updateHadithSchema() {
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Authenticated as admin');

        // Hadiths Collection
        try {
            await pb.collections.create({
                name: 'hadiths',
                type: 'base',
                schema: [
                    { name: 'collection', type: 'text', required: true }, // e.g., Bukhari, Muslim
                    { name: 'book_number', type: 'number', required: false },
                    { name: 'hadith_number', type: 'number', required: false },
                    { name: 'text_en', type: 'editor', required: true },
                    { name: 'text_ar', type: 'editor', required: false }, // Some APIs might not have Arabic easily mapped
                    { name: 'chapter', type: 'text', required: false },
                    { name: 'tags', type: 'json', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('✅ Created hadiths collection');
        } catch (e) {
            console.log('ℹ️ hadiths collection might already exist');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

updateHadithSchema();
