/**
 * Advanced API Client
 * Provides HTTP client with interceptors, retry logic, and request/response transformation
 */

import { normalizeError, retryWithBackoff, withTimeout } from './errorHandling';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  credentials?: RequestCredentials;
  params?: Record<string, any>;
  transformRequest?: (config: RequestConfig) => RequestConfig;
  transformResponse?: (data: any) => any;
}

export interface RequestInterceptor {
  (config: RequestConfig): RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor<T = any> {
  (response: T): T | Promise<T>;
}

export interface ErrorInterceptor {
  (error: Error): Error | Promise<Error>;
}

export interface APIResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  config: RequestConfig;
  duration: number;
}

/**
 * Advanced API Client
 */
export class APIClient {
  private baseURL: string = '';
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private defaultConfig: Partial<RequestConfig> = {
    timeout: 30000,
    retries: 3,
    credentials: 'include',
  };
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(baseURL?: string) {
    this.baseURL = baseURL || '';
  }

  /**
   * Set base URL
   */
  setBaseURL(baseURL: string): this {
    this.baseURL = baseURL;
    return this;
  }

  /**
   * Set default configuration
   */
  setDefaultConfig(config: Partial<RequestConfig>): this {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    return this;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);

    // Return removal function
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter((i) => i !== interceptor);
    };
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);

    // Return removal function
    return () => {
      this.responseInterceptors = this.responseInterceptors.filter((i) => i !== interceptor);
    };
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);

    // Return removal function
    return () => {
      this.errorInterceptors = this.errorInterceptors.filter((i) => i !== interceptor);
    };
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    body?: any,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    body?: any,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    body?: any,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * Core request method
   */
  private async request<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();
    let finalConfig = { ...this.defaultConfig, ...config };

    // Check cache for GET requests
    if (finalConfig.method === 'GET' || !finalConfig.method) {
      const cacheKey = this.getCacheKey(url, finalConfig);
      const cached = this.requestCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return {
          status: 200,
          statusText: 'OK (Cached)',
          headers: {},
          data: cached.data,
          config: finalConfig,
          duration: 0,
        };
      }
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await Promise.resolve(interceptor(finalConfig));
    }

    // Build full URL
    const fullURL = this.buildURL(url, finalConfig.params);

    try {
      // Execute request with retry logic
      let response = await retryWithBackoff(
        () => this.executeRequest<T>(fullURL, finalConfig),
        { maxRetries: finalConfig.retries || 3 }
      );

      // Apply timeout
      if (finalConfig.timeout) {
        response = await withTimeout(Promise.resolve(response), finalConfig.timeout);
      }

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        response.data = await Promise.resolve(interceptor(response.data));
      }

      // Cache successful GET responses
      if ((finalConfig.method === 'GET' || !finalConfig.method) && response.status === 200) {
        const cacheKey = this.getCacheKey(url, finalConfig);
        this.requestCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
        });
      }

      response.duration = Date.now() - startTime;
      return response;
    } catch (error) {
      // Apply error interceptors
      let processedError = normalizeError(error);

      for (const interceptor of this.errorInterceptors) {
        processedError = await Promise.resolve(interceptor(processedError));
      }

      throw processedError;
    }
  }

  /**
   * Execute actual HTTP request
   */
  private async executeRequest<T>(
    url: string,
    config: RequestConfig
  ): Promise<APIResponse<T>> {
    const fetchConfig: RequestInit = {
      method: config.method || 'GET',
      headers: this.buildHeaders(config.headers),
      credentials: config.credentials,
    };

    if (config.body) {
      fetchConfig.body = typeof config.body === 'string'
        ? config.body
        : JSON.stringify(config.body);
    }

    const response = await fetch(url, fetchConfig);
    const contentType = response.headers.get('content-type');
    let data: T;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text')) {
      data = await response.text() as T;
    } else {
      data = await response.blob() as T;
    }

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      config,
      duration: 0,
    };
  }

  /**
   * Build headers
   */
  private buildHeaders(headers?: Record<string, string>): HeadersInit {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    return { ...defaultHeaders, ...headers };
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(path: string, params?: Record<string, any>): string {
    let url = path.startsWith('http') ? path : `${this.baseURL}${path}`;

    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams();

      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          queryString.append(key, String(value));
        }
      }

      url += `?${queryString.toString()}`;
    }

    return url;
  }

  /**
   * Get cache key
   */
  private getCacheKey(url: string, config: RequestConfig): string {
    const params = config.params ? JSON.stringify(config.params) : '';
    return `${url}:${params}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Clear cache entry
   */
  clearCacheEntry(url: string, params?: Record<string, any>): boolean {
    const config: RequestConfig = { params };
    const key = this.getCacheKey(url, config);
    return this.requestCache.delete(key);
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): { size: number; keys: string[] } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
    };
  }
}

/**
 * Request queue for managing concurrent requests
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests: number = 0;
  private maxConcurrent: number = 5;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add request to queue
   */
  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
      this.activeRequests++;
      const request = this.queue.shift();

      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Request failed:', error);
        } finally {
          this.activeRequests--;
          this.process(); // Continue processing
        }
      }
    }
  }

  /**
   * Get queue statistics
   */
  getStatistics(): { queued: number; active: number } {
    return {
      queued: this.queue.length,
      active: this.activeRequests,
    };
  }
}

/**
 * Global API client instance
 */
export const apiClient = new APIClient();

/**
 * Create API client
 */
export function createAPIClient(baseURL?: string): APIClient {
  return new APIClient(baseURL);
}

/**
 * Create request queue
 */
export function createRequestQueue(maxConcurrent?: number): RequestQueue {
  return new RequestQueue(maxConcurrent);
}

export default {
  APIClient,
  RequestQueue,
  apiClient,
  createAPIClient,
  createRequestQueue,
};
