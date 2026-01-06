#!/usr/bin/env node

/**
 * Production Build & Deployment Script
 * Builds and prepares the app for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function exec(command, description) {
    log(`\n🔄 ${description}...`, 'cyan');
    try {
        execSync(command, { stdio: 'inherit' });
        log(`✅ ${description} complete`, 'green');
        return true;
    } catch (error) {
        log(`❌ ${description} failed`, 'red');
        return false;
    }
}

async function main() {
    log('\n🚀 GROW YOUR NEED - Production Build Script\n', 'blue');
    log('================================================', 'blue');

    // 1. Check environment file
    log('\n📋 Step 1: Environment Check', 'yellow');
    if (!fs.existsSync('.env.production')) {
        log('⚠️  .env.production not found!', 'yellow');
        log('Please copy .env.production.example to .env.production', 'yellow');
        log('and fill in your production values.\n', 'yellow');

        const proceed = process.argv.includes('--skip-env-check');
        if (!proceed) {
            log('❌ Build cancelled. Use --skip-env-check to bypass.', 'red');
            process.exit(1);
        }
    } else {
        log('✅ .env.production found', 'green');
    }

    // 2. Clean old builds
    log('\n📋 Step 2: Cleanup', 'yellow');
    if (fs.existsSync('build')) {
        exec('rm -rf build || rmdir /s /q build', 'Removing old build');
    }

    // 3. Install dependencies
    log('\n📋 Step 3: Dependencies', 'yellow');
    exec('npm ci', 'Installing production dependencies');

    // 4. Run tests (if available)
    log('\n📋 Step 4: Tests', 'yellow');
    const hasTests = fs.existsSync('src/__tests__') ||
        fs.existsSync('src/**/*.test.ts') ||
        fs.existsSync('src/**/*.test.tsx');

    if (hasTests && !process.argv.includes('--skip-tests')) {
        exec('npm test -- --watchAll=false', 'Running tests');
    } else {
        log('⏭️  Skipping tests', 'yellow');
    }

    // 5. Type check
    log('\n📋 Step 5: Type Check', 'yellow');
    exec('npm run build:types || tsc --noEmit', 'Type checking');

    // 6. Build
    log('\n📋 Step 6: Production Build', 'yellow');
    if (!exec('npm run build', 'Building production bundle')) {
        log('\n❌ Build failed!', 'red');
        process.exit(1);
    }

    // 7. Analyze bundle (optional)
    if (process.argv.includes('--analyze')) {
        log('\n📋 Step 7: Bundle Analysis', 'yellow');
        exec('npm run build:analyze', 'Analyzing bundle size');
    }

    // 8. Create build info
    log('\n📋 Step 8: Build Info', 'yellow');
    const buildInfo = {
        version: process.env.REACT_APP_VERSION || '1.0.0',
        buildDate: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: 'production'
    };

    fs.writeFileSync(
        path.join('build', 'build-info.json'),
        JSON.stringify(buildInfo, null, 2)
    );
    log(`✅ Build info created (v${buildInfo.version})`, 'green');

    // 9. Generate deployment checklist
    log('\n📋 Step 9: Deployment Checklist', 'yellow');
    const checklist = `
# Deployment Checklist

## Pre-Deployment
- [ ] Reviewed .env.production variables
- [ ] Updated version number
- [ ] Tested build locally
- [ ] Database migrations ready
- [ ] Backup current production

## Deploy
- [ ] Upload build folder to server
- [ ] Update environment variables on server
- [ ] Run database migrations
- [ ] Clear CDN cache (if applicable)
- [ ] Restart server/services

## Post-Deployment
- [ ] Verify deployment at ${process.env.PUBLIC_URL || 'https://your-domain.com'}
- [ ] Check error tracking dashboard
- [ ] Monitor performance metrics
- [ ] Test critical user flows
- [ ] Notify team of deployment

## Rollback Plan
If issues occur:
1. Revert to previous build
2. Restore database backup
3. Clear cache
4. Investigate logs

Build Version: ${buildInfo.version}
Build Date: ${buildInfo.buildDate}
`;

    fs.writeFileSync('DEPLOYMENT_CHECKLIST.txt', checklist);
    log('✅ Deployment checklist created', 'green');

    // 10. Success summary
    log('\n================================================', 'blue');
    log('✅ BUILD SUCCESSFUL!', 'green');
    log('================================================\n', 'blue');

    log('📦 Build artifacts:', 'cyan');
    log('  • Production bundle: ./build', 'cyan');
    log('  • Build info: ./build/build-info.json', 'cyan');
    log('  • Deployment checklist: ./DEPLOYMENT_CHECKLIST.txt\n', 'cyan');

    log('🚀 Next Steps:', 'yellow');
    log('  1. Review DEPLOYMENT_CHECKLIST.txt', 'yellow');
    log('  2. Test build locally: npx serve build', 'yellow');
    log('  3. Deploy to production server', 'yellow');
    log('  4. Run health checks\n', 'yellow');

    log('📚 Documentation:', 'cyan');
    log('  • Full guide: DEPLOYMENT.md', 'cyan');
    log('  • Utilities: PRODUCTION_UTILITIES.md', 'cyan');
    log('  • Database: seed-all-data.cjs\n', 'cyan');
}

main().catch(error => {
    log(`\n❌ Build script failed: ${error.message}`, 'red');
    process.exit(1);
});
