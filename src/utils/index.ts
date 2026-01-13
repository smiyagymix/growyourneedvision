/**
 * Production Utilities Index
 * Export all production utilities from one place
 */

// Logger
export { logger, logError, logWarn, logInfo, logDebug, LogLevel } from './logger';

// Analytics
export {
    analytics,
    trackPageView,
    trackEvent,
    trackLogin,
    trackLogout,
    identifyUser
} from './analytics';

// Performance Monitoring
export {
    perfMonitor,
    markPerf,
    measurePerf,
    timeAsync,
    trackAPI
} from './performance';

// Health Check
export { healthCheck } from './healthCheck';

// Advanced Error Handling
export * from './errorHandling';

// Logging System
export { globalLogger } from './logging';

// Database Utilities
export * from './databaseUtilities';

// Advanced Validation
export * from './advancedValidation';

// State Management
export * from './stateManagement';

// API Client
export * from './apiClient';

// Re-export types
export type { AnalyticsEvent } from './analytics';
export type { PerformanceMetric } from './performance';
export type { HealthStatus } from './healthCheck';

/**
 * Utility Factory for quick access
 */
export class UtilityFactory {
  /**
   * Get logger instance
   */
  static getLogger(name?: string) {
    const { Logger } = require('./logging');
    return name ? new Logger().createChild(name) : require('./logging').globalLogger;
  }

  /**
   * Get API client
   */
  static getAPIClient(baseURL?: string) {
    const { createAPIClient } = require('./apiClient');
    return createAPIClient(baseURL);
  }

  /**
   * Get store
   */
  static getStore<T>(name: string, initialState: T, options?: any) {
    const { storeFactory } = require('./stateManagement');
    return storeFactory.create(name, initialState, options);
  }

  /**
   * Get query builder
   */
  static getQueryBuilder<T>(collection: string) {
    const { query } = require('./databaseUtilities');
    return query<T>(collection);
  }

  /**
   * Get validator
   */
  static getValidator(schema?: any) {
    const { createValidator } = require('./advancedValidation');
    return createValidator(schema);
  }

  /**
   * Get error handler
   */
  static getErrorHandler() {
    const { ErrorHandler } = require('./errorHandling');
    return ErrorHandler.getInstance();
  }
}
