/**
 * Apply PocketBase Collection Security Rules
 * 
 * This script applies Row-Level Security rules to all PocketBase collections
 * to prevent unauthorized data access. CRITICAL for production security.
 * 
 * Usage: node scripts/apply-pb-rules.js
 */

const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
const path = require('path');

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://localhost:8090');

async function authenticate() {
    try {
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD
        );
        console.log('✅ Authenticated as admin\n');
    } catch (err) {
        console.error('❌ Admin authentication failed:', err.message);
        console.log('Make sure PocketBase is running and admin credentials are correct');
        process.exit(1);
    }
}

async function backupCurrentRules() {
    console.log('📦 Backing up current rules...');
    const collections = await pb.collections.getFullList();
    const backup = [];

    for (const collection of collections) {
        backup.push({
            name: collection.name,
            listRule: collection.listRule,
            viewRule: collection.viewRule,
            createRule: collection.createRule,
            updateRule: collection.updateRule,
            deleteRule: collection.deleteRule
        });
    }

    const backupPath = path.join(__dirname, '../../pocketbase/rules-backup-' + Date.now() + '.json');
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup saved to: ${backupPath}\n`);
}

async function applyRules() {
    console.log('🔒 Applying security rules...\n');

    const rulesPath = path.join(__dirname, '../../pocketbase/pb-collection-rules.json');
    const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

    let applied = 0;
    let skipped = 0;
    let errors = 0;

    for (const collectionRule of rulesData.collections) {
        try {
            // Get collection
            const collection = await pb.collections.getOne(collectionRule.name);

            // Update rules
            await pb.collections.update(collection.id, {
                listRule: collectionRule.rules.listRule,
                viewRule: collectionRule.rules.viewRule,
                createRule: collectionRule.rules.createRule,
                updateRule: collectionRule.rules.updateRule,
                deleteRule: collectionRule.rules.deleteRule
            });

            console.log(`✅ Applied rules to: ${collectionRule.name}`);
            applied++;
        } catch (err) {
            if (err.status === 404) {
                console.log(`⚠️  Collection not found: ${collectionRule.name} (skipping...)`);
                skipped++;
            } else {
                console.error(`❌ Error applying rules to ${collectionRule.name}:`, err.message);
                errors++;
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Applied: ${applied} collections`);
    console.log(`   ⚠️  Skipped: ${skipped} collections (not found)`);
    console.log(`   ❌ Errors: ${errors} collections`);

    if (errors > 0) {
        console.log('\n⚠️  Some rules failed to apply. Check the errors above.');
        console.log('   You can restore from backup if needed.');
    } else if (applied > 0) {
        console.log('\n✨ All rules applied successfully!');
        console.log('   Your PocketBase collections are now secured with RLS.');
    }
}

async function verifyRules() {
    console.log('\n🔍 Verifying applied rules...\n');

    const rulesPath = path.join(__dirname, '../../pocketbase/pb-collection-rules.json');
    const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

    let verified = 0;
    let mismatched = 0;

    for (const collectionRule of rulesData.collections) {
        try {
            const collection = await pb.collections.getOne(collectionRule.name);

            const expectedRules = collectionRule.rules;
            const actualRules = {
                listRule: collection.listRule,
                viewRule: collection.viewRule,
                createRule: collection.createRule,
                updateRule: collection.updateRule,
                deleteRule: collection.deleteRule
            };

            // Check if rules match
            const rulesMatch =
                actualRules.listRule === expectedRules.listRule &&
                actualRules.viewRule === expectedRules.viewRule &&
                actualRules.createRule === expectedRules.createRule &&
                actualRules.updateRule === expectedRules.updateRule &&
                actualRules.deleteRule === expectedRules.deleteRule;

            if (rulesMatch) {
                console.log(`✅ ${collectionRule.name}: Rules verified`);
                verified++;
            } else {
                console.log(`⚠️  ${collectionRule.name}: Rules mismatch detected`);
                mismatched++;
            }
        } catch (err) {
            // Collection doesn't exist, skip
        }
    }

    console.log(`\n📊 Verification: ${verified} correct, ${mismatched} mismatched`);
}

async function main() {
    console.log('🔐 PocketBase Security Rules Application\n');
    console.log('⚠️  IMPORTANT: This will modify collection access rules');
    console.log('   A backup will be created before applying changes\n');

    await authenticate();
    await backupCurrentRules();
    await applyRules();
    await verifyRules();

    console.log('\n✅ Complete! Your collections are now protected.');
    console.log('\n📋 Next Steps:');
    console.log('   1. Test owner login and data access');
    console.log('   2. Test non-owner roles (should have limited access)');
    console.log('   3. Monitor for any permission errors');
}

main().catch(err => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
});
