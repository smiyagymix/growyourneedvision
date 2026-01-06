import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function fixSecurityRules() {
    console.log('🔒 Securing PocketBase API Rules...');

    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');

        // 1. Fix Dangerous Public Collections
        const publicToAuth = [
            'finance_transactions',
            'wellness_logs',
            'deals',
            'contacts',
            'products', // Assuming marketplace needs auth to buy, maybe public to view? Let's secure for now.
            'knowledge_base'
        ];

        const authRule = "@request.auth.id != ''";
        const ownerRule = "@request.auth.id = user.id"; // For personal data

        for (const name of publicToAuth) {
            try {
                const col = await pb.collections.getOne(name);
                console.log(`Securing ${name}...`);
                
                // Apply basic auth rule
                col.listRule = authRule;
                col.viewRule = authRule;
                col.createRule = authRule;
                col.updateRule = authRule;
                col.deleteRule = authRule;

                // Refine for specific collections if possible
                if (name === 'wellness_logs') {
                    col.listRule = ownerRule;
                    col.viewRule = ownerRule;
                    col.updateRule = ownerRule;
                    col.deleteRule = ownerRule;
                    // createRule stays authRule (any user can create their own log)
                }

                await pb.collections.update(name, col);
                console.log(`✅ Secured ${name}`);
            } catch (err) {
                console.error(`⚠️ Could not update ${name}: ${err.message}`);
            }
        }

        // 2. Open up "Admin Only" collections that likely need App access
        // These were null (Admin Only) in the report
        const adminToAuth = [
            'students',
            'grades',
            'enrollments',
            'timetables',
            'announcements',
            'file_uploads',
            'notifications'
        ];

        for (const name of adminToAuth) {
            try {
                const col = await pb.collections.getOne(name);
                // Only update if currently Admin Only (null)
                if (col.listRule === null) {
                    console.log(`Opening access for ${name}...`);
                    col.listRule = authRule;
                    col.viewRule = authRule;
                    col.createRule = authRule;
                    col.updateRule = authRule;
                    col.deleteRule = authRule;
                    await pb.collections.update(name, col);
                    console.log(`✅ Updated ${name} to Authenticated Users`);
                }
            } catch (err) {
                // Ignore if collection doesn't exist
            }
        }

        console.log('✨ Security rules update complete!');

    } catch (err) {
        console.error('❌ Security update failed:', err.message);
    }
}

fixSecurityRules();
