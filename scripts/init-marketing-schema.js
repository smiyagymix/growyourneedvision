/**
 * Marketing Module Schema Initialization
 * Run: node scripts/init-marketing-schema.js
 * 
 * Creates all collections needed for the Marketing Tool Platform
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase(PB_URL);

const defaultRules = {
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
};

async function createCollection(name, schema, extraOptions = {}) {
    try {
        await pb.collections.create({
            name,
            type: 'base',
            schema,
            ...defaultRules,
            ...extraOptions,
        });
        console.log(`✅ Created collection: ${name}`);
    } catch (e) {
        if (e.message?.includes('already exists') || e.status === 400) {
            console.log(`⏭️  Collection '${name}' already exists, skipping...`);
        } else {
            console.error(`❌ Failed to create '${name}':`, e.message);
        }
    }
}

async function initMarketingSchema() {
    try {
        console.log('🔐 Authenticating as admin...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated successfully\n');

        // 1. CAMPAIGNS
        await createCollection('campaigns', [
            { name: 'name', type: 'text', required: true },
            { name: 'status', type: 'select', required: true, options: { values: ['Active', 'Scheduled', 'Paused', 'Completed', 'Draft'] } },
            { name: 'budget', type: 'number', required: true },
            { name: 'spent', type: 'number' },
            { name: 'start_date', type: 'date', required: true },
            { name: 'end_date', type: 'date', required: true },
            { name: 'type', type: 'select', required: true, options: { values: ['Email', 'Social', 'Search', 'Display'] } },
            { name: 'performance_score', type: 'number' },
            { name: 'impressions', type: 'number' },
            { name: 'clicks', type: 'number' },
            { name: 'conversions', type: 'number' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 2. MARKETING ASSETS
        await createCollection('marketing_assets', [
            { name: 'title', type: 'text', required: true },
            { name: 'file', type: 'file', required: true, options: { maxSelect: 1, maxSize: 52428800 } },
            { name: 'type', type: 'select', required: true, options: { values: ['Image', 'Video', 'Document'] } },
            { name: 'size', type: 'number' },
            { name: 'tags', type: 'json' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 3. EMAIL TEMPLATES
        await createCollection('email_templates', [
            { name: 'name', type: 'text', required: true },
            { name: 'subject', type: 'text', required: true },
            { name: 'content', type: 'editor', required: true },
            { name: 'category', type: 'select', options: { values: ['Marketing', 'Transactional', 'Notification', 'Newsletter'] } },
            { name: 'variables', type: 'json' },
            { name: 'is_active', type: 'bool' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 4. MARKETING SEGMENTS
        await createCollection('marketing_segments', [
            { name: 'name', type: 'text', required: true },
            { name: 'type', type: 'select', required: true, options: { values: ['Dynamic', 'Static'] } },
            { name: 'count', type: 'number' },
            { name: 'criteria', type: 'json' },
            { name: 'last_calculated', type: 'date' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 5. AUDIENCES
        await createCollection('audiences', [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'type', type: 'select', options: { values: ['Custom', 'Lookalike', 'Retargeting', 'Behavioral'] }, required: true },
            { name: 'size', type: 'number' },
            { name: 'status', type: 'select', options: { values: ['Building', 'Ready', 'Syncing', 'Error'] } },
            { name: 'source', type: 'text' },
            { name: 'criteria', type: 'json' },
            { name: 'last_synced', type: 'date' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 6. A/B TESTS
        await createCollection('ab_tests', [
            { name: 'name', type: 'text', required: true },
            { name: 'status', type: 'select', options: { values: ['Draft', 'Running', 'Paused', 'Completed'] }, required: true },
            { name: 'type', type: 'select', options: { values: ['Email', 'Landing Page', 'CTA', 'Price', 'Copy'] } },
            { name: 'variants', type: 'json', required: true },
            { name: 'winner_id', type: 'text' },
            { name: 'traffic_split', type: 'number' },
            { name: 'start_date', type: 'date' },
            { name: 'end_date', type: 'date' },
            { name: 'goal', type: 'text' },
            { name: 'confidence_level', type: 'number' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 7. CUSTOMER PROFILES (CDP)
        await createCollection('customer_profiles', [
            { name: 'email', type: 'email', required: true },
            { name: 'name', type: 'text' },
            { name: 'phone', type: 'text' },
            { name: 'company', type: 'text' },
            { name: 'ltv', type: 'number' },
            { name: 'engagement_score', type: 'number' },
            { name: 'segments', type: 'json' },
            { name: 'last_activity', type: 'date' },
            { name: 'source', type: 'text' },
            { name: 'tags', type: 'json' },
            { name: 'custom_attributes', type: 'json' },
            { name: 'events_count', type: 'number' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 8. PERSONALIZATION RULES
        await createCollection('personalization_rules', [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'status', type: 'select', options: { values: ['Active', 'Inactive', 'Testing'] }, required: true },
            { name: 'target_audience', type: 'text' },
            { name: 'trigger_type', type: 'select', options: { values: ['Page Visit', 'User Attribute', 'Behavior', 'Time-based'] } },
            { name: 'trigger_conditions', type: 'json' },
            { name: 'content_variations', type: 'json' },
            { name: 'performance', type: 'json' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 9. JOURNEYS
        await createCollection('journeys', [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'text' },
            { name: 'status', type: 'select', options: { values: ['Draft', 'Active', 'Paused', 'Completed'] }, required: true },
            { name: 'trigger', type: 'json', required: true },
            { name: 'steps', type: 'json', required: true },
            { name: 'enrolled_count', type: 'number' },
            { name: 'completed_count', type: 'number' },
            { name: 'conversion_rate', type: 'number' },
            { name: 'start_date', type: 'date' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 10. LEAD SCORES
        await createCollection('lead_scores', [
            { name: 'profile_id', type: 'text' },
            { name: 'profile_name', type: 'text' },
            { name: 'profile_email', type: 'email' },
            { name: 'score', type: 'number', required: true },
            { name: 'grade', type: 'select', options: { values: ['A', 'B', 'C', 'D', 'F'] }, required: true },
            { name: 'factors', type: 'json' },
            { name: 'last_updated', type: 'date' },
            { name: 'trend', type: 'select', options: { values: ['up', 'down', 'stable'] } },
            { name: 'tenantId', type: 'text' },
        ]);

        // 11. SOCIAL POSTS
        await createCollection('social_posts', [
            { name: 'content', type: 'text', required: true },
            { name: 'media_urls', type: 'json' },
            { name: 'platforms', type: 'json', required: true },
            { name: 'scheduled_date', type: 'date' },
            { name: 'published_date', type: 'date' },
            { name: 'status', type: 'select', options: { values: ['Draft', 'Scheduled', 'Published', 'Failed'] }, required: true },
            { name: 'engagement', type: 'json' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 12. SOCIAL ACCOUNTS
        await createCollection('social_accounts', [
            { name: 'platform', type: 'select', options: { values: ['LinkedIn', 'Twitter', 'Instagram', 'Facebook'] }, required: true },
            { name: 'account_name', type: 'text', required: true },
            { name: 'account_id', type: 'text', required: true },
            { name: 'status', type: 'select', options: { values: ['Connected', 'Disconnected', 'Expired'] }, required: true },
            { name: 'followers', type: 'number' },
            { name: 'avatar_url', type: 'url' },
            { name: 'access_token', type: 'text' },
            { name: 'refresh_token', type: 'text' },
            { name: 'token_expires', type: 'date' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 13. CREATIVE PROJECTS
        await createCollection('creative_projects', [
            { name: 'name', type: 'text', required: true },
            { name: 'type', type: 'select', options: { values: ['Social Post', 'Story', 'Ad Banner', 'Email Header', 'Blog Cover', 'Presentation'] }, required: true },
            { name: 'thumbnail', type: 'file', options: { maxSelect: 1, maxSize: 5242880 } },
            { name: 'canvas_data', type: 'json' },
            { name: 'dimensions', type: 'json' },
            { name: 'last_edited', type: 'date' },
            { name: 'owner', type: 'text' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 14. ATTRIBUTION
        await createCollection('attribution', [
            { name: 'campaign_id', type: 'text' },
            { name: 'campaign_name', type: 'text' },
            { name: 'channel', type: 'text', required: true },
            { name: 'model', type: 'select', options: { values: ['Last Touch', 'First Touch', 'Linear', 'Time Decay', 'Position Based'] }, required: true },
            { name: 'conversions', type: 'number' },
            { name: 'revenue', type: 'number' },
            { name: 'cost', type: 'number' },
            { name: 'roas', type: 'number' },
            { name: 'touchpoints', type: 'json' },
            { name: 'tenantId', type: 'text' },
        ]);

        // 15. EXPERIMENTS
        await createCollection('experiments', [
            { name: 'name', type: 'text', required: true },
            { name: 'hypothesis', type: 'text' },
            { name: 'status', type: 'select', options: { values: ['Planning', 'Running', 'Analyzing', 'Completed'] }, required: true },
            { name: 'type', type: 'select', options: { values: ['Feature', 'Price', 'Copy', 'Design', 'Flow'] } },
            { name: 'variants', type: 'json' },
            { name: 'metrics', type: 'json' },
            { name: 'sample_size', type: 'number' },
            { name: 'current_sample', type: 'number' },
            { name: 'start_date', type: 'date' },
            { name: 'end_date', type: 'date' },
            { name: 'results', type: 'json' },
            { name: 'tenantId', type: 'text' },
        ]);

        console.log('\n🎉 Marketing schema initialization complete!');
        console.log('\n📦 Collections available:');
        console.log('   campaigns, marketing_assets, email_templates, marketing_segments');
        console.log('   audiences, ab_tests, customer_profiles, personalization_rules');
        console.log('   journeys, lead_scores, social_posts, social_accounts');
        console.log('   creative_projects, attribution, experiments');

    } catch (error) {
        console.error('❌ Schema initialization failed:', error);
        process.exit(1);
    }
}

initMarketingSchema();

