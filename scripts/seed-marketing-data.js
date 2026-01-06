/**
 * Marketing Module Data Seeding
 * Run: node scripts/seed-marketing-data.js
 * 
 * Seeds realistic marketing data for testing and demonstration
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase(PB_URL);

// Helper to generate random date within range
const randomDate = (daysAgo = 30) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString();
};

// Helper to generate future date
const futureDate = (daysAhead = 30) => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
    return date.toISOString();
};

// Random pick from array
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Random number in range
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Realistic names and data generators
const companyNames = ['TechFlow', 'GreenLeaf', 'UrbanNest', 'DataPulse', 'CloudPeak', 'SwiftMart', 'PixelForge', 'BlueSky Solutions', 'NextGen Labs', 'Horizon Ventures'];
const firstNames = ['James', 'Emma', 'Oliver', 'Sophia', 'William', 'Ava', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Sebastian', 'Harper'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas'];
const domains = ['gmail.com', 'outlook.com', 'company.io', 'business.com', 'enterprise.net'];

const generateEmail = (firstName, lastName) => `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${pick(domains)}`;
const generateName = () => `${pick(firstNames)} ${pick(lastNames)}`;

async function seedCampaigns() {
    console.log('📣 Seeding campaigns...');
    const campaigns = [
        { name: 'Q4 Holiday Sale Blitz', status: 'Active', budget: 25000, spent: 18750, type: 'Display', start_date: randomDate(20), end_date: futureDate(40), performance_score: 87, impressions: 450000, clicks: 13500, conversions: 675 },
        { name: 'Product Launch - AI Features', status: 'Active', budget: 15000, spent: 8200, type: 'Email', start_date: randomDate(10), end_date: futureDate(20), performance_score: 92, impressions: 180000, clicks: 9000, conversions: 540 },
        { name: 'Spring Awareness Campaign', status: 'Scheduled', budget: 30000, spent: 0, type: 'Social', start_date: futureDate(30), end_date: futureDate(60), performance_score: 0, impressions: 0, clicks: 0, conversions: 0 },
        { name: 'Retargeting - Cart Abandoners', status: 'Active', budget: 8000, spent: 6400, type: 'Display', start_date: randomDate(30), end_date: futureDate(10), performance_score: 94, impressions: 95000, clicks: 7600, conversions: 456 },
        { name: 'Newsletter Subscriber Growth', status: 'Completed', budget: 5000, spent: 4850, type: 'Social', start_date: randomDate(60), end_date: randomDate(5), performance_score: 78, impressions: 220000, clicks: 4400, conversions: 880 },
        { name: 'Enterprise SEM Campaign', status: 'Active', budget: 50000, spent: 32000, type: 'Search', start_date: randomDate(45), end_date: futureDate(45), performance_score: 85, impressions: 890000, clicks: 26700, conversions: 534 },
        { name: 'Brand Video Series', status: 'Paused', budget: 20000, spent: 12000, type: 'Social', start_date: randomDate(25), end_date: futureDate(35), performance_score: 72, impressions: 340000, clicks: 6800, conversions: 204 },
        { name: 'Partner Co-Marketing', status: 'Draft', budget: 10000, spent: 0, type: 'Email', start_date: null, end_date: null, performance_score: 0, impressions: 0, clicks: 0, conversions: 0 },
    ];

    for (const campaign of campaigns) {
        try {
            await pb.collection('campaigns').create(campaign);
            console.log(`  ✅ ${campaign.name}`);
        } catch (e) {
            console.log(`  ⏭️  ${campaign.name} (may exist)`);
        }
    }
}

async function seedCustomerProfiles() {
    console.log('👥 Seeding customer profiles (CDP)...');
    const segments = ['High Value', 'Active Users', 'At Risk', 'New Users', 'Enterprise', 'SMB', 'Churned', 'Engaged'];
    const sources = ['Organic Search', 'Paid Ads', 'Referral', 'Social Media', 'Direct', 'Email Campaign', 'Partner', 'Trade Show'];
    const tags = ['VIP', 'Early Adopter', 'Beta Tester', 'Influencer', 'Partner', 'Enterprise', 'SMB', 'Startup'];

    for (let i = 0; i < 50; i++) {
        const firstName = pick(firstNames);
        const lastName = pick(lastNames);
        const profile = {
            email: generateEmail(firstName, lastName),
            name: `${firstName} ${lastName}`,
            phone: `+1${rand(200, 999)}${rand(100, 999)}${rand(1000, 9999)}`,
            company: Math.random() > 0.3 ? pick(companyNames) : null,
            ltv: rand(0, 15000),
            engagement_score: rand(10, 100),
            segments: Array.from({ length: rand(1, 3) }, () => pick(segments)),
            last_activity: randomDate(rand(1, 60)),
            source: pick(sources),
            tags: Array.from({ length: rand(0, 3) }, () => pick(tags)),
            custom_attributes: { industry: pick(['Tech', 'Finance', 'Healthcare', 'Retail', 'Education']), company_size: pick(['1-10', '11-50', '51-200', '201-500', '500+']) },
            events_count: rand(5, 500),
        };

        try {
            await pb.collection('customer_profiles').create(profile);
        } catch (e) { /* ignore duplicates */ }
    }
    console.log('  ✅ Created 50 customer profiles');
}

