/**
 * Enhanced Error Handling Utilities
 * Provides type-safe error handling with proper error typing and recovery patterns
 */

import { ClientResponseError } from 'pocketbase';

/**
 * Custom error types for better error discrimination
 */
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  SERVER = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

/**
 * Enhanced error class with type information
 */
export class TypedError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;
  public readonly originalError?: Error;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode: number = 500,
    context?: Record<string, unknown>,
    originalError?: Error,
    requestId?: string
  ) {
    super(message);
    this.name = 'TypedError';
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date();
    this.requestId = requestId;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, TypedError.prototype);
  }

  /**
   * Get detailed error information for logging
   */
  getDetails(): Record<string, unknown> {
    return {
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
      context: this.context,
      stack: this.stack,
      originalErrorMessage: this.originalError?.message,
      originalErrorStack: this.originalError?.stack,
    };
  }
}

/**
 * Type guard to check if error is a TypedError
 */
/**
 * Factory for creating TypedError instances
 */
export const ErrorFactory = {
  validation(message: string, context?: Record<string, unknown>): TypedError {
    return new TypedError(message, ErrorType.VALIDATION, 400, context);
  },
  authentication(message: string = 'Authentication required', context?: Record<string, unknown>): TypedError {
    return new TypedError(message, ErrorType.AUTHENTICATION, 401, context);
  },
  authorization(message: string = 'Permission denied', context?: Record<string, unknown>): TypedError {
    return new TypedError(message, ErrorType.AUTHORIZATION, 403, context);
  },
  notFound(message: string = 'Resource not found', context?: Record<string, unknown>): TypedError {
    return new TypedError(message, ErrorType.NOT_FOUND, 404, context);
  },
  conflict(message: string, context?: Record<string, unknown>): TypedError {
    return new TypedError(message, ErrorType.CONFLICT, 409, context);
  },
  network(message: string = 'Network error', context?: Record<string, unknown>): TypedError {
    return new TypedError(message, ErrorType.NETWORK, 503, context);
  },
  server(message: string = 'Internal server error', context?: Record<string, unknown>): TypedError {
    return new TypedError(message, ErrorType.SERVER, 500, context);
  },
  timeout(message: string = 'Operation timed out', context?: Record<string, unknown>): TypedError {
    return new TypedError(message, ErrorType.TIMEOUT, 408, context);
  },
  rateLimit(message: string = 'Too many requests', context?: Record<string, unknown>): TypedError {
    return new TypedError(message, ErrorType.RATE_LIMIT, 429, context);
  },
  createValidationError(message: string, context?: Record<string, unknown>): TypedError {
    return this.validation(message, context);
  },
  createNotFoundError(message: string, context?: Record<string, unknown>): TypedError {
    return this.notFound(message, context);
  }
};

export function isTypedError(error: unknown): error is TypedError {
  return error instanceof TypedError;
}

/**
 * Type guard to check if error is a PocketBase error
 */
export function isPocketBaseError(error: unknown): error is ClientResponseError {
  return error instanceof ClientResponseError;
}

/**
 * Convert various error types to TypedError
 */
export function normalizeError(
  error: unknown,
  defaultType: ErrorType = ErrorType.UNKNOWN,
  context?: Record<string, unknown>,
  requestId?: string
): TypedError {
  // Already a TypedError
  if (isTypedError(error)) {
    return error;
  }

  // PocketBase error
  if (isPocketBaseError(error)) {
    const type = getPocketBaseErrorType(error.status);
    return new TypedError(
      error.message,
      type,
      error.status,
      { pbError: error.data },
      error as Error,
      requestId
    );
  }

  // Standard Error
  if (error instanceof Error) {
    let type = defaultType;
    let statusCode = 500;

    // Try to infer error type from message
    if (error.message.includes('timeout')) {
      type = ErrorType.TIMEOUT;
      statusCode = 408;
    } else if (error.message.includes('network')) {
      type = ErrorType.NETWORK;
      statusCode = 503;
    } else if (error.message.includes('auth')) {
      type = ErrorType.AUTHENTICATION;
      statusCode = 401;
    }

    return new TypedError(
      error.message,
      type,
      statusCode,
      context,
      error,
      requestId
    );
  }

  // Unknown type
  return new TypedError(
    String(error || 'Unknown error'),
    defaultType,
    500,
    { raw: error },
    undefined,
    requestId
  );
}

/**
 * Map PocketBase status codes to error types
 */
