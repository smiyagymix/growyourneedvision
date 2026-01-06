/**
 * Environment Configuration
 * Centralized configuration management for all environment variables
 * Replaces hardcoded values throughout the application
 */

interface EnvironmentConfig {
  // Application
  appUrl: string;
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';

  // PocketBase
  pocketbaseUrl: string;
  pocketbaseAdminUrl: string;

  // AI Services
  aiServiceUrl: string;
  ollamaUrl: string;
  ollamaModel: string;
  aiProvider: string;

  // Security
  vapidPublicKey: string;

  // External Services
  resendApiKey: string;
  sentryDsn: string;

  // Redis
  upstashRedisUrl: string;
  upstashRedisToken: string;

  // Stripe Payment Processing
  stripePublishableKey: string;
  serviceApiKey: string;
  paymentServerUrl: string;

  // Server URLs
  serverUrl: string;
  frontendUrl: string;

  // Feature Flags
  enablePayments: boolean;
  enable2FA: boolean;
  enableEmailVerification: boolean;

  // School Settings (will be overridden by database)
  defaultSchoolName: string;
  defaultAcademicYear: string;
}

class Environment {
  private config: EnvironmentConfig;

  constructor() {
    // Detect environment
    const env = this.detectEnvironment();

    this.config = {
      // Application
      appUrl: this.getEnvVar('VITE_APP_URL', 'http://localhost:3040'),
      apiUrl: this.getEnvVar('VITE_API_URL', 'http://localhost:3041'),
      environment: env,

      // PocketBase - IMPORTANT: No hardcoded localhost URLs
      pocketbaseUrl: this.getEnvVar('VITE_POCKETBASE_URL', 'http://localhost:8090'),
      pocketbaseAdminUrl: this.getPocketBaseAdminUrl(),

      // AI Services
      aiServiceUrl: this.getEnvVar('VITE_AI_SERVICE_URL', 'http://localhost:8000'),
      ollamaUrl: this.getEnvVar('VITE_OLLAMA_URL', 'http://localhost:11434'),
      ollamaModel: this.getEnvVar('VITE_OLLAMA_MODEL', 'qwen2.5:1.5b'),
      aiProvider: this.getEnvVar('AI_PROVIDER', 'ollama'),

      // Security
      vapidPublicKey: this.getEnvVar('VITE_VAPID_PUBLIC_KEY', ''),

      // External Services
      resendApiKey: this.getEnvVar('VITE_RESEND_API_KEY', ''),
      sentryDsn: this.getEnvVar('VITE_SENTRY_DSN', ''),

      // Redis
      upstashRedisUrl: this.getEnvVar('VITE_UPSTASH_REDIS_REST_URL', ''),
      upstashRedisToken: this.getEnvVar('VITE_UPSTASH_REDIS_REST_TOKEN', ''),

      // Stripe Payment Processing
      stripePublishableKey: this.getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', ''),
      serviceApiKey: this.getEnvVar('VITE_SERVICE_API_KEY', ''),
      paymentServerUrl: this.getEnvVar('VITE_PAYMENT_SERVER_URL', 'http://localhost:3001'),

      // Server URLs
      serverUrl: this.getEnvVar('VITE_SERVER_URL', 'http://localhost:3002'),
      frontendUrl: this.getEnvVar('VITE_FRONTEND_URL', 'http://localhost:3001'),

      // Feature Flags (will be database-driven in production)
      enablePayments: this.getEnvVar('VITE_ENABLE_PAYMENTS', 'false') === 'true',
      enable2FA: this.getEnvVar('VITE_ENABLE_2FA', 'false') === 'true',
      enableEmailVerification: this.getEnvVar('VITE_ENABLE_EMAIL_VERIFICATION', 'false') === 'true',

      // Default values (will be replaced by database in runtime)
      defaultSchoolName: this.getEnvVar('VITE_DEFAULT_SCHOOL_NAME', 'School'),
      defaultAcademicYear: this.getEnvVar('VITE_DEFAULT_ACADEMIC_YEAR', this.getCurrentAcademicYear()),
    };

    // Log configuration in development
    if (this.isDevelopment()) {
      console.log('🔧 Environment Configuration Loaded:', {
        environment: this.config.environment,
        pocketbaseUrl: this.config.pocketbaseUrl,
        aiServiceUrl: this.config.aiServiceUrl,
      });
    }
  }

  /**
   * Get environment variable with fallback
   */
  private getEnvVar(key: string, fallback: string = ''): string {
    return import.meta.env[key] || fallback;
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): 'development' | 'staging' | 'production' {
    const mode = import.meta.env.MODE;
    const url = window.location.hostname;

    if (mode === 'production') {
      if (url.includes('staging')) return 'staging';
      return 'production';
    }
    return 'development';
  }

  /**
   * Get PocketBase admin URL
   */
  private getPocketBaseAdminUrl(): string {
    const baseUrl = this.getEnvVar('VITE_POCKETBASE_URL', 'http://localhost:8090');
    return `${baseUrl}/_/`;
  }

  /**
   * Calculate current academic year
   */
  private getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    // Academic year typically starts in August/September
    if (month >= 7) { // August or later
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Check if development environment
   */
  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  /**
   * Check if production environment
   */
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Check if staging environment
   */
  isStaging(): boolean {
    return this.config.environment === 'staging';
  }

  /**
   * Get all configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Get specific config value
   */
  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: 'payments' | '2fa' | 'emailVerification'): boolean {
    const featureMap = {
      payments: this.config.enablePayments,
      '2fa': this.config.enable2FA,
      emailVerification: this.config.enableEmailVerification,
    };
    return featureMap[feature] || false;
  }
}

// Singleton instance
const env = new Environment();

export default env;
export type { EnvironmentConfig };