async function seedABTests() {
    console.log('🧪 Seeding A/B tests...');
    const tests = [
        {
            name: 'Pricing Page CTA Color',
            status: 'Running',
            type: 'CTA',
            goal: 'Increase conversion rate by 10%',
            traffic_split: 50,
            start_date: randomDate(14),
            confidence_level: 87,
            variants: JSON.stringify([
                { id: 'v1', name: 'Blue CTA (Control)', description: 'Current blue button', visitors: 4500, conversions: 225, conversion_rate: 5.0, is_control: true },
                { id: 'v2', name: 'Green CTA', description: 'Green button variant', visitors: 4520, conversions: 271, conversion_rate: 6.0, is_control: false }
            ])
        },
        {
            name: 'Email Subject Line Test',
            status: 'Completed',
            type: 'Email',
            goal: 'Improve open rate by 15%',
            traffic_split: 50,
            start_date: randomDate(30),
            end_date: randomDate(10),
            confidence_level: 96,
            winner_id: 'v2',
            variants: JSON.stringify([
                { id: 'v1', name: 'Generic Subject', description: 'Check out our new features', visitors: 10000, conversions: 2200, conversion_rate: 22.0, is_control: true },
                { id: 'v2', name: 'Personalized Subject', description: '{{name}}, see what\'s new for you', visitors: 10000, conversions: 2850, conversion_rate: 28.5, is_control: false }
            ])
        },
        {
            name: 'Landing Page Layout',
            status: 'Draft',
            type: 'Landing Page',
            goal: 'Reduce bounce rate by 20%',
            traffic_split: 33,
            confidence_level: 0,
            variants: JSON.stringify([
                { id: 'v1', name: 'Current Layout', description: 'Hero + Features + Testimonials', visitors: 0, conversions: 0, conversion_rate: 0, is_control: true },
                { id: 'v2', name: 'Video Hero', description: 'Video hero section', visitors: 0, conversions: 0, conversion_rate: 0, is_control: false },
                { id: 'v3', name: 'Social Proof First', description: 'Testimonials above the fold', visitors: 0, conversions: 0, conversion_rate: 0, is_control: false }
            ])
        },
        {
            name: 'Checkout Flow Simplification',
            status: 'Running',
            type: 'Price',
            goal: 'Increase checkout completion by 8%',
            traffic_split: 50,
            start_date: randomDate(7),
            confidence_level: 72,
            variants: JSON.stringify([
                { id: 'v1', name: '3-Step Checkout', description: 'Current multi-step checkout', visitors: 2800, conversions: 560, conversion_rate: 20.0, is_control: true },
                { id: 'v2', name: '1-Page Checkout', description: 'Single page checkout', visitors: 2750, conversions: 605, conversion_rate: 22.0, is_control: false }
            ])
        }
    ];

    for (const test of tests) {
        try {
            await pb.collection('ab_tests').create(test);
            console.log(`  ✅ ${test.name}`);
        } catch (e) {
            console.log(`  ⏭️  ${test.name} (may exist)`);
        }
    }
}

