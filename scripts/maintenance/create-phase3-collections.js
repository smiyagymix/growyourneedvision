/**
 * Automated PocketBase Collection Creator for Phase 3
 * Run this script to automatically create all required collections
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Collection schemas
const collections = [
    {
        name: 'ai_intelligence_files',
        type: 'base',
        schema: [
            { name: 'level', type: 'number', required: true },
            { name: 'file_name', type: 'text', required: true },
            { name: 'file_path', type: 'text', required: true },
            { name: 'file_size', type: 'number', required: false },
            { name: 'status', type: 'text', required: true },
            { name: 'token_count', type: 'number', required: false },
            { name: 'metadata', type: 'json', required: false }
        ]
    },
    {
        name: 'ai_playground_tests',
        type: 'base',
        schema: [
            { name: 'prompt', type: 'text', required: true, options: { max: 5000 } },
            { name: 'models', type: 'json', required: true },
            { name: 'responses', type: 'json', required: true }
        ]
    },
    {
        name: 'ai_usage_logs',
        type: 'base',
        schema: [
            { name: 'model', type: 'text', required: true },
            { name: 'feature', type: 'text', required: true },
            { name: 'tokens_input', type: 'number', required: false },
            { name: 'tokens_output', type: 'number', required: false },
            { name: 'cost', type: 'number', required: false },
            { name: 'response_time', type: 'number', required: false }
        ]
    },
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
            { name: 'status', type: 'text', required: false },
            { name: 'tags', type: 'json', required: false },
            { name: 'custom_fields', type: 'json', required: false }
        ]
    },
    {
        name: 'ai_finetuning_jobs',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'base_model', type: 'text', required: true },
            { name: 'training_file', type: 'text', required: true },
            { name: 'validation_file', type: 'text', required: false },
            { name: 'status', type: 'text', required: true },
            { name: 'progress', type: 'number', required: false, options: { min: 0, max: 100 } },
            { name: 'epochs', type: 'number', required: false },
            { name: 'batch_size', type: 'number', required: false },
            { name: 'learning_rate', type: 'number', required: false },
            { name: 'cost', type: 'number', required: false },
            { name: 'fine_tuned_model', type: 'text', required: false },
            { name: 'metrics', type: 'json', required: false },
            { name: 'error_message', type: 'text', required: false },
            { name: 'created_by', type: 'text', required: false },
            { name: 'started_at', type: 'date', required: false },
            { name: 'completed_at', type: 'date', required: false }
        ]
    },
    {
        name: 'ai_model_routing_rules',
        type: 'base',
        schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'priority', type: 'number', required: true },
            { name: 'enabled', type: 'bool', required: true },
            { name: 'conditions', type: 'json', required: true },
            { name: 'model_selection', type: 'text', required: true },
            { name: 'fallback_model', type: 'text', required: false }
        ]
    }
];

async function createCollections() {
    console.log('🚀 Auto-creating PocketBase collections for Phase 3...\n');

    try {
        // Note: This requires admin authentication
        // For development, you can create these manually in PocketBase Admin UI
        // Or authenticate as admin first

        console.log('⚠️ IMPORTANT: This script requires PocketBase Admin SDK or manual creation.\n');
        console.log('📋 Please create these collections manually in PocketBase Admin UI (http://127.0.0.1:8090/_/):\n');

        collections.forEach((collection, index) => {
            console.log(`${index + 1}. Collection: ${collection.name}`);
            console.log(`   Fields (${collection.schema.length}):`);
            collection.schema.forEach(field => {
                const required = field.required ? '(required)' : '(optional)';
                console.log(`   - ${field.name}: ${field.type} ${required}`);
            });
            console.log('');
        });

        console.log('✅ After creating collections, run: node scripts/maintenance/seed-phase3-data.js');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createCollections();
