/**
 * Seed Phase 3 Collections with Test Data
 * Populates AI and CRM collections for immediate testing
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// Sample data generators
const generateIntelligenceFiles = () => [
    {
        level: 1,
        file_name: 'company_overview.pdf',
        file_path: '/uploads/intelligence/level1/company_overview.pdf',
        file_size: 245678,
        status: 'ready',
        token_count: 1245,
        metadata: { content_type: 'application/pdf', pages: 5, language: 'en' }
    },
    {
        level: 1,
        file_name: 'faq_document.txt',
        file_path: '/uploads/intelligence/level1/faq_document.txt',
        file_size: 12456,
        status: 'ready',
        token_count: 567,
        metadata: { content_type: 'text/plain', language: 'en' }
    },
    {
        level: 2,
        file_name: 'user_manual.pdf',
        file_path: '/uploads/intelligence/level2/user_manual.pdf',
        file_size: 567890,
        status: 'processing',
        token_count: null,
        metadata: { content_type: 'application/pdf', pages: 45 }
    },
    {
        level: 2,
        file_name: 'api_documentation.md',
        file_path: '/uploads/intelligence/level2/api_documentation.md',
        file_size: 34567,
        status: 'ready',
        token_count: 2345,
        metadata: { content_type: 'text/markdown', language: 'en' }
    },
    {
        level: 3,
        file_name: 'internal_policies.pdf',
        file_path: '/uploads/intelligence/level3/internal_policies.pdf',
        file_size: 123456,
        status: 'ready',
        token_count: 890,
        metadata: { content_type: 'application/pdf', pages: 12 }
    }
];

const generatePlaygroundTests = () => [
    {
        prompt: 'Explain the benefits of cloud computing for small businesses',
        models: [
            { model: 'gpt-4', params: { temperature: 0.7, max_tokens: 500 } },
            { model: 'claude-3-sonnet', params: { temperature: 0.7, max_tokens: 500 } }
        ],
        responses: [
            {
                model: 'gpt-4',
                response: 'Cloud computing offers small businesses significant advantages including cost efficiency through pay-as-you-go models...',
                time_ms: 1245,
                cost: 0.0234,
                tokens_input: 156,
                tokens_output: 234
            },
            {
                model: 'claude-3-sonnet',
                response: 'Small businesses can leverage cloud computing to reduce infrastructure costs, improve scalability...',
                time_ms: 987,
                cost: 0.0156,
                tokens_input: 156,
                tokens_output: 198
            }
        ]
    },
    {
        prompt: 'Write a product description for an AI-powered task manager',
        models: [
            { model: 'gpt-3.5-turbo', params: { temperature: 0.9, max_tokens: 300 } }
        ],
        responses: [
            {
                model: 'gpt-3.5-turbo',
                response: 'Revolutionize your productivity with our AI-powered task manager that learns your work patterns...',
                time_ms: 567,
                cost: 0.0045,
                tokens_input: 89,
                tokens_output: 145
            }
        ]
    }
];

const generateUsageLogs = () => {
    const logs = [];
    const models = ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet', 'gemini-pro'];
    const features = ['chat', 'playground', 'assistant'];

    // Generate logs for the past 30 days
    for (let i = 0; i < 100; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        const model = models[Math.floor(Math.random() * models.length)];
        const feature = features[Math.floor(Math.random() * features.length)];
        const tokensInput = Math.floor(Math.random() * 500) + 100;
        const tokensOutput = Math.floor(Math.random() * 300) + 50;

        // Calculate cost based on model
        let costPer1kInput = 0.0015;
        let costPer1kOutput = 0.002;

        if (model === 'gpt-4') {
            costPer1kInput = 0.03;
            costPer1kOutput = 0.06;
        } else if (model.includes('claude')) {
            costPer1kInput = 0.003;
            costPer1kOutput = 0.015;
        } else if (model === 'gemini-pro') {
            costPer1kInput = 0.00025;
            costPer1kOutput = 0.0005;
        }

        const cost = (tokensInput / 1000) * costPer1kInput + (tokensOutput / 1000) * costPer1kOutput;

        logs.push({
            model,
            feature,
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            cost: parseFloat(cost.toFixed(6)),
            response_time: Math.floor(Math.random() * 2000) + 500,
            created: date.toISOString()
        });
    }

    return logs;
};

const generateContacts = () => [
    {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@acmecorp.com',
        phone: '+1-555-0123',
        company: 'Acme Corporation',
        title: 'CEO',
        status: 'customer',
        tags: ['Enterprise', 'Decision Maker', 'VIP'],
        custom_fields: { industry: 'Technology', employees: '500-1000' }
    },
    {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@techstart.io',
        phone: '+1-555-0124',
        company: 'TechStart Inc',
        title: 'CTO',
        status: 'prospect',
        tags: ['Tech', 'Startup'],
        custom_fields: { industry: 'SaaS', employees: '50-100' }
    },
    {
        first_name: 'Michael',
        last_name: 'Johnson',
        email: 'm.johnson@eduschool.edu',
        phone: '+1-555-0125',
        company: 'EduSchool',
        title: 'Director of IT',
        status: 'lead',
        tags: ['Education', 'Public Sector'],
        custom_fields: { industry: 'Education', employees: '200-500' }
    },
    {
        first_name: 'Sarah',
        last_name: 'Williams',
        email: 'sarah.w@innovate.com',
        phone: '+1-555-0126',
        company: 'Innovate Labs',
        title: 'Product Manager',
        status: 'prospect',
        tags: ['Innovation', 'AI'],
        custom_fields: { industry: 'AI/ML', employees: '20-50' }
    },
    {
        first_name: 'David',
        last_name: 'Brown',
        email: 'david.brown@retailco.com',
        phone: '+1-555-0127',
        company: 'Retail Co',
        title: 'VP of Operations',
        status: 'customer',
        tags: ['Retail', 'Enterprise'],
        custom_fields: { industry: 'Retail', employees: '1000+' }
    },
    {
        first_name: 'Emily',
        last_name: 'Davis',
        email: 'emily.davis@healthplus.org',
        phone: '+1-555-0128',
        company: 'HealthPlus',
        title: 'Administrator',
        status: 'lead',
        tags: ['Healthcare', 'Non-Profit'],
        custom_fields: { industry: 'Healthcare', employees: '100-200' }
    },
    {
        first_name: 'Robert',
        last_name: 'Martinez',
        email: 'r.martinez@financegroup.com',
        phone: '+1-555-0129',
        company: 'Finance Group',
        title: 'CFO',
        status: 'inactive',
        tags: ['Finance', 'Legacy'],
        custom_fields: { industry: 'Finance', employees: '300-500' }
    },
    {
        first_name: 'Lisa',
        last_name: 'Anderson',
        email: 'lisa.a@designstudio.co',
        phone: '+1-555-0130',
        company: 'Design Studio',
        title: 'Creative Director',
        status: 'prospect',
        tags: ['Creative', 'Agency'],
        custom_fields: { industry: 'Design', employees: '10-20' }
    }
];

async function seedPhase3Data() {
    try {
        console.log('🌱 Starting Phase 3 data seeding...\n');

        // 1. Seed AI Intelligence Files
        console.log('📊 Seeding AI Intelligence Files...');
        const intelligenceFiles = generateIntelligenceFiles();
        for (const file of intelligenceFiles) {
            try {
                await pb.collection('ai_intelligence_files').create(file);
                console.log(`  ✓ Created ${file.file_name} (Level ${file.level})`);
            } catch (error) {
                console.log(`  ✗ Failed to create ${file.file_name}:`, error.message);
            }
        }

        // 2. Seed AI Playground Tests
        console.log('\n🎮 Seeding AI Playground Tests...');
        const playgroundTests = generatePlaygroundTests();
        for (const test of playgroundTests) {
            try {
                await pb.collection('ai_playground_tests').create(test);
                console.log(`  ✓ Created test: "${test.prompt.substring(0, 50)}..."`);
            } catch (error) {
                console.log(`  ✗ Failed to create test:`, error.message);
            }
        }

        // 3. Seed AI Usage Logs
        console.log('\n💰 Seeding AI Usage Logs (100 records)...');
        const usageLogs = generateUsageLogs();
        let successCount = 0;
        for (const log of usageLogs) {
            try {
                await pb.collection('ai_usage_logs').create(log);
                successCount++;
            } catch (error) {
                // Silent fail for large batch
            }
        }
        console.log(`  ✓ Created ${successCount} usage logs`);

        // 4. Seed CRM Contacts
        console.log('\n👥 Seeding CRM Contacts...');
        const contacts = generateContacts();
        for (const contact of contacts) {
            try {
                await pb.collection('crm_contacts').create(contact);
                console.log(`  ✓ Created ${contact.first_name} ${contact.last_name} (${contact.status})`);
            } catch (error) {
                console.log(`  ✗ Failed to create ${contact.first_name} ${contact.last_name}:`, error.message);
            }
        }

        console.log('\n✅ Phase 3 data seeding complete!\n');
        console.log('📊 Summary:');
        console.log(`  - Intelligence Files: ${intelligenceFiles.length}`);
        console.log(`  - Playground Tests: ${playgroundTests.length}`);
        console.log(`  - Usage Logs: ${successCount}`);
        console.log(`  - Contacts: ${contacts.length}`);
        console.log('\n🎯 You can now test all Phase 3 features with real data!');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
}

// Run the seed function
seedPhase3Data().catch(console.error);