async function seedAudiences() {
    console.log('🎯 Seeding audiences...');
    const audiences = [
        { name: 'High-Intent Visitors', description: 'Users who viewed pricing page 3+ times', type: 'Behavioral', size: 8420, status: 'Ready', source: 'Website Analytics', criteria: JSON.stringify({ page_views: { pricing: { gte: 3 } } }), last_synced: randomDate(1) },
        { name: 'Enterprise Prospects', description: 'Companies with 500+ employees', type: 'Custom', size: 2150, status: 'Ready', source: 'CRM Import', criteria: JSON.stringify({ company_size: '500+' }), last_synced: randomDate(2) },
        { name: 'Lookalike - Top Customers', description: '1% lookalike of top 100 customers', type: 'Lookalike', size: 45000, status: 'Syncing', source: 'Facebook', criteria: JSON.stringify({ source_audience: 'top_customers', expansion: 0.01 }), last_synced: randomDate(1) },
        { name: 'Cart Abandoners (7 days)', description: 'Added to cart but didn\'t purchase', type: 'Retargeting', size: 3200, status: 'Ready', source: 'E-commerce Events', criteria: JSON.stringify({ event: 'add_to_cart', not_event: 'purchase', window_days: 7 }), last_synced: randomDate(1) },
        { name: 'Newsletter Subscribers', description: 'Opted-in email subscribers', type: 'Custom', size: 28500, status: 'Ready', source: 'Email Platform', criteria: JSON.stringify({ subscribed: true }), last_synced: randomDate(3) },
        { name: 'Churned Users', description: 'No login in 90 days', type: 'Behavioral', size: 1890, status: 'Building', source: 'Product Analytics', criteria: JSON.stringify({ last_login_days_ago: { gte: 90 } }) },
    ];

    for (const audience of audiences) {
        try {
            await pb.collection('audiences').create(audience);
            console.log(`  ✅ ${audience.name}`);
        } catch (e) {
            console.log(`  ⏭️  ${audience.name} (may exist)`);
        }
    }
}

async function seedJourneys() {
    console.log('🗺️ Seeding customer journeys...');
    const journeys = [
        {
            name: 'Welcome Series',
            description: 'Onboarding journey for new signups',
            status: 'Active',
            trigger: JSON.stringify({ type: 'Event', conditions: { event: 'user.created' } }),
            steps: JSON.stringify([
                { id: 's1', type: 'Email', config: { template: 'welcome_email', delay: '0' }, next_steps: ['s2'], position: { x: 0, y: 100 } },
                { id: 's2', type: 'Wait', config: { duration: '3 days' }, next_steps: ['s3'], position: { x: 0, y: 200 } },
                { id: 's3', type: 'Email', config: { template: 'feature_tips' }, next_steps: ['s4'], position: { x: 0, y: 300 } },
                { id: 's4', type: 'Condition', config: { condition: 'completed_onboarding' }, next_steps: ['s5', 's6'], position: { x: 0, y: 400 } },
                { id: 's5', type: 'Tag', config: { tag: 'onboarded' }, next_steps: [], position: { x: -100, y: 500 } },
                { id: 's6', type: 'Email', config: { template: 'help_offer' }, next_steps: [], position: { x: 100, y: 500 } },
            ]),
            enrolled_count: 12500,
            completed_count: 9800,
            conversion_rate: 78.4,
            start_date: randomDate(90),
        },
        {
            name: 'Re-engagement Campaign',
            description: 'Win back inactive users',
            status: 'Active',
            trigger: JSON.stringify({ type: 'Segment Entry', conditions: { segment: 'inactive_30_days' } }),
            steps: JSON.stringify([
                { id: 's1', type: 'Email', config: { template: 'we_miss_you' }, next_steps: ['s2'], position: { x: 0, y: 100 } },
                { id: 's2', type: 'Wait', config: { duration: '5 days' }, next_steps: ['s3'], position: { x: 0, y: 200 } },
                { id: 's3', type: 'Condition', config: { condition: 'opened_email' }, next_steps: ['s4', 's5'], position: { x: 0, y: 300 } },
                { id: 's4', type: 'SMS', config: { template: 'comeback_offer' }, next_steps: [], position: { x: -100, y: 400 } },
                { id: 's5', type: 'Email', config: { template: 'last_chance_offer' }, next_steps: [], position: { x: 100, y: 400 } },
            ]),
            enrolled_count: 3200,
            completed_count: 1450,
            conversion_rate: 45.3,
            start_date: randomDate(60),
        },
        {
            name: 'Upgrade Nurture',
            description: 'Convert free users to paid',
            status: 'Paused',
            trigger: JSON.stringify({ type: 'Segment Entry', conditions: { segment: 'free_tier_active' } }),
            steps: JSON.stringify([
                { id: 's1', type: 'Wait', config: { duration: '14 days' }, next_steps: ['s2'], position: { x: 0, y: 100 } },
                { id: 's2', type: 'Email', config: { template: 'upgrade_benefits' }, next_steps: ['s3'], position: { x: 0, y: 200 } },
                { id: 's3', type: 'Split', config: { ratio: 50 }, next_steps: ['s4', 's5'], position: { x: 0, y: 300 } },
                { id: 's4', type: 'Email', config: { template: 'case_study' }, next_steps: [], position: { x: -100, y: 400 } },
                { id: 's5', type: 'Email', config: { template: 'discount_offer' }, next_steps: [], position: { x: 100, y: 400 } },
            ]),
            enrolled_count: 8900,
            completed_count: 2100,
            conversion_rate: 23.6,
            start_date: randomDate(120),
        },
    ];

    for (const journey of journeys) {
        try {
            await pb.collection('journeys').create(journey);
            console.log(`  ✅ ${journey.name}`);
        } catch (e) {
            console.log(`  ⏭️  ${journey.name} (may exist)`);
        }
    }
}

