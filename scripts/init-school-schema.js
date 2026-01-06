import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function initSchema() {
    try {
        console.log('Authenticating as admin...');
        await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
        console.log('Authenticated!');

        const collections = [
            {
                name: 'classes',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'code', type: 'text', required: true },
                    { name: 'teacher', type: 'relation', collectionId: 'users', maxSelect: 1 },
                    { name: 'room', type: 'text' },
                    { name: 'schedule', type: 'text' }, // JSON string
                    { name: 'academic_year', type: 'text' }
                ]
            },
            {
                name: 'subjects',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'code', type: 'text', required: true },
                    { name: 'description', type: 'text' },
                    { name: 'credits', type: 'number' }
                ]
            },
            {
                name: 'exams',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'subject', type: 'relation', collectionId: 'subjects', maxSelect: 1 },
                    { name: 'class', type: 'relation', collectionId: 'classes', maxSelect: 1 },
                    { name: 'date', type: 'date' },
                    { name: 'total_marks', type: 'number' }
                ]
            },
            {
                name: 'exam_results',
                type: 'base',
                schema: [
                    { name: 'exam', type: 'relation', collectionId: 'exams', maxSelect: 1 },
                    { name: 'student', type: 'relation', collectionId: 'users', maxSelect: 1 },
                    { name: 'marks_obtained', type: 'number' },
                    { name: 'grade', type: 'text' }
                ]
            },
            {
                name: 'attendance',
                type: 'base',
                schema: [
                    { name: 'class', type: 'relation', collectionId: 'classes', maxSelect: 1 },
                    { name: 'student', type: 'relation', collectionId: 'users', maxSelect: 1 },
                    { name: 'date', type: 'date' },
                    { name: 'status', type: 'select', options: ['Present', 'Absent', 'Late', 'Excused'] }
                ]
            },
            {
                name: 'fees',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'amount', type: 'number', required: true },
                    { name: 'frequency', type: 'select', options: ['One-time', 'Monthly', 'Yearly'] },
                    { name: 'due_day', type: 'number' }
                ]
            },
            {
                name: 'invoices',
                type: 'base',
                schema: [
                    { name: 'student', type: 'relation', collectionId: 'users', maxSelect: 1 },
                    { name: 'fee', type: 'relation', collectionId: 'fees', maxSelect: 1 },
                    { name: 'amount', type: 'number' },
                    { name: 'due_date', type: 'date' },
                    { name: 'status', type: 'select', options: ['Paid', 'Pending', 'Overdue'] },
                    { name: 'paid_date', type: 'date' }
                ]
            },
            {
                name: 'enrollments',
                type: 'base',
                schema: [
                    { name: 'student', type: 'relation', collectionId: 'users', maxSelect: 1 },
                    { name: 'class', type: 'relation', collectionId: 'classes', maxSelect: 1 },
                    { name: 'enrolled_at', type: 'date' }
                ]
            },
            {
                name: 'crm_inquiries',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'email', type: 'email' },
                    { name: 'phone', type: 'text' },
                    { name: 'grade_interest', type: 'text' },
                    { name: 'status', type: 'select', options: ['New Inquiry', 'Contacted', 'Interview Scheduled', 'Offer Sent', 'Enrolled', 'Rejected'] },
                    { name: 'source', type: 'text' },
                    { name: 'notes', type: 'text' }
                ]
            },
            {
                name: 'crm_interactions',
                type: 'base',
                schema: [
                    { name: 'inquiry', type: 'relation', collectionId: 'crm_inquiries', maxSelect: 1 },
                    { name: 'student', type: 'relation', collectionId: 'users', maxSelect: 1 },
                    { name: 'type', type: 'select', options: ['Call', 'Email', 'Meeting', 'Note'] },
                    { name: 'summary', type: 'text', required: true },
                    { name: 'details', type: 'text' },
                    { name: 'date', type: 'date' },
                    { name: 'logged_by', type: 'relation', collectionId: 'users', maxSelect: 1 }
                ]
            },
            {
                name: 'parent_student_links',
                type: 'base',
                schema: [
                    { name: 'parent', type: 'relation', collectionId: 'users', maxSelect: 1, required: true },
                    { name: 'student', type: 'relation', collectionId: 'users', maxSelect: 1, required: true },
                    { name: 'relationship', type: 'text', required: true } // e.g. Father, Mother, Guardian
                ]
            },
            {
                name: 'services',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'description', type: 'text' },
                    { name: 'price', type: 'number', required: true },
                    { name: 'duration_minutes', type: 'number' },
                    { name: 'category', type: 'select', options: ['Transport', 'Canteen', 'Extra Class', 'Health'] }
                ]
            },
            {
                name: 'bookings',
                type: 'base',
                schema: [
                    { name: 'service', type: 'relation', collectionId: 'services', maxSelect: 1, required: true },
                    { name: 'parent', type: 'relation', collectionId: 'users', maxSelect: 1, required: true },
                    { name: 'student', type: 'relation', collectionId: 'users', maxSelect: 1 },
                    { name: 'date', type: 'date', required: true },
                    { name: 'status', type: 'select', options: ['Pending', 'Confirmed', 'Cancelled', 'Completed'] },
                    { name: 'notes', type: 'text' }
                ]
            }
        ];

        for (const col of collections) {
            try {
                await pb.collections.create(col);
                console.log(`Created collection: ${col.name}`);
            } catch (e) {
                console.log(`Collection ${col.name} might already exist or error: ${e.message}`);
            }
        }

        console.log('Schema initialization complete!');
    } catch (e) {
        console.error('Failed to init schema:', e);
    }
}

initSchema();
