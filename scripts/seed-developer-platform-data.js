import PocketBase from 'pocketbase';
import crypto from 'crypto';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

function generateApiKey(prefix = 'gyn_live') {
    const random = crypto.randomBytes(24).toString('hex');
    return `${prefix}_${random}`;
}

function generateSecret(prefix = 'gyn_secret') {
    const random = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${random}`;
}

function generateWebhookSecret(prefix = 'whsec') {
    const random = crypto.randomBytes(24).toString('hex');
    return `${prefix}_${random}`;
}

function hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
}

async function main() {
    try {
        console.log('🔐 Authenticating...');
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL || 'owner@growyourneed.com';
        const adminPass = process.env.POCKETBASE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASS || 'Darnag12345678@';
        
        await pb.collection('_superusers').authWithPassword(adminEmail, adminPass);
        console.log('✅ Authenticated successfully\n');

        // Get test users
        console.log('📋 Fetching test users...');
        const users = await pb.collection('users').getFullList();
        const ownerUser = users.find(u => u.email === 'owner@growyourneed.com' || u.role === 'Owner');
        const teacherUser = users.find(u => u.email === 'teacher@school.com');
        const studentUser = users.find(u => u.email === 'student@school.com');

        if (!ownerUser) {
            console.error('❌ Owner user not found. Please run seed-data.js first.');
            process.exit(1);
        }

        console.log(`✅ Found users: Owner, ${teacherUser ? 'Teacher' : '(no teacher)'}, ${studentUser ? '(no student)' : 'Student'}\n`);

        // ==========================================
        // 1. Seed API Keys
        // ==========================================
        console.log('=== Seeding API Keys ===\n');

        const apiKeys = [
            {
                userId: ownerUser.id,
                tenantId: 'default-tenant',
                keyType: 'public',
                keyValue: generateApiKey(),
                keyHash: '',
                rateLimit: 10000,
                status: 'active',
                lastUsed: null,
                expiresAt: null
            },
            {
                userId: ownerUser.id,
                tenantId: 'default-tenant',
                keyType: 'secret',
                keyValue: generateSecret(),
                keyHash: '',
                rateLimit: 10000,
                status: 'active',
                lastUsed: null,
                expiresAt: null
            }
        ];

        if (teacherUser) {
            apiKeys.push({
                userId: teacherUser.id,
                tenantId: 'default-tenant',
                keyType: 'public',
                keyValue: generateApiKey(),
                keyHash: '',
                rateLimit: 1000,
                status: 'active',
                lastUsed: null,
                expiresAt: null
            });
        }

        for (const key of apiKeys) {
            try {
                key.keyHash = hashKey(key.keyValue);
                const created = await pb.collection('api_keys').create(key);
                console.log(`✅ Created ${key.keyType} API key for user ${key.userId.substring(0, 8)}... (Rate: ${key.rateLimit}/hour)`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  API key already exists for user ${key.userId.substring(0, 8)}...`);
                } else {
                    console.error(`❌ Error creating API key:`, error.message);
                }
            }
        }

        // ==========================================
        // 2. Seed Plugins
        // ==========================================
        console.log('\n=== Seeding Plugin Marketplace ===\n');

        const plugins = [
            {
                pluginId: 'google-calendar-sync',
                name: 'Google Calendar Sync',
                description: 'Sync your assignments and classes with Google Calendar automatically',
                authorId: ownerUser.id,
                version: '1.2.0',
                manifest: {
                    entry: 'index.js',
                    permissions: ['calendar.read', 'calendar.write'],
                    hooks: ['assignment.created', 'class.scheduled']
                },
                downloads: 1547,
                revenue: 3094.00,
                price: 9.99,
                revenueShare: 0.70,
                category: 'integration',
                tags: ['google', 'calendar', 'sync', 'productivity'],
                status: 'active',
                verified: true,
                rating: 4.8,
                reviewCount: 234,
                repositoryUrl: 'https://github.com/grow-your-need/google-calendar-sync',
                documentationUrl: 'https://docs.growyourneed.com/plugins/google-calendar-sync'
            },
            {
                pluginId: 'ai-grade-assistant',
                name: 'AI Grade Assistant',
                description: 'Auto-grade essays and assignments using advanced AI models',
                authorId: ownerUser.id,
                version: '2.0.1',
                manifest: {
                    entry: 'index.js',
                    permissions: ['assignments.read', 'grades.write', 'ai.access'],
                    hooks: ['assignment.submitted']
                },
                downloads: 892,
                revenue: 2676.00,
                price: 14.99,
                revenueShare: 0.70,
                category: 'education',
                tags: ['ai', 'grading', 'automation', 'teacher'],
                status: 'active',
                verified: true,
                rating: 4.9,
                reviewCount: 156,
                repositoryUrl: 'https://github.com/grow-your-need/ai-grade-assistant',
                documentationUrl: 'https://docs.growyourneed.com/plugins/ai-grade-assistant'
            },
            {
                pluginId: 'attendance-tracker-pro',
                name: 'Attendance Tracker Pro',
                description: 'Advanced attendance tracking with QR codes and geofencing',
                authorId: ownerUser.id,
                version: '1.5.3',
                manifest: {
                    entry: 'index.js',
                    permissions: ['attendance.read', 'attendance.write', 'location.access'],
                    hooks: ['class.started']
                },
                downloads: 2341,
                revenue: 4682.00,
                price: 7.99,
                revenueShare: 0.70,
                category: 'education',
                tags: ['attendance', 'qr', 'geofencing', 'tracking'],
                status: 'active',
                verified: true,
                rating: 4.7,
                reviewCount: 412,
                repositoryUrl: 'https://github.com/grow-your-need/attendance-tracker-pro',
                documentationUrl: 'https://docs.growyourneed.com/plugins/attendance-tracker-pro'
            },
            {
                pluginId: 'slack-notifications',
                name: 'Slack Notifications',
                description: 'Send notifications to Slack channels for important events',
                authorId: ownerUser.id,
                version: '1.0.5',
                manifest: {
                    entry: 'index.js',
                    permissions: ['notifications.send'],
                    hooks: ['assignment.due', 'grade.published', 'message.received']
                },
                downloads: 567,
                revenue: 0, // Free plugin
                price: 0,
                revenueShare: 0.70,
                category: 'communication',
                tags: ['slack', 'notifications', 'integration'],
                status: 'active',
                verified: true,
                rating: 4.6,
                reviewCount: 89,
                repositoryUrl: 'https://github.com/grow-your-need/slack-notifications',
                documentationUrl: 'https://docs.growyourneed.com/plugins/slack-notifications'
            },
            {
                pluginId: 'analytics-dashboard',
                name: 'Advanced Analytics Dashboard',
                description: 'Comprehensive analytics with custom charts and reports',
                authorId: ownerUser.id,
                version: '3.1.0',
                manifest: {
                    entry: 'index.js',
                    permissions: ['analytics.read', 'reports.generate'],
                    hooks: []
                },
                downloads: 1823,
                revenue: 9115.00,
                price: 19.99,
                revenueShare: 0.70,
                category: 'analytics',
                tags: ['analytics', 'charts', 'reports', 'dashboard'],
                status: 'active',
                verified: true,
                rating: 4.9,
                reviewCount: 267,
                repositoryUrl: 'https://github.com/grow-your-need/analytics-dashboard',
                documentationUrl: 'https://docs.growyourneed.com/plugins/analytics-dashboard'
            },
            {
                pluginId: 'zoom-integration',
                name: 'Zoom Integration',
                description: 'Create and manage Zoom meetings directly from the platform',
                authorId: ownerUser.id,
                version: '2.3.1',
                manifest: {
                    entry: 'index.js',
                    permissions: ['meetings.create', 'meetings.manage'],
                    hooks: ['class.scheduled']
                },
                downloads: 3421,
                revenue: 6842.00,
                price: 9.99,
                revenueShare: 0.70,
                category: 'integration',
                tags: ['zoom', 'video', 'meetings', 'conferencing'],
                status: 'active',
                verified: true,
                rating: 4.8,
                reviewCount: 534,
                repositoryUrl: 'https://github.com/grow-your-need/zoom-integration',
                documentationUrl: 'https://docs.growyourneed.com/plugins/zoom-integration'
            },
            {
                pluginId: 'gamification-badges',
                name: 'Gamification Badges',
                description: 'Add custom badges and achievements to gamify learning',
                authorId: ownerUser.id,
                version: '1.8.2',
                manifest: {
                    entry: 'index.js',
                    permissions: ['gamification.write', 'achievements.create'],
                    hooks: ['assignment.completed', 'quiz.passed']
                },
                downloads: 1234,
                revenue: 4321.00,
                price: 12.99,
                revenueShare: 0.70,
                category: 'education',
                tags: ['gamification', 'badges', 'achievements', 'motivation'],
                status: 'active',
                verified: true,
                rating: 4.7,
                reviewCount: 198,
                repositoryUrl: 'https://github.com/grow-your-need/gamification-badges',
                documentationUrl: 'https://docs.growyourneed.com/plugins/gamification-badges'
            },
            {
                pluginId: 'stripe-payments',
                name: 'Stripe Payment Gateway',
                description: 'Accept payments for courses, materials, and fees via Stripe',
                authorId: ownerUser.id,
                version: '2.5.0',
                manifest: {
                    entry: 'index.js',
                    permissions: ['payments.process', 'invoices.create'],
                    hooks: ['enrollment.created', 'invoice.generated']
                },
                downloads: 2876,
                revenue: 11504.00,
                price: 14.99,
                revenueShare: 0.70,
                category: 'integration',
                tags: ['stripe', 'payments', 'billing', 'finance'],
                status: 'active',
                verified: true,
                rating: 4.9,
                reviewCount: 445,
                repositoryUrl: 'https://github.com/grow-your-need/stripe-payments',
                documentationUrl: 'https://docs.growyourneed.com/plugins/stripe-payments'
            },
            {
                pluginId: 'plagiarism-detector',
                name: 'Plagiarism Detector Pro',
                description: 'Check assignments for plagiarism using advanced AI',
                authorId: ownerUser.id,
                version: '1.4.1',
                manifest: {
                    entry: 'index.js',
                    permissions: ['assignments.read', 'ai.access'],
                    hooks: ['assignment.submitted']
                },
                downloads: 1645,
                revenue: 8225.00,
                price: 17.99,
                revenueShare: 0.70,
                category: 'education',
                tags: ['plagiarism', 'ai', 'integrity', 'detection'],
                status: 'active',
                verified: true,
                rating: 4.8,
                reviewCount: 312,
                repositoryUrl: 'https://github.com/grow-your-need/plagiarism-detector',
                documentationUrl: 'https://docs.growyourneed.com/plugins/plagiarism-detector'
            },
            {
                pluginId: 'export-to-excel',
                name: 'Export to Excel',
                description: 'Export grades, attendance, and reports to Excel format',
                authorId: ownerUser.id,
                version: '1.1.0',
                manifest: {
                    entry: 'index.js',
                    permissions: ['data.export'],
                    hooks: []
                },
                downloads: 4521,
                revenue: 0, // Free plugin
                price: 0,
                revenueShare: 0.70,
                category: 'productivity',
                tags: ['excel', 'export', 'reports', 'data'],
                status: 'active',
                verified: true,
                rating: 4.5,
                reviewCount: 678,
                repositoryUrl: 'https://github.com/grow-your-need/export-to-excel',
                documentationUrl: 'https://docs.growyourneed.com/plugins/export-to-excel'
            }
        ];

        for (const plugin of plugins) {
            try {
                await pb.collection('plugins').create(plugin);
                console.log(`✅ Created plugin: ${plugin.name} (${plugin.downloads} downloads, $${plugin.revenue} revenue)`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Plugin already exists: ${plugin.name}`);
                } else {
                    console.error(`❌ Error creating plugin ${plugin.name}:`, error.message);
                }
            }
        }

        // ==========================================
        // 3. Seed Plugin Installs
        // ==========================================
        console.log('\n=== Seeding Plugin Installs ===\n');

        const pluginInstalls = [];

        // Owner installs all plugins
        const installedPlugins = await pb.collection('plugins').getFullList({ limit: 5 });
        for (const plugin of installedPlugins) {
            pluginInstalls.push({
                userId: ownerUser.id,
                tenantId: 'default-tenant',
                pluginId: plugin.id,
                installedAt: new Date().toISOString(),
                config: { enabled: true },
                enabled: true,
                version: plugin.version
            });
        }

        // Teacher installs some plugins
        if (teacherUser) {
            for (const plugin of installedPlugins.slice(0, 3)) {
                pluginInstalls.push({
                    userId: teacherUser.id,
                    tenantId: 'default-tenant',
                    pluginId: plugin.id,
                    installedAt: new Date().toISOString(),
                    config: { enabled: true },
                    enabled: true,
                    version: plugin.version
                });
            }
        }

        for (const install of pluginInstalls) {
            try {
                await pb.collection('plugin_installs').create(install);
                console.log(`✅ Installed plugin for user ${install.userId.substring(0, 8)}...`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Plugin install already exists`);
                } else {
                    console.error(`❌ Error creating plugin install:`, error.message);
                }
            }
        }

        // ==========================================
        // 4. Seed Webhooks
        // ==========================================
        console.log('\n=== Seeding Webhooks ===\n');

        const webhooks = [
            {
                userId: ownerUser.id,
                tenantId: 'default-tenant',
                url: 'https://api.example.com/webhooks/assignments',
                secret: generateWebhookSecret(),
                events: ['assignment.created', 'assignment.updated', 'assignment.deleted'],
                status: 'active',
                lastTriggered: null,
                failureCount: 0,
                metadata: { description: 'Assignment notifications' }
            },
            {
                userId: ownerUser.id,
                tenantId: 'default-tenant',
                url: 'https://api.example.com/webhooks/grades',
                secret: generateWebhookSecret(),
                events: ['grade.published', 'grade.updated'],
                status: 'active',
                lastTriggered: null,
                failureCount: 0,
                metadata: { description: 'Grade notifications' }
            }
        ];

        for (const webhook of webhooks) {
            try {
                await pb.collection('webhooks').create(webhook);
                console.log(`✅ Created webhook: ${webhook.url} (${webhook.events.length} events)`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Webhook already exists: ${webhook.url}`);
                } else {
                    console.error(`❌ Error creating webhook:`, error.message);
                }
            }
        }

        // ==========================================
        // 5. Summary
        // ==========================================
        console.log('\n=== Summary ===\n');
        console.log(`✅ API Keys: ${apiKeys.length} created`);
        console.log(`✅ Plugins: ${plugins.length} created`);
        console.log(`✅ Plugin Installs: ${pluginInstalls.length} created`);
        console.log(`✅ Webhooks: ${webhooks.length} created`);
        
        console.log('\n📊 Plugin Marketplace Stats:');
        console.log(`   Total Downloads: ${plugins.reduce((sum, p) => sum + p.downloads, 0)}`);
        console.log(`   Total Revenue: $${plugins.reduce((sum, p) => sum + p.revenue, 0).toFixed(2)}`);
        console.log(`   Average Rating: ${(plugins.reduce((sum, p) => sum + p.rating, 0) / plugins.length).toFixed(1)}`);
        
        console.log('\n✨ Developer Platform data seeding complete!');
        console.log('\n🚀 Next steps:');
        console.log('   1. Create developerPlatformService.ts');
        console.log('   2. Wire IntegrationSettings.tsx to backend API');
        console.log('   3. Test API key generation and plugin installation');
        
    } catch (error) {
        console.error('❌ Data seeding failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
