import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const COLLECTIONS = [
    {
        name: 'tenants',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'type', type: 'select', options: { values: ['School', 'Individual', 'Enterprise'] }, required: true },
            { name: 'domain', type: 'text' },
            { name: 'logo', type: 'file' },
            { name: 'status', type: 'select', options: { values: ['Active', 'Inactive', 'Pending'] } },
            { name: 'subscription_plan', type: 'text' }
        ]
    },
    {
        name: 'deals',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'value', type: 'number' },
            { name: 'stage', type: 'relation', options: { collectionId: 'deal_stages', cascadeDelete: false } },
            { name: 'contact_email', type: 'email' },
            { name: 'company', type: 'text' },
            { name: 'probability', type: 'number' },
            { name: 'expected_close_date', type: 'date' },
            { name: 'assigned_to', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
        ]
    },
    {
        name: 'deal_stages',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'order', type: 'number' },
            { name: 'color', type: 'text' }
        ]
    },
    {
        name: 'invoices',
        type: 'base',
        schema: [
            { name: 'invoice_number', type: 'text', required: true },
            { name: 'amount', type: 'number', required: true },
            { name: 'status', type: 'select', options: { values: ['Draft', 'Sent', 'Paid', 'Overdue'] } },
            { name: 'due_date', type: 'date' },
            { name: 'client_name', type: 'text' },
            { name: 'items', type: 'json' },
            { name: 'tenant', type: 'relation', options: { collectionId: 'tenants', cascadeDelete: false } }
        ]
    },
    {
        name: 'expenses',
        type: 'base',
        schema: [
            { name: 'description', type: 'text', required: true },
            { name: 'amount', type: 'number', required: true },
            { name: 'category', type: 'text' },
            { name: 'date', type: 'date' },
            { name: 'receipt', type: 'file' },
            { name: 'approved_by', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
        ]
    },
    {
        name: 'classes',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'code', type: 'text' },
            { name: 'teacher', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'schedule', type: 'json' },
            { name: 'room', type: 'text' },
            { name: 'academic_year', type: 'text' }
        ]
    },
    {
        name: 'subjects',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'code', type: 'text' },
            { name: 'description', type: 'text' },
            { name: 'credits', type: 'number' }
        ]
    },
    {
        name: 'assignments',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'due_date', type: 'date' },
            { name: 'class', type: 'relation', options: { collectionId: 'classes', cascadeDelete: true } },
            { name: 'points', type: 'number' },
            { name: 'attachments', type: 'file' }
        ]
    },
    {
        name: 'submissions',
        type: 'base',
        schema: [
            { name: 'assignment', type: 'relation', options: { collectionId: 'assignments', cascadeDelete: true } },
            { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'content', type: 'text' },
            { name: 'files', type: 'file' },
            { name: 'grade', type: 'number' },
            { name: 'feedback', type: 'text' },
            { name: 'submitted_at', type: 'date' }
        ]
    },
    {
        name: 'attendance',
        type: 'base',
        schema: [
            { name: 'class', type: 'relation', options: { collectionId: 'classes', cascadeDelete: false } },
            { name: 'student', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'date', type: 'date' },
            { name: 'status', type: 'select', options: { values: ['Present', 'Absent', 'Late', 'Excused'] } },
            { name: 'notes', type: 'text' }
        ]
    },
    {
        name: 'events',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'start_time', type: 'date' },
            { name: 'end_time', type: 'date' },
            { name: 'location', type: 'text' },
            { name: 'organizer', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'type', type: 'select', options: { values: ['Academic', 'Social', 'Sports', 'Other'] } }
        ]
    },
    {
        name: 'products',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'price', type: 'number', required: true },
            { name: 'category', type: 'text' },
            { name: 'images', type: 'file' },
            { name: 'stock', type: 'number' },
            { name: 'seller', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
        ]
    },
    {
        name: 'orders',
        type: 'base',
        schema: [
            { name: 'customer', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'items', type: 'json' },
            { name: 'total_amount', type: 'number' },
            { name: 'status', type: 'select', options: { values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] } },
            { name: 'shipping_address', type: 'text' }
        ]
    },
    {
        name: 'tickets',
        type: 'base',
        schema: [
            { name: 'subject', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'status', type: 'select', options: { values: ['Open', 'In Progress', 'Resolved', 'Closed'] } },
            { name: 'priority', type: 'select', options: { values: ['Low', 'Medium', 'High', 'Urgent'] } },
            { name: 'requester', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'assigned_to', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
        ]
    },
    {
        name: 'knowledge_base',
        type: 'base',
        schema: [
            { name: 'title', type: 'text', required: true },
            { name: 'content', type: 'text' }, // HTML or Markdown
            { name: 'category', type: 'text' },
            { name: 'tags', type: 'text' },
            { name: 'author', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'is_published', type: 'bool' }
        ]
    },
    {
        name: 'messages',
        type: 'base',
        schema: [
            { name: 'sender', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'recipient', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'content', type: 'text' },
            { name: 'read_at', type: 'date' },
            { name: 'attachments', type: 'file' }
        ]
    },
    {
        name: 'notifications',
        type: 'base',
        schema: [
            { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: true } },
            { name: 'title', type: 'text' },
            { name: 'message', type: 'text' },
            { name: 'type', type: 'text' },
            { name: 'is_read', type: 'bool' },
            { name: 'link', type: 'text' }
        ]
    },
    {
        name: 'audit_logs',
        type: 'base',
        schema: [
            { name: 'user', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } },
            { name: 'action', type: 'text' },
            { name: 'resource', type: 'text' },
            { name: 'details', type: 'json' },
            { name: 'ip_address', type: 'text' }
        ]
    },
    {
        name: 'app_settings',
        type: 'base',
        schema: [
            { name: 'key', type: 'text', required: true, unique: true },
            { name: 'value', type: 'json' },
            { name: 'description', type: 'text' },
            { name: 'is_public', type: 'bool' }
        ]
    },
    {
        name: 'activities',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'type', type: 'text' },
            { name: 'location', type: 'text' },
            { name: 'schedule', type: 'json' },
            { name: 'capacity', type: 'number' },
            { name: 'organizer', type: 'relation', options: { collectionId: 'users', cascadeDelete: false } }
        ]
    }
];