async function seedSocialPosts() {
    console.log('📱 Seeding social posts...');
    const posts = [
        { content: '🚀 Exciting news! We just launched our AI-powered analytics dashboard. See your data like never before. #AI #Analytics #ProductLaunch', platforms: JSON.stringify(['LinkedIn', 'Twitter']), scheduled_date: futureDate(2), status: 'Scheduled', engagement: JSON.stringify({ likes: 0, comments: 0, shares: 0 }) },
        { content: 'Customer spotlight: How @TechFlow increased their conversion rate by 45% using our platform. Read the full case study 👇', platforms: JSON.stringify(['LinkedIn']), scheduled_date: futureDate(5), status: 'Scheduled', engagement: JSON.stringify({ likes: 0, comments: 0, shares: 0 }) },
        { content: 'Happy Friday! 🎉 What\'s one productivity tip that changed your workflow? We\'ll share ours in the comments!', platforms: JSON.stringify(['Twitter', 'Instagram']), published_date: randomDate(3), status: 'Published', engagement: JSON.stringify({ likes: 245, comments: 38, shares: 12 }) },
        { content: 'Join us for a live demo of our new features this Thursday at 2pm EST. Register now - link in bio! 🔗 #Webinar #SaaS', platforms: JSON.stringify(['Instagram', 'LinkedIn', 'Twitter']), scheduled_date: futureDate(8), status: 'Scheduled', engagement: JSON.stringify({ likes: 0, comments: 0, shares: 0 }) },
        { content: '5 ways to optimize your marketing funnel (thread) 🧵', platforms: JSON.stringify(['Twitter']), published_date: randomDate(7), status: 'Published', engagement: JSON.stringify({ likes: 892, comments: 67, shares: 234 }) },
        { content: 'Behind the scenes look at our team retreat! 🏔️ #TeamBuilding #CompanyCulture', platforms: JSON.stringify(['Instagram']), status: 'Draft', engagement: JSON.stringify({ likes: 0, comments: 0, shares: 0 }) },
    ];

    for (const post of posts) {
        try {
            await pb.collection('social_posts').create(post);
        } catch (e) { /* ignore */ }
    }
    console.log('  ✅ Created social posts');
}

