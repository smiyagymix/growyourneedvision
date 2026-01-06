import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const COLLECTIONS = [
    {
        name: 'tenants',
        type: 'base',
        fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'type', type: 'select', maxSelect: 1, values: ['School', 'Individual', 'Enterprise'], required: true },
            { name: 'domain', type: 'text' },
            { name: 'logo', type: 'file', maxSelect: 1, maxSize: 5242880 },
            { name: 'status', type: 'select', maxSelect: 1, values: ['Active', 'Inactive', 'Pending'] },
            { name: 'subscription_plan', type: 'text' }
        ]
    },
    {
        name: 'deal_stages',
        type: 'base',
        fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'order', type: 'number' },
            { name: 'color', type: 'text' }
        ]
    },
    {
        name: 'deals',
        type: 'base',
        fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'value', type: 'number' },
            { name: 'stage', type: 'relation', collectionId: 'deal_stages', cascadeDelete: false, maxSelect: 1 },
            { name: 'contact_email', type: 'email' },
            { name: 'company', type: 'text' },
            { name: 'probability', type: 'number' },
            { name: 'expected_close_date', type: 'date' },
            { name: 'assigned_to', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 }
        ]
    },
    {
        name: 'invoices',
        type: 'base',
        fields: [
            { name: 'invoice_number', type: 'text', required: true },
            { name: 'amount', type: 'number', required: true },
            { name: 'status', type: 'select', maxSelect: 1, values: ['Draft', 'Sent', 'Paid', 'Overdue'] },
            { name: 'due_date', type: 'date' },
            { name: 'client_name', type: 'text' },
            { name: 'items', type: 'json' },
            { name: 'tenant', type: 'relation', collectionId: 'tenants', cascadeDelete: false, maxSelect: 1 }
        ]
    },
    {
        name: 'expenses',
        type: 'base',
        fields: [
            { name: 'description', type: 'text', required: true },
            { name: 'amount', type: 'number', required: true },
            { name: 'category', type: 'text' },
            { name: 'date', type: 'date' },
            { name: 'receipt', type: 'file', maxSelect: 1, maxSize: 5242880 },
            { name: 'approved_by', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 }
        ]
    },
    {
        name: 'classes',
        type: 'base',
        fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'code', type: 'text' },
            { name: 'teacher', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'schedule', type: 'json' },
            { name: 'room', type: 'text' },
            { name: 'academic_year', type: 'text' }
        ]
    },
    {
        name: 'subjects',
        type: 'base',
        fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'code', type: 'text' },
            { name: 'description', type: 'text' },
            { name: 'credits', type: 'number' }
        ]
    },
    {
        name: 'assignments',
        type: 'base',
        fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'due_date', type: 'date' },
            { name: 'class', type: 'relation', collectionId: 'classes', cascadeDelete: true, maxSelect: 1 },
            { name: 'points', type: 'number' },
            { name: 'attachments', type: 'file', maxSelect: 5, maxSize: 5242880 }
        ]
    },
    {
        name: 'submissions',
        type: 'base',
        fields: [
            { name: 'assignment', type: 'relation', collectionId: 'assignments', cascadeDelete: true, maxSelect: 1 },
            { name: 'student', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'content', type: 'text' },
            { name: 'files', type: 'file', maxSelect: 5, maxSize: 5242880 },
            { name: 'grade', type: 'number' },
            { name: 'feedback', type: 'text' },
            { name: 'submitted_at', type: 'date' }
        ]
    },
    {
        name: 'attendance',
        type: 'base',
        fields: [
            { name: 'class', type: 'relation', collectionId: 'classes', cascadeDelete: false, maxSelect: 1 },
            { name: 'student', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'date', type: 'date' },
            { name: 'status', type: 'select', maxSelect: 1, values: ['Present', 'Absent', 'Late', 'Excused'] },
            { name: 'notes', type: 'text' }
        ]
    },
    {
        name: 'events',
        type: 'base',
        fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'start_time', type: 'date' },
            { name: 'end_time', type: 'date' },
            { name: 'location', type: 'text' },
            { name: 'organizer', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'type', type: 'select', maxSelect: 1, values: ['Academic', 'Social', 'Sports', 'Other'] }
        ]
    },
    {
        name: 'products',
        type: 'base',
        fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'price', type: 'number', required: true },
            { name: 'category', type: 'text' },
            { name: 'images', type: 'file', maxSelect: 5, maxSize: 5242880 },
            { name: 'stock', type: 'number' },
            { name: 'seller', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 }
        ]
    },
    {
        name: 'orders',
        type: 'base',
        fields: [
            { name: 'customer', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'items', type: 'json' },
            { name: 'total_amount', type: 'number' },
            { name: 'status', type: 'select', maxSelect: 1, values: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] },
            { name: 'shipping_address', type: 'text' }
        ]
    },
    {
        name: 'tickets',
        type: 'base',
        fields: [
            { name: 'subject', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'status', type: 'select', maxSelect: 1, values: ['Open', 'In Progress', 'Resolved', 'Closed'] },
            { name: 'priority', type: 'select', maxSelect: 1, values: ['Low', 'Medium', 'High', 'Urgent'] },
            { name: 'requester', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'assigned_to', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 }
        ]
    },
    {
        name: 'knowledge_base',
        type: 'base',
        fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'content', type: 'text' }, // HTML or Markdown
            { name: 'category', type: 'text' },
            { name: 'tags', type: 'text' },
            { name: 'author', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'is_published', type: 'bool' }
        ]
    },
    {
        name: 'messages',
        type: 'base',
        fields: [
            { name: 'sender', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'recipient', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'content', type: 'text' },
            { name: 'read_at', type: 'date' },
            { name: 'attachments', type: 'file', maxSelect: 5, maxSize: 5242880 }
        ]
    },
    {
        name: 'notifications',
        type: 'base',
        fields: [
            { name: 'user', type: 'relation', collectionId: 'users', cascadeDelete: true, maxSelect: 1 },
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
        fields: [
            { name: 'user', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
            { name: 'action', type: 'text' },
            { name: 'resource', type: 'text' },
            { name: 'details', type: 'json' },
            { name: 'ip_address', type: 'text' }
        ]
    },
    {
        name: 'app_settings',
        type: 'base',
        fields: [
            { name: 'key', type: 'text', required: true, unique: true },
            { name: 'value', type: 'json' },
            { name: 'description', type: 'text' },
            { name: 'is_public', type: 'bool' }
        ]
    },
    {
        name: 'activities',
        type: 'base',
        fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'type', type: 'text' },
            { name: 'location', type: 'text' },
            { name: 'schedule', type: 'json' },
            { name: 'capacity', type: 'number' },
            { name: 'organizer', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 }
        ]
    }
];

