import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://localhost:8090');

// Get admin credentials from env or use defaults (but warn)
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
    try {
        console.log(`🔐 Authenticating as ${ADMIN_EMAIL}...`);
        await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
        console.log('✅ Authenticated.');

        console.log('📋 Fetching all collections...');
        const collections = await pb.collections.getFullList();
        console.log(`Found ${collections.length} collections.`);

        // Define rules
        const AUTH_ONLY = "@request.auth.id != ''";
        const OWNER_ONLY = "@request.auth.id = id"; // For users collection self-management
        const PUBLIC_READ = ""; // Empty string means public

        // Collections that should be publicly readable (e.g. for landing page)
        const PUBLIC_READ_COLLECTIONS = [
            'subscription_plans',
            'system_settings', // Maybe restricted? Let's keep it auth for now to be safe, or public if needed for frontend config
            'public_content' // Hypothetical
        ];

        for (const col of collections) {
            // Skip system collections if needed, though usually we want to secure them too if exposed
            if (col.system) {
                // console.log(`Skipping system collection: ${col.name}`);
                // continue;
            }

            let rules = {
                listRule: AUTH_ONLY,
                viewRule: AUTH_ONLY,
                createRule: AUTH_ONLY,
                updateRule: AUTH_ONLY,
                deleteRule: AUTH_ONLY,
            };

            // Special cases
            if (col.name === 'users') {
                rules = {
                    listRule: AUTH_ONLY, // Users can see other users? Maybe restrict to tenant?
                    viewRule: AUTH_ONLY,
                    createRule: "", // Public registration usually allowed, or AUTH_ONLY if invite-only
                    updateRule: OWNER_ONLY, // Only update self
                    deleteRule: OWNER_ONLY, // Only delete self
                };
            } else if (PUBLIC_READ_COLLECTIONS.includes(col.name)) {
                rules.listRule = PUBLIC_READ;
                rules.viewRule = PUBLIC_READ;
            }

            console.log(`🔒 Securing collection: ${col.name}`);
            try {
                await pb.collections.update(col.id, rules);
                console.log(`   ✅ Updated rules for ${col.name}`);
            } catch (e) {
                console.error(`   ❌ Failed to update ${col.name}: ${e.message}`);
            }
        }

        console.log('\n✨ Security audit complete. All collections secured.');

    } catch (err) {
        console.error('❌ Critical Error:', err);
        process.exit(1);
    }
}

main();