async function seedSocialAccounts() {
    console.log('🔗 Seeding social accounts...');
    const accounts = [
        { platform: 'LinkedIn', account_name: 'Grow Your Need', account_id: 'growyourneed', status: 'Connected', followers: 12500, avatar_url: 'https://ui-avatars.com/api/?name=GYN&background=0077b5&color=fff' },
        { platform: 'Twitter', account_name: '@growyourneed', account_id: 'growyourneed', status: 'Connected', followers: 8420, avatar_url: 'https://ui-avatars.com/api/?name=GYN&background=1da1f2&color=fff' },
        { platform: 'Instagram', account_name: 'growyourneed', account_id: 'growyourneed', status: 'Connected', followers: 5200, avatar_url: 'https://ui-avatars.com/api/?name=GYN&background=e4405f&color=fff' },
        { platform: 'Facebook', account_name: 'Grow Your Need', account_id: 'growyourneed.page', status: 'Expired', followers: 3100, avatar_url: 'https://ui-avatars.com/api/?name=GYN&background=1877f2&color=fff' },
    ];

    for (const account of accounts) {
        try {
            await pb.collection('social_accounts').create(account);
        } catch (e) { /* ignore */ }
    }
    console.log('  ✅ Created social accounts');
}

async function seedLeadScores() {
    console.log('📊 Seeding lead scores...');
    const grades = ['A', 'B', 'C', 'D', 'F'];
    const trends = ['up', 'down', 'stable'];

    for (let i = 0; i < 30; i++) {
        const score = rand(10, 100);
        const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';
        const firstName = pick(firstNames);
        const lastName = pick(lastNames);

        const lead = {
            profile_id: `profile-${i}`,
            profile_name: `${firstName} ${lastName}`,
            profile_email: generateEmail(firstName, lastName),
            score,
            grade,
            factors: JSON.stringify([
                { name: 'Email Engagement', weight: 25, value: rand(0, 100), contribution: rand(0, 25) },
                { name: 'Website Activity', weight: 30, value: rand(0, 100), contribution: rand(0, 30) },
                { name: 'Company Fit', weight: 20, value: rand(0, 100), contribution: rand(0, 20) },
                { name: 'Feature Usage', weight: 25, value: rand(0, 100), contribution: rand(0, 25) },
            ]),
            last_updated: randomDate(rand(1, 7)),
            trend: pick(trends),
        };

        try {
            await pb.collection('lead_scores').create(lead);
        } catch (e) { /* ignore */ }
    }
    console.log('  ✅ Created 30 lead scores');
}

async function seedPersonalizationRules() {
    console.log('🎨 Seeding personalization rules...');
    const rules = [
        {
            name: 'Enterprise Hero Banner',
            description: 'Show enterprise-focused messaging to large companies',
            status: 'Active',
            target_audience: 'Enterprise',
            trigger_type: 'User Attribute',
            trigger_conditions: JSON.stringify({ company_size: { in: ['201-500', '500+'] } }),
            content_variations: JSON.stringify([{ id: 'cv1', name: 'Enterprise Hero', content: { headline: 'Scale with confidence', cta: 'Talk to Sales' }, weight: 100 }]),
            performance: JSON.stringify({ impressions: 45200, conversions: 1808, uplift: 24 }),
        },
        {
            name: 'Returning Visitor CTA',
            description: 'Skip newsletter popup for known visitors',
            status: 'Active',
            target_audience: 'Returning Visitors',
            trigger_type: 'Behavior',
            trigger_conditions: JSON.stringify({ visit_count: { gte: 2 } }),
            content_variations: JSON.stringify([{ id: 'cv2', name: 'No Popup', content: { show_popup: false }, weight: 100 }]),
            performance: JSON.stringify({ impressions: 89000, conversions: 0, uplift: 15 }),
        },
        {
            name: 'Startup Pricing',
            description: 'Show startup-friendly pricing for small teams',
            status: 'Testing',
            target_audience: 'Startups',
            trigger_type: 'User Attribute',
            trigger_conditions: JSON.stringify({ company_size: { in: ['1-10', '11-50'] }, industry: 'Tech' }),
            content_variations: JSON.stringify([{ id: 'cv3', name: 'Startup Deal', content: { discount: 20, badge: 'Startup Special' }, weight: 100 }]),
            performance: JSON.stringify({ impressions: 12000, conversions: 360, uplift: 32 }),
        },
    ];

    for (const rule of rules) {
        try {
            await pb.collection('personalization_rules').create(rule);
            console.log(`  ✅ ${rule.name}`);
        } catch (e) {
            console.log(`  ⏭️  ${rule.name} (may exist)`);
        }
    }
}

