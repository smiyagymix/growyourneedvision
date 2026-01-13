/**
 * Environment Configuration System
 * Provides centralized environment variable management with validation
 */

export interface EnvironmentConfig {
  // API Endpoints
  pocketbaseUrl: string;
  aiServiceUrl: string;
  paymentServerUrl: string;

  // Feature Flags
  enablePayments: boolean;
  enableAI: boolean;
  enableAnalytics: boolean;
  enableOfflineMode: boolean;
  enableDevTools: boolean;

  // API Keys
  openaiApiKey?: string;
  stripePublicKey?: string;
  sentryDsn?: string;

  // Environment
  environment: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;

  // Feature Configuration
  features: Record<string, boolean>;
  allowedOrigins: string[];
}

/**
 * Environment configuration manager
 */
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;
  private validators: Map<string, (value: any) => boolean> = new Map();
  private watchers: Map<string, Set<(value: any) => void>> = new Map();

  private constructor() {
    this.config = this.loadConfig();
    this.setupValidators();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): EnvironmentConfig {
    const env = typeof process !== 'undefined' ? process.env : {};
    const viteEnv = typeof import.meta !== 'undefined' ? (import.meta.env as any) : {};

    // Merge both sources (Vite env takes precedence)
    const allEnv = { ...env, ...viteEnv };

    const environment = (allEnv.VITE_ENVIRONMENT || allEnv.NODE_ENV || 'development') as any;

    return {
      // API Endpoints
      pocketbaseUrl: allEnv.VITE_POCKETBASE_URL || 'http://localhost:8090',
      aiServiceUrl: allEnv.VITE_AI_SERVICE_URL || 'http://localhost:8000',
      paymentServerUrl: allEnv.VITE_PAYMENT_SERVER_URL || 'http://localhost:3001',

      // Feature Flags
      enablePayments: allEnv.VITE_ENABLE_PAYMENTS === 'true',
      enableAI: allEnv.VITE_ENABLE_AI !== 'false',
      enableAnalytics: allEnv.VITE_ENABLE_ANALYTICS !== 'false',
      enableOfflineMode: allEnv.VITE_ENABLE_OFFLINE === 'true',
      enableDevTools: environment !== 'production',

      // API Keys
      openaiApiKey: allEnv.VITE_OPENAI_API_KEY,
      stripePublicKey: allEnv.VITE_STRIPE_PUBLIC_KEY,
      sentryDsn: allEnv.VITE_SENTRY_DSN,

      // Environment
      environment,
      isDevelopment: environment === 'development',
      isStaging: environment === 'staging',
      isProduction: environment === 'production',

      // Features
      features: {
        payments: allEnv.VITE_ENABLE_PAYMENTS === 'true',
        ai: allEnv.VITE_ENABLE_AI !== 'false',
        analytics: allEnv.VITE_ENABLE_ANALYTICS !== 'false',
        offlineMode: allEnv.VITE_ENABLE_OFFLINE === 'true',
        devTools: environment !== 'production',
      },

      // Security
      allowedOrigins: (allEnv.VITE_ALLOWED_ORIGINS || 'localhost:3001,localhost:5173').split(','),
    };
  }

  /**
   * Setup validators for environment variables
   */
  private setupValidators(): void {
    this.validators.set('pocketbaseUrl', (value) => typeof value === 'string' && value.length > 0);
    this.validators.set('aiServiceUrl', (value) => typeof value === 'string' && value.length > 0);
    this.validators.set('environment', (value) =>
      ['development', 'staging', 'production'].includes(value)
    );
  }

  /**
   * Get configuration value
   */
  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  /**
   * Set configuration value
   */
  set<K extends keyof EnvironmentConfig>(key: K, value: EnvironmentConfig[K]): void {
    const validator = this.validators.get(key as string);

    if (validator && !validator(value)) {
      throw new Error(`Invalid value for ${String(key)}: ${value}`);
    }

    this.config[key] = value;

    // Notify watchers
    const watchers = this.watchers.get(key as string);
    if (watchers) {
      watchers.forEach((watcher) => watcher(value));
    }
  }

  /**
   * Watch for configuration changes
   */
  watch<K extends keyof EnvironmentConfig>(
    key: K,
    callback: (value: EnvironmentConfig[K]) => void
  ): () => void {
    const keyStr = key as string;

    if (!this.watchers.has(keyStr)) {
      this.watchers.set(keyStr, new Set());
    }

    this.watchers.get(keyStr)!.add(callback);

    // Return unwatch function
    return () => {
      this.watchers.get(keyStr)?.delete(callback);
    };
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    return this.config.features[feature] ?? false;
  }

  /**
   * Enable feature
   */
  enableFeature(feature: string): void {
    this.config.features[feature] = true;
  }

  /**
   * Disable feature
   */
  disableFeature(feature: string): void {
    this.config.features[feature] = false;
  }

  /**
   * Validate environment
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required endpoints
    if (!this.config.pocketbaseUrl) {
      errors.push('VITE_POCKETBASE_URL is not configured');
    }

    // Check API keys for production
    if (this.config.isProduction) {
      if (!this.config.sentryDsn) {
        errors.push('VITE_SENTRY_DSN is required in production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get all configuration
   */
  getAll(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.config = this.loadConfig();
  }

  /**
   * Print configuration (for debugging, hides sensitive data)
   */
  print(): Record<string, any> {
    return {
      environment: this.config.environment,
      isDevelopment: this.config.isDevelopment,
      isProduction: this.config.isProduction,
      pocketbaseUrl: this.config.pocketbaseUrl,
      aiServiceUrl: this.config.aiServiceUrl,
      features: this.config.features,
      hasOpenaiKey: !!this.config.openaiApiKey,
      hasStripeKey: !!this.config.stripePublicKey,
      hasSentryDsn: !!this.config.sentryDsn,
    };
  }
}

/**
 * Global environment manager instance
 */
export const envManager = EnvironmentManager.getInstance();

/**
 * Helper functions
 */
export function getConfig(): EnvironmentConfig {
  return envManager.getAll();
}

export function getEnv<K extends keyof EnvironmentConfig>(
  key: K
): EnvironmentConfig[K] {
  return envManager.get(key);
}

export function setEnv<K extends keyof EnvironmentConfig>(
  key: K,
  value: EnvironmentConfig[K]
): void {
  envManager.set(key, value);
}

export function isFeatureEnabled(feature: string): boolean {
  return envManager.isFeatureEnabled(feature);
}

export function isDevelopment(): boolean {
  return envManager.get('isDevelopment');
}

export function isProduction(): boolean {
  return envManager.get('isProduction');
}

export function isStaging(): boolean {
  return envManager.get('isStaging');
}

export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  return envManager.validate();
}

export default {
  EnvironmentManager,
  envManager,
  getConfig,
  getEnv,
  setEnv,
  isFeatureEnabled,
  isDevelopment,
  isProduction,
  isStaging,
  validateEnvironment,
};
