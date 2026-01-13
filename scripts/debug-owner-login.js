#!/usr/bin/env node

/**
 * Debug Owner login issue
 */

import http from 'http';

const PB_URL = 'http://127.0.0.1:8090';

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
  console.log('🔍 Debugging Owner Account Login\n');

  const ownerEmail = 'owner@growyourneed.com';
  const passwords = [
    'Darnag12345678@',
    'Darnag123456789@',
    '12345678',
  ];

  // Try each password
  for (const password of passwords) {
    console.log(`\nTrying password: ${password}`);
    console.log('─'.repeat(50));

    const loginResponse = await makeRequest('POST', '/api/collections/users/auth-with-password', {
      identity: ownerEmail,
      password: password,
    });

    console.log(`Status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      console.log(`✅ SUCCESS!`);
      console.log(`User ID: ${loginResponse.data.record.id.substring(0, 8)}...`);
      console.log(`Email: ${loginResponse.data.record.email}`);
      console.log(`Role: ${loginResponse.data.record.role}`);
      console.log(`Token present: ${!!loginResponse.data.token}`);
      break;
    } else {
      console.log(`❌ Failed`);
      if (loginResponse.data.message) {
        console.log(`Message: ${loginResponse.data.message}`);
      }
      if (loginResponse.data.data) {
        console.log(`Data: ${JSON.stringify(loginResponse.data.data)}`);
      }
    }
  }

  // Also try getting user directly by email (if it exists)
  console.log('\n\nChecking if user exists via query...');
  console.log('─'.repeat(50));
  
  const searchResponse = await makeRequest(
    'GET',
    `/api/collections/users/records?filter=email%3D%22${encodeURIComponent(ownerEmail)}%22`
  );

  console.log(`Status: ${searchResponse.status}`);
  if (searchResponse.data.items && searchResponse.data.items.length > 0) {
    const user = searchResponse.data.items[0];
    console.log(`✅ User found`);
    console.log(`ID: ${user.id.substring(0, 8)}...`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Verified: ${user.verified}`);
    console.log(`Updated: ${user.updated}`);
  } else {
    console.log(`⚠️  No user found with email: ${ownerEmail}`);
  }
}

await main();
