#!/usr/bin/env node

/**
 * Create test users for all roles
 * This script directly creates users via the users collection API
 */

import http from 'http';

const PB_URL = 'http://127.0.0.1:8090';

// Make HTTP request helper
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(PB_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test users for all roles
const TEST_USERS = [
  { email: 'owner@growyourneed.com', password: 'OwnerPass123456@', role: 'Owner', name: 'Platform Owner' },
  { email: 'admin@school.com', password: 'AdminPass123456@', role: 'SchoolAdmin', name: 'School Administrator' },
  { email: 'teacher@school.com', password: '123456789', role: 'Teacher', name: 'John Teacher' },
  { email: 'student@school.com', password: 'StudentPass123@', role: 'Student', name: 'Jane Student' },
  { email: 'parent@school.com', password: 'ParentPass123456@', role: 'Parent', name: 'Parent Guardian' },
  { email: 'individual@example.com', password: '123456789', role: 'Individual', name: 'Individual User' },
];

async function userExists(email) {
  try {
    const response = await makeRequest(
      'GET',
      `/api/collections/users/records?filter=email%3D%22${encodeURIComponent(email)}%22`
    );
    if (response.status === 200 && response.data.items && response.data.items.length > 0) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function createUser(userData) {
  try {
    const response = await makeRequest('POST', '/api/collections/users/records', {
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
      role: userData.role,
      name: userData.name,
    });

    return { status: response.status, data: response.data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Create Test Users For All Roles                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Check PocketBase health
  console.log('⏳ Checking PocketBase...');
  try {
    const healthResponse = await makeRequest('GET', '/api/health');
    if (healthResponse.status !== 200) {
      console.error('❌ PocketBase not responding');
      process.exit(1);
    }
    console.log('✅ PocketBase is running\n');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Create each user
  for (const userData of TEST_USERS) {
    process.stdout.write(`🔍 ${userData.role.padEnd(12)} (${userData.email}) ... `);

    const exists = await userExists(userData.email);
    if (exists) {
      console.log('⏭️  Already exists');
      skipped++;
      continue;
    }

    const result = await createUser(userData);

    if (result.status === 200) {
      console.log(`✅ Created`);
      console.log(`   └─ Password: ${userData.password}`);
      created++;
    } else {
      console.log(`❌ Failed - Status: ${result.status}`);
      if (result.data?.message) {
        console.log(`      ${result.data.message}`);
      }
      failed++;
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
}

await main();
