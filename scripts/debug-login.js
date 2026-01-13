#!/usr/bin/env node

/**
 * Debug test to check login issues
 */

import http from 'http';

const PB_URL = 'http://127.0.0.1:8090';

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

async function main() {
  console.log('🔍 Debugging Login Issues\n');

  // Get all users first
  console.log('📋 Getting all users...\n');
  const listResponse = await makeRequest('GET', '/api/collections/users/records?perPage=100');
  const users = listResponse.data.items || [];

  console.log(`Found ${users.length} users:\n`);
  users.forEach((user) => {
    console.log(`  • ${user.email.padEnd(30)} | Role: ${(user.role || 'null').padEnd(15)}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('Testing login for each user...\n');

  const testCredentials = [
    { email: 'owner@growyourneed.com', password: '12345678' },
    { email: 'admin@school.com', password: '12345678' },
    { email: 'teacher@school.com', password: '123456789' },
    { email: 'student@school.com', password: '123456789' },
    { email: 'parent@school.com', password: '123456789' },
    { email: 'individual@example.com', password: '123456789' },
  ];

  for (const cred of testCredentials) {
    console.log(`\n🔐 ${cred.email}`);

    const loginResponse = await makeRequest('POST', '/api/collections/users/auth-with-password', {
      identity: cred.email,
      password: cred.password,
    });

    if (loginResponse.status === 200) {
      console.log(`   ✅ Login successful`);
      console.log(`      Role: ${loginResponse.data.record.role || 'NOT SET'}`);
      console.log(`      Verified: ${loginResponse.data.record.verified}`);
      console.log(`      Token present: ${!!loginResponse.data.token}`);
    } else {
      console.log(`   ❌ Login failed - Status: ${loginResponse.status}`);
      if (loginResponse.data.message) {
        console.log(`      Error: ${loginResponse.data.message}`);
      }
      if (loginResponse.data.data) {
        console.log(`      Details: ${JSON.stringify(loginResponse.data.data, null, 2)}`);
      }
    }
  }
}

await main();
