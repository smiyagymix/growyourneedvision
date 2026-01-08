/**
 * Production Environment Validator
 * Validates all required environment variables are set before starting server
 */

const requiredVars = [
  'NODE_ENV',
  'JWT_SECRET',
  'SESSION_SECRET',
  'POCKETBASE_URL',
  'CORS_ORIGINS',
  'SERVICE_API_KEY'
];

const recommendedVars = [
  'SENTRY_DSN',
  'REDIS_URL',
  'AWS_S3_BUCKET',
  'SMTP_HOST',
  'SSL_CERT_PATH'
];

export function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not set to "production"');
  }

  // Check required variables (core)
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Required environment variable ${varName} is not set`);
    }
  }

  // Payments: only required when FEATURE_PAYMENTS=true
  const paymentsEnabled = (process.env.FEATURE_PAYMENTS || '').toString().toLowerCase() === 'true';
  if (paymentsEnabled) {
    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push('STRIPE_SECRET_KEY is required when FEATURE_PAYMENTS=true');
    }
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
      errors.push('STRIPE_PUBLISHABLE_KEY is required when FEATURE_PAYMENTS=true');
    }
  }

  // Check for test/demo keys in production
  if (process.env.NODE_ENV === 'production') {
    if (paymentsEnabled) {
      if (process.env.STRIPE_SECRET_KEY?.includes('sk_test_')) {
        errors.push('CRITICAL: Test Stripe key detected in production!');
      }
      if (process.env.STRIPE_PUBLISHABLE_KEY?.includes('pk_test_')) {
        errors.push('CRITICAL: Test Stripe publishable key detected in production!');
      }
    }
    if (process.env.JWT_SECRET === 'your-secret-key' || 
        process.env.JWT_SECRET?.length < 32) {
      errors.push('JWT_SECRET must be a strong random string (32+ characters)');
    }
  }

  // Check recommended variables
  for (const varName of recommendedVars) {
    if (!process.env[varName]) {
      warnings.push(`Recommended environment variable ${varName} is not set`);
    }
  }

  // Check CORS origins
  if (process.env.CORS_ORIGINS) {
    const origins = process.env.CORS_ORIGINS.split(',');
    if (origins.some(origin => origin.includes('localhost'))) {
      warnings.push('CORS_ORIGINS includes localhost - should be removed in production');
    }
  }

  // Check SSL configuration
  if (process.env.FORCE_HTTPS === 'true' && !process.env.SSL_CERT_PATH) {
    warnings.push('FORCE_HTTPS is enabled but SSL_CERT_PATH is not set');
  }

  // Report results
  if (errors.length > 0) {
    console.error('\n❌ PRODUCTION ENVIRONMENT VALIDATION FAILED\n');
    console.error('Errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error('\nServer will NOT start until these errors are fixed.\n');
    return false;
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  PRODUCTION ENVIRONMENT WARNINGS\n');
    console.warn('Warnings:');
    warnings.forEach(warn => console.warn(`  - ${warn}`));
    console.warn('\nThese are non-critical but recommended to address.\n');
  }

  console.log('✅ Production environment validation passed');
  return true;
}

export function getEnvironmentInfo() {
  const paymentsEnabled = (process.env.FEATURE_PAYMENTS || '').toString().toLowerCase() === 'true';
  return {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT || 3001,
    pocketbaseUrl: process.env.POCKETBASE_URL,
    aiServiceUrl: process.env.AI_SERVICE_URL,
    paymentsEnabled,
    stripeMode: paymentsEnabled ? (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 'TEST') : 'DISABLED',
    sentryEnabled: !!process.env.SENTRY_DSN,
    redisEnabled: !!process.env.REDIS_URL,
    s3Enabled: !!process.env.AWS_S3_BUCKET,
    smtpEnabled: !!process.env.SMTP_HOST,
    sslEnabled: !!process.env.SSL_CERT_PATH,
    cacheEnabled: true,
    auditLogRetention: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90'),
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
  };
}

export function printEnvironmentInfo() {
  const info = getEnvironmentInfo();
  
  console.log('\n📋 Production Environment Configuration:');
  console.log(`  Node Environment: ${info.nodeEnv}`);
  console.log(`  Server Port: ${info.port}`);
  console.log(`  PocketBase URL: ${info.pocketbaseUrl}`);
  console.log(`  AI Service URL: ${info.aiServiceUrl}`);
  console.log(`  Payments: ${info.paymentsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Stripe Mode: ${info.stripeMode}`);
  console.log(`  Sentry: ${info.sentryEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Redis Cache: ${info.redisEnabled ? '✅ Enabled' : '⚠️  In-Memory Only'}`);
  console.log(`  S3 Storage: ${info.s3Enabled ? '✅ Enabled' : '⚠️  Local Only'}`);
  console.log(`  SMTP Email: ${info.smtpEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  SSL/TLS: ${info.sslEnabled ? '✅ Enabled' : '⚠️  HTTP Only'}`);
  console.log(`  Audit Log Retention: ${info.auditLogRetention} days`);
  console.log(`  Maintenance Mode: ${info.maintenanceMode ? '🔧 ON' : '✅ OFF'}`);
  console.log('');
}

// Run validation if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const isValid = validateEnvironment();
  if (isValid) {
    printEnvironmentInfo();
  }
  process.exit(isValid ? 0 : 1);
}

export default {
  validateEnvironment,
  getEnvironmentInfo,
  printEnvironmentInfo
};