async function seedExperiments() {
    console.log('🔬 Seeding experiments...');
    const experiments = [
        {
            name: 'Checkout Flow Optimization',
            hypothesis: 'Reducing checkout steps from 3 to 1 will increase conversion rate by at least 5%',
            status: 'Running',
            type: 'Flow',
            variants: JSON.stringify([
                { id: 'v1', name: '3-Step Checkout (Control)', description: 'Current multi-step flow', allocation: 50 },
                { id: 'v2', name: 'Single Page Checkout', description: 'All steps on one page', allocation: 50 },
            ]),
            metrics: JSON.stringify([
                { name: 'Checkout Completion', type: 'Primary', target: 5 },
                { name: 'Time to Complete', type: 'Secondary', target: -20 },
                { name: 'Payment Errors', type: 'Guardrail', target: 0 },
            ]),
            sample_size: 10000,
            current_sample: 7850,
            start_date: randomDate(14),
        },
        {
            name: 'Annual Pricing Prominence',
            hypothesis: 'Showing annual pricing first will increase annual plan selection by 10%',
            status: 'Completed',
            type: 'Price',
            variants: JSON.stringify([
                { id: 'v1', name: 'Monthly First', description: 'Show monthly prices prominently', allocation: 50 },
                { id: 'v2', name: 'Annual First', description: 'Show annual prices with savings badge', allocation: 50 },
            ]),
            metrics: JSON.stringify([
                { name: 'Annual Plan Selection', type: 'Primary', target: 10 },
                { name: 'Total Revenue', type: 'Secondary', target: 5 },
            ]),
            sample_size: 5000,
            current_sample: 5000,
            start_date: randomDate(45),
            end_date: randomDate(5),
            results: JSON.stringify({ winner_id: 'v2', confidence: 94, impact: { 'Annual Plan Selection': 12.5, 'Total Revenue': 8.2 }, recommendation: 'Implement Annual First variant across all pricing pages' }),
        },
        {
            name: 'Hero CTA Copy Test',
            hypothesis: 'Action-oriented CTAs will increase click-through rate vs passive CTAs',
            status: 'Planning',
            type: 'Copy',
            variants: JSON.stringify([
                { id: 'v1', name: 'Learn More', description: 'Current passive CTA', allocation: 33 },
                { id: 'v2', name: 'Get Started Now', description: 'Action verb CTA', allocation: 33 },
                { id: 'v3', name: 'Start Free Trial', description: 'Benefit-focused CTA', allocation: 34 },
            ]),
            metrics: JSON.stringify([
                { name: 'CTA Click Rate', type: 'Primary', target: 15 },
                { name: 'Signup Completion', type: 'Secondary', target: 5 },
            ]),
            sample_size: 15000,
            current_sample: 0,
        },
    ];

    for (const exp of experiments) {
        try {
            await pb.collection('experiments').create(exp);
            console.log(`  ✅ ${exp.name}`);
        } catch (e) {
            console.log(`  ⏭️  ${exp.name} (may exist)`);
        }
    }
}

async function seedAttribution() {
    console.log('📈 Seeding attribution data...');
    const channels = ['Organic Search', 'Paid Search', 'Social Media', 'Email', 'Direct', 'Referral', 'Display Ads'];
    const models = ['Last Touch', 'First Touch', 'Linear', 'Time Decay', 'Position Based'];

    for (const channel of channels) {
        const conversions = rand(50, 500);
        const revenue = conversions * rand(50, 200);
        const cost = rand(1000, 10000);

        const attribution = {
            channel,
            model: pick(models),
            conversions,
            revenue,
            cost,
            roas: parseFloat((revenue / cost).toFixed(2)),
            touchpoints: JSON.stringify(Array.from({ length: rand(2, 5) }, (_, i) => ({
                position: i + 1,
                channel: pick(channels),
                timestamp: randomDate(rand(1, 30)),
            }))),
        };

        try {
            await pb.collection('attribution').create(attribution);
        } catch (e) { /* ignore */ }
    }
    console.log('  ✅ Created attribution data for all channels');
}

