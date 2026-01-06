/**
 * Rate Limiting Service
 * 
 * Client-side rate limiting to prevent abuse and excessive API calls.
 * Works in conjunction with server-side rate limiting for defense in depth.
 */

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private configs: Record<string, RateLimitConfig> = {
        // Owner endpoints
        'owner:dashboard': { windowMs: 60000, maxRequests: 100 },
        'owner:tenant:create': { windowMs: 60000, maxRequests: 10 },
        'owner:tenant:update': { windowMs: 60000, maxRequests: 50 },
        'owner:tenant:delete': { windowMs: 60000, maxRequests: 5 },
        'owner:settings': { windowMs: 60000, maxRequests: 30 },

        // API calls
        'api:read': { windowMs: 60000, maxRequests: 100 },
        'api:write': { windowMs: 60000, maxRequests: 50 },
        'api:ai': { windowMs: 60000, maxRequests: 20 },

        // Default
        'default': { windowMs: 60000, maxRequests: 60 }
    };

    /**
     * Check if request is allowed
     */
    isAllowed(key: string, customConfig?: RateLimitConfig): boolean {
        const config = customConfig || this.configs[key] || this.configs.default;
        const now = Date.now();
        const limitKey = key;

        // Get or create limit entry
        let entry = this.limits.get(limitKey);

        if (!entry || now > entry.resetTime) {
            // Create new window
            entry = {
                count: 1,
                resetTime: now + config.windowMs
            };
            this.limits.set(limitKey, entry);
            return true;
        }

        // Check if limit exceeded
        if (entry.count >= config.maxRequests) {
            return false;
        }

        // Increment counter
        entry.count++;
        this.limits.set(limitKey, entry);
        return true;
    }

    /**
     * Get remaining requests for a key
     */
    getRemaining(key: string): number {
        const config = this.configs[key] || this.configs.default;
        const entry = this.limits.get(key);

        if (!entry || Date.now() > entry.resetTime) {
            return config.maxRequests;
        }

        return Math.max(0, config.maxRequests - entry.count);
    }

    /**
     * Get time until reset (in seconds)
     */
    getResetTime(key: string): number {
        const entry = this.limits.get(key);

        if (!entry) {
            return 0;
        }

        const remainingMs = Math.max(0, entry.resetTime - Date.now());
        return Math.ceil(remainingMs / 1000);
    }

    /**
     * Reset limits for a specific key
     */
    reset(key: string): void {
        this.limits.delete(key);
    }

    /**
     * Reset all limits
     */
    resetAll(): void {
        this.limits.clear();
    }

    /**
     * Create a rate-limited wrapper for a function
     */
    createRateLimitedFunction<T extends (...args: any[]) => any>(
        fn: T,
        key: string,
        onLimitExceeded?: () => void
    ): T {
        return ((...args: any[]) => {
            if (!this.isAllowed(key)) {
                const resetTime = this.getResetTime(key);
                const error = new Error(
                    `Rate limit exceeded. Try again in ${resetTime} seconds.`
                );
                (error as any).rateLimitExceeded = true;
                (error as any).resetTime = resetTime;

                if (onLimitExceeded) {
                    onLimitExceeded();
                }

                throw error;
            }

            return fn(...args);
        }) as T;
    }

    /**
     * Get status for all active limits
     */
    getStatus(): Record<string, { count: number; max: number; resetIn: number }> {
        const status: Record<string, any> = {};
        const now = Date.now();

        this.limits.forEach((entry, key) => {
            if (now <= entry.resetTime) {
                const config = this.configs[key] || this.configs.default;
                status[key] = {
                    count: entry.count,
                    max: config.maxRequests,
                    resetIn: Math.ceil((entry.resetTime - now) / 1000)
                };
            }
        });

        return status;
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit decorator for class methods
 */
export function RateLimit(key: string, config?: RateLimitConfig) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            if (!rateLimiter.isAllowed(key, config)) {
                const resetTime = rateLimiter.getResetTime(key);
                throw new Error(
                    `Rate limit exceeded for ${propertyKey}. Try again in ${resetTime} seconds.`
                );
            }
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(key: string) {
    const checkLimit = () => {
        return rateLimiter.isAllowed(key);
    };

    const getInfo = () => {
        return {
            remaining: rateLimiter.getRemaining(key),
            resetIn: rateLimiter.getResetTime(key)
        };
    };

    return { checkLimit, getInfo };
}
