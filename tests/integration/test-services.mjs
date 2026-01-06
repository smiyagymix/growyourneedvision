/**
 * Integration Test for Trial Management and Coupon Services
 * Run this after starting the payment server: node server/index.js
 */

const API_BASE_URL = process.env.PAYMENT_SERVER_URL || 'http://localhost:3001';
const API_KEY = process.env.SERVICE_API_KEY || 'test-key';

const headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
};

// ANSI color codes for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthEndpoint() {
    log('\n🔍 Testing Health Endpoint...', 'blue');
    try {
        // Simple connectivity test - try metrics endpoint which doesn't require auth
        const response = await fetch(`${API_BASE_URL}/api/metrics`);
        if (response.ok) {
            log(`✅ Server is reachable on port 3001`, 'green');
            return true;
        } else {
            log(`⚠️  Server returned status ${response.status}, but is reachable`, 'yellow');
            return true; // Server is up, just protected
        }
    } catch (error) {
        log(`❌ Cannot connect to server: ${error.message}`, 'red');
        log(`   Make sure server is running: cd server && node index.js`, 'yellow');
        return false;
    }
}

async function testTrialManagement() {
    log('\n🧪 Testing Trial Management API...', 'blue');
    
    try {
        // Test 1: Get active trials
        log('\n📊 Test 1: Get Active Trials', 'yellow');
        const activeRes = await fetch(`${API_BASE_URL}/api/trial/active`, { headers });
        if (!activeRes.ok) {
            throw new Error(`HTTP ${activeRes.status}: ${await activeRes.text()}`);
        }
        const activeData = await activeRes.json();
        log(`✅ Active trials: ${activeData.count} trials found`, 'green');
        
        // Test 2: Get expiring trials
        log('\n📊 Test 2: Get Expiring Trials', 'yellow');
        const expiringRes = await fetch(`${API_BASE_URL}/api/trial/expiring?daysThreshold=7`, { headers });
        if (!expiringRes.ok) {
            throw new Error(`HTTP ${expiringRes.status}: ${await expiringRes.text()}`);
        }
        const expiringData = await expiringRes.json();
        log(`✅ Expiring trials: ${expiringData.count} trials expiring in 7 days`, 'green');
        
        // Test 3: Get trial metrics
        log('\n📊 Test 3: Get Trial Metrics', 'yellow');
        const metricsRes = await fetch(`${API_BASE_URL}/api/trial/metrics`, { headers });
        if (!metricsRes.ok) {
            throw new Error(`HTTP ${metricsRes.status}: ${await metricsRes.text()}`);
        }
        const metricsData = await metricsRes.json();
        log(`✅ Trial metrics retrieved:`, 'green');
        log(`   Total Trials: ${metricsData.metrics.totalTrials}`, 'green');
        log(`   Active Trials: ${metricsData.metrics.activeTrials}`, 'green');
        log(`   Conversion Rate: ${metricsData.metrics.conversionRate}%`, 'green');
        
        return true;
    } catch (error) {
        log(`❌ Trial management test failed: ${error.message}`, 'red');
        return false;
    }
}

