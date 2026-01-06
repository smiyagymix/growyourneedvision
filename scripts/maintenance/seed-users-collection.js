import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

const USERS = [
    {
        email: process.env.POCKETBASE_ADMIN_EMAIL,
        password: process.env.POCKETBASE_ADMIN_PASSWORD,
        passwordConfirm: process.env.POCKETBASE_ADMIN_PASSWORD,
        name: 'Platform Owner',
        role: 'Owner'
    }
];

async function seedUsers() {
    console.log('🚀 Seeding Users Collection...');

    try {
        if (!process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
            throw new Error('Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD env vars');
        }

        // Authenticate as Admin to create users
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.POCKETBASE_ADMIN_PASSWORD
        );

        for (const user of USERS) {
            try {
                // Check if user exists
                const existing = await pb.collection('users').getList(1, 1, {
                    filter: `email = "${user.email}"`
                });

                if (existing.totalItems === 0) {
                    console.log(`   Creating user '${user.email}'...`);
                    await pb.collection('users').create({
                        email: user.email,
                        password: user.password,
                        passwordConfirm: user.passwordConfirm,
                        name: user.name,
                        role: user.role,
                        emailVisibility: true
                    });
                    console.log(`   ✅ Created user '${user.email}'`);
                } else {
                    console.log(`   ⚠️  User '${user.email}' already exists.`);
                    // Update role just in case
                    const userId = existing.items[0].id;
                    if (existing.items[0].role !== user.role) {
                        await pb.collection('users').update(userId, { role: user.role });
                        console.log(`   🔄 Updated role for '${user.email}' to '${user.role}'`);
                    }
                }
            } catch (e) {
                console.error(`   ❌ Failed to process user '${user.email}':`, e.message);
            }
        }

    } catch (e) {
        console.error("Fatal Error:", e);
    }
}

seedUsers();
