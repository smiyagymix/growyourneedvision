import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function initReligionSchema() {
    try {
        const adminAuth = await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, '1234567890');
        console.log('Authenticated as admin');

        // 1. Prayer Times Collection
        try {
            await pb.collections.create({
                name: 'prayer_times',
                type: 'base',
                schema: [
                    { name: 'date', type: 'date', required: true },
                    { name: 'fajr', type: 'text', required: true },
                    { name: 'dhuhr', type: 'text', required: true },
                    { name: 'asr', type: 'text', required: true },
                    { name: 'maghrib', type: 'text', required: true },
                    { name: 'isha', type: 'text', required: true },
                    { name: 'location', type: 'text', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created prayer_times collection');
        } catch (e) {
            console.log('prayer_times collection might already exist');
        }

        // 2. Religious Events Collection
        try {
            await pb.collections.create({
                name: 'religious_events',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'editor', required: false },
                    { name: 'event_type', type: 'select', options: { values: ['Prayer', 'Holiday', 'Sermon', 'Study Circle', 'Community'] }, required: true },
                    { name: 'date', type: 'date', required: true },
                    { name: 'time', type: 'text', required: false },
                    { name: 'location', type: 'text', required: false },
                    { name: 'organizer', type: 'text', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created religious_events collection');
        } catch (e) {
            console.log('religious_events collection might already exist');
        }

        // 3. Quran Verses Collection
        try {
            await pb.collections.create({
                name: 'quran_verses',
                type: 'base',
                schema: [
                    { name: 'surah_number', type: 'number', required: true },
                    { name: 'surah_name', type: 'text', required: true },
                    { name: 'verse_number', type: 'number', required: true },
                    { name: 'arabic_text', type: 'text', required: true },
                    { name: 'translation', type: 'text', required: true },
                    { name: 'transliteration', type: 'text', required: false },
                    { name: 'interpretation', type: 'editor', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created quran_verses collection');
        } catch (e) {
            console.log('quran_verses collection might already exist');
        }

        // 4. Religious Resources Collection
        try {
            await pb.collections.create({
                name: 'religious_resources',
                type: 'base',
                schema: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'description', type: 'text', required: false },
                    { name: 'category', type: 'select', options: { values: ['Quran', 'Hadith', 'Article', 'Lecture', 'Book'] }, required: true },
                    { name: 'content', type: 'editor', required: false },
                    { name: 'url', type: 'url', required: false },
                    { name: 'author', type: 'text', required: false },
                    { name: 'tags', type: 'json', required: false }
                ],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
            });
            console.log('Created religious_resources collection');
        } catch (e) {
            console.log('religious_resources collection might already exist');
        }

    } catch (error) {
        console.error('Error initializing schema:', error);
    }
}

initReligionSchema();