function getPocketBaseErrorType(status: number): ErrorType {
  switch (status) {
    case 400:
      return ErrorType.VALIDATION;
    case 401:
      return ErrorType.AUTHENTICATION;
    case 403:
      return ErrorType.AUTHORIZATION;
    case 404:
      return ErrorType.NOT_FOUND;
    case 409:
      return ErrorType.CONFLICT;
    case 429:
      return ErrorType.RATE_LIMIT;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
    shouldRetry?: (error: Error) => boolean;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 100,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry,
    shouldRetry = (error: Error) => {
      // Retry on network errors, timeouts, and 5xx errors
      if (isPocketBaseError(error)) {
        return error.status >= 500;
      }
      return error.message.includes('timeout') || error.message.includes('network');
    },
  } = options || {};

  let lastError: Error | undefined;
  let delay = baseDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = normalizeError(error);

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      onRetry?.(attempt + 1, lastError);

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError || new TypedError('Retry failed', ErrorType.UNKNOWN);
}

/**
 * Timeout wrapper for promises
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  requestId?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new TypedError(
          `Operation timed out after ${timeoutMs}ms`,
          ErrorType.TIMEOUT,
          408,
          { timeoutMs },
          undefined,
          requestId
        )
      );
    }, timeoutMs);

    // Ensure timeout is cleared when promise settles
    promise.finally(() => clearTimeout(timeoutId));
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Safe error handler for async operations
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: Record<string, unknown>,
  requestId?: string
): Promise<T | typeof fallback> {
  try {
    return await fn();
  } catch (error) {
    const typedError = normalizeError(error, ErrorType.UNKNOWN, context, requestId);
    console.error('Async operation failed:', typedError.getDetails());
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw typedError;
  }
}

/**
 * Error handler middleware for API calls
 */
export function createErrorHandler(context?: {
  userId?: string;
  endpoint?: string;
  method?: string;
  requestId?: string;
}) {
  return (error: unknown) => {
    const typedError = normalizeError(
      error,
      ErrorType.UNKNOWN,
      {
        ...context,
      },
      context?.requestId
    );

    // Log with full context
    console.error('[API ERROR]', {
      ...context,
      ...typedError.getDetails(),
    });

    return typedError;
  };
}

/**
 * Create a request ID for tracing
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T = unknown>(
  json: string,
  fallback?: T,
  context?: Record<string, unknown>
): T | undefined {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    const typedError = normalizeError(
      error,
      ErrorType.VALIDATION,
      { ...context, jsonInput: json }
    );
    console.warn('JSON parse failed:', typedError.getDetails());
    return fallback;
  }
}

/**
 * Chain multiple operations with error handling
 */
export async function chainOperations<T>(
  operations: Array<() => Promise<T>>,
  errorHandler?: (error: TypedError, operationIndex: number) => void
): Promise<(T | TypedError)[]> {
  const results: (T | TypedError)[] = [];

  for (let i = 0; i < operations.length; i++) {
    try {
      results.push(await operations[i]());
    } catch (error) {
      const typedError = normalizeError(error);
      results.push(typedError);
      errorHandler?.(typedError, i);
    }
  }

  return results;
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Exponential backoff retry
   */
  async exponentialBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    return retryWithBackoff(fn, { maxRetries });
  },

  /**
   * Fallback to cache or default value
   */
  async withFallback<T>(
    fn: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.warn('Operation failed, using fallback:', normalizeError(error).message);
      return fallback;
    }
  },

  /**
   * Circuit breaker pattern
   */
  createCircuitBreaker<T>(
    fn: () => Promise<T>,
    options?: {
      failureThreshold?: number;
      resetTimeoutMs?: number;
    }
  ) {
    const { failureThreshold = 5, resetTimeoutMs = 60000 } = options || {};
    let failures = 0;
    let lastFailureTime = 0;

    return async (): Promise<T> => {
      // Check if circuit is open
      if (failures >= failureThreshold) {
        const timeSinceLastFailure = Date.now() - lastFailureTime;
        if (timeSinceLastFailure < resetTimeoutMs) {
          throw new TypedError(
            'Circuit breaker is open - service temporarily unavailable',
            ErrorType.SERVER,
            503
          );
        }
        // Reset circuit
        failures = 0;
      }

      try {
        const result = await fn();
        failures = 0; // Reset on success
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();
        throw normalizeError(error);
      }
    };
  },
};

export default {
  TypedError,
  ErrorType,
  isTypedError,
  isPocketBaseError,
  normalizeError,
  retryWithBackoff,
  withTimeout,
  safeAsync,
  createErrorHandler,
  generateRequestId,
  safeJsonParse,
  chainOperations,
  ErrorRecovery,
};
