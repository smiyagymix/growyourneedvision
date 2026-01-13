#!/usr/bin/env node

/**
 * Verify SMTP Configuration
 * Tests that email sending is properly configured
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config({ path: '.env' });

console.log('\n📧 SMTP Configuration Verification\n');
console.log('=' .repeat(50));

const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET',
    from: process.env.SMTP_FROM
};

console.log('\n✓ SMTP Configuration:');
console.log(`  Host: ${smtpConfig.host || '❌ NOT SET'}`);
console.log(`  Port: ${smtpConfig.port || '❌ NOT SET'}`);
console.log(`  Secure: ${smtpConfig.secure}`);
console.log(`  User: ${process.env.SMTP_USER || '❌ NOT SET'}`);
console.log(`  Password: ${smtpConfig.pass}`);
console.log(`  From: ${smtpConfig.from || '❌ NOT SET'}`);

// Verify all required fields
const isConfigured = smtpConfig.host && smtpConfig.port && process.env.SMTP_USER && process.env.SMTP_PASS;

if (!isConfigured) {
    console.log('\n❌ SMTP Configuration Incomplete!\n');
    console.log('Required environment variables:');
    if (!smtpConfig.host) console.log('  - SMTP_HOST');
    if (!smtpConfig.port) console.log('  - SMTP_PORT');
    if (!process.env.SMTP_USER) console.log('  - SMTP_USER');
    if (!process.env.SMTP_PASS) console.log('  - SMTP_PASS');
    process.exit(1);
}

// Test SMTP Connection
console.log('\n🧪 Testing SMTP Connection...\n');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Failed:');
        console.error(error.message);
        console.log('\nCommon issues:');
        console.log('  • Invalid SMTP credentials');
        console.log('  • SMTP server not accessible from this network');
        console.log('  • Firewall blocking SMTP port');
        console.log('  • Wrong secure setting (should match port 465=true, 587=false)');
        process.exit(1);
    }

    console.log('✅ SMTP Connection Successful!');
    console.log('\n📨 Email sending is now ENABLED');
    console.log('   Features:');
    console.log('   • Payment receipts');
    console.log('   • Account notifications');
    console.log('   • Password resets');
    console.log('   • Trial reminders');
    console.log('   • User invitations');
    console.log('\n');
});
