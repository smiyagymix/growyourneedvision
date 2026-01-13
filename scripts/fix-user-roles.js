#!/usr/bin/env node

/**
 * Fix User Roles - Update existing users with correct roles
 * Uses PocketBase admin SDK with super user credentials
 */

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Default credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123456';

// Users to fix/ensure
const USERS_TO_FIX = [
  { email: 'owner@growyourneed.com', role: 'Owner' },
  { email: 'admin@school.com', role: 'SchoolAdmin' },
  { email: 'student@school.com', role: 'Student' },
  { email: 'parent@school.com', role: 'Parent' },
];

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Fix User Roles                       ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Try to authenticate as admin
    console.log(`⏳ Trying admin authentication (${ADMIN_EMAIL})...`);
    try {
      await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ Admin authenticated\n');
    } catch (e) {
      console.log('⚠️  Admin auth failed, trying super user approach\n');
    }

    // Get all users and show their roles
    console.log('📋 Current users and their roles:\n');
    
    let page = 1;
    let allUsers = [];
    let hasMore = true;

    while (hasMore) {
      const result = await pb.collection('users').getList(page, 50);
      allUsers = allUsers.concat(result.items);
      hasMore = result.page < result.totalPages;
      page++;
    }

    allUsers.forEach((user) => {
      console.log(`  • ${user.email.padEnd(30)} | Role: ${(user.role || 'null').padEnd(15)} | Verified: ${user.verified}`);
    });

    console.log('\n' + '═'.repeat(56));
    console.log('Attempting to update roles...\n');

    // Try to update roles
    for (const userData of USERS_TO_FIX) {
      const user = allUsers.find(u => u.email === userData.email);
      if (!user) {
        console.log(`⏭️  ${userData.email} - Not found`);
        continue;
      }

      if (user.role === userData.role) {
        console.log(`✅ ${userData.email} - Already has ${userData.role} role`);
        continue;
      }

      process.stdout.write(`🔄 ${userData.email} - Updating from ${user.role} to ${userData.role}... `);

      try {
        await pb.collection('users').update(user.id, { role: userData.role });
        console.log('✅ Updated');
      } catch (error) {
        console.log(`❌ Failed - ${error.message}`);
      }
    }

    console.log('\n✨ Done!\n');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log('\nℹ️  Make sure PocketBase is running and you have proper credentials.');
    process.exit(1);
  }
}

await main();
