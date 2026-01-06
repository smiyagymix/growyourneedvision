import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const RULES = [
    { name: 'tenants', list: '', view: '', create: null, update: null, delete: null }, // Public read for tenants (schools)
    { name: 'deals', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'deal_stages', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: null, update: null, delete: null },
    { name: 'invoices', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'expenses', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'classes', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'subjects', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: null, update: null, delete: null },
    { name: 'assignments', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'submissions', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'attendance', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'events', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'products', list: '', view: '', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null }, // Public marketplace?
    { name: 'orders', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'tickets', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null },
    { name: 'knowledge_base', list: '', view: '', create: null, update: null, delete: null }, // Public KB
    { name: 'messages', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: '@request.auth.id != ""' },
    { name: 'notifications', list: 'user = @request.auth.id', view: 'user = @request.auth.id', create: null, update: 'user = @request.auth.id', delete: 'user = @request.auth.id' },
    { name: 'audit_logs', list: null, view: null, create: null, update: null, delete: null }, // Admin only
    { name: 'app_settings', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: null, update: null, delete: null },
    { name: 'activities', list: '@request.auth.id != ""', view: '@request.auth.id != ""', create: '@request.auth.id != ""', update: '@request.auth.id != ""', delete: null }
];

async function updateRules() {
    console.log('🚀 Updating PocketBase API rules...');

    try {
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
    } catch (error) {
        console.error('❌ Failed to authenticate as admin:', error.message);
        process.exit(1);
    }

    for (const rule of RULES) {
        try {
            const collection = await pb.collections.getOne(rule.name);
            
            const updateData = {
                listRule: rule.list,
                viewRule: rule.view,
                createRule: rule.create,
                updateRule: rule.update,
                deleteRule: rule.delete
            };
            
            await pb.collections.update(collection.id, updateData);
            console.log(`   ✅ Updated rules for ${rule.name}`);
        } catch (error) {
            console.error(`   ❌ Error updating ${rule.name}:`, error.message);
        }
    }
    
    console.log('\n✨ API rules update complete!');
}

updateRules().catch(console.error);
