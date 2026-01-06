import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Configuration
const ADMIN_EMAIL = process.argv[2] || 'admin@example.com';
const ADMIN_PASSWORD = process.argv[3] || '1234567890';

// ============================================================================
// MOCK DATA (Extracted from Frontend Services)
// ============================================================================

const MOCK_COURSES = [
    { student: 'RELATION_USER', name: 'Mathematics 101', code: 'MATH101', credits: 3, status: 'active', progress: 85, color: '#4F46E5', schedule: [], data: { schedule: [{ day: 'Mon', time: '09:00', room: '101' }] } },
    { student: 'RELATION_USER', name: 'Physics 202', code: 'PHYS202', credits: 4, status: 'active', progress: 72, color: '#10B981', schedule: [], data: { schedule: [{ day: 'Tue', time: '11:00', room: 'Lab 2' }] } },
    { student: 'RELATION_USER', name: 'History 101', code: 'HIST101', credits: 3, status: 'completed', progress: 100, grade: 92, color: '#F59E0B', schedule: [], data: { schedule: [] } }
];

const MOCK_ASSIGNMENTS = [
    { student: 'RELATION_USER', title: 'Algebra Quiz', type: 'quiz', status: 'pending', max_grade: 100, due_date: new Date(Date.now() + 86400000).toISOString(), priority: 'high', data: { description: 'Chapter 5-6 coverage' } },
    { student: 'RELATION_USER', title: 'Physics Lab Report', type: 'lab', status: 'submitted', max_grade: 50, due_date: new Date(Date.now() - 86400000).toISOString(), priority: 'medium', data: { description: 'Motion experiments' } }
];

const MOCK_CAMPAIGNS = [
    { name: 'Spring Sale Campaign', status: 'Active', budget: 10000, spent: 4500, start_date: '2025-01-01', end_date: '2025-03-31', type: 'Email', performance_score: 85, data: { impressions: 50000, clicks: 2500 } },
    { name: 'Social Media Boost', status: 'Paused', budget: 5000, spent: 3200, start_date: '2025-02-01', end_date: '2025-02-28', type: 'Social', performance_score: 72, data: { impressions: 30000, clicks: 1200 } }
];

const MOCK_SERVICES = [
    { title: 'Tax Consultation', provider_name: 'John Smith, CPA', category: 'Finance', price: 150, rating: 4.9, reviews_count: 127, location: 'New York, NY', availability: 'Available', data: { description: 'Expert tax planning' } },
    { title: 'Legal Consultation', provider_name: 'Sarah Johnson, Esq.', category: 'Legal', price: 200, rating: 4.8, reviews_count: 89, location: 'Los Angeles, CA', availability: 'Available', data: { description: 'Business law expertise' } }
];

const MOCK_APPS = [
    { name: 'Advanced Analytics Dashboard', provider: 'GYN Team', category: 'Analytics', rating: 4.8, installs: 15420, price: 'Free', verified: true, data: { description: 'Real-time insights' } },
    { name: 'AI Content Generator', provider: 'AI Labs', category: 'AI & Automation', rating: 4.6, installs: 8930, price: '$9.99/mo', verified: true, data: { description: 'Generate high-quality content' } }
];

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
    console.log(`Starting Data Seeding...`);
    console.log(`Target: ${pb.baseUrl}`);
    console.log(`User:   ${ADMIN_EMAIL}`);

    try {
        // 1. Authenticate
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated as Admin');

        // 2. Get a valid user to attach records to (for 'student' relation)
        // We'll try to find any user, or create one if none exist.
        let targetUser = null;
        try {
            const users = await pb.collection('users').getList(1, 1);
            if (users.items.length > 0) {
                targetUser = users.items[0];
                console.log(`✅ Using existing user: ${targetUser.email} (${targetUser.id})`);
            } else {
                // Create a test student user
                targetUser = await pb.collection('users').create({
                    email: 'student@example.com',
                    password: 'password123',
                    passwordConfirm: 'password123',
                    name: 'Test Student',
                    role: 'student'
                });
                console.log(`✅ Created test user: ${targetUser.email} (${targetUser.id})`);
            }
        } catch (e) {
            console.error('⚠️ Could not fetch/create user. Some relations might fail.', e.message);
        }

        const userId = targetUser ? targetUser.id : null;

        // 3. Seed Collections

        // --- ACADEMIC ---
        if (userId) {
            await seedCollection('student_courses', MOCK_COURSES.map(c => ({ ...c, student: userId })));
            await seedCollection('student_assignments', MOCK_ASSIGNMENTS.map(a => ({ ...a, student: userId })));
        }

        // --- BUSINESS ---
        await seedCollection('services', MOCK_SERVICES.map(s => ({ ...s, user: userId }))); // Associate with our user as provider for now

        // --- EXPANSION ---
        await seedCollection('campaigns', MOCK_CAMPAIGNS.map(c => ({ ...c, user: userId })));
        await seedCollection('marketplace_apps', MOCK_APPS.map(a => ({ ...a, provider: 'GYN Team' }))); // String provider for now

        console.log('\n✨ Seeding Complete!');

    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
        console.log('Tip: Ensure PocketBase is running (npm run dev:pocketbase) and credentials are correct.');
    }
}

async function seedCollection(collectionName, data) {
    console.log(`\nChanged seeding ${collectionName}...`);
    let successCount = 0;

    // Check if collection has data to avoid duplicates (naive check)
    // Actually, we'll just insert and let duplicates happen for this bootstrap, 
    // or we could check count. Let's check count.
    try {
        const result = await pb.collection(collectionName).getList(1, 1);
        if (result.totalItems > 0) {
            console.log(`  ℹ️  Collection ${collectionName} already has ${result.totalItems} items. Skipping to avoid duplicates.`);
            return;
        }
    } catch (e) {
        console.log(`  ⚠️  Collection ${collectionName} might not exist or verify failed: ${e.message}`);
        return;
    }

    for (const item of data) {
        try {
            await pb.collection(collectionName).create(item);
            process.stdout.write('.');
            successCount++;
        } catch (err) {
            process.stdout.write('x');
            // Detailed error log only if needed
            // console.error(`\n  Failed to create item in ${collectionName}:`, err.data);
        }
    }
    console.log(`\n  ✅ create ${successCount}/${data.length} records.`);
}

main();
