import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

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
        const studentUser = users.find(u => u.email === 'student@school.com');

        if (!ownerUser) {
            console.error('❌ Owner user not found. Please run seed-data.js first.');
            process.exit(1);
        }

        console.log(`✅ Found users: Owner, ${studentUser ? 'Student' : '(no student)'}\n`);

        // ==========================================
        // 1. Seed Currencies
        // ==========================================
        console.log('=== Seeding Currencies ===\n');

        const currencies = [
            { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.0, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 149.50, baseCurrency: 'USD', decimalPlaces: 0, active: true },
            { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', exchangeRate: 7.24, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 83.12, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 1.52, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 1.36, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', exchangeRate: 0.88, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', exchangeRate: 4.97, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', exchangeRate: 17.05, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchangeRate: 3.67, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', exchangeRate: 3.75, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'ZAR', name: 'South African Rand', symbol: 'R', exchangeRate: 18.65, baseCurrency: 'USD', decimalPlaces: 2, active: true },
            { code: 'KRW', name: 'South Korean Won', symbol: '₩', exchangeRate: 1305.20, baseCurrency: 'USD', decimalPlaces: 0, active: true }
        ];

        for (const currency of currencies) {
            try {
                currency.lastUpdated = new Date().toISOString();
                await pb.collection('currencies').create(currency);
                console.log(`✅ Created currency: ${currency.code} - ${currency.name} (${currency.symbol})`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Currency already exists: ${currency.code}`);
                } else {
                    console.error(`❌ Error creating currency ${currency.code}:`, error.message);
                }
            }
        }

        // ==========================================
        // 2. Seed Languages
        // ==========================================
        console.log('\n=== Seeding Language Settings ===\n');

        const languages = [
            { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇺🇸', enabled: true, isDefault: true, completionPercentage: 100 },
            { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸', enabled: true, isDefault: false, completionPercentage: 95 },
            { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷', enabled: true, isDefault: false, completionPercentage: 92 },
            { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪', enabled: true, isDefault: false, completionPercentage: 88 },
            { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦', enabled: true, isDefault: false, completionPercentage: 90 },
            { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', flag: '🇨🇳', enabled: true, isDefault: false, completionPercentage: 85 },
            { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', flag: '🇯🇵', enabled: true, isDefault: false, completionPercentage: 82 },
            { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', flag: '🇮🇳', enabled: true, isDefault: false, completionPercentage: 78 },
            { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', flag: '🇧🇷', enabled: true, isDefault: false, completionPercentage: 93 },
            { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', flag: '🇷🇺', enabled: true, isDefault: false, completionPercentage: 75 },
            { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', flag: '🇰🇷', enabled: true, isDefault: false, completionPercentage: 80 },
            { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', flag: '🇮🇹', enabled: true, isDefault: false, completionPercentage: 87 }
        ];

        for (const lang of languages) {
            try {
                lang.tenantId = 'default-tenant';
                lang.translatorId = null;
                await pb.collection('language_settings').create(lang);
                console.log(`✅ Created language: ${lang.name} (${lang.nativeName}) - ${lang.completionPercentage}% complete`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Language already exists: ${lang.code}`);
                } else {
                    console.error(`❌ Error creating language ${lang.code}:`, error.message);
                }
            }
        }

        // ==========================================
        // 3. Seed Regional Settings
        // ==========================================
        console.log('\n=== Seeding Regional Settings ===\n');

        const regionalSettings = [
            {
                tenantId: 'default-tenant',
                region: 'North America',
                country: 'United States',
                timezone: 'America/New_York',
                currency: 'USD',
                language: 'en',
                secondaryLanguages: ['es', 'fr'],
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h',
                compliance: {
                    GDPR: false,
                    PIPL: false,
                    LGPD: false,
                    IT_ACT: false,
                    COPPA: true
                },
                taxConfig: { salesTax: 0.07, vatEnabled: false },
                dataResidency: 'us-east-1',
                active: true
            },
            {
                tenantId: 'eu-tenant-1',
                region: 'Europe',
                country: 'Germany',
                timezone: 'Europe/Berlin',
                currency: 'EUR',
                language: 'de',
                secondaryLanguages: ['en', 'fr'],
                dateFormat: 'DD.MM.YYYY',
                timeFormat: '24h',
                compliance: {
                    GDPR: true,
                    PIPL: false,
                    LGPD: false,
                    IT_ACT: false,
                    COPPA: false
                },
                taxConfig: { salesTax: 0, vatEnabled: true, vatRate: 0.19 },
                dataResidency: 'eu-central-1',
                active: true
            },
            {
                tenantId: 'asia-tenant-1',
                region: 'Asia',
                country: 'China',
                timezone: 'Asia/Shanghai',
                currency: 'CNY',
                language: 'zh',
                secondaryLanguages: ['en'],
                dateFormat: 'YYYY-MM-DD',
                timeFormat: '24h',
                compliance: {
                    GDPR: false,
                    PIPL: true,
                    LGPD: false,
                    IT_ACT: false,
                    COPPA: false
                },
                taxConfig: { salesTax: 0.13, vatEnabled: false },
                dataResidency: 'cn-north-1',
                active: true
            }
        ];

        for (const setting of regionalSettings) {
            try {
                await pb.collection('regional_settings').create(setting);
                console.log(`✅ Created regional setting: ${setting.country} (${setting.region})`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Regional setting already exists: ${setting.country}`);
                } else {
                    console.error(`❌ Error creating regional setting:`, error.message);
                }
            }
        }

        // ==========================================
        // 4. Seed Sample Translations
        // ==========================================
        console.log('\n=== Seeding Sample Translations ===\n');

        const translations = [
            { key: 'welcome_message', language: 'en', value: 'Welcome to Grow Your Need', context: 'Homepage', category: 'ui', autoGenerated: false, verified: true },
            { key: 'welcome_message', language: 'es', value: 'Bienvenido a Grow Your Need', context: 'Homepage', category: 'ui', autoGenerated: true, verified: true },
            { key: 'welcome_message', language: 'fr', value: 'Bienvenue à Grow Your Need', context: 'Homepage', category: 'ui', autoGenerated: true, verified: true },
            { key: 'welcome_message', language: 'de', value: 'Willkommen bei Grow Your Need', context: 'Homepage', category: 'ui', autoGenerated: true, verified: true },
            { key: 'welcome_message', language: 'ar', value: 'مرحبا بكم في Grow Your Need', context: 'Homepage', category: 'ui', autoGenerated: true, verified: true },
            
            { key: 'dashboard', language: 'en', value: 'Dashboard', context: 'Navigation', category: 'ui', autoGenerated: false, verified: true },
            { key: 'dashboard', language: 'es', value: 'Panel', context: 'Navigation', category: 'ui', autoGenerated: true, verified: true },
            { key: 'dashboard', language: 'fr', value: 'Tableau de bord', context: 'Navigation', category: 'ui', autoGenerated: true, verified: true },
            { key: 'dashboard', language: 'de', value: 'Übersicht', context: 'Navigation', category: 'ui', autoGenerated: true, verified: true },
            
            { key: 'assignments', language: 'en', value: 'Assignments', context: 'Navigation', category: 'ui', autoGenerated: false, verified: true },
            { key: 'assignments', language: 'es', value: 'Tareas', context: 'Navigation', category: 'ui', autoGenerated: true, verified: true },
            { key: 'assignments', language: 'fr', value: 'Devoirs', context: 'Navigation', category: 'ui', autoGenerated: true, verified: true },
            { key: 'assignments', language: 'de', value: 'Aufgaben', context: 'Navigation', category: 'ui', autoGenerated: true, verified: true }
        ];

        for (const translation of translations) {
            try {
                translation.translatorId = null;
                translation.metadata = { source: 'seed' };
                await pb.collection('translations').create(translation);
                console.log(`✅ Created translation: ${translation.key} (${translation.language})`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Translation already exists: ${translation.key} (${translation.language})`);
                } else {
                    console.error(`❌ Error creating translation:`, error.message);
                }
            }
        }

        // ==========================================
        // 5. Seed Compliance Logs
        // ==========================================
        console.log('\n=== Seeding Compliance Logs ===\n');

        const complianceLogs = [
            {
                tenantId: 'default-tenant',
                regulation: 'GDPR',
                action: 'Data access request',
                userId: studentUser ? studentUser.id : null,
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0',
                data: { requestType: 'access', dataCategories: ['personal', 'academic'] },
                severity: 'info',
                status: 'logged'
            },
            {
                tenantId: 'eu-tenant-1',
                regulation: 'GDPR',
                action: 'Data deletion request',
                userId: null,
                ipAddress: '192.168.1.101',
                userAgent: 'Mozilla/5.0',
                data: { requestType: 'deletion', dataCategories: ['personal'] },
                severity: 'warning',
                status: 'logged'
            },
            {
                tenantId: 'asia-tenant-1',
                regulation: 'PIPL',
                action: 'Cross-border data transfer',
                userId: null,
                ipAddress: '192.168.1.102',
                userAgent: 'Mozilla/5.0',
                data: { destination: 'Singapore', dataSize: '50MB' },
                severity: 'info',
                status: 'logged'
            }
        ];

        for (const log of complianceLogs) {
            try {
                await pb.collection('compliance_logs').create(log);
                console.log(`✅ Created compliance log: ${log.regulation} - ${log.action}`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    console.log(`⚠️  Compliance log already exists`);
                } else {
                    console.error(`❌ Error creating compliance log:`, error.message);
                }
            }
        }

        // ==========================================
        // 6. Summary
        // ==========================================
        console.log('\n=== Summary ===\n');
        console.log(`✅ Currencies: ${currencies.length} created`);
        console.log(`✅ Languages: ${languages.length} created`);
        console.log(`✅ Regional Settings: ${regionalSettings.length} created`);
        console.log(`✅ Translations: ${translations.length} created`);
        console.log(`✅ Compliance Logs: ${complianceLogs.length} created`);
        
        console.log('\n📊 Global Expansion Stats:');
        console.log(`   Supported Currencies: ${currencies.length}`);
        console.log(`   Active Languages: ${languages.filter(l => l.enabled).length}`);
        console.log(`   Average Translation Completion: ${(languages.reduce((sum, l) => sum + l.completionPercentage, 0) / languages.length).toFixed(1)}%`);
        console.log(`   Compliance Regions: ${regionalSettings.length}`);
        
        console.log('\n✨ Global Expansion data seeding complete!');
        console.log('\n🚀 Next steps:');
        console.log('   1. Create globalExpansionService.ts');
        console.log('   2. Wire SystemSettings.tsx to backend API');
        console.log('   3. Integrate DeepL/Google Translate API');
        console.log('   4. Test currency conversion and language switching');
        
    } catch (error) {
        console.error('❌ Data seeding failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
