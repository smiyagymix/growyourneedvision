#!/usr/bin/env node

/**
 * Create test users for all roles with admin authentication
 * Uses PocketBase admin credentials to ensure users are properly created
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// PocketBase admin credentials (from environment or defaults)
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'Darnag123456789@';

// Test users for all roles
const TEST_USERS = [
  { email: 'owner@growyourneed.com', password: '12345678', role: 'Owner', name: 'Platform Owner' },
  { email: 'admin@school.com', password: '12345678', role: 'SchoolAdmin', name: 'School Administrator' },
  { email: 'teacher@school.com', password: '123456789', role: 'Teacher', name: 'John Teacher' },
  { email: 'student@school.com', password: '123456789', role: 'Student', name: 'Jane Student' },
  { email: 'parent@school.com', password: '123456789', role: 'Parent', name: 'Parent Guardian' },
  { email: 'individual@example.com', password: '123456789', role: 'Individual', name: 'Individual User' },
];

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Create Test Users For All Roles (Admin Auth)         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Authenticate as admin
    console.log(`⏳ Authenticating as PocketBase admin (${ADMIN_EMAIL})...`);
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Admin authenticated\n');

    let created = 0;
    let skipped = 0;
    let failed = 0;

    // Create each user
    for (const userData of TEST_USERS) {
      process.stdout.write(`🔍 ${userData.role.padEnd(12)} (${userData.email}) ... `);

      try {
        // Try to find existing user
        let user = null;
        try {
          user = await pb.collection('users').getFirstListItem(`email="${userData.email}"`);
        } catch (e) {
          // User doesn't exist, that's fine
        }

        if (user) {
          console.log(`⏭️  Already exists`);
          skipped++;
          continue;
        }

        // Create the user
        const newUser = await pb.collection('users').create({
          email: userData.email,
          password: userData.password,
          passwordConfirm: userData.password,
          role: userData.role,
          name: userData.name,
          verified: true, // Auto-verify test users
        });

        console.log(`✅ Created`);
        console.log(`   └─ ID: ${newUser.id.substring(0, 8)}..., Password: ${userData.password}`);
        created++;
      } catch (error) {
        if (error.response?.data?.email?.message?.includes('already')) {
          console.log(`⏭️  Already exists`);
          skipped++;
        } else {
          console.log(`❌ Failed - ${error.message}`);
          failed++;
        }
      }
    }

    console.log('\n' + '═'.repeat(56));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Created:  ${created}`);
    console.log(`   ⏭️  Skipped:  ${skipped}`);
    console.log(`   ❌ Failed:   ${failed}`);
    console.log('═'.repeat(56));

    console.log('\n📋 Test Credentials:\n');
    TEST_USERS.forEach((user) => {
      console.log(`${user.role.padEnd(12)} | Email: ${user.email.padEnd(30)} | Password: ${user.password}`);
    });

    console.log('\n✨ All users ready for testing!\n');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

await main();
