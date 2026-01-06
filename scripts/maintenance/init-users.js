#!/usr/bin/env node

/**
 * PocketBase User Initialization Script
 * 
 * This script creates all required user accounts for testing and production.
 * It connects to your PocketBase instance and creates users with specific roles.
 * 
 * Usage: node init-users.js
 */

import PocketBase from 'pocketbase';

// Initialize PocketBase client
const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// User accounts to create
const USERS = [
    {
        email: process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL,
        password: process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD,
        name: 'Platform Owner',
        role: 'Owner',
        description: 'Super admin with full platform access'
    },
    {
        email: 'admin@school.com',
        password: '12345678',
        name: 'School Administrator',
        role: 'Admin',
        description: 'School administrator with school management access'
    },
    {
        email: 'teacher@school.com',
        password: '123456789',
        name: 'Teacher Account',
        role: 'Teacher',
        description: 'Teacher with classroom management access'
    },
    {
        email: 'student@school.com',
        password: '12345678',
        name: 'Student Account',
        role: 'Student',
        description: 'Student with learning access'
    },
    {
        email: 'parent@school.com',
        password: '12345678',
        name: 'Parent Account',
        role: 'Parent',
        description: 'Parent with child monitoring access'
    },
    {
        email: 'individual@individual.com',
        password: '12345678',
        name: 'Individual User',
        role: 'Individual',
        description: 'Individual user account'
    }
];

async function initializeUsers() {
    console.log('🚀 Starting PocketBase user initialization...\n');

    // First, authenticate as admin
    try {
        console.log('🔐 Authenticating as admin...');
        await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD);
        console.log('✅ Admin authentication successful\n');
    } catch (error) {
        console.error('❌ Failed to authenticate as admin. Make sure PocketBase is running and admin credentials are correct.');
        console.error('   Run PocketBase with: cd pocketbase && ./pocketbase serve');
        console.error('   Error:', error.message);
        process.exit(1);
    }

    // Update 'users' collection schema to include 'role' field
    try {
        console.log('🛠️ Checking users collection schema...');
        const collection = await pb.collections.getOne('users');
        // Support both old 'schema' and new 'fields' structure
        const fields = collection.fields || collection.schema || [];
        console.log('   🔍 Existing fields sample:', JSON.stringify(fields[0], null, 2));
        const hasRoleField = fields.some(f => f.name === 'role');
        
        if (!hasRoleField) {
            console.log('   ➕ Adding "role" field to users collection...');
            fields.push({
                name: 'role',
                type: 'text',
                required: true,
                presentable: false,
                system: false,
            });
            
            // Update with the correct property
            if (collection.fields) {
                collection.fields = fields;
            } else {
                collection.schema = fields;
            }
            
            await pb.collections.update('users', collection);
            console.log('   ✅ Schema updated successfully');
        } else {
            console.log('   ✅ "role" field already exists');
        }
        console.log('');
    } catch (error) {
        console.error('❌ Failed to update schema:', error.message);
        // Continue anyway, maybe it exists
    }

    // Create or update each user
    for (const userData of USERS) {
        try {
            console.log(`📝 Processing user: ${userData.email} (${userData.role})`);

            // Check if user already exists
            let existingUser = null;
            try {
                const users = await pb.collection('users').getFullList({
                    filter: `email = "${userData.email}"`
                });
                existingUser = users[0];
            } catch (err) {
                // User doesn't exist, which is fine
            }

            if (existingUser) {
                console.log(`   ⚠️  User already exists, updating...`);
                const updateData = {
                    name: userData.name,
                    role: userData.role,
                    emailVisibility: true
                };
                
                // Force password update for Owner to ensure it matches documentation
                if (userData.role === 'Owner') {
                    updateData.password = userData.password;
                    updateData.passwordConfirm = userData.password;
                }

                await pb.collection('users').update(existingUser.id, updateData);
                console.log(`   ✅ Updated: ${userData.email}`);
            } else {
                console.log(`   ➕ Creating new user...`);
                await pb.collection('users').create({
                    email: userData.email,
                    password: userData.password,
                    passwordConfirm: userData.password,
                    name: userData.name,
                    role: userData.role,
                    emailVisibility: true,
                    verified: true
                });
                console.log(`   ✅ Created: ${userData.email}`);
            }

            console.log(`   📋 Role: ${userData.role}`);
            console.log(`   📝 Description: ${userData.description}\n`);
        } catch (error) {
            console.error(`   ❌ Failed to process ${userData.email}:`, error.message);
            console.error(`      Make sure the 'users' collection exists with the 'role' field\n`);
        }
    }

    console.log('✨ User initialization complete!\n');
    console.log('📋 Summary of accounts:');
    console.log('━'.repeat(70));
    USERS.forEach(user => {
        console.log(`${user.role.padEnd(12)} | ${user.email.padEnd(30)} | ${user.password}`);
    });
    console.log('━'.repeat(70));
    console.log('\n🎯 You can now login with any of these accounts!');
    console.log('🌐 Start the app with: npm run dev\n');
}

// Run the initialization
initializeUsers().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
