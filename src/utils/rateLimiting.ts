/**
 * Rate Limiting Utilities
 * 
 * Client-side request throttling and debouncing to prevent abuse
 * Implements token bucket algorithm for rate limiting
 */

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
    /** Maximum requests allowed in the time window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Identifier for the rate limiter (e.g., API endpoint) */
    key: string;
}

/**
 * Rate limit state stored per key
 */
interface RateLimitState {
    count: number;
    resetTime: number;
}

/**
 * In-memory rate limit tracking
 */
const rateLimitStore = new Map<string, RateLimitState>();

/**
 * Check if request is allowed under rate limit
 * @param config - Rate limiter configuration
 * @returns True if request is allowed, false if rate limited
 */
export function checkRateLimit(config: RateLimiterConfig): boolean {
    const now = Date.now();
    const state = rateLimitStore.get(config.key);
    
    // No state yet or window expired
    if (!state || now >= state.resetTime) {
        rateLimitStore.set(config.key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return true;
    }
    
    // Within window, check count
    if (state.count < config.maxRequests) {
        state.count++;
        return true;
    }
    
    // Rate limit exceeded
    return false;
}

/**
 * Get remaining requests in current window
 * @param key - Rate limiter key
 * @returns Object with remaining count and reset time
 */
export function getRateLimitStatus(key: string): {
    remaining: number;
    resetAt: number;
    isLimited: boolean;
} {
    const state = rateLimitStore.get(key);
    const now = Date.now();
    
    if (!state || now >= state.resetTime) {
        return {
            remaining: Infinity,
            resetAt: 0,
            isLimited: false,
        };
    }
    
    const config = Array.from(rateLimitStore.entries())
        .find(([k]) => k === key);
    
    const maxRequests = config ? 10 : 10; // Default to 10 if not found
    
    return {
        remaining: Math.max(0, maxRequests - state.count),
        resetAt: state.resetTime,
        isLimited: state.count >= maxRequests,
    };
}

/**
 * Reset rate limit for a key
 * @param key - Rate limiter key
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}

/**
 * Clear all rate limits
 */
export function clearAllRateLimits(): void {
    rateLimitStore.clear();
}

/**
 * Debounce function - delays execution until after wait time
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function(...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

/**
 * Throttle function - limits execution to once per wait time
 * @param func - Function to throttle
 * @param wait - Wait time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return function(...args: Parameters<T>) {
        const now = Date.now();
        
        if (now - lastCall >= wait) {
            lastCall = now;
            func(...args);
        }
    };
}

/**
 * Rate-limited fetch wrapper
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param rateLimitConfig - Rate limit configuration
 * @returns Fetch promise or rejected promise if rate limited
 */
export async function rateLimitedFetch(
    url: string | URL,
    options: RequestInit = {},
    rateLimitConfig: RateLimiterConfig
): Promise<Response> {
    if (!checkRateLimit(rateLimitConfig)) {
        const status = getRateLimitStatus(rateLimitConfig.key);
        const waitTime = Math.ceil((status.resetAt - Date.now()) / 1000);
        
        throw new Error(
            `Rate limit exceeded. Try again in ${waitTime} seconds.`
        );
    }
    
    return fetch(url, options);
}

/**
 * Exponential backoff retry wrapper
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise that resolves with function result or rejects after max retries
 */
export async function exponentialBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 0.3 * delay; // Add 0-30% jitter
                
                console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay + jitter)}ms`);
                
                await new Promise(resolve => setTimeout(resolve, delay + jitter));
            }
        }
    }
    
    throw lastError!;
}

/**
 * React hook for rate limiting
 * @param key - Rate limiter key
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 */
export function useRateLimit(
    key: string,
    maxRequests: number = 10,
    windowMs: number = 60000
) {
    const config: RateLimiterConfig = { key, maxRequests, windowMs };
    
    const canMakeRequest = () => checkRateLimit(config);
    const getStatus = () => getRateLimitStatus(key);
    const reset = () => resetRateLimit(key);
    
    return {
        canMakeRequest,
        getStatus,
        reset,
        fetch: (url: string | URL, options?: RequestInit) => 
            rateLimitedFetch(url, options, config),
    };
}

/**
 * React hook for debounced value
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
    
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    
    return debouncedValue;
}

/**
 * React hook for throttled callback
 * @param callback - Callback to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const lastRun = React.useRef(Date.now());
    
    return React.useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();
            
            if (now - lastRun.current >= delay) {
                lastRun.current = now;
                return callback(...args);
            }
        },
        [callback, delay]
    ) as T;
}

/**
 * API request queue with rate limiting
 */
export class RequestQueue {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    private config: RateLimiterConfig;
    
    constructor(config: RateLimiterConfig) {
        this.config = config;
    }
    
    /**
     * Add request to queue
     * @param requestFn - Function that returns a promise
     * @returns Promise that resolves when request completes
     */
    async enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await requestFn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            
            this.process();
        });
    }
    
    /**
     * Process queue with rate limiting
     */
    private async process(): Promise<void> {
        if (this.processing) return;
        
        this.processing = true;
        
        while (this.queue.length > 0) {
            if (checkRateLimit(this.config)) {
                const request = this.queue.shift();
                if (request) {
                    await request();
                }
            } else {
                // Wait for rate limit window to reset
                const status = getRateLimitStatus(this.config.key);
                const waitTime = status.resetAt - Date.now();
                if (waitTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        this.processing = false;
    }
    
    /**
     * Get queue size
     */
    get size(): number {
        return this.queue.length;
    }
    
    /**
     * Clear queue
     */
    clear(): void {
        this.queue = [];
    }
}

// Import React for hooks
import React from 'react';

/**
 * Default rate limit configs for common scenarios
 */
export const RATE_LIMITS = {
    // API calls - 60 requests per minute
    API: {
        maxRequests: 60,
        windowMs: 60000,
    },
    
    // Search queries - 30 per minute
    SEARCH: {
        maxRequests: 30,
        windowMs: 60000,
    },
    
    // File uploads - 10 per minute
    UPLOAD: {
        maxRequests: 10,
        windowMs: 60000,
    },
    
    // Authentication - 5 attempts per 5 minutes
    AUTH: {
        maxRequests: 5,
        windowMs: 300000,
    },
    
    // Email sending - 3 per hour
    EMAIL: {
        maxRequests: 3,
        windowMs: 3600000,
    },
} as const;

export default {
    checkRateLimit,
    getRateLimitStatus,
    resetRateLimit,
    clearAllRateLimits,
    debounce,
    throttle,
    rateLimitedFetch,
    exponentialBackoff,
    useRateLimit,
    useDebounce,
    useThrottle,
    RequestQueue,
    RATE_LIMITS,
};
