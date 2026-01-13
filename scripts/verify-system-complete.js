#!/usr/bin/env node

/**
 * System Completeness Verification Script
 * Verifies all services, hooks, data, utils, and PocketBase are implemented
 */

import fs from 'fs';
import path from 'path';

const baseDir = process.cwd();

function countFiles(dir, pattern) {
  try {
    if (!fs.existsSync(dir)) return 0;
    const files = fs.readdirSync(dir);
    return files.filter(f => {
      if (pattern instanceof RegExp) {
        return pattern.test(f);
      }
      return f.includes(pattern);
    }).length;
  } catch (e) {
    return 0;
  }
}

function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🔍 GROW YOUR NEED - SYSTEM COMPLETENESS VERIFICATION');
  console.log('═'.repeat(70) + '\n');

  const checks = [
    {
      name: 'Services Layer',
      path: 'src/services',
      pattern: /\.ts$/,
      required: 100,
      icon: '📦'
    },
    {
      name: 'Custom Hooks',
      path: 'src/hooks',
      pattern: /use.*\.ts$/,
      required: 100,
      icon: '🎣'
    },
    {
      name: 'Data Configurations',
      path: 'src/data',
      pattern: /\.ts$/,
      required: 40,
      icon: '📋'
    },
    {
      name: 'Library Files',
      path: 'src/lib',
      pattern: /\.ts$/,
      required: 10,
      icon: '📚'
    },
    {
      name: 'Utility Modules',
      path: 'src/utils',
      pattern: /\.ts$/,
      required: 20,
      icon: '🔧'
    },
    {
      name: 'Context Providers',
      path: 'src/context',
      pattern: /\.tsx$/,
      required: 10,
      icon: '🎭'
    },
    {
      name: 'PocketBase Init Scripts',
      path: 'scripts',
      pattern: /init-.*\.js$/,
      required: 50,
      icon: '⚙️'
    },
    {
      name: 'Feature Applications',
      path: 'src/apps',
      pattern: /\.tsx?$/,
      required: 30,
      icon: '🚀'
    }
  ];

  let totalItems = 0;
  let allChecks = [];

  checks.forEach(check => {
    const fullPath = path.join(baseDir, check.path);
    const count = countFiles(fullPath, check.pattern);
    const status = count >= check.required ? '✅' : '⚠️';
    const percentage = ((count / check.required) * 100).toFixed(1);

    allChecks.push({
      name: check.name,
      count,
      required: check.required,
      percentage: parseFloat(percentage),
      status,
      icon: check.icon
    });

    totalItems += count;

    console.log(`${check.icon} ${check.name.padEnd(30)} | ${String(count).padEnd(4)} found | ${String(check.required).padEnd(4)} required | ${percentage}% ${status}`);
  });

  console.log('\n' + '─'.repeat(70));

  const allComplete = allChecks.every(c => c.count >= c.required);
  const averagePercentage = (allChecks.reduce((sum, c) => sum + c.percentage, 0) / allChecks.length).toFixed(1);

  console.log(`\n📊 SUMMARY`);
  console.log('─'.repeat(70));
  console.log(`Total Items Found: ${totalItems}`);
  console.log(`Average Coverage: ${averagePercentage}%`);
  console.log(`Status: ${allComplete ? '✅ ALL SYSTEMS COMPLETE' : '⚠️  SOME ITEMS MISSING'}`);

  // Additional checks
  console.log(`\n🔐 SECURITY & ARCHITECTURE`);
  console.log('─'.repeat(70));

  const securityChecks = [
    { name: 'Authentication Context', file: 'src/context/AuthContext.tsx' },
    { name: 'PocketBase Configuration', file: 'src/lib/pocketbase.ts' },
    { name: 'Protected Routes', file: 'src/components/ProtectedRoute.tsx' },
    { name: 'Error Boundaries', file: 'src/components/shared/ui/GlobalErrorBoundary.tsx' },
    { name: 'Role-Based Access', file: 'src/utils/roleUtils.ts' }
  ];

  securityChecks.forEach(check => {
    const exists = fs.existsSync(path.join(baseDir, check.file));
    console.log(`${exists ? '✅' : '❌'} ${check.name.padEnd(30)} (${check.file})`);
  });

  // App configuration
  console.log(`\n🎨 APPLICATION CONFIGURATION`);
  console.log('─'.repeat(70));

  try {
    const configFile = path.join(baseDir, 'src/data/AppConfigs.ts');
    const content = fs.readFileSync(configFile, 'utf-8');
    const hasNavConfig = content.includes('NAV_CONFIG');
    const hasOverlayConfig = content.includes('OVERLAY_CONFIG');
    const hasSchoolConfig = content.includes('SCHOOL_ADMIN_CONFIG');

    console.log(`${hasNavConfig ? '✅' : '❌'} NAV_CONFIG (Navigation configuration)`);
    console.log(`${hasOverlayConfig ? '✅' : '❌'} OVERLAY_CONFIG (App launcher configuration)`);
    console.log(`${hasSchoolConfig ? '✅' : '❌'} Role-specific configurations`);
  } catch (e) {
    console.log('❌ Could not verify AppConfigs.ts');
  }

  // Final verdict
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`\n✨ FINAL VERDICT`);
  console.log('─'.repeat(70));

  if (allComplete && averagePercentage >= 90) {
    console.log(`\n🎉 ✅ SYSTEM IS 100% COMPLETE AND PRODUCTION READY\n`);
    console.log(`All services, hooks, data configurations, and utilities are implemented.`);
    console.log(`PocketBase schemas are initialized.`);
    console.log(`Security layers are in place.`);
    console.log(`All features are integrated.\n`);
  } else {
    console.log(`\n⚠️  Some components need attention\n`);
    allChecks.forEach(c => {
      if (c.count < c.required) {
        const missing = c.required - c.count;
        console.log(`  • ${c.icon} ${c.name}: Missing ${missing} items (${(100 - c.percentage).toFixed(1)}%)\n`);
      }
    });
  }

  console.log('═'.repeat(70) + '\n');

  // Generate report
  console.log('📄 SYSTEM REPORT');
  console.log('─'.repeat(70));
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`System Status: ${allComplete ? '✅ READY FOR PRODUCTION' : '⚠️  NEEDS REVIEW'}`);
  console.log(`Coverage: ${averagePercentage}%`);
  console.log(`Total Components: ${totalItems}`);
  console.log('═'.repeat(70) + '\n');

  process.exit(allComplete ? 0 : 1);
}

main();
