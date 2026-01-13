/**
 * Enhanced HTTP Request Management
 * Provides request handling with timeouts, retries, and cancellation
 */

import { TypedError, ErrorType, normalizeError, generateRequestId } from './errorHandling';

export interface RequestConfig {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onProgress?: (progress: { loaded: number; total: number }) => void;
  signal?: AbortSignal;
  requestId?: string;
  headers?: Record<string, string>;
}

export interface RequestMetrics {
  requestId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  retries: number;
  statusCode?: number;
  error?: string;
}

/**
 * Request metrics collector for monitoring
 */
class RequestMetricsCollector {
  private metrics: Map<string, RequestMetrics> = new Map();

  createMetrics(requestId?: string): RequestMetrics {
    const id = requestId || generateRequestId();
    const metrics: RequestMetrics = {
      requestId: id,
      startTime: Date.now(),
      retries: 0,
    };
    this.metrics.set(id, metrics);
    return metrics;
  }

  finalize(requestId: string, statusCode?: number, error?: string): RequestMetrics | undefined {
    const metrics = this.metrics.get(requestId);
    if (metrics) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.statusCode = statusCode;
      metrics.error = error;
    }
    return metrics;
  }

  incrementRetries(requestId: string): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) {
      metrics.retries++;
    }
  }

  getMetrics(requestId: string): RequestMetrics | undefined {
    return this.metrics.get(requestId);
  }

  getAllMetrics(): RequestMetrics[] {
    return Array.from(this.metrics.values());
  }

  clearOldMetrics(olderThanMs: number = 3600000): void {
    const now = Date.now();
    for (const [id, metrics] of this.metrics.entries()) {
      if (metrics.endTime && now - metrics.endTime > olderThanMs) {
        this.metrics.delete(id);
      }
    }
  }
}

export const requestMetrics = new RequestMetricsCollector();

/**
 * Create abort controller with timeout
 */
export function createTimeoutController(timeoutMs: number = 30000): AbortController {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Store timeout ID for cleanup
  (controller as any).__timeoutId = timeoutId;

  return controller;
}

/**
 * Clear abort controller timeout
 */
export function clearTimeoutController(controller: AbortController): void {
  const timeoutId = (controller as any).__timeoutId;
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

/**
 * Enhanced fetch wrapper with retry and timeout
 */
export async function enhancedFetch<T = unknown>(
  url: string,
  options: RequestInit & RequestConfig = {}
): Promise<T> {
  const {
    timeout = 30000,
    maxRetries = 3,
    retryDelay = 100,
    backoffMultiplier = 2,
    requestId = generateRequestId(),
    ...fetchOptions
  } = options;

  const metrics = requestMetrics.createMetrics(requestId);
  let lastError: TypedError | undefined;
  let currentDelay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller with timeout
      const controller = fetchOptions.signal
        ? new AbortController() // Use existing signal
        : createTimeoutController(timeout);

      // Merge signal
      const finalOptions: RequestInit = {
        ...fetchOptions,
        signal: controller.signal,
      };

      // Add request ID header if not present
      const headers = (finalOptions.headers as Record<string, string>) || {};
      if (!headers['X-Request-ID']) {
        headers['X-Request-ID'] = requestId;
      }
      finalOptions.headers = headers;

      // Perform fetch
      const response = await fetch(url, finalOptions);

      // Clear timeout
      if (!fetchOptions.signal) {
        clearTimeoutController(controller);
      }

      // Check response status
      if (!response.ok) {
        const error = new TypedError(
          `HTTP ${response.status}: ${response.statusText}`,
          getErrorType(response.status),
          response.status,
          { url, status: response.status },
          undefined,
          requestId
        );

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          requestMetrics.finalize(requestId, response.status, error.message);
          throw error;
        }

        throw error;
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: unknown;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text')) {
        data = await response.text();
      } else {
        data = await response.arrayBuffer();
      }

      requestMetrics.finalize(requestId, response.status);
      return data as T;
    } catch (error) {
      lastError = normalizeError(error, ErrorType.NETWORK);
      requestMetrics.incrementRetries(requestId);

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        requestMetrics.finalize(requestId, undefined, lastError.message);
        throw lastError;
      }

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        requestMetrics.finalize(requestId, undefined, lastError.message);
        throw lastError;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }

  if (lastError) {
    requestMetrics.finalize(requestId, undefined, lastError.message);
    throw lastError;
  }

  throw new TypedError('Request failed unexpectedly', ErrorType.UNKNOWN, 500);
}

/**
 * Determine error type from HTTP status code
 */
function getErrorType(status: number): ErrorType {
  if (status === 429) return ErrorType.RATE_LIMIT;
  if (status === 408) return ErrorType.TIMEOUT;
  if (status === 401) return ErrorType.AUTHENTICATION;
  if (status === 403) return ErrorType.AUTHORIZATION;
  if (status === 404) return ErrorType.NOT_FOUND;
  if (status === 409) return ErrorType.CONFLICT;
  if (status >= 500) return ErrorType.SERVER;
  return ErrorType.UNKNOWN;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: TypedError): boolean {
  // Retry on network errors, timeouts, and server errors
  return [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.SERVER,
    ErrorType.RATE_LIMIT,
  ].includes(error.type);
}

/**
 * Request queue for batching and ordering
 */
class RequestQueue {
  private queue: Array<{
    id: string;
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private processing = false;
  private concurrency = 3;
  private activeRequests = 0;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: generateRequestId(),
        fn,
        resolve,
        reject,
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.activeRequests >= this.concurrency) {
      return;
    }

    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    this.activeRequests++;

    const item = this.queue.shift();
    if (!item) {
      this.processing = false;
      this.activeRequests--;
      return;
    }

    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (error) {
      item.reject(normalizeError(error));
    } finally {
      this.activeRequests--;
      this.processing = false;
      this.process(); // Process next item
    }
  }

  getConcurrency(): number {
    return this.concurrency;
  }

  setConcurrency(concurrency: number): void {
    this.concurrency = Math.max(1, concurrency);
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveRequestCount(): number {
    return this.activeRequests;
  }
}

export const requestQueue = new RequestQueue();

/**
 * Batch requests with concurrency control
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  concurrency: number = 3
): Promise<T[]> {
  const queue = new RequestQueue();
  queue.setConcurrency(concurrency);

  return Promise.all(requests.map((req) => queue.enqueue(req)));
}

/**
 * Debounce requests to prevent duplicate calls
 */
export function createRequestDebouncer<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  delayMs: number = 500
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastResult: R | undefined;
  let lastArgs: T | undefined;

  return async (...args: T): Promise<R> => {
    // Cancel previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Check if request is identical to last one
    if (lastArgs && JSON.stringify(lastArgs) === JSON.stringify(args) && lastResult !== undefined) {
      return lastResult;
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          lastResult = await fn(...args);
          lastArgs = args;
          resolve(lastResult);
        } catch (error) {
          reject(normalizeError(error));
        }
      }, delayMs);
    });
  };
}

/**
 * Create a request cache
 */
export class RequestCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number; // milliseconds

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): number {
    let cleared = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  getSize(): number {
    return this.cache.size;
  }
}

export const requestCache = new RequestCache();

export default {
  enhancedFetch,
  createTimeoutController,
  clearTimeoutController,
  requestMetrics,
  requestQueue,
  batchRequests,
  createRequestDebouncer,
  RequestCache,
  requestCache,
};
