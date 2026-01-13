#!/usr/bin/env node

/**
 * Auth Testing Script
 * Tests authentication flow: login, role checking, and logout
 */

import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Test users - verified working credentials
const TEST_USERS = [
  { email: 'teacher@school.com', password: '123456789', role: 'Teacher', name: 'Teacher (Verified)' },
  // Additional users can be added after database seeding:
  // { email: 'admin@growyourneed.com', password: '12345678', role: 'Owner', name: 'Admin (Owner)' },
  // { email: 'student@school.com', password: '123456789', role: 'Student', name: 'Student' },
];

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAuth(user) {
  console.log(`\n📝 Testing: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  
  try {
    // Test 1: Login
    console.log(`   ⏳ Attempting login...`);
    const loginResponse = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: user.email,
        password: user.password
      })
    });

    if (!loginResponse.ok) {
      console.log(`   ❌ Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      const error = await loginResponse.text();
      console.log(`      Error: ${error}`);
      return false;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    const userRecord = loginData.record;

    console.log(`   ✅ Login successful!`);
    console.log(`      User ID: ${userRecord.id}`);
    console.log(`      Email: ${userRecord.email}`);
    console.log(`      Role: ${userRecord.role}`);
    console.log(`      Token: ${token.substring(0, 20)}...`);

    // Test 2: Verify token by fetching protected data
    console.log(`   ⏳ Verifying token with protected request...`);
    const verifyResponse = await fetch(`${PB_URL}/api/collections/users/records/${userRecord.id}`, {
      headers: {
        'Authorization': token
      }
    });

    if (!verifyResponse.ok) {
      console.log(`   ❌ Token verification failed: ${verifyResponse.status}`);
      return false;
    }

    const verifiedData = await verifyResponse.json();
    console.log(`   ✅ Token verified - protected request successful!`);
    console.log(`      Verified User: ${verifiedData.email} (${verifiedData.role})`);

    // Test 3: Check role-based access
    console.log(`   ⏳ Checking role-based access...`);
    if (userRecord.role === user.role) {
      console.log(`   ✅ Role verified: ${userRecord.role}`);
    } else {
      console.log(`   ⚠️  Role mismatch: Expected ${user.role}, got ${userRecord.role}`);
    }

    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 GROW YOUR NEED - AUTHENTICATION TEST');
  console.log('='.repeat(60));
  console.log(`PocketBase URL: ${PB_URL}`);
  console.log(`Testing at: ${new Date().toLocaleString()}`);

  // Wait for services to be ready
  console.log('\n⏳ Checking PocketBase health...');
  let isReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const health = await fetch(`${PB_URL}/api/health`);
      if (health.ok) {
        console.log('✅ PocketBase is ready\n');
        isReady = true;
        break;
      }
    } catch (err) {
      // Not ready yet
    }
    if (i < 9) {
      process.stdout.write(`⏳ Waiting (${i + 1}/10)...\r`);
      await wait(1000);
    }
  }

  if (!isReady) {
    console.log('❌ PocketBase did not become ready after 10 seconds');
    process.exit(1);
  }

  // Test each user
  let passCount = 0;
  for (const user of TEST_USERS) {
    const passed = await testAuth(user);
    if (passed) passCount++;
    await wait(500);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 TEST SUMMARY: ${passCount}/${TEST_USERS.length} users authenticated successfully`);
  console.log('='.repeat(60));

  if (passCount === TEST_USERS.length) {
    console.log('✅ ALL AUTHENTICATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
