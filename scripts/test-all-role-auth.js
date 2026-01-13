#!/usr/bin/env node

/**
 * Comprehensive Authentication Testing for All Roles
 * Tests login, token generation, and role-based access for:
 * - Owner
 * - SchoolAdmin
 * - Teacher
 * - Student
 * - Parent
 * - Individual
 */

import http from 'http';

const PB_URL = 'http://127.0.0.1:8090';

// Test users for all roles (with correct passwords from setup-users.ps1)
const TEST_USERS = [
  { email: 'owner@growyourneed.com', password: 'Darnag123456789@', role: 'Owner' }, // Note: 9 "9"s
  { email: 'admin@school.com', password: '12345678', role: 'Admin' }, // Note: Role is 'Admin' not 'SchoolAdmin'
  { email: 'teacher@school.com', password: '123456789', role: 'Teacher' },
  { email: 'student@school.com', password: '12345678', role: 'Student' },
  { email: 'parent@school.com', password: '123456788', role: 'Parent' },
  { email: 'individual@individual.com', password: '12345678', role: 'Individual' },
];

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

// Verify token with protected request
async function verifyTokenWithProtectedRequest(userId, token) {
  try {
    const response = await makeRequest(
      'GET',
      `/api/collections/users/records/${userId}`,
      null,
      { Authorization: token }
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Test authentication for a user
async function testUserAuth(userData) {
  const result = {
    role: userData.role,
    email: userData.email,
    steps: [],
  };

  try {
    // Step 1: Login
    const loginResponse = await makeRequest('POST', '/api/collections/users/auth-with-password', {
      identity: userData.email,
      password: userData.password,
    });

    if (loginResponse.status !== 200) {
      result.steps.push({ step: 'login', success: false, message: `Login failed: ${loginResponse.status}` });
      result.success = false;
      return result;
    }

    const user = loginResponse.data.record;
    const token = loginResponse.data.token;

    result.steps.push({ step: 'login', success: true, message: 'Login successful' });
    result.userId = user.id;
    result.token = token ? token.substring(0, 50) + '...' : 'N/A';

    // Step 2: Verify token
    if (!token) {
      result.steps.push({ step: 'token_generation', success: false, message: 'No token returned' });
      result.success = false;
      return result;
    }

    result.steps.push({ step: 'token_generation', success: true, message: `JWT token generated` });

    // Step 3: Verify role
    if (user.role !== userData.role) {
      result.steps.push({
        step: 'role_verification',
        success: false,
        message: `Role mismatch: expected ${userData.role}, got ${user.role}`,
      });
      result.success = false;
      return result;
    }

    result.steps.push({ step: 'role_verification', success: true, message: `Role verified: ${user.role}` });

    // Step 4: Verify protected request with token
    const protectedRequestWorks = await verifyTokenWithProtectedRequest(user.id, token);

    if (!protectedRequestWorks) {
      result.steps.push({
        step: 'protected_request',
        success: false,
        message: 'Token validation failed on protected request',
      });
      result.success = false;
      return result;
    }

    result.steps.push({ step: 'protected_request', success: true, message: 'Protected API request validated' });

    result.success = true;
    return result;
  } catch (error) {
    result.steps.push({ step: 'error', success: false, message: error.message });
    result.success = false;
    return result;
  }
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           Authentication Test - All Roles                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Check PocketBase health
  console.log('⏳ Checking PocketBase health...');
  try {
    const healthResponse = await makeRequest('GET', '/api/health');
    if (healthResponse.status !== 200) {
      console.error('❌ PocketBase not responding');
      process.exit(1);
    }
    console.log('✅ PocketBase is ready\n');
  } catch (error) {
    console.error(`❌ Error connecting to PocketBase: ${error.message}`);
    process.exit(1);
  }

  // Test all users
  const results = [];
  let passCount = 0;
  let failCount = 0;

  for (const userData of TEST_USERS) {
    process.stdout.write(`🔐 Testing ${userData.role.padEnd(12)} (${userData.email}) ... `);

    const testResult = await testUserAuth(userData);
    results.push(testResult);

    if (testResult.success) {
      console.log('✅ PASS');
      passCount++;
    } else {
      console.log('❌ FAIL');
      failCount++;
    }
  }

  // Print detailed results
  console.log('\n' + '═'.repeat(70));
  console.log('DETAILED TEST RESULTS');
  console.log('═'.repeat(70) + '\n');

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} [${index + 1}/${results.length}] ${result.role.toUpperCase()} - ${result.email}`);

    result.steps.forEach((step, stepIndex) => {
      const stepIcon = step.success ? '✅' : '❌';
      const prefix = stepIndex === result.steps.length - 1 ? '└─' : '├─';
      console.log(`    ${prefix} ${stepIcon} ${step.step.padEnd(20)} : ${step.message}`);
    });

    if (result.token) {
      console.log(`    └─ 🔑 Token: ${result.token}`);
    }
    console.log();
  });

  // Summary
  console.log('═'.repeat(70));
  console.log('📊 AUTHENTICATION TEST SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total Users Tested  : ${results.length}`);
  console.log(`✅ Passed           : ${passCount}/${results.length}`);
  console.log(`❌ Failed           : ${failCount}/${results.length}`);
  console.log(`📈 Success Rate     : ${((passCount / results.length) * 100).toFixed(1)}%`);
  console.log('═'.repeat(70));

  if (passCount === results.length) {
    console.log('\n🎉 ALL AUTHENTICATION TESTS PASSED!');
    console.log('✨ All roles can authenticate successfully\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - Please review the results above\n');
    process.exit(1);
  }
}

await main();
