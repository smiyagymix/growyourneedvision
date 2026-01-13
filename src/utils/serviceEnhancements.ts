/**
 * Service Enhancement Patterns
 * Provides utilities for enhancing services with better error handling, logging, and monitoring
 */

import {
  TypedError,
  ErrorType,
  normalizeError,
  createErrorHandler,
  generateRequestId,
  retryWithBackoff,
} from '../utils/errorHandling';
import { validateEmail, validateName, validateNumber, ValidationResult } from '../utils/inputValidation';
import { enhancedFetch, createRequestDebouncer, RequestCache } from '../utils/requestManagement';

/**
 * Service method decorator for error handling and logging
 */
export function withErrorHandling(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const context = {
      service: target.constructor.name,
      method: propertyKey,
      userId: (this as any).userId,
      requestId: generateRequestId(),
    };

    try {
      const result = await originalMethod.apply(this, args);
      console.log(`[${propertyKey}] Success`, context);
      return result;
    } catch (error) {
      const typedError = normalizeError(error, ErrorType.UNKNOWN, context, context.requestId);
      console.error(`[${propertyKey}] Error:`, typedError.getDetails());
      throw typedError;
    }
  };

  return descriptor;
}

/**
 * Wrap service method with validation
 */
export function withInputValidation<T extends Record<string, any>>(
  validators: Record<keyof T, (value: any) => ValidationResult>
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (data: T, ...args: any[]) {
      // Validate input
      const errors: Record<string, string[]> = {};

      for (const [field, validator] of Object.entries(validators)) {
        const result = validator(data[field as keyof T]);
        if (!result.isValid) {
          errors[field] = result.errors[field] || ['Validation failed'];
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new TypedError(
          'Input validation failed',
          ErrorType.VALIDATION,
          400,
          { errors }
        );
      }

      return originalMethod.apply(this, [data, ...args]);
    };

    return descriptor;
  };
}

/**
 * Wrap service method with retry logic
 */
export function withRetry(
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
  }
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retryWithBackoff(
        () => originalMethod.apply(this, args),
        {
          ...options,
          onRetry: (attempt, error) => {
            console.warn(
              `[${propertyKey}] Retry attempt ${attempt}:`,
              error.message
            );
          },
        }
      );
    };

    return descriptor;
  };
}

/**
 * Wrap service method with caching
 */
export function withCaching(cacheTtlSeconds: number = 300) {
  const cache = new RequestCache(cacheTtlSeconds);

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;

      // Check cache
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        console.log(`[${propertyKey}] Cache hit for ${cacheKey}`);
        return cached;
      }

      // Call original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      cache.set(cacheKey, result);

      return result;
    };

    return descriptor;
  };
}

/**
 * Service base class with common utilities
 */
export class BaseService {
  protected requestId: string = generateRequestId();
  protected errorHandler = createErrorHandler({
    service: this.constructor.name,
  });

  /**
   * Safe collection fetch with error handling
   */
  protected async fetchCollection<T>(
    pb: any,
    collectionName: string,
    options?: {
      filter?: string;
      sort?: string;
      page?: number;
      perPage?: number;
    }
  ): Promise<T[]> {
    try {
      const result = await pb.collection(collectionName).getFullList<T>({
        ...options,
        requestKey: null,
      });
      return result;
    } catch (error) {
      throw this.errorHandler(error);
    }
  }

  /**
   * Safe record fetch
   */
  protected async fetchRecord<T>(
    pb: any,
    collectionName: string,
    id: string
  ): Promise<T> {
    try {
      const record = await pb.collection(collectionName).getOne<T>(id, {
        requestKey: null,
      });
      return record;
    } catch (error) {
      throw this.errorHandler(error);
    }
  }

  /**
   * Safe record creation
   */
  protected async createRecord<T extends Record<string, any>>(
    pb: any,
    collectionName: string,
    data: T
  ): Promise<T> {
    try {
      const record = await pb.collection(collectionName).create<T>(data, {
        requestKey: null,
      });
      return record;
    } catch (error) {
      throw this.errorHandler(error);
    }
  }

  /**
   * Safe record update
   */
  protected async updateRecord<T extends Record<string, any>>(
    pb: any,
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    try {
      const record = await pb.collection(collectionName).update<T>(id, data, {
        requestKey: null,
      });
      return record;
    } catch (error) {
      throw this.errorHandler(error);
    }
  }

  /**
   * Safe record deletion
   */
  protected async deleteRecord(
    pb: any,
    collectionName: string,
    id: string
  ): Promise<void> {
    try {
      await pb.collection(collectionName).delete(id, {
        requestKey: null,
      });
    } catch (error) {
      throw this.errorHandler(error);
    }
  }

  /**
   * Generate unique ID
   */
  protected generateId(prefix?: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
  }

  /**
   * Validate email
   */
  protected validateEmail(email: string): string | null {
    const result = validateEmail(email);
    if (!result.isValid) {
      return Object.values(result.errors)[0]?.[0] || 'Invalid email';
    }
    return null;
  }

  /**
   * Validate name
   */
  protected validateName(name: string, fieldName: string = 'Name'): string | null {
    const result = validateName(name, fieldName);
    if (!result.isValid) {
      return Object.values(result.errors)[0]?.[0] || 'Invalid name';
    }
    return null;
  }

  /**
   * Log operation
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${this.constructor.name}] [${timestamp}]`;

    switch (level) {
      case 'info':
        console.log(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'error':
        console.error(prefix, message, data);
        break;
    }
  }

  /**
   * Create debounced method
   */
  protected createDebounced<T extends any[], R>(
    method: (...args: T) => Promise<R>,
    delayMs: number = 500
  ) {
    return createRequestDebouncer(method, delayMs);
  }
}

/**
 * Safe type assertion helper
 */
export function assertType<T>(
  value: unknown,
  typeGuard: (v: any) => v is T,
  errorMessage?: string
): T {
  if (!typeGuard(value)) {
    throw new TypedError(
      errorMessage || 'Type assertion failed',
      ErrorType.VALIDATION,
      400,
      { receivedType: typeof value }
    );
  }
  return value;
}

/**
 * Safe property access
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  if (!obj) return defaultValue;
  return obj[key] ?? defaultValue;
}

/**
 * Deep property access
 */
export function getNestedProperty<T = any>(
  obj: any,
  path: string,
  defaultValue?: T
): T {
  try {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (!current) return defaultValue as T;
      current = current[key];
    }

    return current ?? defaultValue;
  } catch {
    return defaultValue as T;
  }
}

/**
 * Create a service factory with common setup
 */
export function createServiceFactory<T extends BaseService>(
  ServiceClass: new () => T
): T {
  return new ServiceClass();
}

export default {
  withErrorHandling,
  withInputValidation,
  withRetry,
  withCaching,
  BaseService,
  assertType,
  safeGet,
  getNestedProperty,
  createServiceFactory,
};
