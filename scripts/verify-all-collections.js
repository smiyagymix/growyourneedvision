/**
 * Master PocketBase Collection Verification Script
 * 
 * Verifies all 286 collections referenced in the codebase exist in PocketBase
 * Creates missing collections with proper schemas
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

// All 286 unique collections found in codebase
const ALL_COLLECTIONS = [
    'ab_test_assignments', 'ab_test_metrics', 'ab_tests',
    'account_deletion_requests', 'achievements', 'activities',
    'activities_local', 'adaptive_learning_profiles', 'ai_config',
    'ai_objectives', 'ai_stats', 'analytics_events',
    'analytics_pages', 'analytics_sources', 'announcements',
    'anomaly_detections', 'api_key_usage', 'api_keys',
    'api_logs', 'api_usage', 'api_usage_logs',
    'app_installations', 'app_reviews', 'assignments',
    'attendance', 'attendance_records', 'attribution',
    'audiences', 'audit_logs', 'automation_analytics',
    'automation_rules', 'batch_exports', 'billing_rule_executions',
    'billing_rules', 'bulk_operations', 'business_metrics',
    'business_plans', 'business_rules', 'calendar_events',
    'campaigns', 'certifications', 'challenge_completions',
    'channel_recommendations', 'channel_stats', 'chat_messages',
    'class_schedules', 'classes', 'clone_jobs',
    'community_comments', 'community_posts', 'comparison_reports',
    'compliance_logs', 'compliance_reports', 'compliance_violations',
    'contacts', 'content_history', 'course_resources',
    'courses', 'creative_projects', 'creator_code',
    'creator_designs', 'creator_docs', 'creator_templates',
    'creator_videos', 'crm_contacts', 'crm_emails',
    'crm_inquiries', 'crm_interactions', 'currencies',
    'customer_profiles', 'customer_segments', 'customers',
    'dashboard_layouts', 'datasets', 'deal_assignments',
    'deals', 'duas', 'email_logs',
    'email_templates', 'enrollments', 'events',
    'exam_results', 'exams', 'expenses',
    'experiments', 'export_configs', 'export_jobs',
    'feature_definitions', 'feature_usage', 'feedback',
    'fees', 'file_uploads', 'finance_expenses',
    'flashcard_decks', 'flashcards', 'forecasts',
    'fragments', 'gamification_achievements', 'gamification_challenges',
    'gamification_progress', 'gamification_rewards', 'gdpr_deletion_requests',
    'gdpr_export_requests', 'glitches', 'goals',
    'grade_entries', 'grades', 'habit_logs',
    'habits', 'hadiths', 'help_faqs',
    'hobby_projects', 'hobby_resources', 'hobby_skills',
    'incident_rules', 'incidents', 'individual_courses',
    'individual_goals', 'integrations', 'invoices',
    'ip_rate_limits', 'ip_violations', 'journeys',
    'knowledge_articles', 'knowledge_base', 'knowledge_docs',
    'language_settings', 'lead_scores', 'leads',
    'learning_analytics', 'learning_path_recommendations', 'learning_progress',
    'lesson_plans', 'm3u_playlists', 'marketing_assets',
    'marketing_roi', 'marketing_segments', 'marketplace_apps',
    'marketplace_orders', 'media_items', 'media_uploads',
    'messages', 'micro_credentials', 'mission_runs',
    'missions', 'monitoring_events', 'multi_channel_campaigns',
    'multiverse_profiles', 'names_of_allah', 'notes',
    'notification_preferences', 'notification_settings', 'notification_templates',
    'notifications', 'onboarding_progress', 'onboarding_step_skips',
    'onboarding_workflows', 'orders', 'parent_student_links',
    'payment_attempts', 'payment_gateways', 'payment_methods',
    'penetration_tests', 'personalization_rules', 'planned_events',
    'platform_config', 'platform_settings', 'player_stats',
    'plugin_installs', 'plugins', 'prayer_times',
    'privacy_settings', 'products', 'projects',
    'prompt_templates', 'quiz_questions', 'quran_verses',
    'rate_limit_configs', 'rate_limit_usage', 'rate_limit_violations',
    'rate_limits', 'receipts', 'recipes',
    'recommendations', 'regional_settings', 'religious_events',
    'religious_resources', 'report_schedules', 'resource_categories',
    'resources', 'saved_searches', 'school_bookings',
    'school_classes', 'school_invoices', 'school_payments',
    'school_services', 'school_settings', 'scoring_rules',
    'search_history', 'security_audit', 'service_bookings',
    'service_categories', 'service_reviews', 'services',
    'skill_assessments', 'skills', 'social_accounts',
    'social_groups', 'social_posts', 'sport_activities',
    'sport_matches', 'sport_teams', 'sport_venues',
    'storage_files', 'student_assignments', 'student_attendance',
    'student_courses', 'student_grades', 'student_schedule',
    'students', 'studio_projects', 'study_sessions',
    'subjects', 'submissions', 'subscription_plans',
    'subscriptions', 'support_tickets', 'system_alerts',
    'system_health', 'system_logs', 'tasks',
    'teacher_schedule', 'tenant_activity_logs', 'tenant_health_history',
    'tenant_health_scores', 'tenant_notifications', 'tenant_settings',
    'tenant_storage', 'tenant_templates', 'tenant_trials',
    'tenant_usage', 'tenants', 'ticket_comments',
    'ticket_replies', 'tickets', 'timelines',
    'timetable', 'tools_business', 'tools_finance',
    'tools_marketing', 'training_jobs', 'transactions',
    'translations', 'travel_bookings', 'travel_destinations',
    'travel_itineraries', 'travel_transport', 'tv_channels',
    'universes', 'usage_logs', 'usage_reports',
    'user_achievements', 'user_fragments', 'user_glitch_fixes',
    'user_mission_completions', 'user_preferences', 'user_profiles',
    'user_progress', 'user_rewards', 'user_sessions',
    'users', 'utils_design', 'utils_dev',
    'utils_general', 'utils_resources', 'vulnerabilities',
    'wal_archives', 'watch_history', 'webhook_deliveries',
    'webhook_logs', 'webhooks', 'wellness_data',
    'wellness_goals', 'wellness_logs', 'workflows'
];

// Common schema fields for new collections
const getTenantScopedSchema = (additionalFields = []) => [
    {
        name: 'tenantId',
        type: 'text',
        required: false, // False for Owner-level collections
        options: {}
    },
    {
        name: 'createdBy',
        type: 'relation',
        required: false,
        options: {
            collectionId: '', // Will be set to users collection ID
            cascadeDelete: false,
            minSelect: 0,
            maxSelect: 1
        }
    },
    ...additionalFields
];

async function authenticateAsAdmin() {
    try {
        // Use service token if available (best for collection management)
        const serviceToken = process.env.POCKETBASE_SERVICE_TOKEN;
        if (serviceToken) {
            pb.authStore.save(serviceToken);
            console.log('✓ Authenticated with service token');
            return true;
        }

        // Fallback to admin UI credentials
        // Note: This requires admin dashboard account, not regular users
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123';
        
        // For PocketBase admin API, we can't auth directly through SDK
        // User needs to visit http://127.0.0.1:8090/_/ and create admin account first
        console.log('✗ No service token found');
        console.log('  Please either:');
        console.log('  1. Set POCKETBASE_SERVICE_TOKEN in .env');
        console.log('  2. Create an admin account at http://127.0.0.1:8090/_/');
        return false;
    } catch (error) {
        console.error('✗ Failed to authenticate:', error.message);
        return false;
    }
}

async function verifyAndCreateCollections() {
    console.log('\n=== PocketBase Collection Verification ===\n');
    
    if (!(await authenticateAsAdmin())) {
        process.exit(1);
    }

    // Get all existing collections
    const existingCollections = await pb.collections.getFullList();
    const existingNames = new Set(existingCollections.map(c => c.name));

    console.log(`Found ${existingCollections.length} existing collections\n`);

    const missing = [];
    const existing = [];

    // Check each collection
    for (const collectionName of ALL_COLLECTIONS) {
        if (existingNames.has(collectionName)) {
            existing.push(collectionName);
        } else {
            missing.push(collectionName);
        }
    }

    // Print results
    console.log(`✓ Existing: ${existing.length} collections`);
    console.log(`✗ Missing: ${missing.length} collections\n`);

    if (missing.length > 0) {
        console.log('Missing Collections:');
        console.log('===================');
        missing.forEach((name, index) => {
            console.log(`${index + 1}. ${name}`);
        });
        console.log('\n');
    }

    // Ask user if they want to create missing collections
    if (missing.length > 0) {
        console.log('Would you like to create missing collections? (y/n)');
        console.log('Note: This will create basic schemas. You may need to customize them.\n');
        
        // For automated runs, check environment variable
        if (process.env.AUTO_CREATE_COLLECTIONS === 'true') {
            await createMissingCollections(missing);
        } else {
            console.log('Set AUTO_CREATE_COLLECTIONS=true to auto-create collections');
        }
    } else {
        console.log('✓ All collections exist! No action needed.\n');
    }

    // Print summary by category
    printCategorySummary(existing, missing);
}

async function createMissingCollections(missingCollections) {
    console.log('\nCreating missing collections...\n');

    let created = 0;
    let failed = 0;

    for (const collectionName of missingCollections) {
        try {
            // Determine if collection needs tenant scoping
            const needsTenantId = !collectionName.startsWith('_') && 
                                 collectionName !== 'users' &&
                                 collectionName !== 'tenants' &&
                                 !collectionName.startsWith('platform_') &&
                                 !collectionName.startsWith('system_');

            const schema = needsTenantId ? getTenantScopedSchema() : [];

            await pb.collections.create({
                name: collectionName,
                type: 'base',
                schema: schema,
                listRule: null,
                viewRule: null,
                createRule: null,
                updateRule: null,
                deleteRule: null
            });

            console.log(`✓ Created: ${collectionName}`);
            created++;
        } catch (error) {
            console.error(`✗ Failed to create ${collectionName}:`, error.message);
            failed++;
        }
    }

    console.log(`\nResults: ${created} created, ${failed} failed\n`);
}

function printCategorySummary(existing, missing) {
    console.log('\n=== Collection Status by Category ===\n');

    const categories = {
        'Core': ['users', 'tenants', 'messages', 'notifications'],
        'Education': ['assignments', 'enrollments', 'school_classes', 'attendance_records', 'grades', 'lesson_plans', 'submissions', 'students'],
        'Finance': ['invoices', 'payments', 'subscriptions', 'fees', 'expenses', 'receipts', 'transactions'],
        'Security': ['audit_logs', 'ip_rate_limits', 'api_keys', 'webhooks', 'rate_limits'],
        'Owner/Admin': ['tenant_trials', 'tenant_usage', 'bulk_operations', 'clone_jobs', 'export_jobs', 'penetration_tests'],
        'Marketing': ['marketing_assets', 'campaigns', 'leads', 'deals', 'contacts'],
        'Analytics': ['analytics_events', 'usage_logs', 'system_health', 'monitoring_events'],
        'Religion': ['duas', 'hadiths', 'prayer_times', 'quran_verses', 'religious_events'],
        'Travel': ['travel_bookings', 'travel_destinations', 'travel_itineraries'],
        'Sport': ['sport_activities', 'sport_matches', 'sport_teams', 'sport_venues'],
        'Gamification': ['achievements', 'user_progress', 'missions', 'challenges']
    };

    Object.entries(categories).forEach(([category, collections]) => {
        const existingCount = collections.filter(c => existing.includes(c)).length;
        const missingCount = collections.filter(c => missing.includes(c)).length;
        const status = missingCount === 0 ? '✓' : '✗';
        
        console.log(`${status} ${category}: ${existingCount}/${collections.length} exist (${missingCount} missing)`);
        
        if (missingCount > 0) {
            const missingOnes = collections.filter(c => missing.includes(c));
            console.log(`  Missing: ${missingOnes.join(', ')}`);
        }
    });
    console.log('\n');
}

// Run verification
verifyAndCreateCollections().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
