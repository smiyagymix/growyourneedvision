import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
    try {
        console.log('Authenticating...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);

        // 1. Fix 'finance_transactions' schema
        console.log('Fixing finance_transactions schema...');
        try {
            try {
                const col = await pb.collections.getOne('finance_transactions');
                await pb.collections.delete(col.id);
                console.log('Deleted existing finance_transactions collection.');
            } catch (e) {
                // Ignore if not found
            }
            
            // Create new collection
            await pb.collections.create({
                name: 'finance_transactions',
                type: 'base',
                listRule: "",
                viewRule: "",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''",
                fields: [
                    { name: 'type', type: 'text', required: true },
                    { name: 'amount', type: 'number', required: true },
                    { name: 'category', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'date', type: 'date', required: true },
                    { name: 'status', type: 'text', required: true }
                ]
            });
            console.log('Created finance_transactions collection.');

            // Seed new data
            const transactions = [
                { type: 'income', amount: 5000, category: 'Tuition', description: 'Student Fees - Grade 10', date: '2023-10-25 10:00:00', status: 'completed' },
                { type: 'expense', amount: 1200, category: 'Payroll', description: 'Teacher Salaries', date: '2023-10-24 10:00:00', status: 'completed' },
                { type: 'income', amount: 300, category: 'Donation', description: 'Alumni Donation', date: '2023-10-23 10:00:00', status: 'completed' },
            ];

            for (const t of transactions) {
                await pb.collection('finance_transactions').create(t);
            }
            console.log(`Seeded ${transactions.length} transactions.`);

        } catch (e) {
            console.error('Error processing finance_transactions:', e);
        }

        // 2. Fix 'classes' schema
        console.log('Fixing classes schema...');
        try {
            const col = await pb.collections.getOne('classes');
            
            const fields = [
                { name: 'name', type: 'text', required: true },
                { name: 'code', type: 'text', required: true },
                { name: 'room', type: 'text', required: true },
                { name: 'schedule', type: 'text', required: true }
            ];

            const newFields = [
                ...col.fields.filter(f => f.system),
                ...fields
            ];

             // Remove duplicates
            const uniqueFields = [];
            const seen = new Set();
            for (const f of newFields) {
                if (!seen.has(f.name)) {
                    uniqueFields.push(f);
                    seen.add(f.name);
                }
            }

            await pb.collections.update(col.id, { fields: uniqueFields });
            console.log('Schema updated for classes');

            // Delete existing
            const records = await pb.collection('classes').getFullList();
            for (const r of records) {
                await pb.collection('classes').delete(r.id);
            }
            console.log(`Deleted ${records.length} empty records.`);

            // Seed
            const classes = [
                { name: 'Mathematics 101', code: 'MATH101', room: 'Room 301', schedule: 'Mon/Wed 10:00 AM' },
                { name: 'Physics 202', code: 'PHYS202', room: 'Lab 2', schedule: 'Tue/Thu 02:00 PM' },
                { name: 'History 101', code: 'HIST101', room: 'Room 105', schedule: 'Fri 09:00 AM' },
            ];

            for (const c of classes) {
                await pb.collection('classes').create(c);
            }
            console.log(`Seeded ${classes.length} classes.`);

        } catch (e) {
            console.error('Error processing classes:', e);
        }

        // 3. Fix 'activities' schema and seed
        console.log('Fixing activities schema...');
        try {
            try {
                const col = await pb.collections.getOne('activities');
                await pb.collections.delete(col.id);
                console.log('Deleted existing activities collection.');
            } catch (e) {
                // Ignore
            }

            await pb.collections.create({
                name: 'activities',
                type: 'base',
                listRule: "",
                viewRule: "",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''",
                fields: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'date', type: 'date', required: true },
                    { name: 'time_range', type: 'text', required: true },
                    { name: 'category', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'attendees_count', type: 'number', required: true }
                ]
            });
            console.log('Created activities collection.');

            const activities = [
                {
                    title: 'Community Garden Planting',
                    date: '2023-11-15 09:00:00',
                    time_range: '9:00 AM - 12:00 PM',
                    category: 'Outdoor',
                    description: 'Join us for a morning of planting and gardening in the community garden.',
                    attendees_count: 12
                },
                {
                    title: 'Jazz Night',
                    date: '2023-11-18 19:00:00',
                    time_range: '7:00 PM - 10:00 PM',
                    category: 'Music',
                    description: 'Live jazz music at the town square.',
                    attendees_count: 45
                }
            ];

            for (const a of activities) {
                await pb.collection('activities').create(a);
            }
            console.log(`Seeded ${activities.length} activities.`);

        } catch (e) {
            console.error('Error processing activities:', e);
        }

        // 4. Fix 'wellness_logs' schema and seed
        console.log('Fixing wellness_logs schema...');
        try {
            try {
                const col = await pb.collections.getOne('wellness_logs');
                await pb.collections.delete(col.id);
                console.log('Deleted existing wellness_logs collection.');
            } catch (e) {
                // Ignore
            }

            await pb.collections.create({
                name: 'wellness_logs',
                type: 'base',
                listRule: "",
                viewRule: "",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''",
                fields: [
                    { name: 'date', type: 'date', required: true },
                    { name: 'steps', type: 'number', required: true },
                    { name: 'calories', type: 'number', required: true },
                    { name: 'sleep_minutes', type: 'number', required: true },
                    { name: 'mood', type: 'text', required: true }
                ]
            });
            console.log('Created wellness_logs collection.');

            const logs = [
                {
                    date: new Date().toISOString(), // Today
                    steps: 8500,
                    calories: 450,
                    sleep_minutes: 450, // 7h 30m
                    mood: 'Happy'
                },
                {
                    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                    steps: 7200,
                    calories: 380,
                    sleep_minutes: 420,
                    mood: 'Normal'
                }
            ];

            for (const l of logs) {
                await pb.collection('wellness_logs').create(l);
            }
            console.log(`Seeded ${logs.length} wellness logs.`);

        } catch (e) {
            console.error('Error processing wellness_logs:', e);
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

main();
