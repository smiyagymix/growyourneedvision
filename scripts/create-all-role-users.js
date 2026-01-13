#!/usr/bin/env node

/**
 * Create test users for all roles:
 * - Owner
 * - SchoolAdmin (Admin of school)
 * - Teacher
 * - Student
 * - Parent
 * - Individual
 */

import http from 'http';

const PB_URL = 'http://127.0.0.1:8090';

// Test users for all roles
const TEST_USERS = [
  { email: 'owner@growyourneed.com', password: '12345678', role: 'Owner', name: 'Platform Owner' },
  { email: 'admin@school.com', password: '12345678', role: 'SchoolAdmin', name: 'School Administrator' },
  { email: 'teacher@school.com', password: '123456789', role: 'Teacher', name: 'John Teacher' },
  { email: 'student@school.com', password: '123456789', role: 'Student', name: 'Jane Student' },
  { email: 'parent@school.com', password: '123456789', role: 'Parent', name: 'Parent Guardian' },
  { email: 'individual@example.com', password: '123456789', role: 'Individual', name: 'Individual User' },
];

// Make HTTP request helper
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(PB_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
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
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

// Check if user exists
async function userExists(email) {
  try {
    const response = await makeRequest(
      'GET',
      `/api/collections/users/records?filter=email%3D%22${encodeURIComponent(email)}%22`
    );
    if (response.status === 200 && response.data.items && response.data.items.length > 0) {
      return response.data.items[0];
    }
    return null;
  } catch (error) {
    console.error(`Error checking if user exists: ${error.message}`);
    return null;
  }
}

// Create user
async function createUser(userData) {
  try {
    const response = await makeRequest('POST', '/api/collections/users/records', {
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
      role: userData.role,
      name: userData.name,
    });

    if (response.status === 200) {
      return { success: true, user: response.data };
    } else if (response.status === 400 && response.data.data && response.data.data.email) {
      // User already exists
      return { success: false, reason: 'already_exists', message: 'User already exists' };
    } else {
      return { success: false, reason: 'error', message: response.data.message || 'Unknown error', status: response.status };
    }
  } catch (error) {
    return { success: false, reason: 'error', message: error.message };
  }
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Create Test Users For All Roles                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // First check PocketBase health
  console.log('⏳ Checking PocketBase health...');
  try {
    const healthResponse = await makeRequest('GET', '/api/health');
    if (healthResponse.status !== 200) {
      console.error('❌ PocketBase not responding');
      process.exit(1);
    }
    console.log('✅ PocketBase is running\n');
  } catch (error) {
    console.error(`❌ Error connecting to PocketBase: ${error.message}`);
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Create each user
  for (const userData of TEST_USERS) {
    process.stdout.write(`🔍 ${userData.role.padEnd(12)} (${userData.email}) ... `);

    const existing = await userExists(userData.email);
    if (existing) {
      console.log('⏭️  Already exists');
      skipped++;
      continue;
    }

    const result = await createUser(userData);
    if (result.success) {
      console.log(`✅ Created`);
      console.log(`   └─ Password: ${userData.password}`);
      created++;
    } else if (result.reason === 'already_exists') {
      console.log('⏭️  Already exists');
      skipped++;
    } else {
      console.log(`❌ Failed - ${result.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(56));
  console.log(`📊 Summary:`);
  console.log(`   ✅ Created:  ${created}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Failed:   ${failed}`);
  console.log('═'.repeat(56));

  if (created > 0 || skipped > 0) {
    console.log('\n📋 Test Credentials:\n');
    TEST_USERS.forEach((user) => {
      console.log(`${user.role.padEnd(12)} | Email: ${user.email.padEnd(30)} | Password: ${user.password}`);
    });
  }

  console.log('\n✨ All users ready for testing!\n');
}

await main();