async function seedEmailTemplates() {
    console.log('📧 Seeding email templates...');
    const templates = [
        { name: 'Welcome Email', subject: 'Welcome to Grow Your Need, {{name}}! 🎉', content: '<h1>Welcome aboard, {{name}}!</h1><p>We\'re thrilled to have you join us. Here\'s how to get started...</p>', category: 'Transactional', variables: JSON.stringify(['{{name}}', '{{email}}']), is_active: true },
        { name: 'Monthly Newsletter', subject: 'Your {{month}} Update from Grow Your Need', content: '<h1>{{month}} Highlights</h1><p>Here\'s what happened this month...</p>', category: 'Newsletter', variables: JSON.stringify(['{{month}}', '{{name}}']), is_active: true },
        { name: 'Feature Announcement', subject: '🚀 New Feature: {{feature_name}}', content: '<h1>Introducing {{feature_name}}</h1><p>We\'ve been working hard on this one...</p>', category: 'Marketing', variables: JSON.stringify(['{{feature_name}}', '{{name}}']), is_active: true },
        { name: 'Cart Abandonment', subject: 'You left something behind, {{name}}', content: '<h1>Complete your purchase</h1><p>Your cart is waiting for you...</p>', category: 'Marketing', variables: JSON.stringify(['{{name}}', '{{cart_items}}', '{{cart_total}}']), is_active: true },
        { name: 'Password Reset', subject: 'Reset your password', content: '<p>Click the link below to reset your password...</p><p>{{reset_link}}</p>', category: 'Transactional', variables: JSON.stringify(['{{reset_link}}']), is_active: true },
        { name: 'Invoice Receipt', subject: 'Receipt for your payment - {{invoice_number}}', content: '<h1>Payment Received</h1><p>Amount: {{amount}}</p><p>Invoice: {{invoice_number}}</p>', category: 'Transactional', variables: JSON.stringify(['{{invoice_number}}', '{{amount}}', '{{date}}']), is_active: true },
    ];

    for (const template of templates) {
        try {
            await pb.collection('email_templates').create(template);
            console.log(`  ✅ ${template.name}`);
        } catch (e) {
            console.log(`  ⏭️  ${template.name} (may exist)`);
        }
    }
}

async function seedCreativeProjects() {
    console.log('🎨 Seeding creative projects...');
    const projects = [
        { name: 'Q4 Campaign Banner', type: 'Ad Banner', dimensions: JSON.stringify({ width: 1200, height: 628 }), last_edited: randomDate(3), owner: 'Marketing Team' },
        { name: 'Instagram Story - Product', type: 'Story', dimensions: JSON.stringify({ width: 1080, height: 1920 }), last_edited: randomDate(1), owner: 'Social Team' },
        { name: 'LinkedIn Post - Case Study', type: 'Social Post', dimensions: JSON.stringify({ width: 1200, height: 1200 }), last_edited: randomDate(5), owner: 'Content Team' },
        { name: 'Email Header - Newsletter', type: 'Email Header', dimensions: JSON.stringify({ width: 600, height: 200 }), last_edited: randomDate(7), owner: 'Email Team' },
        { name: 'Blog Cover - AI Features', type: 'Blog Cover', dimensions: JSON.stringify({ width: 1200, height: 630 }), last_edited: randomDate(2), owner: 'Content Team' },
    ];

    for (const project of projects) {
        try {
            await pb.collection('creative_projects').create(project);
            console.log(`  ✅ ${project.name}`);
        } catch (e) {
            console.log(`  ⏭️  ${project.name} (may exist)`);
        }
    }
}

async function main() {
    try {
        console.log('🔐 Authenticating as admin...');
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated successfully\n');

        await seedCampaigns();
        await seedCustomerProfiles();
        await seedABTests();
        await seedAudiences();
        await seedJourneys();
        await seedSocialPosts();
        await seedSocialAccounts();
        await seedLeadScores();
        await seedPersonalizationRules();
        await seedExperiments();
        await seedAttribution();
        await seedEmailTemplates();
        await seedCreativeProjects();

        console.log('\n🎉 Marketing data seeding complete!');
        console.log('\n📊 Summary:');
        console.log('   • 8 campaigns');
        console.log('   • 50 customer profiles');
        console.log('   • 4 A/B tests');
        console.log('   • 6 audiences');
        console.log('   • 3 journeys');
        console.log('   • 6 social posts + 4 accounts');
        console.log('   • 30 lead scores');
        console.log('   • 3 personalization rules');
        console.log('   • 3 experiments');
        console.log('   • Attribution data for 7 channels');
        console.log('   • 6 email templates');
        console.log('   • 5 creative projects');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

main();