async function testCouponManagement() {
    log('\n🎟️  Testing Coupon Management API...', 'blue');
    
    try {
        // Test 1: Create a test coupon
        log('\n📊 Test 1: Create Coupon', 'yellow');
        const couponData = {
            code: 'TEST2025',
            percentOff: 20,
            duration: 'once',
            maxRedemptions: 100,
            metadata: { test: true, created_for: 'integration_test' }
        };
        
        const createCouponRes = await fetch(`${API_BASE_URL}/api/coupons/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify(couponData)
        });
        
        if (createCouponRes.status === 500) {
            const errorText = await createCouponRes.text();
            if (errorText.includes('already exists')) {
                log(`⚠️  Coupon TEST2025 already exists, continuing...`, 'yellow');
            } else {
                throw new Error(`HTTP ${createCouponRes.status}: ${errorText}`);
            }
        } else if (!createCouponRes.ok) {
            throw new Error(`HTTP ${createCouponRes.status}: ${await createCouponRes.text()}`);
        } else {
            const couponResult = await createCouponRes.json();
            log(`✅ Coupon created: ${couponResult.coupon.id}`, 'green');
        }
        
        // Test 2: Get all coupons
        log('\n📊 Test 2: Get All Coupons', 'yellow');
        const couponsRes = await fetch(`${API_BASE_URL}/api/coupons`, { headers });
        if (!couponsRes.ok) {
            throw new Error(`HTTP ${couponsRes.status}: ${await couponsRes.text()}`);
        }
        const couponsData = await couponsRes.json();
        log(`✅ Coupons retrieved: ${couponsData.count} coupons found`, 'green');
        
        // Test 3: Create promotion code
        log('\n📊 Test 3: Create Promotion Code', 'yellow');
        const promoData = {
            couponId: 'TEST2025',
            code: 'WELCOME20',
            active: true,
            maxRedemptions: 50,
            metadata: { test: true }
        };
        
        const createPromoRes = await fetch(`${API_BASE_URL}/api/coupons/promo/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify(promoData)
        });
        
        if (createPromoRes.status === 500) {
            const errorText = await createPromoRes.text();
            if (errorText.includes('already exists')) {
                log(`⚠️  Promo code WELCOME20 already exists, continuing...`, 'yellow');
            } else {
                throw new Error(`HTTP ${createPromoRes.status}: ${errorText}`);
            }
        } else if (!createPromoRes.ok) {
            throw new Error(`HTTP ${createPromoRes.status}: ${await createPromoRes.text()}`);
        } else {
            const promoResult = await createPromoRes.json();
            log(`✅ Promotion code created: ${promoResult.promotionCode.code}`, 'green');
        }
        
        // Test 4: Validate promotion code
        log('\n📊 Test 4: Validate Promotion Code', 'yellow');
        const validateRes = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ code: 'WELCOME20' })
        });
        
        if (!validateRes.ok) {
            throw new Error(`HTTP ${validateRes.status}: ${await validateRes.text()}`);
        }
        const validateData = await validateRes.json();
        log(`✅ Validation result: ${validateData.valid ? 'VALID' : 'INVALID'}`, 'green');
        if (validateData.valid) {
            log(`   Discount: ${validateData.discount}`, 'green');
            log(`   Duration: ${validateData.duration}`, 'green');
        }
        
        // Test 5: Get promotion codes
        log('\n📊 Test 5: Get All Promotion Codes', 'yellow');
        const promosRes = await fetch(`${API_BASE_URL}/api/coupons/promo?active=true`, { headers });
        if (!promosRes.ok) {
            throw new Error(`HTTP ${promosRes.status}: ${await promosRes.text()}`);
        }
        const promosData = await promosRes.json();
        log(`✅ Promotion codes retrieved: ${promosData.count} active codes`, 'green');
        
        // Test 6: Get coupon stats
        log('\n📊 Test 6: Get Coupon Statistics', 'yellow');
        const statsRes = await fetch(`${API_BASE_URL}/api/coupons/stats/TEST2025`, { headers });
        if (!statsRes.ok) {
            throw new Error(`HTTP ${statsRes.status}: ${await statsRes.text()}`);
        }
        const statsData = await statsRes.json();
        log(`✅ Coupon stats retrieved:`, 'green');
        log(`   Times Redeemed: ${statsData.stats.timesRedeemed}`, 'green');
        log(`   Active Promo Codes: ${statsData.stats.activePromoCodes}`, 'green');
        log(`   Active Subscribers: ${statsData.stats.activeSubscribers}`, 'green');
        
        return true;
    } catch (error) {
        log(`❌ Coupon management test failed: ${error.message}`, 'red');
        return false;
    }
}

async function testAnalyticsEndpoints() {
    log('\n📈 Testing Analytics API...', 'blue');
    
    try {
        // Test cohort analysis
        log('\n📊 Test: Cohort Analysis', 'yellow');
        const cohortRes = await fetch(`${API_BASE_URL}/api/analytics/cohorts`, { headers });
        if (!cohortRes.ok) {
            throw new Error(`HTTP ${cohortRes.status}: ${await cohortRes.text()}`);
        }
        const cohortData = await cohortRes.json();
        log(`✅ Cohort analysis retrieved: ${cohortData.cohorts?.length || 0} cohorts`, 'green');
        
        // Test MRR metrics
        log('\n📊 Test: MRR Metrics', 'yellow');
        const mrrRes = await fetch(`${API_BASE_URL}/api/analytics/mrr`, { headers });
        if (!mrrRes.ok) {
            throw new Error(`HTTP ${mrrRes.status}: ${await mrrRes.text()}`);
        }
        const mrrData = await mrrRes.json();
        log(`✅ MRR metrics retrieved: $${mrrData.overall?.mrr || 0}`, 'green');
        
        return true;
    } catch (error) {
        log(`❌ Analytics test failed: ${error.message}`, 'red');
        return false;
    }
}

async function runAllTests() {
    log('\n' + '='.repeat(60), 'blue');
    log('🚀 STARTING INTEGRATION TESTS', 'blue');
    log('='.repeat(60), 'blue');
    log(`\nAPI Base URL: ${API_BASE_URL}`, 'blue');
    log(`API Key: ${API_KEY.substring(0, 8)}...`, 'blue');
    
    const results = {
        health: false,
        trialManagement: false,
        couponManagement: false,
        analytics: false
    };
    
    // Run tests
    results.health = await testHealthEndpoint();
    
    if (results.health) {
        results.trialManagement = await testTrialManagement();
        results.couponManagement = await testCouponManagement();
        results.analytics = await testAnalyticsEndpoints();
    } else {
        log('\n⚠️  Skipping API tests - health check failed. Is the server running?', 'yellow');
        log('   Start the server with: node server/index.js', 'yellow');
    }
    
    // Summary
    log('\n' + '='.repeat(60), 'blue');
    log('📊 TEST SUMMARY', 'blue');
    log('='.repeat(60), 'blue');
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, result]) => {
        const icon = result ? '✅' : '❌';
        const color = result ? 'green' : 'red';
        log(`${icon} ${test.padEnd(20)} ${result ? 'PASSED' : 'FAILED'}`, color);
    });
    
    log('\n' + '='.repeat(60), 'blue');
    log(`${passed}/${total} test suites passed`, passed === total ? 'green' : 'yellow');
    log('='.repeat(60) + '\n', 'blue');
    
    process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
