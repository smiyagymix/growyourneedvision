import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Configuration
const ADMIN_EMAIL = process.argv[2] || 'owner@growyourneed.com';
const ADMIN_PASSWORD = process.argv[3] || '12345678';

// ============================================================================
// SYSTEM SETTINGS SEED DATA
// ============================================================================

const SETTINGS = [
    // --- General Branding (White Labeling) ---
    {
        key: 'brand_name',
        value: 'Grow Your Need',
        description: 'The name of the platform displayed in title bars and emails.',
        category: 'General'
    },
    {
        key: 'brand_logo_url',
        value: '/logo.png', // Placeholder
        description: 'URL to the main logo image.',
        category: 'General'
    },
    {
        key: 'brand_primary_color',
        value: '#0F172A', // Slate 900
        description: 'Primary brand color for headers and buttons.',
        category: 'Appearance'
    },
    {
        key: 'brand_secondary_color',
        value: '#3B82F6', // Blue 500
        description: 'Secondary brand color for accents.',
        category: 'Appearance'
    },
    {
        key: 'portal_title',
        value: 'Admin Portal',
        description: 'Title text for the browser tab.',
        category: 'General'
    },

    // --- Feature Flags ---
    {
        key: 'enable_registration',
        value: true,
        description: 'Allow new users to sign up.',
        category: 'Features'
    },
    {
        key: 'enable_marketplace',
        value: true,
        description: 'Enable the App Marketplace module.',
        category: 'Features'
    },
    {
        key: 'enable_dark_mode',
        value: true,
        description: 'Allow users to switch to dark mode.',
        category: 'Features'
    },
    {
        key: 'maintenance_mode',
        value: false,
        description: 'Put the platform into maintenance mode (admins only).',
        category: 'System'
    },

    // --- Integrations ---
    {
        key: 'stripe_public_key',
        value: 'pk_test_sample',
        description: 'Stripe Public Key for payments.',
        category: 'Integrations'
    },
    {
        key: 'support_email',
        value: 'support@growyourneed.com',
        description: 'Contact email for support inquiries.',
        category: 'General'
    }
];

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
    console.log(`Starting Settings Seeding...`);
    console.log(`Target: ${pb.baseUrl}`);
    console.log(`User:   ${ADMIN_EMAIL}`);

    try {
        // 1. Authenticate
        await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✅ Authenticated as Admin');

        // 1.5 Debug: Check if collection exists
        try {
            const collections = await pb.collections.getFullList();
            const targetCollection = collections.find(c => c.name === 'platform_settings');
            if (targetCollection) {
                console.log('✅ Collection "platform_settings" found.');
            } else {
                console.warn('⚠️ Collection "platform_settings" NOT FOUND in collection list!');
                console.log('Available collections:', collections.map(c => c.name).join(', '));
            }
        } catch (err) {
            console.error('Error listing collections:', err.message);
        }

        // 2. Check & Seed Settings
        console.log(`\nChecking ${SETTINGS.length} settings...`);
        let changes = 0;

        // Fetch all existing settings to check efficiently in memory
        // This avoids potential 400 errors with specific field filters (like 'key')
        let existingSettings = [];
        try {
            existingSettings = await pb.collection('platform_settings').getFullList();
            console.log(`Loaded ${existingSettings.length} existing settings.`);
        } catch (e) {
            console.error('Error fetching existing settings:', e.status, e.message);
            // If completely failing to list, we might have bigger issues, but we can try creating anyway?
            // No, best to stop or proceed with caution.
        }

        const existingKeys = new Set(existingSettings.map(s => s.key));

        for (const setting of SETTINGS) {
            try {
                if (existingKeys.has(setting.key)) {
                    console.log(`  - [${setting.key}] Exists. Skipping.`);
                } else {
                    process.stdout.write(`  - [${setting.key}] Creating... `);
                    await pb.collection('platform_settings').create(setting);
                    console.log('Done.');
                    changes++;
                }
            } catch (e) {
                console.error(`  - [${setting.key}] Error creating:`, e.status, e.message);
                if (e.data) console.error('    Details:', JSON.stringify(e.data));
            }
        }

        console.log(`\n✨ Seeding Complete! Added ${changes} new settings.`);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
        console.log('Tip: Ensure PocketBase is running and credentials are correct.');
    }
}

main();