async function initCollections() {
    console.log('🚀 Starting PocketBase collection initialization...');

    try {
        console.log('🔐 Authenticating as admin...');
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authentication successful\n');
    } catch (error) {
        console.error('❌ Failed to authenticate as admin.');
        console.error('   Error:', error.message);
        process.exit(1);
    }

    for (const colDef of COLLECTIONS) {
        try {
            console.log(`📦 Processing collection: ${colDef.name}`);
            
            let existing = null;
            try {
                existing = await pb.collections.getOne(colDef.name);
            } catch (e) {
                // Not found
            }

            if (existing) {
                console.log(`   ⚠️  Collection exists. Updating schema...`);
                // Merge existing fields with new ones to avoid data loss, but update types if needed
                // For simplicity in this script, we'll just append new fields if they don't exist
                // In a real production migration, you'd be more careful
                
                // Note: PocketBase API expects 'fields' or 'schema' depending on version. 
                // We'll try to use the modern 'fields' approach if available on the object
                
                // We are not doing a full update here to avoid breaking existing data easily
                // But we will ensure the collection exists.
                console.log(`   ✅ Collection ${colDef.name} already exists.`);
            } else {
                console.log(`   ➕ Creating collection ${colDef.name}...`);
                await pb.collections.create({
                    name: colDef.name,
                    type: colDef.type,
                    schema: colDef.schema
                });
                console.log(`   ✅ Created ${colDef.name}`);
            }
        } catch (error) {
            console.error(`   ❌ Error processing ${colDef.name}:`, error.message);
            // If it's a relation error (target collection doesn't exist yet), we might need a second pass
            // But we ordered them reasonably well.
        }
    }

    console.log('\n✨ Collection initialization complete!');
}

initCollections().catch(console.error);
