import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

async function verifyApiRules() {
    console.log('🔍 Verifying PocketBase API Rules...');

    try {
        // Authenticate as admin
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authenticated');

        const collections = await pb.collections.getFullList();
        
        console.log('\n' + '='.repeat(80));
        console.log(String('COLLECTION').padEnd(25) + String('LIST').padEnd(20) + String('VIEW').padEnd(20) + String('CREATE').padEnd(20));
        console.log('='.repeat(80));

        let publicCount = 0;
        let authCount = 0;
        let adminCount = 0;

        for (const col of collections) {
            const rules = {
                list: col.listRule,
                view: col.viewRule,
                create: col.createRule,
                update: col.updateRule,
                delete: col.deleteRule
            };

            // Helper to format rule string
            const fmt = (r) => {
                if (r === '' || r === null && col.type === 'auth') return 'PUBLIC (⚠️)'; // Auth collection empty rule means public
                if (r === '') return 'PUBLIC (⚠️)';
                if (r === null) return 'ADMIN ONLY';
                if (r.includes('@request.auth.id')) return 'AUTH USER';
                return r.substring(0, 18) + '...';
            };

            console.log(
                col.name.padEnd(25) + 
                fmt(col.listRule).padEnd(20) + 
                fmt(col.viewRule).padEnd(20) + 
                fmt(col.createRule).padEnd(20)
            );

            // Simple stats based on list rule
            if (col.listRule === '') publicCount++;
            else if (col.listRule === null) adminCount++;
            else authCount++;
        }

        console.log('='.repeat(80));
        console.log(`\n📊 Summary:`);
        console.log(`   - Public Collections: ${publicCount} (⚠️ Check these!)`);
        console.log(`   - Authenticated Only: ${authCount}`);
        console.log(`   - Admin Only:         ${adminCount}`);
        console.log('\n💡 Legend:');
        console.log('   - PUBLIC: Accessible by anyone (guests).');
        console.log('   - AUTH USER: Accessible by logged-in users.');
        console.log('   - ADMIN ONLY: Accessible only via Admin Dashboard/API.');

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
    }
}

verifyApiRules();
