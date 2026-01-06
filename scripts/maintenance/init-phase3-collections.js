/**
 * PocketBase Collection Schemas for Phase 3 - AI & CRM Features
 * Run this script to create all necessary collections
 */

import PocketBase from 'pocketbase';

const collections = [
    // ========================================
    // AI FEATURES COLLECTIONS
    // ========================================
    {
        name: 'ai_intelligence_files',
        type: 'base',
        schema: [
            { name: 'level', type: 'number', required: true, min: 1, max: 5 },
            { name: 'file_name', type: 'text', required: true },
            { name: 'file_path', type: 'text', required: true },
            { name: 'file_size', type: 'number', required: true },
            { name: 'status', type: 'select', required: true, options: { values: ['uploaded', 'processing', 'ready', 'error'] } },
            { name: 'token_count', type: 'number', required: false },
            { name: 'metadata', type: 'json', required: false },
            { name: 'error_message', type: 'text', required: false },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'ai_playground_tests',
        type: 'base',
        schema: [
            { name: 'prompt', type: 'text', required: true },
            { name: 'models', type: 'json', required: true }, // [{model: 'gpt-4', params: {...}}]
            { name: 'responses', type: 'json', required: false }, // [{model, response, time, cost, tokens}]
            { name: 'created_by', type: 'relation', required: true, options: { collectionId: 'users' } },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'ai_finetuning_jobs',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'base_model', type: 'text', required: true },
            { name: 'dataset_file', type: 'text', required: true },
            { name: 'hyperparameters', type: 'json', required: false },
            { name: 'status', type: 'select', required: true, options: { values: ['pending', 'running', 'completed', 'failed'] } },
            { name: 'progress', type: 'number', required: false }, // 0-100
            { name: 'epochs_completed', type: 'number', required: false },
            { name: 'metrics', type: 'json', required: false }, // {loss, accuracy, val_loss}
            { name: 'model_id', type: 'text', required: false },
            { name: 'completed_at', type: 'date', required: false },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'ai_usage_logs',
        type: 'base',
        schema: [
            { name: 'tenant_id', type: 'relation', required: false, options: { collectionId: 'tenants' } },
            { name: 'model', type: 'text', required: true },
            { name: 'feature', type: 'select', required: true, options: { values: ['chat', 'playground', 'finetuning', 'assistant'] } },
            { name: 'tokens_input', type: 'number', required: true },
            { name: 'tokens_output', type: 'number', required: true },
            { name: 'cost', type: 'number', required: true },
            { name: 'response_time', type: 'number', required: false },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '', // System generated
        updateRule: '',
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'ai_model_routing_rules',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'condition', type: 'json', required: true }, // {type: 'token_count', operator: '<', value: 100}
            { name: 'target_model', type: 'text', required: true },
            { name: 'priority', type: 'number', required: true },
            { name: 'enabled', type: 'bool', required: true },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    },

    // ========================================
    // CRM FEATURES COLLECTIONS
    // ========================================
    {
        name: 'crm_contacts',
        type: 'base',
        schema: [
            { name: 'first_name', type: 'text', required: true },
            { name: 'last_name', type: 'text', required: true },
            { name: 'email', type: 'email', required: true },
            { name: 'phone', type: 'text', required: false },
            { name: 'company', type: 'text', required: false },
            { name: 'title', type: 'text', required: false },
            { name: 'status', type: 'select', required: true, options: { values: ['lead', 'prospect', 'customer', 'inactive'] } },
            { name: 'tags', type: 'json', required: false },
            { name: 'custom_fields', type: 'json', required: false },
            { name: 'last_contact', type: 'date', required: false },
            { name: 'created_by', type: 'relation', required: true, options: { collectionId: 'users' } },
        ],
        listRule: '@request.auth.role = "owner" || created_by = @request.auth.id',
        viewRule: '@request.auth.role = "owner" || created_by = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.role = "owner" || created_by = @request.auth.id',
        deleteRule: '@request.auth.role = "owner" || created_by = @request.auth.id'
    },
    {
        name: 'crm_emails',
        type: 'base',
        schema: [
            { name: 'contact_id', type: 'relation', required: true, options: { collectionId: 'crm_contacts' } },
            { name: 'deal_id', type: 'relation', required: false, options: { collectionId: 'deals' } },
            { name: 'subject', type: 'text', required: true },
            { name: 'body', type: 'editor', required: true },
            { name: 'sent_at', type: 'date', required: false },
            { name: 'opened_at', type: 'date', required: false },
            { name: 'clicked_at', type: 'date', required: false },
            { name: 'status', type: 'select', required: true, options: { values: ['draft', 'scheduled', 'sent', 'failed'] } },
            { name: 'sent_by', type: 'relation', required: true, options: { collectionId: 'users' } },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.role = "owner"',
        updateRule: '@request.auth.role = "owner"',
        deleteRule: '@request.auth.role = "owner"'
    },
    {
        name: 'crm_activities',
        type: 'base',
        schema: [
            { name: 'contact_id', type: 'relation', required: true, options: { collectionId: 'crm_contacts' } },
            { name: 'deal_id', type: 'relation', required: false, options: { collectionId: 'deals' } },
            { name: 'type', type: 'select', required: true, options: { values: ['call', 'email', 'meeting', 'note', 'task'] } },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text', required: false },
            { name: 'created_by', type: 'relation', required: true, options: { collectionId: 'users' } },
        ],
        listRule: '@request.auth.role = "owner"',
        viewRule: '@request.auth.role = "owner"',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.role = "owner" || created_by = @request.auth.id',
        deleteRule: '@request.auth.role = "owner" || created_by = @request.auth.id'
    }
];

async function createCollections() {
    const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

    console.log('🚀 Creating Phase 3 AI & CRM collections...\n');
    console.log('⚠️  Note: You may need to create these manually in PocketBase Admin UI\n');
    console.log('Collections to create:\n');

    console.log('📊 AI Features (5):');
    console.log('  1. ai_intelligence_files - Intelligence level file uploads');
    console.log('  2. ai_playground_tests - AI model testing history');
    console.log('  3. ai_finetuning_jobs - Fine-tuning job tracking');
    console.log('  4. ai_usage_logs - AI usage and cost tracking');
    console.log('  5. ai_model_routing_rules - Model routing configuration\n');

    console.log('👥 CRM Features (3):');
    console.log('  6. crm_contacts - Contact management');
    console.log('  7. crm_emails - Email communication log');
    console.log('  8. crm_activities - Activity timeline\n');

    console.log('✨ Manual creation steps:');
    console.log('1. Open http://127.0.0.1:8090/_/');
    console.log('2. Go to Collections');
    console.log('3. Create each collection above with the specified fields\n');

    for (const collectionData of collections) {
        console.log(`\n📦 ${collectionData.name}`);
        console.log(`   Type: ${collectionData.type}`);
        console.log(`   Fields: ${collectionData.schema.length}`);
        collectionData.schema.forEach(field => {
            console.log(`   - ${field.name} (${field.type})${field.required ? ' *required' : ''}`);
        });
    }
}

createCollections().catch(console.error);

export { createCollections, collections };