async function fixAllCollections() {
    console.log('🚀 Starting PocketBase collection fix (Robust Mode)...');

    try {
        console.log('🔐 Authenticating as admin...');
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authentication successful\n');
    } catch (error) {
        console.error('❌ Failed to authenticate as admin.');
        console.error('   Error:', error.message);
        process.exit(1);
    }

    // 1. Get existing collections map (Name -> ID)
    let collectionIds = {};
    try {
        const existing = await pb.collections.getFullList();
        existing.forEach(c => collectionIds[c.name] = c.id);
    } catch (e) {
        console.log('Error fetching existing collections');
    }

    // 2. Create missing collections (empty schema) to ensure they exist and we have IDs
    for (const colDef of COLLECTIONS) {
        if (!collectionIds[colDef.name]) {
            try {
                console.log(`   ➕ Creating shell for ${colDef.name}...`);
                const col = await pb.collections.create({
                    name: colDef.name,
                    type: colDef.type
                });
                collectionIds[colDef.name] = col.id;
                console.log(`   ✅ Created shell ${colDef.name} (${col.id})`);
            } catch (error) {
                console.error(`   ❌ Error creating shell ${colDef.name}:`, error.message);
            }
        }
    }

    // 3. Update collections with full schema, resolving IDs
    for (const colDef of COLLECTIONS) {
        try {
            console.log(`📦 Updating schema for: ${colDef.name}`);
            
            // Resolve collection IDs in fields
            const resolvedFields = colDef.fields.map(field => {
                if (field.type === 'relation' && field.collectionId) {
                    const targetName = field.collectionId;
                    let targetId = collectionIds[targetName];
                    
                    if (targetId) {
                        return {
                            ...field,
                            collectionId: targetId
                        };
                    } else {
                        console.warn(`      ⚠️  Warning: Could not resolve collection ID for '${targetName}' in ${colDef.name}.${field.name}`);
                        return field;
                    }
                }
                return field;
            });

            if (colDef.name === 'deals') {
                 console.log('Resolved fields for deals:', JSON.stringify(resolvedFields, null, 2));
            }

            const colId = collectionIds[colDef.name];
            if (colId) {
                await pb.collections.update(colId, {
                    fields: resolvedFields
                });
                console.log(`   ✅ Updated schema for ${colDef.name}`);
            } else {
                console.error(`   ❌ Could not find ID for ${colDef.name}`);
            }
            
        } catch (error) {
            console.error(`   ❌ Error updating ${colDef.name}:`, error.message);
        }
    }

    console.log('\n✨ Collection fix complete!');
}

fixAllCollections().catch(console.error);
